---
name: infographic
description: Use when someone asks to make an infographic, create an educational infographic, visualize a topic as an infographic, or turn a concept into a shareable graphic.
---

## What This Skill Does

Takes a topic or prompt, researches/drafts concise educational content on it, and produces a clean, self-contained SVG infographic saved to disk, styled to the **Mr. Informer** brand.

For a fast task-by-task lookup (colors, fonts, file paths, animation pattern), see [reference.md](reference.md) instead of re-reading this whole file.

## Steps

1. **Identify the topic.** Use the topic/prompt from the user's request. If it's too vague to build a factual infographic (e.g. no clear subject), ask for clarification instead of guessing.
2. **Draft the content.** Outline the infographic's structure before designing:
   - Title
   - 3-6 key sections (facts, steps, stats, or comparisons — whatever fits the topic)
   - Only include facts/numbers you're confident are accurate. If a stat is uncertain, omit it or phrase it qualitatively rather than inventing a number.
3. **Load design conventions.** Read `.claude/brand-asset/brand-reference.md` (the Mr. Informer brand quick-reference) — this replaces any generic default palette. Use its color table, typography, and tone pillars. Layout/spacing heuristics (avoiding overcrowding, whitespace, mark specs) can still borrow from the `dataviz` skill's structural rules, but **colors and fonts always come from the brand, not from dataviz's default palette.**
4. **Build the SVG.** Write a single self-contained `.svg` file:
   - Background: Graphite `#1F2937` (dark-first brand — don't default to a light/white surface).
   - Title/headings: Poppins Bold/SemiBold (font-family stack: `'Poppins', 'Inter', system-ui, -apple-system, "Segoe UI", sans-serif`), White `#FFFFFF` text.
   - Body/section text: Inter Regular/Medium, Light Gray `#D1D5DB` for secondary text, Dark Gray `#6B7280` for tertiary/muted text.
   - Section/category accents: Accent Blue `#2563EB` as the primary color, Accent Teal `#14B8A6` as the secondary — alternate or pair these two for categorical sections rather than introducing a wider rainbow palette. For 3+ sections, pair Blue/Teal with the Light Gray/Dark Gray neutrals.
   - Icons: simple line-style glyphs in rounded squares/circles, consistent stroke weight, matching the brand's iconography style.
   - Buttons/callout chips (if used): filled Blue = primary emphasis, Teal outline = secondary emphasis.
   - Embed the brand logo: use `.claude/brand-asset/logo-with-background.png` (the version with its own dark card baked in — confirmed by the user to read better than the transparent variant against this infographic's card/background colors). Base64-encode it and place it as a small mark (e.g. bottom-right corner, ~48-64px) via an `<image>` element with a `xlink:href="data:image/png;base64,..."` data URI, so the SVG stays self-contained. Keep clearspace around it roughly equal to its own height.
   - Keep it readable at a glance: cap section count so text doesn't get cramped, leave whitespace, avoid overcrowding.
5. **Save the file.** Slugify the topic (lowercase, hyphens, strip punctuation) and write to `./infographics/<topic-slug>.svg`. Create the `infographics/` directory if it doesn't exist. If the user asks for a "live"/animated/real-time version, save it as `<topic-slug>-live.svg` alongside (don't overwrite the static one) — see [reference.md](reference.md) for the animation pattern.
6. **Report back.** Tell the user the file path. Briefly note anything you omitted for lack of confident data.

## Output

- File: `./infographics/<topic-slug>.svg` (and optionally `./infographics/<topic-slug>-live.svg` for an animated request)
- One SVG per run per variant. If the user asks to revise, edit the existing file rather than creating a duplicate with a new name.

## Notes

- Prioritize factual accuracy over decoration — this is educational content, not marketing material.
- Don't fabricate statistics, dates, or figures. Flag uncertainty to the user rather than inventing specifics.
- Don't overcrowd the layout chasing completeness; a focused infographic beats an exhaustive one.
- No external API calls or paid image generation — everything is authored directly as SVG markup, brand colors/fonts/logo included.
- Always use the brand palette (Step 3/4), never the dataviz skill's default reference palette, for any color decision in this skill's output.
