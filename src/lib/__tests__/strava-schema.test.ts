import { describe, it, expect } from "vitest";
import { StravaActivitySchema } from "../strava";

/**
 * Creates a valid base activity object with all required fields.
 * Tests can spread this and override specific fields as needed.
 */
function makeBaseActivity() {
  return {
    id: 12345678,
    name: "Morning Ride",
    type: "Ride",
    sport_type: "Ride",
    distance: 42195.0,
    moving_time: 5400,
    elapsed_time: 6000,
    total_elevation_gain: 320.5,
    start_date: "2026-03-01T08:00:00Z",
    start_date_local: "2026-03-01T09:00:00+01:00",
    average_speed: 7.814,
    max_speed: 12.3,
  };
}

describe("StravaActivitySchema", () => {
  it("parses an activity with a valid summary_polyline", () => {
    const input = {
      ...makeBaseActivity(),
      map: { summary_polyline: "a~l~Fjk~uOwHfE`BsJzH" },
    };

    const result = StravaActivitySchema.parse(input);

    expect(result.map).toBeDefined();
    expect(result.map!.summary_polyline).toBe("a~l~Fjk~uOwHfE`BsJzH");
  });

  it("parses an activity with null summary_polyline (GPS-less activity)", () => {
    const input = {
      ...makeBaseActivity(),
      map: { summary_polyline: null },
    };

    const result = StravaActivitySchema.parse(input);

    expect(result.map).toBeDefined();
    expect(result.map!.summary_polyline).toBeNull();
  });

  it("parses an activity without a map field", () => {
    const input = makeBaseActivity();

    const result = StravaActivitySchema.parse(input);

    expect(result.map).toBeUndefined();
  });

  it("parses an activity with an empty string polyline", () => {
    const input = {
      ...makeBaseActivity(),
      map: { summary_polyline: "" },
    };

    const result = StravaActivitySchema.parse(input);

    expect(result.map).toBeDefined();
    expect(result.map!.summary_polyline).toBe("");
  });

  it("rejects an activity with invalid map shape (number instead of string)", () => {
    const input = {
      ...makeBaseActivity(),
      map: { summary_polyline: 123 },
    };

    expect(() => StravaActivitySchema.parse(input)).toThrow();
  });

  it("rejects an empty object (missing required fields)", () => {
    expect(() => StravaActivitySchema.parse({})).toThrow();
  });

  it("rejects when a required field is missing", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { distance, ...missingDistance } = makeBaseActivity();
    expect(() => StravaActivitySchema.parse(missingDistance)).toThrow();
  });

  it("rejects wrong types for required fields", () => {
    expect(() => StravaActivitySchema.parse({ ...makeBaseActivity(), id: "not-a-number" })).toThrow();
    expect(() => StravaActivitySchema.parse({ ...makeBaseActivity(), distance: "forty" })).toThrow();
  });

  it("parses a full activity with all optional fields present", () => {
    const input = {
      ...makeBaseActivity(),
      average_heartrate: 145,
      max_heartrate: 182,
      suffer_score: 87,
      map: { summary_polyline: "encodedPolylineData" },
    };

    const result = StravaActivitySchema.parse(input);

    expect(result.id).toBe(12345678);
    expect(result.name).toBe("Morning Ride");
    expect(result.type).toBe("Ride");
    expect(result.sport_type).toBe("Ride");
    expect(result.distance).toBe(42195.0);
    expect(result.moving_time).toBe(5400);
    expect(result.elapsed_time).toBe(6000);
    expect(result.total_elevation_gain).toBe(320.5);
    expect(result.start_date).toBe("2026-03-01T08:00:00Z");
    expect(result.start_date_local).toBe("2026-03-01T09:00:00+01:00");
    expect(result.average_speed).toBe(7.814);
    expect(result.max_speed).toBe(12.3);
    expect(result.average_heartrate).toBe(145);
    expect(result.max_heartrate).toBe(182);
    expect(result.suffer_score).toBe(87);
    expect(result.map!.summary_polyline).toBe("encodedPolylineData");
  });
});
