"use client";

import { type StravaActivity } from "@/lib/strava";
import { formatDistance, formatDuration, formatElevation } from "@/lib/format";

interface Props {
  activities: StravaActivity[];
}

export default function SummaryCards({ activities }: Props) {
  const totalRides = activities.length;
  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
  const totalElevation = activities.reduce((sum, a) => sum + a.total_elevation_gain, 0);
  const totalTime = activities.reduce((sum, a) => sum + a.moving_time, 0);

  const cards = [
    { label: "Total Rides", value: totalRides.toString() },
    { label: "Total Distance", value: formatDistance(totalDistance) },
    { label: "Total Elevation", value: formatElevation(totalElevation) },
    { label: "Total Time", value: formatDuration(totalTime) },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-foreground/5 rounded-xl p-5 space-y-1"
        >
          <p className="text-sm text-foreground/50">{card.label}</p>
          <p className="text-2xl font-bold text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
