import { schedules } from "@trigger.dev/sdk";
import { articleTag, wasAlreadyPosted } from "./lib/article-tag.js";
import { fetchTavilyNews } from "./lib/tavily.js";
import { processArticle } from "./process-article.js";

// Wider than the 60-minute cron interval so we don't miss an article that
// landed right at the boundary between two runs.
const LOOKBACK_MINUTES = 75;

// Tavily's own recency filter is day-granularity, not minute-granularity —
// ask for the last day's news, then narrow to LOOKBACK_MINUTES ourselves.
const TAVILY_DAYS = 1;

// How many recent candidates to check before giving up — picking just the
// single newest result isn't enough once dedup is involved, since that one
// might already be posted; we walk past it to find something fresh.
const MAX_CANDIDATES_TO_CHECK = 10;

export const checkNews = schedules.task({
  id: "check-news",
  cron: "0 * * * *", // every hour
  run: async () => {
    const niche = process.env.NEWS_NICHE;
    if (!niche) throw new Error("NEWS_NICHE is not set");

    const articles = await fetchTavilyNews(niche, TAVILY_DAYS);
    const cutoff = Date.now() - LOOKBACK_MINUTES * 60_000;

    const recent = articles
      .map((article) => ({ ...article, publishedAtMs: Date.parse(article.pubDate) }))
      .filter((article) => !Number.isNaN(article.publishedAtMs) && article.publishedAtMs >= cutoff)
      .sort((a, b) => b.publishedAtMs - a.publishedAtMs)
      .slice(0, MAX_CANDIDATES_TO_CHECK);

    for (const candidate of recent) {
      if (await wasAlreadyPosted(candidate.link)) {
        continue;
      }

      await processArticle.trigger(
        { title: candidate.title, link: candidate.link, source: candidate.source, niche },
        { idempotencyKey: `article-${candidate.guid}`, tags: [articleTag(candidate.link)] }
      );

      return { dispatched: true, title: candidate.title };
    }

    console.log(
      `No new, not-yet-posted "${niche}" articles in the last ${LOOKBACK_MINUTES} minutes (checked ${recent.length} candidates).`
    );
    return { dispatched: false };
  },
});
