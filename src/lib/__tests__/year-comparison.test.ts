import { describe, it, expect } from "vitest";
import { type StravaActivity } from "@/lib/strava";
import {
  aggregateByYearMonth,
  formatMetricValue,
  formatSummaryText,
} from "@/lib/year-comparison";

function makeActivity(overrides: Partial<StravaActivity> = {}): StravaActivity {
  return {
    id: 1,
    name: "Ride",
    type: "Ride",
    sport_type: "Ride",
    distance: 25000,
    moving_time: 3600,
    elapsed_time: 3600,
    total_elevation_gain: 200,
    start_date: "2026-01-15T10:00:00Z",
    start_date_local: "2026-01-15T10:00:00Z",
    average_speed: 6.94,
    max_speed: 10.0,
    ...overrides,
  };
}

const NOW = new Date("2026-03-15");

describe("aggregateByYearMonth", () => {
  it("returns 12 zeroed months with correct years when given no activities", () => {
    const result = aggregateByYearMonth([], "distance", NOW);

    expect(result.data).toHaveLength(12);
    expect(result.data.every((d) => d.current === 0 && d.previous === 0)).toBe(
      true
    );
    expect(result.currentYear).toBe(2026);
    expect(result.previousYear).toBe(2025);
    expect(result.currentYearTotal).toBe(0);
    expect(result.previousYearTotal).toBe(0);
    expect(result.percentageChange).toBeNull();
  });

  it("places a single Jan 2026 activity in the correct month for distance metric", () => {
    const activities = [
      makeActivity({
        start_date_local: "2026-01-20T08:00:00Z",
        distance: 30000,
      }),
    ];
    const result = aggregateByYearMonth(activities, "distance", NOW);

    expect(result.data[0].month).toBe("Jan");
    expect(result.data[0].current).toBe(30);
    for (let i = 1; i < 12; i++) {
      expect(result.data[i].current).toBe(0);
    }
  });

  it("aggregates activities from both current and previous year", () => {
    const activities = [
      makeActivity({
        start_date_local: "2026-01-10T08:00:00Z",
        distance: 30000,
      }),
      makeActivity({
        start_date_local: "2025-01-10T08:00:00Z",
        distance: 20000,
      }),
    ];
    const result = aggregateByYearMonth(activities, "distance", NOW);

    expect(result.data[0].current).toBe(30);
    expect(result.data[0].previous).toBe(20);
  });

  it("converts distance from meters to kilometers", () => {
    const activities = [
      makeActivity({
        start_date_local: "2026-02-05T10:00:00Z",
        distance: 25000,
      }),
    ];
    const result = aggregateByYearMonth(activities, "distance", NOW);

    expect(result.data[1].current).toBe(25);
  });

  it("uses raw meters for elevation without rounding", () => {
    const activities = [
      makeActivity({
        start_date_local: "2026-01-15T10:00:00Z",
        total_elevation_gain: 200.7,
      }),
    ];
    const result = aggregateByYearMonth(activities, "elevation", NOW);

    expect(result.data[0].current).toBe(200.7);
  });

  it("counts activities per month for rides metric", () => {
    const activities = [
      makeActivity({
        id: 1,
        start_date_local: "2026-02-01T10:00:00Z",
      }),
      makeActivity({
        id: 2,
        start_date_local: "2026-02-10T10:00:00Z",
      }),
      makeActivity({
        id: 3,
        start_date_local: "2026-02-20T10:00:00Z",
      }),
    ];
    const result = aggregateByYearMonth(activities, "rides", NOW);

    expect(result.data[1].current).toBe(3);
  });

  it("converts moving_time from seconds to hours for time metric", () => {
    const activities = [
      makeActivity({
        start_date_local: "2026-01-15T10:00:00Z",
        moving_time: 7200,
      }),
    ];
    const result = aggregateByYearMonth(activities, "time", NOW);

    expect(result.data[0].current).toBe(2);
  });

  it("ignores activities outside the 2-year window", () => {
    const activities = [
      makeActivity({
        start_date_local: "2024-06-15T10:00:00Z",
        distance: 50000,
      }),
      makeActivity({
        start_date_local: "2023-01-15T10:00:00Z",
        distance: 40000,
      }),
    ];
    const result = aggregateByYearMonth(activities, "distance", NOW);

    expect(result.data.every((d) => d.current === 0 && d.previous === 0)).toBe(
      true
    );
  });

  it("sums multiple activities in the same month", () => {
    const activities = [
      makeActivity({
        id: 1,
        start_date_local: "2026-02-05T10:00:00Z",
        distance: 10000,
      }),
      makeActivity({
        id: 2,
        start_date_local: "2026-02-20T10:00:00Z",
        distance: 15000,
      }),
    ];
    const result = aggregateByYearMonth(activities, "distance", NOW);

    expect(result.data[1].current).toBe(25);
  });

  it("calculates YTD totals using only months up to the current month", () => {
    const activities = [
      makeActivity({
        id: 1,
        start_date_local: "2026-01-10T10:00:00Z",
        distance: 10000,
      }),
      makeActivity({
        id: 2,
        start_date_local: "2026-02-10T10:00:00Z",
        distance: 20000,
      }),
      makeActivity({
        id: 3,
        start_date_local: "2026-03-10T10:00:00Z",
        distance: 30000,
      }),
      makeActivity({
        id: 4,
        start_date_local: "2026-06-10T10:00:00Z",
        distance: 50000,
      }),
    ];
    // now is March 15, so YTD = Jan + Feb + Mar only
    const result = aggregateByYearMonth(activities, "distance", NOW);

    expect(result.currentYearTotal).toBe(60); // 10+20+30 km
  });

  it("returns null percentageChange when previous year total is zero", () => {
    const activities = [
      makeActivity({
        start_date_local: "2026-01-10T10:00:00Z",
        distance: 50000,
      }),
    ];
    const result = aggregateByYearMonth(activities, "distance", NOW);

    expect(result.previousYearTotal).toBe(0);
    expect(result.percentageChange).toBeNull();
  });

  it("calculates positive percentage change correctly", () => {
    const activities = [
      // Current year: 150km total in Jan-Mar
      makeActivity({
        id: 1,
        start_date_local: "2026-01-10T10:00:00Z",
        distance: 50000,
      }),
      makeActivity({
        id: 2,
        start_date_local: "2026-02-10T10:00:00Z",
        distance: 50000,
      }),
      makeActivity({
        id: 3,
        start_date_local: "2026-03-10T10:00:00Z",
        distance: 50000,
      }),
      // Previous year: 100km total in Jan-Mar
      makeActivity({
        id: 4,
        start_date_local: "2025-01-10T10:00:00Z",
        distance: 50000,
      }),
      makeActivity({
        id: 5,
        start_date_local: "2025-02-10T10:00:00Z",
        distance: 50000,
      }),
    ];
    const result = aggregateByYearMonth(activities, "distance", NOW);

    expect(result.currentYearTotal).toBe(150);
    expect(result.previousYearTotal).toBe(100);
    expect(result.percentageChange).toBeCloseTo(50);
    expect(result.difference).toBe(50);
  });

  it("calculates negative percentage change correctly", () => {
    const activities = [
      // Current year: 80km in Jan-Mar
      makeActivity({
        id: 1,
        start_date_local: "2026-01-10T10:00:00Z",
        distance: 40000,
      }),
      makeActivity({
        id: 2,
        start_date_local: "2026-02-10T10:00:00Z",
        distance: 40000,
      }),
      // Previous year: 100km in Jan-Mar
      makeActivity({
        id: 3,
        start_date_local: "2025-01-10T10:00:00Z",
        distance: 50000,
      }),
      makeActivity({
        id: 4,
        start_date_local: "2025-02-10T10:00:00Z",
        distance: 50000,
      }),
    ];
    const result = aggregateByYearMonth(activities, "distance", NOW);

    expect(result.currentYearTotal).toBe(80);
    expect(result.previousYearTotal).toBe(100);
    expect(result.percentageChange).toBeCloseTo(-20);
    expect(result.difference).toBe(-20);
  });
});

describe("formatMetricValue", () => {
  it("formats distance with one decimal and km suffix", () => {
    expect(formatMetricValue(150.5, "distance")).toBe("150.5 km");
  });

  it("formats elevation with thousands separator and m suffix", () => {
    expect(formatMetricValue(1234, "elevation")).toBe("1,234 m");
  });

  it("formats rides count with plural suffix", () => {
    expect(formatMetricValue(15, "rides")).toBe("15 rides");
  });

  it("formats time with one decimal and hrs suffix", () => {
    expect(formatMetricValue(12.5, "time")).toBe("12.5 hrs");
  });
});

describe("formatSummaryText", () => {
  it("returns positive diff text for distance", () => {
    const result = aggregateByYearMonth(
      [
        // Current: ~190km more than previous
        makeActivity({
          id: 1,
          start_date_local: "2026-01-10T10:00:00Z",
          distance: 350000,
        }),
        makeActivity({
          id: 2,
          start_date_local: "2025-01-10T10:00:00Z",
          distance: 160000,
        }),
      ],
      "distance",
      NOW
    );
    const summary = formatSummaryText(result, "distance");

    expect(summary.text).toBe("You've ridden ");
    expect(summary.highlight).toContain("more");
    expect(summary.highlight).toContain("km");
    expect(summary.highlight).toContain("+");
    expect(summary.highlight).toContain("%");
    expect(summary.suffix).toBe(" than this time last year");
  });

  it("returns negative diff text for distance", () => {
    const result = aggregateByYearMonth(
      [
        makeActivity({
          id: 1,
          start_date_local: "2026-01-10T10:00:00Z",
          distance: 50000,
        }),
        makeActivity({
          id: 2,
          start_date_local: "2025-01-10T10:00:00Z",
          distance: 100000,
        }),
      ],
      "distance",
      NOW
    );
    const summary = formatSummaryText(result, "distance");

    expect(summary.highlight).toContain("less");
    expect(summary.highlight).toContain("-");
    expect(summary.highlight).toContain("%");
  });

  it("returns zero diff text for distance", () => {
    const result = aggregateByYearMonth(
      [
        makeActivity({
          id: 1,
          start_date_local: "2026-01-10T10:00:00Z",
          distance: 50000,
        }),
        makeActivity({
          id: 2,
          start_date_local: "2025-01-10T10:00:00Z",
          distance: 50000,
        }),
      ],
      "distance",
      NOW
    );
    const summary = formatSummaryText(result, "distance");

    expect(summary.highlight).toContain("the same distance as");
    expect(summary.suffix).toBe(" this time last year");
  });

  it("returns zero diff text for elevation", () => {
    const result = aggregateByYearMonth(
      [
        makeActivity({
          id: 1,
          start_date_local: "2026-01-10T10:00:00Z",
          total_elevation_gain: 500,
        }),
        makeActivity({
          id: 2,
          start_date_local: "2025-01-10T10:00:00Z",
          total_elevation_gain: 500,
        }),
      ],
      "elevation",
      NOW
    );
    const summary = formatSummaryText(result, "elevation");

    expect(summary.highlight).toContain("the same elevation as");
  });

  it("returns zero diff text for time", () => {
    const result = aggregateByYearMonth(
      [
        makeActivity({
          id: 1,
          start_date_local: "2026-01-10T10:00:00Z",
          moving_time: 3600,
        }),
        makeActivity({
          id: 2,
          start_date_local: "2025-01-10T10:00:00Z",
          moving_time: 3600,
        }),
      ],
      "time",
      NOW
    );
    const summary = formatSummaryText(result, "time");

    expect(summary.highlight).toContain("the same time as");
  });

  it("uses ride-specific wording for rides metric", () => {
    const result = aggregateByYearMonth(
      [
        makeActivity({
          id: 1,
          start_date_local: "2026-01-10T10:00:00Z",
        }),
        makeActivity({
          id: 2,
          start_date_local: "2026-02-10T10:00:00Z",
        }),
        makeActivity({
          id: 3,
          start_date_local: "2025-01-10T10:00:00Z",
        }),
      ],
      "rides",
      NOW
    );
    const summary = formatSummaryText(result, "rides");

    expect(summary.text).toBe("You've completed ");
    expect(summary.highlight).toContain("more");
    expect(summary.highlight).toContain("ride");
    expect(summary.suffix).toBe(" than this time last year");
  });

  it("omits percentage when percentageChange is null", () => {
    const result = aggregateByYearMonth(
      [
        makeActivity({
          start_date_local: "2026-01-10T10:00:00Z",
          distance: 50000,
        }),
      ],
      "distance",
      NOW
    );
    const summary = formatSummaryText(result, "distance");

    expect(summary.highlight).not.toContain("%");
  });
});
