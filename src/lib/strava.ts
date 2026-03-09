import { z } from "zod";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_AUTH_BASE = "https://www.strava.com/oauth";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Add it to .env.local (see .env.example for reference).`
    );
  }
  return value;
}

export function getClientId() {
  return requireEnv("STRAVA_CLIENT_ID");
}

export function getClientSecret() {
  return requireEnv("STRAVA_CLIENT_SECRET");
}

export function getAuthUrl(state: string, origin: string) {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: `${origin}/api/auth/callback`,
    response_type: "code",
    scope: "read,activity:read_all",
    state,
  });
  return `${STRAVA_AUTH_BASE}/authorize?${params}`;
}

export async function exchangeToken(code: string): Promise<StravaTokens> {
  const res = await fetch(`${STRAVA_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("Failed to exchange token");
  const data = await res.json();
  return StravaTokensSchema.parse(data);
}

export async function refreshAccessToken(refreshToken: string): Promise<StravaTokens> {
  const res = await fetch(`${STRAVA_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error("Failed to refresh token");
  const data = await res.json();
  return StravaTokensSchema.parse(data);
}

export async function getActivities(accessToken: string, page = 1, perPage = 100): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch activities");
  const data = await res.json();
  return z.array(StravaActivitySchema).parse(data);
}

const StravaTokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number(),
});
export type StravaTokens = z.infer<typeof StravaTokensSchema>;

export const StravaActivitySchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  sport_type: z.string(),
  distance: z.number(),
  moving_time: z.number(),
  elapsed_time: z.number(),
  total_elevation_gain: z.number(),
  start_date: z.string(),
  start_date_local: z.string(),
  average_speed: z.number(),
  max_speed: z.number(),
  average_heartrate: z.number().optional(),
  max_heartrate: z.number().optional(),
  suffer_score: z.number().optional(),
  map: z.object({
    summary_polyline: z.string().nullable(),
  }).optional(),
});
export type StravaActivity = z.infer<typeof StravaActivitySchema>;
