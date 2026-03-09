"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { type StravaActivity } from "@/lib/strava";
import SummaryCards from "@/components/SummaryCards";
import RecentRides from "@/components/RecentRides";
import DistanceChart from "@/components/DistanceChart";
import SpeedChart from "@/components/SpeedChart";
import ElevationChart from "@/components/ElevationChart";
import PersonalRecords from "@/components/PersonalRecords";
import { ThemeToggle } from "@/components/ThemeToggle";

const RideHeatmap = dynamic(() => import("@/components/RideHeatmap"), {
  ssr: false,
  loading: () => (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-4">Ride Map</h2>
      <div className="bg-foreground/5 rounded-xl animate-pulse" style={{ height: 500 }} />
    </section>
  ),
});

export default function Dashboard() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortedRecent = useMemo(
    () =>
      [...activities]
        .sort((a, b) => a.start_date_local.localeCompare(b.start_date_local))
        .slice(-30),
    [activities]
  );

  useEffect(() => {
    fetch("/api/activities")
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/";
          return null;
        }
        if (!res.ok) throw new Error("Failed to load activities");
        return res.json();
      })
      .then((data) => {
        if (data) setActivities(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground/60 text-lg">Loading your rides...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <Link href="/" className="text-[#FC4C02] underline">Try reconnecting</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Cycling Dashboard</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm text-foreground/50 hover:text-foreground transition-colors"
              >
                Disconnect
              </button>
            </form>
          </div>
        </div>

        <SummaryCards activities={activities} />

        <PersonalRecords activities={activities} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DistanceChart activities={activities} />
          <SpeedChart activities={sortedRecent} />
        </div>

        <ElevationChart activities={sortedRecent} />

        <RideHeatmap activities={activities} />

        <RecentRides activities={activities} />
      </div>
    </div>
  );
}
