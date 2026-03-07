"use client";

import { type StravaActivity } from "@/lib/strava";
import {
  formatDistance,
  formatDuration,
  formatSpeed,
  formatElevation,
  formatDate,
} from "@/lib/format";

interface Props {
  activities: StravaActivity[];
}

type NumericField = "distance" | "moving_time" | "total_elevation_gain" | "average_speed";

function findMax(
  activities: StravaActivity[],
  field: NumericField,
): StravaActivity | undefined {
  return activities.reduce<StravaActivity | undefined>(
    (best, a) => (!best || a[field] > best[field] ? a : best),
    undefined,
  );
}

const records = [
  { label: "Longest Ride", field: "distance" as const, format: formatDistance },
  { label: "Most Elevation", field: "total_elevation_gain" as const, format: formatElevation },
  { label: "Fastest Avg Speed", field: "average_speed" as const, format: formatSpeed },
  { label: "Longest Moving Time", field: "moving_time" as const, format: formatDuration },
];

export default function PersonalRecords({ activities }: Props) {
  if (activities.length === 0) {
    return <p className="text-foreground/40 text-center py-8">No records yet.</p>;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Personal Records</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {records.map(({ label, field, format }) => {
          const activity = findMax(activities, field);
          if (!activity) return null;

          return (
            <div
              key={label}
              className="bg-foreground/5 rounded-xl p-5 space-y-1"
            >
              <p className="text-sm text-foreground/50">{label}</p>
              <p className="text-2xl font-bold text-[#FC4C02]">
                {format(activity[field])}
              </p>
              <p className="text-sm text-foreground truncate" title={activity.name}>{activity.name}</p>
              <p className="text-xs text-foreground/40">{formatDate(activity.start_date_local)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
