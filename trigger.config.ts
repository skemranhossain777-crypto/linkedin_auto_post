import { defineConfig } from "@trigger.dev/sdk";
import { additionalFiles } from "@trigger.dev/build/extensions/core";

export default defineConfig({
  project: "proj_ikwtglbgkrvkbgmlogug",
  dirs: ["./src/trigger"],
  maxDuration: 120, // seconds — plenty for RSS fetch + image render + LinkedIn upload
  build: {
    // Ships the brand logo PNG with the deployed bundle — otherwise only
    // imported .ts/.js files get bundled and the infographic renderer's
    // fs.readFileSync of the logo would 404 in production.
    extensions: [additionalFiles({ files: [".claude/brand-asset/**"] })],
  },
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10_000,
      factor: 2,
      randomize: true,
    },
  },
});
