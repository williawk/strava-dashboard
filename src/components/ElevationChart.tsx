"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { type StravaActivity } from "@/lib/strava";

interface Props {
  activities: StravaActivity[];
}

export default function ElevationChart({ activities }: Props) {
  const data = useMemo(() => {
    return activities.map((a) => ({
      date: new Date(a.start_date_local).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      elevation: Math.round(a.total_elevation_gain),
    }));
  }, [activities]);

  return (
    <div className="bg-foreground/5 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Elevation Gain per Ride</h2>
      {data.length === 0 ? (
        <p className="text-foreground/40 text-center py-8">No data</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} />
            <YAxis tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} unit=" m" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid rgba(128,128,128,0.2)",
                borderRadius: "8px",
              }}
              formatter={((value: number) => [`${value} m`, "Elevation"]) as never}
            />
            <Area
              type="monotone"
              dataKey="elevation"
              stroke="#FC4C02"
              fill="#FC4C02"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
