import { cookies } from "next/headers";
import { refreshAccessToken, type StravaTokens } from "./strava";

const COOKIE_NAME = "strava_tokens";

export async function getTokens(): Promise<StravaTokens | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  if (!tokens) return null;

  const now = Math.floor(Date.now() / 1000);
  if (tokens.expires_at > now + 60) {
    return tokens.access_token;
  }

  // Token expired, refresh it
  const refreshed = await refreshAccessToken(tokens.refresh_token);
  await setTokens({
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expires_at: refreshed.expires_at,
  });
  return refreshed.access_token;
}

export async function setTokens(tokens: StravaTokens) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function clearTokens() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
