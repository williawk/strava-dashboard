import { NextRequest, NextResponse } from "next/server";
import { clearTokens } from "@/lib/tokens";

export async function POST(request: NextRequest) {
  await clearTokens();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
