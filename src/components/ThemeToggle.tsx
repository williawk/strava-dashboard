"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const noop = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

const cycleOrder = ["system", "light", "dark"] as const;

const icons: Record<(typeof cycleOrder)[number], React.ReactNode> = {
  system: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  light: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  dark: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};

const labels: Record<(typeof cycleOrder)[number], string> = {
  system: "Switch to light mode",
  light: "Switch to dark mode",
  dark: "Switch to system theme",
};

const titles: Record<(typeof cycleOrder)[number], string> = {
  system: "Theme: system",
  light: "Theme: light",
  dark: "Theme: dark",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, getTrue, getFalse);

  if (!mounted) {
    return (
      <div className="min-w-[44px] min-h-[44px]" aria-hidden="true" />
    );
  }

  const current = (theme ?? "system") as (typeof cycleOrder)[number];
  const nextTheme =
    cycleOrder[(cycleOrder.indexOf(current) + 1) % cycleOrder.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
      aria-label={labels[current]}
      title={titles[current]}
    >
      {icons[current]}
    </button>
  );
}
