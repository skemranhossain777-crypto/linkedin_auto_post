---
name: social-post-reference
description: Task-by-task lookup for the social-post skill — env vars, endpoints, char limits, file paths. Read this instead of scanning the full SKILL.md.
---

# Social Post Skill — Quick Reference

| Task | Where to look / exact value |
|---|---|
| Which infographic to post | Slug/path from request, else most recent under `./infographics/` |
| Getting a PNG from the SVG | Manual step — ask user for the PNG path, don't auto-convert or fabricate a path |
| Caption drafts location | `./infographics/<slug>/posts/<platform>.md` |
| Brand tone for captions | `.claude/brand-asset/brand-reference.md` (tone pillars: Informative, Trustworthy, Approachable, Modern) |
| Brand hashtag | `#MrInformer` on every platform |
| Facebook API detail | `platforms/facebook.md` |
| Instagram API detail | `platforms/instagram.md` |
| LinkedIn API detail | `platforms/linkedin.md` |
| Adding a new platform | Copy `platforms/_template.md` → `platforms/<name>.md`, fill in, add a row here |
| Before ANY publish call | Explicit, current-turn user confirmation — never carry forward an earlier "yes" |
| Loading credentials | `set -a; source .env; set +a` in Bash before any curl call — `.env` doesn't auto-load |
| Missing credential | Stop, name the exact missing key from `.env`, point to that platform's file — never guess |
| Credential file locations | `.env` (real values, git-ignored) / `.env.example` (documented placeholders + setup notes) at project root |
| Publish result | Report returned post URL/ID, or the exact API error — never assume success |

## Platform quick-facts

| Platform | Caption limit | Typical hashtags | Tone |
|---|---|---|---|
| Facebook | ~500 chars for good engagement (hard limit much higher) | 2-3, understated | Conversational, community-oriented |
| Instagram | ~2,200 chars hard limit, but lead with the hook in first ~125 chars | 5-10 | Casual, visual-first, hashtag-heavy |
| LinkedIn | ~1,300 chars before "see more" truncation | 3-5, professional | Professional, insight-led, no fluff |

## Credential env vars at a glance

| Platform | Env vars needed |
|---|---|
| Facebook | `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN` |
| Instagram | `INSTAGRAM_BUSINESS_ACCOUNT_ID`, `INSTAGRAM_ACCESS_TOKEN` |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`, `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_REFRESH_TOKEN`, `LINKEDIN_AUTHOR_URN` (app-level Client ID/Secret drive the one-time consent + token refresh flow — see `platforms/linkedin.md`) |

Full setup instructions (how to obtain each token/ID) are in the respective `platforms/<name>.md` file — this table is only for spotting a missing var quickly.
