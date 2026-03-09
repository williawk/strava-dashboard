import { describe, it, expect } from "vitest";
import { decodePolyline } from "../polyline";

describe("decodePolyline", () => {
  it("decodes a well-known polyline to the expected coordinates", () => {
    // Google's canonical example polyline
    const encoded = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
    const result = decodePolyline(encoded);

    expect(result).toHaveLength(3);

    expect(result[0][0]).toBeCloseTo(38.5, 5);
    expect(result[0][1]).toBeCloseTo(-120.2, 5);

    expect(result[1][0]).toBeCloseTo(40.7, 5);
    expect(result[1][1]).toBeCloseTo(-120.95, 5);

    expect(result[2][0]).toBeCloseTo(43.252, 5);
    expect(result[2][1]).toBeCloseTo(-126.453, 5);
  });

  it("returns an empty array for an empty string", () => {
    expect(decodePolyline("")).toEqual([]);
  });

  it("decodes a single-point polyline", () => {
    // Encode [38.5, -120.2] as a single point
    // 38.5 * 1e5 = 3850000 -> zigzag -> chars: _p~iF
    // -120.2 * 1e5 = -12020000 -> zigzag -> chars: ~ps|U
    const encoded = "_p~iF~ps|U";
    const result = decodePolyline(encoded);

    expect(result).toHaveLength(1);
    expect(result[0][0]).toBeCloseTo(38.5, 5);
    expect(result[0][1]).toBeCloseTo(-120.2, 5);
  });

  it("correctly decodes negative coordinates", () => {
    // The canonical example includes negative longitudes
    const encoded = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
    const result = decodePolyline(encoded);

    // All three points have negative longitudes
    for (const [, lng] of result) {
      expect(lng).toBeLessThan(0);
    }
  });

  it("returns an empty array for malformed input instead of throwing", () => {
    // Invalid characters / truncated data should not crash
    expect(() => decodePolyline("!!!")).not.toThrow();
    expect(decodePolyline("!!!")).toEqual([]);

    // A single character is not a valid polyline (need at least lat + lng)
    expect(() => decodePolyline("A")).not.toThrow();
    expect(decodePolyline("A")).toEqual([]);
  });

  it("produces coordinates with approximately 5 decimal places of precision", () => {
    const encoded = "_p~iF~ps|U";
    const result = decodePolyline(encoded);

    expect(result).toHaveLength(1);

    const [lat, lng] = result[0];
    // 38.5 exactly — the value 3850000 / 1e5 = 38.50000
    expect(lat).toBe(38.5);
    // -120.2 exactly — the value -12020000 / 1e5 = -120.20000
    expect(lng).toBe(-120.2);
  });

  it("returns empty array for pathological input with excessive continuation bits", () => {
    // '~' = char code 126, minus 63 = 63, which has the continuation bit set (>= 0x20)
    // A long run of these triggers the shift overflow guard
    const pathological = "~~~~~~~~~~~~~~~~~~~~~~~~";
    expect(() => decodePolyline(pathological)).not.toThrow();
    expect(decodePolyline(pathological)).toEqual([]);
  });

  it("correctly applies delta decoding for multi-point polylines", () => {
    // Use first 2 points from canonical: [38.5, -120.2] and [40.7, -120.95]
    // Second point is encoded as delta from the first
    const encoded = "_p~iF~ps|U_ulLnnqC";
    const result = decodePolyline(encoded);

    expect(result).toHaveLength(2);
    expect(result[0][0]).toBeCloseTo(38.5, 5);
    expect(result[0][1]).toBeCloseTo(-120.2, 5);
    expect(result[1][0]).toBeCloseTo(40.7, 5);
    expect(result[1][1]).toBeCloseTo(-120.95, 5);
  });
});
