import { createHash } from "node:crypto";
import { runs } from "@trigger.dev/sdk";

// A short, deterministic, Trigger.dev-tag-safe identifier for an article,
// derived from its link. Used to look up whether this exact article was
// already posted, regardless of which idempotencyKey a given trigger call
// used (idempotencyKey alone doesn't protect against a run triggered with a
// different key for the same article — this does).
export function articleTag(link: string): string {
  return `article:${createHash("sha256").update(link).digest("hex").slice(0, 16)}`;
}

export async function wasAlreadyPosted(link: string): Promise<boolean> {
  const result = await runs.list({
    tag: articleTag(link),
    status: ["COMPLETED"],
    taskIdentifier: "process-article",
  });
  return result.data.length > 0;
}
