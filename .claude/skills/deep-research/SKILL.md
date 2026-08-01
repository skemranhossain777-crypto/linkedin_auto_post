---
name: deep-research
description: Use when someone asks to research a topic, find the latest on something, dig into a subject, or wants an up-to-date report with sources.
argument-hint: [topic]
---

## What This Skill Does

Takes a topic, researches it using live web search, cross-checks key claims
across multiple sources, and produces a structured, well-written report saved
to disk with a References section for validation.

For a fast task-by-task lookup, see [reference.md](reference.md) instead of
re-reading this whole file.

## Steps

1. **Clarify the topic.** Use the topic from the request or `$ARGUMENTS`. If it's too broad ("AI") or ambiguous (could mean several different things), ask a quick clarifying question rather than guessing the angle — a narrower, well-scoped topic produces a much better report than a shallow pass at something huge.

2. **Search.** Run a moderate round of web searches — roughly 3-6 queries covering different angles of the topic (e.g. an overview query, a "latest developments" query, and a couple of queries on specific sub-aspects that come up). Use the current date to phrase time-sensitive queries correctly (e.g. include the current year, not last year, when searching for "latest").

3. **Cross-check before treating anything as fact.** For any claim, statistic, date, or event that will be stated as settled fact in the report, confirm it appears consistently across at least 2 independent sources. If a claim only appears in one source, or sources conflict, it doesn't get to be stated as plain fact — see step 5.

4. **Synthesize, don't dump links.** Organize findings by theme or subtopic into a coherent narrative — this is a research report, not a list of search snippets. Write in the Mr. Informer brand tone: **Informative** (clear, accurate, helpful), **Trustworthy** (reliable, honest — including about uncertainty), **Approachable** (easy to understand, no unnecessary jargon), **Modern** (current, relevant framing). See `.claude/brand-asset/brand-reference.md` for the full tone reference. No logo/visual branding needed here — this is a plain-text markdown report, not an image deliverable.

5. **Flag low-confidence claims explicitly.** Anything single-source, contested between sources, speculative, or rumor-stage gets a visible marker in the text (e.g. an italicized note or a "⚠ Unconfirmed:" prefix) — never presented with the same confidence as a cross-checked fact. Don't omit interesting-but-unconfirmed information entirely; just be honest about its confidence level.

6. **Compile references.** List every source actually used, as markdown links, in a `## References` section at the end — this is what lets the user validate any claim themselves.

7. **Save and present.** Slugify the topic (lowercase, hyphens, strip punctuation) and write the report to `./research/<topic-slug>.md`. Create the `research/` directory if it doesn't exist. Also show the full report in chat — don't make the user open the file to see what they asked for.

## Output Template

```markdown
# [Topic]

*Research summary — [current date]*

## Overview

[1-2 paragraph framing of the topic and why it matters / what's covered]

## [Theme/Subtopic 1]

[Synthesized findings, cross-checked claims stated plainly, low-confidence
claims marked with ⚠ Unconfirmed:]

## [Theme/Subtopic 2]

...

## Key Takeaways

- [Bulleted summary of the most important points]

## References

- [Source Title](URL)
- [Source Title](URL)
```

## Output

- File: `./research/<topic-slug>.md`
- Same content also shown in full in the chat response
- One report per run. If the user asks to go deeper on the same topic later, update the existing file rather than creating a duplicate.

## Notes

- Never fabricate a source, statistic, date, or quote. If web search doesn't turn up enough to say something confidently, say what's actually known and flag the gap — don't fill it with a plausible-sounding invention.
- Cross-checking is the core safeguard here — a single source is not enough to state something as settled fact, no matter how authoritative that one source seems.
- Keep the report proportional to the topic — don't pad a narrow topic with filler sections just to look thorough.
- This is a research/writing task, not a design task — no need to invoke the `dataviz` or `infographic` skills here unless the user separately asks for a visual version of the findings.
