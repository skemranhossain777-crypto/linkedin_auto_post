---
name: platform-template
description: Template for adding a new social-post platform. Copy this file to platforms/<platform-name>.md and fill it in.
---

# <Platform Name>

## Credentials (env vars)

| Env var | What it is | How to obtain it |
|---|---|---|
| `<PLATFORM>_ACCESS_TOKEN` | ... | ... |
| `<PLATFORM>_...` | ... | ... |

## Caption constraints

- Character limit: ...
- Hashtag norms: ...
- Tone: ...

## Publish flow

1. (e.g. upload image, get a media ID)
2. (e.g. create the post referencing the media ID + caption)
3. What a success response looks like, and what field is the post URL/ID

## Example curl

```bash
curl -s -X POST "https://api.example.com/..." \
  -H "Authorization: Bearer $PLATFORM_ACCESS_TOKEN" \
  -F "..."
```

## Common errors

| Error | Likely cause | Fix |
|---|---|---|
| ... | ... | ... |
