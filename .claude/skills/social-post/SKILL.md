---
name: social-post
description: Use when someone asks to post an infographic to social media, share an infographic on Facebook/Instagram/LinkedIn, or publish a made infographic online.
disable-model-invocation: true
argument-hint: [infographic slug or path] [platform(s), default all]
---

## What This Skill Does

Takes an infographic produced by the `infographic` skill, drafts a platform-tailored,
on-brand caption for each requested social platform, and — after you explicitly
confirm — publishes the post (image + caption) via that platform's API.

Publishing is irreversible and public, so this skill **never runs automatically**
(`disable-model-invocation: true`) and always confirms with you before the actual
publish call, even if you already said "post it" once earlier in the conversation.

For a fast task-by-task lookup (env vars, endpoints, char limits, file paths), see
[reference.md](reference.md) instead of re-reading this whole file. Per-platform
API detail lives in `platforms/<platform>.md` — that's also where you add a new
platform later (see **Adding a new platform** below).

## Steps

1. **Identify the infographic.** Use the slug/path from the request, or if none given, use the most recently created file under `./infographics/`. Confirm the topic with the user if ambiguous.

2. **Get a PNG.** These platforms need a raster image, not SVG. Check whether a `.png` already exists next to the `.svg` (e.g. `./infographics/<slug>.png`). If not, tell the user: "I need a PNG of this infographic — the SVG-to-PNG conversion is a manual step in this project (open the SVG in a browser and export/screenshot it, or use a converter of your choice), please provide the PNG file path once you have it." Do not proceed to captions/publishing without a real PNG path — never fabricate one.

3. **Determine target platform(s).** Default to all three (Facebook, Instagram, LinkedIn) unless the user names specific ones. Read that platform's file in `platforms/` for its constraints (char limit, hashtag norms, tone) before drafting.

4. **Draft captions.** For each target platform, write one caption that:
   - Reflects the Mr. Informer brand tone pillars (Informative, Trustworthy, Approachable, Modern) — read `.claude/brand-asset/brand-reference.md` if you need the full tone detail.
   - Summarizes the infographic's actual content — don't invent facts beyond what's in the infographic.
   - Fits the platform's conventions from its `platforms/<platform>.md` file (length, hashtag count/style, formality).
   - Includes a short call-to-action appropriate to the platform (e.g. "Save this for later", "Follow for more explainers", "Thoughts? Drop them below").
   - Ends with 3-6 relevant hashtags (platform-appropriate count), including a consistent brand tag (e.g. `#MrInformer`).

5. **Save the drafts.** Write each caption to `./infographics/<slug>/posts/<platform>.md` (create the folders if needed). Show all drafted captions to the user in the chat too.

6. **Confirm before publishing.** Explicitly ask the user to confirm which platform(s) to actually publish to now, and let them edit any caption first. Do not call any publish API without this confirmation step, even for a re-run.

7. **Publish (only after confirmation).** For each confirmed platform:
   - Load credentials from the project's `.env` file first: `set -a; source .env; set +a` (run once per Bash session before any curl call — env vars from `.env` don't load automatically). Credentials are never hardcoded and never pasted into chat; `.env` is git-ignored.
   - Follow `platforms/<platform>.md` for the exact env var names and API call.
   - If a required env var is still empty/unset after sourcing `.env`, stop and tell the user exactly which key to fill in in `.env` (see `.env.example` for the full list with setup notes), plus a link to that platform's file for how to obtain it — don't guess or invent a credential.
   - Make the API call via Bash/curl as documented in the platform file.
   - Report the resulting post URL/ID back to the user, or the exact error if it failed.

## Output

- Caption drafts: `./infographics/<slug>/posts/facebook.md`, `instagram.md`, `linkedin.md` (whichever platforms were targeted)
- A published post per confirmed platform, with its returned URL/ID reported in chat

## Adding a new platform

1. Create `platforms/<platform-name>.md` following the structure in `platforms/_template.md`.
2. Add it to the lookup table in [reference.md](reference.md).
3. No changes to this SKILL.md are needed — the steps above are platform-agnostic and just read whichever `platforms/*.md` files are relevant.

## Notes

- Never publish without an explicit, current confirmation from the user — a prior "yes" earlier in the conversation doesn't carry forward to a later run or a different platform.
- Never fabricate an image path, a credential, or a post result. If something's missing or an API call fails, say so plainly.
- Keep captions honest to the infographic's content — this is educational content, not marketing hype.
- Credentials always come from environment variables, documented per-platform in `platforms/`. Never print token values back to the user.
