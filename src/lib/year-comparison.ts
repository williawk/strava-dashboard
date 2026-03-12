import { type StravaActivity } from "@/lib/strava";

export type YearComparisonMetric = "distance" | "elevation" | "rides" | "time";

export interface MonthlyData {
  month: string;
  monthIndex: number;
  current: number;
  previous: number;
}

export interface YearComparisonResult {
  data: MonthlyData[];
  currentYear: number;
  previousYear: number;
  currentYearTotal: number;
  previousYearTotal: number;
  difference: number;
  percentageChange: number | null;
}

export interface SummaryText {
  text: string;
  highlight: string;
  suffix: string;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Extract the numeric value for a given metric from an activity. */
function extractMetricValue(
  activity: StravaActivity,
  metric: YearComparisonMetric
): number {
  switch (metric) {
    case "distance":
      return activity.distance / 1000;
    case "elevation":
      return activity.total_elevation_gain;
    case "rides":
      return 1;
    case "time":
      return activity.moving_time / 3600;
  }
}

/**
 * Aggregates Strava activities into month-by-month data for the current year
 * and the previous year, computing YTD totals and percentage change.
 *
 * @param activities - Array of Strava activities to aggregate
 * @param metric - Which metric to aggregate (distance, elevation, rides, time)
 * @param now - Reference date for determining current/previous year (defaults to today)
 */
export function aggregateByYearMonth(
  activities: StravaActivity[],
  metric: YearComparisonMetric,
  now: Date = new Date()
): YearComparisonResult {
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;
  const currentMonth = now.getMonth();

  // Initialize 12-month grid with zeroes
  const data: MonthlyData[] = MONTH_NAMES.map((month, index) => ({
    month,
    monthIndex: index,
    current: 0,
    previous: 0,
  }));

  // Bucket each activity into the appropriate month slot
  for (const activity of activities) {
    const date = new Date(activity.start_date_local);
    const year = date.getFullYear();
    const month = date.getMonth();

    if (year === currentYear) {
      data[month].current += extractMetricValue(activity, metric);
    } else if (year === previousYear) {
      data[month].previous += extractMetricValue(activity, metric);
    }
    // Activities outside the 2-year window are silently ignored
  }

  // YTD totals: only sum months 0 through the current month (inclusive)
  let currentYearTotal = 0;
  let previousYearTotal = 0;
  for (let i = 0; i <= currentMonth; i++) {
    currentYearTotal += data[i].current;
    previousYearTotal += data[i].previous;
  }

  const difference = currentYearTotal - previousYearTotal;
  const percentageChange =
    previousYearTotal === 0
      ? null
      : ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100;

  return {
    data,
    currentYear,
    previousYear,
    currentYearTotal,
    previousYearTotal,
    difference,
    percentageChange,
  };
}

/**
 * Formats a numeric metric value into a human-readable string with the
 * appropriate unit suffix.
 */
export function formatMetricValue(
  value: number,
  metric: YearComparisonMetric
): string {
  switch (metric) {
    case "distance":
      return `${value.toFixed(1)} km`;
    case "elevation":
      return `${Math.round(value).toLocaleString("en-US")} m`;
    case "rides":
      return `${value} ${value === 1 ? "ride" : "rides"}`;
    case "time":
      return `${value.toFixed(1)} hrs`;
  }
}

/** Map from metric to its unit label used in summary text. */
const METRIC_UNITS: Record<YearComparisonMetric, string> = {
  distance: "km",
  elevation: "m",
  rides: "rides",
  time: "hrs",
};

/**
 * Builds a structured summary sentence describing the year-over-year change.
 * Returns separate text/highlight/suffix fields so callers can style the
 * highlight portion differently (e.g., bold, colored).
 */
export function formatSummaryText(
  result: YearComparisonResult,
  metric: YearComparisonMetric
): SummaryText {
  const { difference, percentageChange } = result;
  const absDiff = Math.abs(difference);

  const isRides = metric === "rides";
  const verb = isRides ? "You've completed " : "You've ridden ";

  // Zero difference — special case
  if (difference === 0) {
    const ZERO_DIFF_NOUN: Record<YearComparisonMetric, string> = {
      distance: "the same distance as",
      elevation: "the same elevation as",
      rides: "the same number of rides as",
      time: "the same time as",
    };
    return {
      text: verb,
      highlight: ZERO_DIFF_NOUN[metric],
      suffix: " this time last year",
    };
  }

  const formattedDiff = absDiff.toLocaleString("en-US");
  const unit = METRIC_UNITS[metric];
  const pctPart =
    percentageChange !== null
      ? ` (${difference > 0 ? "+" : ""}${Math.round(percentageChange)}%)`
      : "";

  if (isRides) {
    const direction = difference > 0 ? "more" : "fewer";
    const rideWord = absDiff === 1 ? "ride" : "rides";
    return {
      text: verb,
      highlight: `${formattedDiff} ${direction} ${rideWord}${pctPart}`,
      suffix: " than this time last year",
    };
  }

  const direction = difference > 0 ? "more" : "less";
  return {
    text: verb,
    highlight: `${formattedDiff} ${unit} ${direction}${pctPart}`,
    suffix: " than this time last year",
  };
}
