# Skills folder

Drop any skill you want Claude to use in this project in here, one folder per skill:

```
.claude/skills/
  my-skill-name/
    SKILL.md
    (any supporting files the skill needs)
```

To add a skill you already built in another project, copy its folder (the one containing
`SKILL.md`) into this directory. Claude will pick it up automatically — no restart needed,
just reference it or let it trigger naturally in conversation.
