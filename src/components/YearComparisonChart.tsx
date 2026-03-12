"use client";

import { useState, useMemo } from "react";
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
import {
  aggregateByYearMonth,
  formatMetricValue,
  formatSummaryText,
  type YearComparisonMetric,
} from "@/lib/year-comparison";

interface Props {
  activities: StravaActivity[];
}

const METRICS: { key: YearComparisonMetric; label: string }[] = [
  { key: "distance", label: "Distance" },
  { key: "elevation", label: "Elevation" },
  { key: "rides", label: "Rides" },
  { key: "time", label: "Time" },
];

const YAXIS_UNITS: Record<YearComparisonMetric, string> = {
  distance: " km",
  elevation: " m",
  rides: "",
  time: " hrs",
};

export default function YearComparisonChart({ activities }: Props) {
  const [metric, setMetric] = useState<YearComparisonMetric>("distance");

  const result = useMemo(
    () => aggregateByYearMonth(activities, metric),
    [activities, metric],
  );

  const summary = useMemo(
    () => formatSummaryText(result, metric),
    [result, metric],
  );

  const hasData = activities.length > 0;

  return (
    <div className="bg-foreground/5 rounded-xl p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="text-xl font-semibold text-foreground">
          Year-over-Year Comparison
        </h2>
        <div className="flex gap-1 bg-foreground/[0.08] rounded-lg p-[3px]">
          {METRICS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`text-sm font-medium px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                metric === key
                  ? "bg-[#FC4C02] text-white"
                  : "bg-transparent text-foreground/50 hover:text-foreground hover:bg-foreground/[0.08]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <p className="text-foreground/40 text-center py-8">No data</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={result.data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                opacity={0.1}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                stroke="currentColor"
                opacity={0.5}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="currentColor"
                opacity={0.5}
                unit={YAXIS_UNITS[metric]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid rgba(128,128,128,0.2)",
                  borderRadius: "8px",
                }}
                formatter={
                  ((value: number, name: string) => [
                    formatMetricValue(value, metric),
                    name,
                  ]) as never
                }
              />
              <Bar
                dataKey="current"
                name={`${result.currentYear}`}
                fill="#FC4C02"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="previous"
                name={`${result.previousYear}`}
                fill="rgba(128,128,128,0.3)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-foreground/10">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#FC4C02]" />
              <span className="text-sm text-foreground/50">
                {result.currentYear}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded"
                style={{ backgroundColor: "rgba(128,128,128,0.3)" }}
              />
              <span className="text-sm text-foreground/50">
                {result.previousYear}
              </span>
            </div>
          </div>

          <p className="mt-3 text-sm text-foreground/50">
            {summary.text}
            <span className="text-[#FC4C02] font-semibold">
              {summary.highlight}
            </span>
            {summary.suffix}
          </p>
        </>
      )}
    </div>
  );
}
