import { NextRequest, NextResponse } from "next/server";
import { exchangeToken } from "@/lib/strava";
import { setTokens } from "@/lib/tokens";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  try {
    const data = await exchangeToken(code);
    await setTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    });
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch {
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }
}
