"use client";

import { type StravaActivity } from "@/lib/strava";
import { formatDistance, formatDuration, formatSpeed, formatDate } from "@/lib/format";

interface Props {
  activities: StravaActivity[];
}

export default function RecentRides({ activities }: Props) {
  const recent = activities.slice(0, 20);

  return (
    <div className="bg-foreground/5 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Recent Rides</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-foreground/50 border-b border-foreground/10">
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4 text-right">Distance</th>
              <th className="pb-3 pr-4 text-right">Duration</th>
              <th className="pb-3 pr-4 text-right">Avg Speed</th>
              <th className="pb-3 text-right">Elevation</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((ride) => (
              <tr
                key={ride.id}
                className="border-b border-foreground/5 text-foreground"
              >
                <td className="py-3 pr-4 whitespace-nowrap">{formatDate(ride.start_date_local)}</td>
                <td className="py-3 pr-4 max-w-[200px] truncate">{ride.name}</td>
                <td className="py-3 pr-4 text-right whitespace-nowrap">{formatDistance(ride.distance)}</td>
                <td className="py-3 pr-4 text-right whitespace-nowrap">{formatDuration(ride.moving_time)}</td>
                <td className="py-3 pr-4 text-right whitespace-nowrap">{formatSpeed(ride.average_speed)}</td>
                <td className="py-3 text-right whitespace-nowrap">{Math.round(ride.total_elevation_gain)} m</td>
              </tr>
            ))}
          </tbody>
        </table>
        {recent.length === 0 && (
          <p className="text-foreground/40 text-center py-8">No cycling activities found.</p>
        )}
      </div>
    </div>
  );
}
