import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/strava";

export async function GET(request: NextRequest) {
  const state = randomBytes(32).toString("hex");
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(getAuthUrl(state, origin));
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
