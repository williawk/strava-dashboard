import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { exchangeToken } from "@/lib/strava";
import { setTokens } from "@/lib/tokens";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("oauth_state")?.value;

  if (
    !state ||
    !storedState ||
    state.length !== storedState.length ||
    !timingSafeEqual(Buffer.from(state), Buffer.from(storedState))
  ) {
    const res = NextResponse.redirect(new URL("/?error=invalid_state", request.url));
    res.cookies.delete("oauth_state");
    return res;
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    const res = NextResponse.redirect(new URL("/?error=no_code", request.url));
    res.cookies.delete("oauth_state");
    return res;
  }

  try {
    const data = await exchangeToken(code);

    if (!data.access_token || !data.refresh_token || !data.expires_at) {
      const res = NextResponse.redirect(new URL("/?error=invalid_token_response", request.url));
      res.cookies.delete("oauth_state");
      return res;
    }

    await setTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    });
    const res = NextResponse.redirect(new URL("/dashboard", request.url));
    res.cookies.delete("oauth_state");
    return res;
  } catch {
    const res = NextResponse.redirect(new URL("/?error=auth_failed", request.url));
    res.cookies.delete("oauth_state");
    return res;
  }
}
