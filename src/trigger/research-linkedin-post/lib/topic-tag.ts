import { createHash } from "node:crypto";
import { runs } from "@trigger.dev/sdk";

// Independent copy of the dedup pattern from the news workflow's
// lib/article-tag.ts, scoped to this workflow's own task identifier so the
// two workflows' post-history never cross-contaminate each other's checks.
export function topicTag(link: string): string {
  return `topic:${createHash("sha256").update(link).digest("hex").slice(0, 16)}`;
}

export async function wasAlreadyPosted(link: string): Promise<boolean> {
  const result = await runs.list({
    tag: topicTag(link),
    status: ["COMPLETED"],
    taskIdentifier: "process-research-post",
  });
  return result.data.length > 0;
}
