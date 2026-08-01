---
name: platform-facebook
description: Facebook Page publishing detail for the social-post skill — credentials, endpoint, curl template.
---

# Facebook

Posts as a **Facebook Page** (not a personal profile — Meta's API does not support posting photos to personal timelines for third-party apps).

## Credentials (env vars)

| Env var | What it is | How to obtain it |
|---|---|---|
| `FACEBOOK_PAGE_ID` | The numeric ID of the Facebook Page to post as | Page Settings → About, or via `GET /me/accounts` with a user token |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | A long-lived Page access token with `pages_manage_posts` + `pages_read_engagement` scopes | Meta for Developers → your app → Graph API Explorer, generate a User token with those scopes, then exchange for a Page token via `GET /me/accounts` |

If either is unset, stop and tell the user exactly which one is missing — don't attempt the call.

## Caption constraints

- No hard character limit, but posts over ~500 characters see a "See more" truncation and lower engagement — keep the visible hook in the first ~250 characters.
- 2-3 hashtags, understated (Facebook audiences respond less to hashtag-heavy copy than Instagram).
- Tone: conversational, community-oriented, can ask a direct question to invite comments.

## Publish flow

1. Upload the photo with the caption in a single call to `/{page-id}/photos` (Facebook attaches the caption as the post message automatically).
2. A successful response includes `id` (photo ID) and usually `post_id` — construct the viewable URL as `https://www.facebook.com/{post_id}` (replace the underscore in `post_id` appropriately if present as `pageid_postid`).

## Example curl

```bash
curl -s -X POST "https://graph.facebook.com/v19.0/${FACEBOOK_PAGE_ID}/photos" \
  -F "source=@${PNG_PATH}" \
  -F "message=${CAPTION}" \
  -F "access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}"
```

## Common errors

| Error | Likely cause | Fix |
|---|---|---|
| `OAuthException` / code 190 | Token expired or wrong type (user token instead of Page token) | Regenerate a Page access token |
| `(#200) Requires pages_manage_posts` | Missing scope on the token | Re-authorize the app with the correct scope |
| `Unsupported post request` | Wrong `FACEBOOK_PAGE_ID` or endpoint typo | Verify the Page ID |
