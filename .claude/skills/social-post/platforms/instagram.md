---
name: platform-instagram
description: Instagram Business account publishing detail for the social-post skill — credentials, endpoint, curl template.
---

# Instagram

Posts via the **Instagram Graph API**, which requires an Instagram *Business or
Creator* account linked to a Facebook Page — there is no direct personal-account
posting API.

## Credentials (env vars)

| Env var | What it is | How to obtain it |
|---|---|---|
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | The IG Business account's ID (not the @handle) | `GET /{facebook-page-id}?fields=instagram_business_account` with a Page token |
| `INSTAGRAM_ACCESS_TOKEN` | A Page/User access token with `instagram_content_publish` scope (often the same token as `FACEBOOK_PAGE_ACCESS_TOKEN` if the same app/page) | Meta for Developers → Graph API Explorer |

If either is unset, stop and tell the user exactly which one is missing — don't attempt the call.

## Caption constraints

- Hard limit 2,200 characters, but only the first ~125 characters show before "more" — put the hook there.
- 5-10 hashtags is typical; can go up to 30 but diminishing returns and looks spammy past ~15. Mix broad + niche tags.
- Tone: casual, visual-first — let the image lead, caption supports it. Emoji are fine and expected.

## Publish flow (two-step: container, then publish)

1. **Create a media container** — `POST /{ig-business-id}/media` with `image_url` (must be a public HTTPS URL to the PNG — Instagram does not accept direct file upload, it fetches the image) and `caption`. Returns a `creation_id`.
2. **Publish the container** — `POST /{ig-business-id}/media_publish` with `creation_id`. Returns the published media `id`.
3. Construct the permalink via a follow-up `GET /{media-id}?fields=permalink` call if you want the exact URL to report back.

**Note:** because step 1 needs a public URL, the PNG must already be reachable online (e.g. hosted somewhere) — a purely local file path won't work for Instagram specifically. If the user only has a local PNG, tell them Instagram needs it hosted at a public URL first (ask where they'd like to host it) before this step can run.

## Example curl

```bash
# Step 1: create container
CREATION_ID=$(curl -s -X POST "https://graph.facebook.com/v19.0/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media" \
  -d "image_url=${PUBLIC_PNG_URL}" \
  -d "caption=${CAPTION}" \
  -d "access_token=${INSTAGRAM_ACCESS_TOKEN}" | jq -r '.id')

# Step 2: publish
curl -s -X POST "https://graph.facebook.com/v19.0/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish" \
  -d "creation_id=${CREATION_ID}" \
  -d "access_token=${INSTAGRAM_ACCESS_TOKEN}"
```

## Common errors

| Error | Likely cause | Fix |
|---|---|---|
| `Media type not supported` | `image_url` isn't a reachable direct image link | Verify the URL returns the PNG directly (no redirects/auth wall) |
| `Invalid parameter` on publish | Wrong or expired `creation_id` | Re-run the container creation step first |
| `(#10) permission denied` | Token missing `instagram_content_publish` scope, or account isn't a Business/Creator account | Re-check account type and token scopes |
