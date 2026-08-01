// Publish flow follows .claude/skills/social-post/platforms/linkedin.md exactly,
// so the same LinkedIn app/credentials work for both the manual skill and this
// automation. Prefers refreshing via LINKEDIN_REFRESH_TOKEN (no human needed);
// falls back to the static LINKEDIN_ACCESS_TOKEN if no refresh token is set —
// that token expires after ~60 days and needs manual renewal at that point
// (redo the one-time consent flow in linkedin.md) unless a refresh token gets
// added later.

function currentLinkedInVersion(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const refreshToken = process.env.LINKEDIN_REFRESH_TOKEN;
  const staticAccessToken = process.env.LINKEDIN_ACCESS_TOKEN;

  if (!refreshToken) {
    if (!staticAccessToken) {
      throw new Error("Neither LINKEDIN_REFRESH_TOKEN nor LINKEDIN_ACCESS_TOKEN is set");
    }
    return staticAccessToken;
  }
  if (!clientId) throw new Error("LINKEDIN_CLIENT_ID is not set");
  if (!clientSecret) throw new Error("LINKEDIN_CLIENT_SECRET is not set");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`LinkedIn token refresh failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

async function initializeImageUpload(
  accessToken: string,
  authorUrn: string,
  version: string
): Promise<{ uploadUrl: string; image: string }> {
  const res = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": version,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({ initializeUploadRequest: { owner: authorUrn } }),
  });
  if (!res.ok) {
    throw new Error(`LinkedIn initializeUpload failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { value: { uploadUrl: string; image: string } };
  return json.value;
}

async function uploadImage(uploadUrl: string, accessToken: string, png: Buffer): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "image/png",
    },
    body: png,
  });
  if (!res.ok) {
    throw new Error(`LinkedIn image upload failed: ${res.status} ${await res.text()}`);
  }
}

async function createPost(
  accessToken: string,
  authorUrn: string,
  version: string,
  caption: string,
  imageUrn: string,
  mediaTitle: string
): Promise<string | null> {
  const body = {
    author: authorUrn,
    commentary: caption,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    content: { media: { title: mediaTitle, id: imageUrn } },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": version,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`LinkedIn post creation failed: ${res.status} ${await res.text()}`);
  }

  const shareUrn = res.headers.get("x-restli-id");
  return shareUrn ? `https://www.linkedin.com/feed/update/${shareUrn}/` : null;
}

export async function publishToLinkedIn(
  png: Buffer,
  caption: string,
  mediaTitle: string
): Promise<string | null> {
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN;
  if (!authorUrn) throw new Error("LINKEDIN_AUTHOR_URN is not set");

  const accessToken = await getAccessToken();
  const version = currentLinkedInVersion();

  const { uploadUrl, image } = await initializeImageUpload(accessToken, authorUrn, version);
  await uploadImage(uploadUrl, accessToken, png);
  return createPost(accessToken, authorUrn, version, caption, image, mediaTitle);
}
