---
name: platform-linkedin
description: LinkedIn publishing detail for the social-post skill — credentials, endpoint, curl template.
---

# LinkedIn

Posts via LinkedIn's newer **versioned Posts API** (`/rest/images`,
`/rest/posts`), as either a personal profile or a Company Page depending on
which URN is configured. The older `/v2/assets` + `/v2/ugcPosts` flow is
deprecated for most apps now — it returns an HTML login page instead of JSON
when hit, which is the tell that you're on the wrong flow.

## Credentials (env vars)

Auth is app-level (Client ID + Client Secret), not a manually-pasted token —
this mirrors the Gmail setup pattern: authorize once, then refresh automatically.

| Env var | What it is | How to obtain it |
|---|---|---|
| `LINKEDIN_CLIENT_ID` | The app's Client ID | LinkedIn Developer Portal → your app → **Auth** tab |
| `LINKEDIN_CLIENT_SECRET` | The app's **Primary** Client Secret | Same **Auth** tab, "Primary Client Secret" (a Secondary secret can be rotated in without downtime, but Primary is what this skill reads) |
| `LINKEDIN_REDIRECT_URI` | An authorized redirect URL registered on the app | Auth tab → "Authorized redirect URLs for your app" — for a one-off manual flow, `https://www.linkedin.com/developers/tools/oauth/redirect` or `http://localhost` both work if added there |
| `LINKEDIN_ACCESS_TOKEN` | Short-lived (60 day) member/org access token | Obtained via the one-time consent flow below, using the Client ID/Secret above |
| `LINKEDIN_REFRESH_TOKEN` | Long-lived (365 day) token to mint new access tokens without re-consenting | Returned alongside the access token in the same flow, **only if** your app has the "Refresh Token" feature enabled on the OAuth 2.0 product |
| `LINKEDIN_AUTHOR_URN` | The posting identity, e.g. `urn:li:person:xxxx` or `urn:li:organization:xxxx` | `GET https://api.linkedin.com/v2/userinfo` (requires `openid` + `profile` scope on the token — `/v2/me` is legacy and returns 403 on newer apps). The response's `sub` field is the person ID: format as `urn:li:person:{sub}`. For an organization URN, use the Page admin view instead — must include the `urn:li:person:` / `urn:li:organization:` prefix, not just the bare ID |

If `LINKEDIN_CLIENT_ID` or `LINKEDIN_CLIENT_SECRET` is unset, stop and tell the
user exactly which one is missing — don't attempt any call. If
`LINKEDIN_ACCESS_TOKEN` is unset/expired and there's no `LINKEDIN_REFRESH_TOKEN`
to mint a new one, the user needs to redo the one-time consent flow below —
this can't be skipped by inventing a token.

## One-time consent flow (needed once per app, or when the refresh token expires)

Client ID + Secret alone cannot authenticate as a specific LinkedIn member or
Page — LinkedIn requires a one-time human consent step first. After that,
if refresh tokens are enabled, this doesn't need to be repeated for a year.

A quick redirect option that needs no server: use LinkedIn's own hosted tool
page as the redirect URL — `https://www.linkedin.com/developers/tools/oauth/redirect`.
Register that exact URL under the app's Auth tab → "Authorized redirect URLs
for your app" first, and set `LINKEDIN_REDIRECT_URI` to match it exactly.

1. **Build the authorization URL** (open this in a browser, logged in as the account/Page admin to post as). Include `openid` and `profile` in the scope — needed to resolve `LINKEDIN_AUTHOR_URN` via `/v2/userinfo` later, not just to post:
   ```
   https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${LINKEDIN_REDIRECT_URI}&scope=openid%20profile%20w_member_social%20w_organization_social
   ```
   (drop `w_organization_social` from the scope if only posting as a personal profile)
2. After consenting, LinkedIn's redirect tool page shows the resulting URL with `?code=AUTH_CODE...` in it — copy the `code` value. It's short-lived, so exchange it promptly.
3. **Exchange the code for tokens.** Use `--data-urlencode` for every field, not plain `-d` — the code and secret can contain characters (`+`, `/`, `-`) that need proper encoding, and a plain `-d` silently mangles them into an `invalid_client` error that looks like a credentials problem but isn't:
   ```bash
   curl -s -X POST "https://www.linkedin.com/oauth/v2/accessToken" \
     --data-urlencode "grant_type=authorization_code" \
     --data-urlencode "code=AUTH_CODE_FROM_STEP_2" \
     --data-urlencode "redirect_uri=${LINKEDIN_REDIRECT_URI}" \
     --data-urlencode "client_id=${LINKEDIN_CLIENT_ID}" \
     --data-urlencode "client_secret=${LINKEDIN_CLIENT_SECRET}"
   ```
   Response includes `access_token` (and `refresh_token` if that feature is enabled on the app) — save both into `.env` as `LINKEDIN_ACCESS_TOKEN` / `LINKEDIN_REFRESH_TOKEN`.
4. **Resolve the author URN** while you're at it:
   ```bash
   curl -s "https://api.linkedin.com/v2/userinfo" -H "Authorization: Bearer ${LINKEDIN_ACCESS_TOKEN}"
   ```
   Format the response's `sub` field as `urn:li:person:{sub}` and save as `LINKEDIN_AUTHOR_URN`.

This step needs the user to actually visit the authorization URL and paste back
the resulting code — it can't be done headlessly. Ask the user to do it and
paste the code, rather than trying to script around it.

## Refreshing the access token (once a refresh token exists)

```bash
set -a; source .env; set +a
TOKEN_JSON=$(curl -s -X POST "https://www.linkedin.com/oauth/v2/accessToken" \
  -d grant_type=refresh_token \
  -d refresh_token="${LINKEDIN_REFRESH_TOKEN}" \
  -d client_id="${LINKEDIN_CLIENT_ID}" \
  -d client_secret="${LINKEDIN_CLIENT_SECRET}")
ACCESS_TOKEN=$(node -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).access_token)" <<< "$TOKEN_JSON")
```

Use `$ACCESS_TOKEN` (not the stale `.env` value) for the rest of the run, and
update `LINKEDIN_ACCESS_TOKEN` in `.env` with the fresh one for next time.

## Caption constraints

- Effectively ~3,000 character hard limit, but truncates to "see more" after ~1,300 characters — keep the key point in the first ~200 characters.
- 3-5 hashtags, professional/topical (e.g. `#Automation`, `#Productivity`), placed at the end.
- Tone: professional, insight-led — frame the infographic as a takeaway or lesson, not a casual share. No excess emoji.

## Publish flow (versioned Posts API — initialize upload, upload, then post)

Every call needs a `LinkedIn-Version: YYYYMM` header. LinkedIn only keeps a
rolling ~12-month window of versions active — a value that looks plausible
(e.g. last year's date) will 426 with `NONEXISTENT_VERSION`. **Don't guess an
old-looking date; probe forward from the current month** if unsure (e.g. try
this month, then the two before it) and use the first one that returns a real
response instead of `NONEXISTENT_VERSION`.

1. **Initialize the image upload** — `POST /rest/images?action=initializeUpload` with `{"initializeUploadRequest": {"owner": "<author urn>"}}`. Returns `value.uploadUrl` and `value.image` (an `urn:li:image:...`, not `urn:li:digitalmediaAsset:...` — that URN shape belongs to the deprecated flow).
2. **Upload the binary** — `PUT` the PNG bytes to `uploadUrl` with an explicit `Content-Type: image/png` header. Omitting it can produce a `400` even though the URL and token are correct.
3. **Create the post** — `POST /rest/posts` with `author`, `commentary` (the caption), `visibility`, `distribution`, and `content.media.id` set to the `image` URN from step 1.
4. Success is `201 Created` with an `x-restli-id` response header like `urn:li:share:...` — the viewable URL is `https://www.linkedin.com/feed/update/{that urn}/`.

## Example curl

```bash
set -a; source .env; set +a
LI_VERSION="202607"   # bump to the current month if this goes stale; see note above
CAPTION=$(cat infographics/<slug>/posts/linkedin.md)
PNG_PATH="infographics/<slug>.png"

# Step 1: initialize upload
INIT_JSON=$(curl -s -X POST "https://api.linkedin.com/rest/images?action=initializeUpload" \
  -H "Authorization: Bearer ${LINKEDIN_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "LinkedIn-Version: ${LI_VERSION}" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  -d '{"initializeUploadRequest": {"owner": "'"${LINKEDIN_AUTHOR_URN}"'"}}')
UPLOAD_URL=$(node -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).value.uploadUrl)" <<< "$INIT_JSON")
IMAGE_URN=$(node -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).value.image)" <<< "$INIT_JSON")

# Step 2: upload binary (Content-Type header matters)
curl -s -X PUT "$UPLOAD_URL" \
  -H "Authorization: Bearer ${LINKEDIN_ACCESS_TOKEN}" \
  -H "Content-Type: image/png" \
  --data-binary "@${PNG_PATH}"

# Step 3: create the post (build the JSON body in a file to keep the caption's
# newlines/quotes safe rather than interpolating it into an inline -d string)
node -e "
const fs = require('fs');
const caption = fs.readFileSync(process.argv[1], 'utf8').trim();
const body = {
  author: process.env.LINKEDIN_AUTHOR_URN,
  commentary: caption,
  visibility: 'PUBLIC',
  distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
  content: { media: { title: 'Infographic title here', id: process.argv[2] } },
  lifecycleState: 'PUBLISHED',
  isReshareDisabledByAuthor: false
};
fs.writeFileSync('/tmp/li_post_body.json', JSON.stringify(body));
" "infographics/<slug>/posts/linkedin.md" "$IMAGE_URN"

curl -s -i -X POST "https://api.linkedin.com/rest/posts" \
  -H "Authorization: Bearer ${LINKEDIN_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "LinkedIn-Version: ${LI_VERSION}" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  --data-binary "@/tmp/li_post_body.json"
```

(No `jq` dependency — parsed with `node -e` instead since that's what's available in this environment; swap back to `jq` if present.)

## Common errors

| Error | Likely cause | Fix |
|---|---|---|
| Upload/post endpoint returns an HTML page instead of JSON | Hit the deprecated `/v2/assets` or `/v2/ugcPosts` endpoints | Use `/rest/images` + `/rest/posts` instead, with a `LinkedIn-Version` header |
| `426 NONEXISTENT_VERSION` | The `LinkedIn-Version` header value is outside the active rolling window | Try the current year-month (`YYYYMM`); step back a month or two if that fails, don't reuse an old hardcoded value indefinitely |
| `invalid_client` on token exchange/refresh | Fields sent via plain `-d` instead of `--data-urlencode` (special characters get mangled), OR genuinely wrong `LINKEDIN_CLIENT_ID`/`LINKEDIN_CLIENT_SECRET`/using the Secondary secret instead of Primary | Retry with `--data-urlencode` on every field first — this was the actual cause once already; only treat it as a credentials problem if that doesn't fix it |
| `403 ACCESS_DENIED` on `/v2/userinfo` or `/v2/me` | Access token's scope didn't include `openid`/`profile` | Redo the consent flow with `openid profile` added to the scope |
| `400` on the upload `PUT` | Missing `Content-Type: image/png` header | Add it explicitly |
| `401 Unauthorized` / `INVALID_ACCESS_TOKEN` | Access token expired, revoked, or wrong-scope | If a refresh token exists, refresh it (see above); otherwise redo the one-time consent flow |
| `403` on post creation | `LINKEDIN_AUTHOR_URN` doesn't match the token's authorized identity, or missing the `urn:li:person:`/`urn:li:organization:` prefix | Confirm the URN format and that the token was issued for that identity |
