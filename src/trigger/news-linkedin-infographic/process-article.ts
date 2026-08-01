import { runs, schemaTask, tags } from "@trigger.dev/sdk";
import { z } from "zod";
import { articleTag } from "./lib/article-tag.js";
import { renderInfographicPng } from "./lib/infographic.js";
import { publishToLinkedIn } from "./lib/linkedin.js";

function buildCaption(title: string, link: string, source: string): string {
  const sourceLine = source ? `via ${source}\n` : "";
  return `${title}\n\n${sourceLine}${link}\n\n#News #Automation`;
}

export const processArticle = schemaTask({
  id: "process-article",
  schema: z.object({
    title: z.string().min(1),
    link: z.string().min(1),
    source: z.string(),
    niche: z.string().min(1),
  }),
  // No auto-retry: publishing to LinkedIn isn't idempotent (a failure after
  // the image uploads but before/during post creation would re-run from
  // scratch on retry, risking a duplicate public post). Better to fail once
  // and let next hour's check-news pick a fresh article than risk that.
  retry: { maxAttempts: 1 },
  run: async (payload) => {
    // Content-based dedup: catches a duplicate regardless of idempotencyKey
    // (idempotencyKey only protects against the *same trigger call*'s key
    // being reused — a manual re-trigger with a different key, or a payload
    // built independently, would slip past it and re-post the same article).
    const tag = articleTag(payload.link);
    const alreadyPosted = await runs.list({
      tag,
      status: ["COMPLETED"],
      taskIdentifier: "process-article",
    });
    const priorRun = alreadyPosted.data[0];
    if (priorRun) {
      console.log(`Already posted this article (run ${priorRun.id}), skipping.`);
      return { title: payload.title, skipped: true };
    }

    const publishedAt = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const png = await renderInfographicPng({
      headline: payload.title,
      source: payload.source,
      niche: payload.niche,
      publishedAt,
    });

    const caption = buildCaption(payload.title, payload.link, payload.source);
    const postUrl = await publishToLinkedIn(png, caption, payload.title);
    await tags.add(tag);

    console.log(`Posted "${payload.title}" to LinkedIn${postUrl ? `: ${postUrl}` : ""}`);

    return { title: payload.title, postUrl };
  },
});
