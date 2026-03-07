import { cookies } from "next/headers";
import { refreshAccessToken, type StravaTokens } from "./strava";

const COOKIE_NAME = "strava_tokens";
const MAX_COOKIE_SIZE = 4096;

/** Module-level promise used to deduplicate concurrent token refresh requests. */
let refreshPromise: Promise<string | null> | null = null;

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

/**
 * Performs the actual token refresh and persists the new tokens.
 * Retries setTokens up to 3 times with increasing delay because the old
 * refresh token is already consumed by Strava once refreshAccessToken succeeds.
 */
async function performTokenRefresh(
  refreshToken: string,
): Promise<string | null> {
  try {
    const refreshed = await refreshAccessToken(refreshToken);

    // Retry cookie persistence — critical because old refresh token is already consumed
    let persisted = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await setTokens({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          expires_at: refreshed.expires_at,
        });
        persisted = true;
        break;
      } catch (err) {
        console.error(
          `[tokens] setTokens attempt ${attempt}/3 failed:`,
          err,
        );
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 100));
        }
      }
    }

    if (!persisted) {
      console.error(
        "[tokens] CRITICAL: All setTokens retries failed. " +
          "New refresh token could not be persisted. " +
          "Access token is still valid for ~6 hours.",
      );
    }

    return refreshed.access_token;
  } catch (err) {
    console.error("[tokens] Token refresh API call failed:", err);
    return null;
  } finally {
    refreshPromise = null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  if (!tokens) return null;

  const now = Math.floor(Date.now() / 1000);
  if (tokens.expires_at > now + 60) {
    return tokens.access_token;
  }

  // If a refresh is already in flight, wait for it instead of starting another
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = performTokenRefresh(tokens.refresh_token);
  return refreshPromise;
}

export async function setTokens(tokens: StravaTokens) {
  const cookieStore = await cookies();
  const value = JSON.stringify(tokens);
  const estimatedSize = new TextEncoder().encode(
    `${COOKIE_NAME}=${value}`
  ).length;

  if (estimatedSize > MAX_COOKIE_SIZE) {
    console.error(
      `[tokens] CRITICAL: Cookie payload is ${estimatedSize} bytes, ` +
        `exceeding the ${MAX_COOKIE_SIZE}-byte browser limit. ` +
        `Token storage will silently fail.`
    );
  } else if (estimatedSize > MAX_COOKIE_SIZE * 0.75) {
    console.warn(
      `[tokens] WARNING: Cookie payload is ${estimatedSize} bytes, ` +
        `approaching the ${MAX_COOKIE_SIZE}-byte browser limit.`
    );
  }

  cookieStore.set(COOKIE_NAME, value, {
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
