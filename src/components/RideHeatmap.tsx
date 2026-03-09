"use client";

import { useMemo, useSyncExternalStore } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Polyline, Tooltip } from "react-leaflet";
import { latLngBounds, latLng } from "leaflet";
import { type StravaActivity } from "@/lib/strava";
import { decodePolyline } from "@/lib/polyline";
import { formatDistance, formatDate } from "@/lib/format";

const darkModeQuery = "(prefers-color-scheme: dark)";

function subscribeDarkMode(callback: () => void) {
  const mq = window.matchMedia(darkModeQuery);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getDarkModeSnapshot() {
  return window.matchMedia(darkModeQuery).matches;
}

function getDarkModeServerSnapshot() {
  return false;
}

interface Route {
  id: number;
  name: string;
  distance: number;
  date: string;
  positions: [number, number][];
}

export default function RideHeatmap({ activities }: { activities: StravaActivity[] }) {
  const isDark = useSyncExternalStore(subscribeDarkMode, getDarkModeSnapshot, getDarkModeServerSnapshot);

  const routes = useMemo<Route[]>(() => {
    return activities
      .filter((a) => a.map?.summary_polyline)
      .map((a) => ({
        id: a.id,
        name: a.name,
        distance: a.distance,
        date: a.start_date_local,
        positions: decodePolyline(a.map!.summary_polyline!),
      }))
      .filter((r) => r.positions.length > 0);
  }, [activities]);

  const bounds = useMemo(() => {
    const b = latLngBounds([]);
    for (const route of routes) {
      for (const [lat, lng] of route.positions) {
        b.extend(latLng(lat, lng));
      }
    }
    if (!b.isValid()) return null;
    // Pad single-point bounds to avoid max zoom
    if (b.getNorthEast().equals(b.getSouthWest())) {
      b.extend(latLng(b.getNorthEast().lat + 0.01, b.getNorthEast().lng + 0.01));
      b.extend(latLng(b.getSouthWest().lat - 0.01, b.getSouthWest().lng - 0.01));
    }
    return b;
  }, [routes]);

  if (routes.length === 0 || !bounds) {
    return (
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Ride Map</h2>
        <div
          className="bg-foreground/5 rounded-xl flex items-center justify-center"
          style={{ height: 500 }}
        >
          <p className="text-foreground/40 text-sm">No GPS data available</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-4">Ride Map</h2>
      <div
        className="bg-foreground/5 rounded-xl overflow-hidden"
        style={{ height: 500 }}
        role="img"
        aria-label="Map showing all cycling routes"
      >
        <MapContainer
          bounds={bounds}
          preferCanvas={true}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            key={isDark ? "dark" : "light"}
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url={
              isDark
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            }
          />
          {routes.map((route) => (
            <Polyline
              key={route.id}
              positions={route.positions}
              pathOptions={{ color: "#FC4C02", weight: 2, opacity: 0.6 }}
            >
              <Tooltip sticky>
                {route.name} &middot; {formatDistance(route.distance)} &middot;{" "}
                {formatDate(route.date)}
              </Tooltip>
            </Polyline>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}
