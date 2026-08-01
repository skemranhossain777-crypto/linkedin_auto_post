import { runs, schemaTask, tags } from "@trigger.dev/sdk";
import { z } from "zod";
import { renderResearchInfographicPng } from "./lib/research-infographic.js";
import { publishToLinkedIn } from "./lib/research-linkedin.js";
import { topicTag } from "./lib/topic-tag.js";

function buildCaption(
  topic: string,
  summary: string,
  sources: Array<{ title: string; url: string }>
): string {
  const sourceLines = sources.map((s) => `• ${s.title}`).join("\n");
  return `${topic}\n\n${summary}\n\nSources:\n${sourceLines}\n\n#Research #AI #Automation`;
}

export const processResearchPost = schemaTask({
  id: "process-research-post",
  schema: z.object({
    topic: z.string().min(1),
    summary: z.string().min(1),
    niche: z.string().min(1),
    sourceUrl: z.string().min(1),
    sourceName: z.string(),
    sources: z.array(z.object({ title: z.string(), url: z.string() })),
  }),
  // No auto-retry — publishing to LinkedIn isn't idempotent, same reasoning
  // as the news workflow's process-article task.
  retry: { maxAttempts: 1 },
  run: async (payload) => {
    const tag = topicTag(payload.sourceUrl);
    const alreadyPosted = await runs.list({
      tag,
      status: ["COMPLETED"],
      taskIdentifier: "process-research-post",
    });
    const priorRun = alreadyPosted.data[0];
    if (priorRun) {
      console.log(`Already posted this topic (run ${priorRun.id}), skipping.`);
      return { topic: payload.topic, skipped: true };
    }

    const publishedAt = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const png = await renderResearchInfographicPng({
      topic: payload.topic,
      summary: payload.summary,
      niche: payload.niche,
      source: payload.sourceName,
      publishedAt,
    });

    const caption = buildCaption(payload.topic, payload.summary, payload.sources);
    const postUrl = await publishToLinkedIn(png, caption, payload.topic);
    await tags.add(tag);

    console.log(`Posted research on "${payload.topic}" to LinkedIn${postUrl ? `: ${postUrl}` : ""}`);

    return { topic: payload.topic, postUrl };
  },
});
