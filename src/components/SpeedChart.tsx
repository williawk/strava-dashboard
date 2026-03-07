"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
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

export default function SpeedChart({ activities }: Props) {
  const data = useMemo(() => {
    return activities.map((a) => ({
      date: new Date(a.start_date_local).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      speed: Math.round(a.average_speed * 3.6 * 10) / 10,
    }));
  }, [activities]);

  return (
    <div className="bg-foreground/5 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Average Speed Trend</h2>
      {data.length === 0 ? (
        <p className="text-foreground/40 text-center py-8">No data</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} />
            <YAxis tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} unit=" km/h" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid rgba(128,128,128,0.2)",
                borderRadius: "8px",
              }}
              formatter={(value) => [`${value} km/h`, "Avg Speed"]}
            />
            <Line
              type="monotone"
              dataKey="speed"
              stroke="#FC4C02"
              strokeWidth={2}
              dot={{ fill: "#FC4C02", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
