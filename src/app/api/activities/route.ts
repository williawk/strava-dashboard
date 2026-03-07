import { NextResponse } from "next/server";
import { getActivities, type StravaActivity } from "@/lib/strava";
import { getValidAccessToken } from "@/lib/tokens";

export async function GET() {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Fetch up to 200 activities (2 pages)
    const page1: StravaActivity[] = await getActivities(accessToken, 1, 100);
    let allActivities = page1;
    if (page1.length === 100) {
      const page2: StravaActivity[] = await getActivities(accessToken, 2, 100);
      allActivities = [...page1, ...page2];
    }

    // Filter for cycling activities
    const rides = allActivities.filter(
      (a) => a.sport_type === "Ride" || a.sport_type === "VirtualRide" || a.sport_type === "MountainBikeRide" || a.sport_type === "GravelRide"
    );

    return NextResponse.json(rides);
  } catch {
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
