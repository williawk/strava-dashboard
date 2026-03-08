/**
 * Decodes a Google Encoded Polyline string into an array of [lat, lng] tuples.
 *
 * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 * Each coordinate component is encoded as a series of 5-bit chunks with a continuation
 * bit, zigzag-encoded, and offset by 63 to produce printable ASCII characters.
 */
export function decodePolyline(encoded: string): [number, number][] {
  if (!encoded) return [];

  try {
    const points: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      // Decode one coordinate component (lat or lng delta)
      for (let componentIndex = 0; componentIndex < 2; componentIndex++) {
        let result = 0;
        let shift = 0;
        let byte: number;

        do {
          if (index >= encoded.length) return [];
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
          if (shift > 30) return [];
        } while (byte >= 0x20);

        // Zigzag decode: if the lowest bit is 1, the value is negative
        const delta = result & 1 ? ~(result >> 1) : result >> 1;

        if (componentIndex === 0) {
          lat += delta;
        } else {
          lng += delta;
        }
      }

      points.push([lat / 1e5, lng / 1e5]);
    }

    return points;
  } catch {
    return [];
  }
}
