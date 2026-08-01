---
name: infographic-reference
description: Task-by-task lookup for the infographic skill — colors, fonts, file paths, animation pattern. Read this instead of scanning the full SKILL.md.
---

# Infographic Skill — Quick Reference

Jump to the row you need instead of re-reading SKILL.md top to bottom.

| Task | Where to look / exact value |
|---|---|
| Background color | `#1F2937` (Graphite) — dark surface, always |
| Heading font | Poppins Bold/SemiBold, `#FFFFFF` |
| Body font | Inter Regular/Medium |
| Font fallback stack | `'Poppins', 'Inter', system-ui, -apple-system, "Segoe UI", sans-serif` |
| Secondary text color | `#D1D5DB` (Light Gray) |
| Muted/tertiary text color | `#6B7280` (Dark Gray) |
| Primary accent (section 1, primary CTA) | `#2563EB` (Accent Blue) |
| Secondary accent (section 2, secondary CTA) | `#14B8A6` (Accent Teal) |
| 3+ section colors | Alternate Blue/Teal, pad with Light Gray/Dark Gray neutrals — don't add new hues |
| Full brand detail (icons, buttons, tone, logo variations) | `.claude/brand-asset/brand-reference.md` |
| Pixel-level guideline (if text ref insufficient) | `.claude/brand-asset/brand-guidleline.png` |
| Logo file to embed | `.claude/brand-asset/logo-with-background.png` — base64-encode, embed via `<image xlink:href="data:image/png;base64,...">`, ~48-64px, bottom-right corner |
| Why not the transparent variant | User feedback: `logo-without-background.png` didn't read well against this infographic's card/background colors — overridden to always use the with-background version here, contrary to the general brand-reference.md default |
| Output path (static) | `./infographics/<topic-slug>.svg` |
| Output path (animated/live request) | `./infographics/<topic-slug>-live.svg` (separate file, don't overwrite static) |
| Layout/spacing structural rules (whitespace, mark specs, avoiding overcrowding) | Borrow from the `dataviz` skill's structural guidance — NOT its default color palette |
| Revising an existing infographic | Edit the existing file in place; don't create a new duplicate filename |
| Uncertain stat/fact | Omit or phrase qualitatively — never invent a number |

## Animation pattern (for "-live"/real-time requests)

Use native SVG SMIL `<animate>` elements (no JS needed, portable):

1. Pick a total loop duration (e.g. `dur="10s"`, `repeatCount="indefinite"`).
2. Give each stage/section a dwell window as a fraction of the loop (e.g. 4 stages → ~0.15 dwell + ~0.10 transit each, summing to 1.0).
3. Animate a "packet"/marker element's `cx`/`cy` (or `transform`) across the stage centers using matching `keyTimes` fractions, pausing (repeated value) during dwell and moving during transit.
4. Animate each stage's border `stroke-width` (e.g. 2 → 5 → 2) with `keyTimes` matching its own dwell window, so the active stage visibly highlights.
5. Optional live status line: stack one `<text>` per stage at the same position, each with an `opacity` `<animate>` using `calcMode="discrete"` so only the active stage's text shows.
6. Always set `dur` identically across all `<animate>` elements in the file so they stay in sync on repeat.

See `./infographics/personal-email-automation-cycle-live.svg` (built before brand policy existed — uses the old dataviz palette, not the brand colors) as a structural example of the technique only; don't copy its colors.
