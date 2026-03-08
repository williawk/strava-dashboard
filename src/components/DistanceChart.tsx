"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
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

export default function DistanceChart({ activities }: Props) {
  const data = useMemo(() => {
    const weekly: Record<string, number> = {};
    activities.forEach((a) => {
      const date = new Date(a.start_date_local);
      // Get ISO week start (Monday) by subtracting days via milliseconds
      // This avoids setDate() mutation bugs at month boundaries
      const dayOfWeek = date.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(date.getTime() - daysToMonday * 86_400_000);
      const key = weekStart.toISOString().slice(0, 10);
      weekly[key] = (weekly[key] || 0) + a.distance / 1000;
    });

    return Object.entries(weekly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, km]) => ({
        week: new Date(week).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        km: Math.round(km * 10) / 10,
      }));
  }, [activities]);

  return (
    <div className="bg-foreground/5 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Distance per Week</h2>
      {data.length === 0 ? (
        <p className="text-foreground/40 text-center py-8">No data</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} />
            <YAxis tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} unit=" km" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid rgba(128,128,128,0.2)",
                borderRadius: "8px",
              }}
              formatter={((value: number) => [`${value} km`, "Distance"]) as never}
            />
            <Bar dataKey="km" fill="#FC4C02" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
