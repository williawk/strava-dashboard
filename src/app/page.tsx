"use client";

import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center space-y-8 p-8">
        <h1 className="text-4xl font-bold text-foreground">
          Cycling Dashboard
        </h1>
        <p className="text-lg text-foreground/60 max-w-md mx-auto">
          Connect your Strava account to see your cycling stats, trends, and ride history.
        </p>
        <a
          href="/api/auth/strava"
          className="inline-block px-8 py-3 bg-[#FC4C02] text-white font-semibold rounded-lg hover:bg-[#e04400] transition-colors"
        >
          Connect with Strava
        </a>
      </div>
    </div>
  );
}
