---
name: brand-reference
description: Mr. Informer brand guideline in text form — colors, typography, logo, tone. Every skill built in this project must apply this.
---

# Mr. Informer — Brand Reference

Source: `brand-guidleline.png` in this folder (full visual guideline). This file is
the text-extracted quick-reference so skills don't need to re-read the image.

## Logo

Two files — pick based on what's already behind the logo at placement time:

- **`.claude/brand-asset/logo-without-background.png`** — transparent PNG, mark + wordmark only, no card. **Default choice.** Use whenever the logo sits on a surface the deliverable already controls (e.g. our SVGs already painted Graphite `#1F2937`, a slide with its own dark background, a colored footer band). Overlaying it directly avoids a visible box-within-a-box.
- **`.claude/brand-asset/logo-with-background.png`** — dark rounded-square card baked in behind the mark. Use only when the logo will sit on a surface that does *not* already match the brand background — e.g. a plain white document, a third-party platform's own light-gray UI (a social media post preview canvas, an email client's white body), or any place transparency would let an uncontrolled/clashing color show through.
- Rule of thumb: if you already painted the pixels behind the logo's placement, use **without-background**. If you don't control what's behind it, use **with-background**.
- Clearspace: keep clear space around the logo equal to the height of the "M" in the wordmark.
- Include the logo in any generated deliverable that functions as a piece of branded content — infographics, reports, slides, exported documents, social post preview images. Skip it only for pure data/code files where a mark would be meaningless (e.g. a `.csv`), or plain-text output (chat messages, Telegram alerts, email drafts) where there's no image surface to place it on.

## Colors

| Role | Name | Hex | RGB |
|---|---|---|---|
| Background/ink (dark mode base) | Graphite | `#1F2937` | 31, 41, 55 |
| Primary text (on dark) | White | `#FFFFFF` | 255, 255, 255 |
| Secondary text / muted | Light Gray | `#D1D5DB` | 209, 213, 219 |
| Tertiary / disabled | Dark Gray | `#6B7280` | 107, 114, 128 |
| Primary accent | Accent Blue | `#2563EB` | 37, 99, 235 |
| Secondary accent | Accent Teal | `#14B8A6` | 20, 184, 166 |

Usage:
- Primary buttons / primary CTAs: filled Accent Blue, white text.
- Secondary buttons: transparent fill, Accent Teal outline + text.
- Default surface is dark (Graphite), not white — this is a dark-first brand.
- Blue and Teal are the only two accent colors — use them for categorical distinction (e.g. blue = primary flow, teal = secondary/success), not a wide multi-hue palette.
- When a chart/infographic needs more than 2 categorical colors, pair Blue + Teal with the Light Gray / Dark Gray neutrals rather than inventing new hues.

## Typography

- Headings: **Poppins**, Bold / SemiBold.
- Body text: **Inter**, Regular / Medium.
- Fallback stack (for HTML/SVG where these fonts may not be installed): `'Poppins', 'Inter', system-ui, -apple-system, "Segoe UI", sans-serif` — declare both fonts by name so they pick up if available/importable, falling back gracefully.

## Iconography & buttons

- Icons: simple line-style glyphs inside rounded squares, consistent stroke weight (see guideline image icon row: chevron, person, file, card, bell, heart, chat, search, shield-check, gear).
- Buttons: rounded-rect pill shape. Primary = filled blue. Secondary = outlined teal.

## Tone & voice

Four pillars — write copy and structure content to reflect these:
- **Informative** — clear, accurate, helpful.
- **Trustworthy** — reliable, honest, credible.
- **Approachable** — friendly, respectful, easy to understand.
- **Modern** — smart, innovative, future-ready.

## How skills should use this file

1. Read this file (not the PNG) when a skill needs colors/fonts/logo — it's faster and text-parseable.
2. Apply the color table above in place of any generic/default palette (e.g. don't pull the `dataviz` skill's default reference palette for brand-facing output — use Blue/Teal/Graphite/Grays instead).
3. Reference the correct logo variant by relative path when embedding it in generated output — `logo-without-background.png` by default, `logo-with-background.png` only when the destination surface isn't one the deliverable already painted (see **Logo** section above).
4. If the guideline PNG itself is needed for a pixel-level detail not captured here (e.g. exact icon shapes), read `.claude/brand-asset/brand-guidleline.png` directly.
