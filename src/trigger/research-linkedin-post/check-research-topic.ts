import { schedules } from "@trigger.dev/sdk";
import { fetchTrendingTopics, researchTopic } from "./lib/research-tavily.js";
import { topicTag, wasAlreadyPosted } from "./lib/topic-tag.js";
import { processResearchPost } from "./process-research-post.js";

// Offset from the news workflow's :00 schedule so the two independent
// automations don't both fire — and potentially both post — in the same minute.
const LOOKBACK_MINUTES = 75;
const MAX_CANDIDATES_TO_CHECK = 10;

export const checkResearchTopic = schedules.task({
  id: "check-research-topic",
  cron: "30 * * * *", // every hour, at :30
  run: async () => {
    const niche = process.env.RESEARCH_NICHE;
    if (!niche) throw new Error("RESEARCH_NICHE is not set");

    const candidates = await fetchTrendingTopics(niche, 1);
    const cutoff = Date.now() - LOOKBACK_MINUTES * 60_000;

    const recent = candidates
      .map((c) => ({ ...c, publishedAtMs: Date.parse(c.pubDate) }))
      .filter((c) => !Number.isNaN(c.publishedAtMs) && c.publishedAtMs >= cutoff)
      .sort((a, b) => b.publishedAtMs - a.publishedAtMs)
      .slice(0, MAX_CANDIDATES_TO_CHECK);

    for (const candidate of recent) {
      if (await wasAlreadyPosted(candidate.link)) {
        continue;
      }

      const research = await researchTopic(candidate.title);

      await processResearchPost.trigger(
        {
          topic: candidate.title,
          summary: research.summary,
          niche,
          sourceUrl: candidate.link,
          sourceName: candidate.source,
          sources: research.sources,
        },
        { idempotencyKey: `topic-${candidate.link}`, tags: [topicTag(candidate.link)] }
      );

      return { dispatched: true, topic: candidate.title };
    }

    console.log(
      `No new, not-yet-covered "${niche}" topics in the last ${LOOKBACK_MINUTES} minutes (checked ${recent.length} candidates).`
    );
    return { dispatched: false };
  },
});
