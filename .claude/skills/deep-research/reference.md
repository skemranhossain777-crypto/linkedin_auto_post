---
name: deep-research-reference
description: Task-by-task lookup for the deep-research skill — search depth, sourcing rules, file paths, tone. Read this instead of scanning the full SKILL.md.
---

# Deep Research Skill — Quick Reference

| Task | Where to look / exact value |
|---|---|
| Topic too broad/ambiguous | Ask a clarifying question before searching — don't guess the angle |
| How many searches | ~3-6 queries, covering different angles (overview, latest developments, specific sub-aspects) |
| Phrasing time-sensitive queries | Use the actual current date/year, not an assumed one |
| When a claim can be stated as plain fact | Only after confirming it across ≥2 independent sources |
| Single-source or conflicting claim | Flag visibly (e.g. "⚠ Unconfirmed:") — never state with full confidence |
| Report structure | Overview → themed sections → Key Takeaways → References (see SKILL.md's Output Template) |
| Brand tone to write in | `.claude/brand-asset/brand-reference.md` — Informative, Trustworthy, Approachable, Modern |
| Logo/visual branding needed? | No — plain-text markdown report, no image surface |
| Output file path | `./research/<topic-slug>.md` |
| Also shown in chat | Yes, full report, not just a summary |
| Updating an existing topic | Edit/extend the existing file, don't create a duplicate with a new name |
| Fabricating a source/stat/quote | Never — say what's actually known, flag the gap instead |
| User wants a visual version too | That's the `infographic` skill's job, not this one — invoke separately if asked |
