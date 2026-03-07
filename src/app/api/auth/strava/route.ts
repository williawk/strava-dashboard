import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/strava";

export async function GET() {
  const state = randomBytes(32).toString("hex");
  const response = NextResponse.redirect(getAuthUrl(state));
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
