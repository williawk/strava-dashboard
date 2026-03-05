export function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(1) + " km";
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatSpeed(metersPerSec: number): string {
  return (metersPerSec * 3.6).toFixed(1) + " km/h";
}

export function formatElevation(meters: number): string {
  return Math.round(meters).toLocaleString() + " m";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
