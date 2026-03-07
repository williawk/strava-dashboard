# Strava Cycling Dashboard

## Tech Stack
- **Next.js 16** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Recharts** for charts/graphs
- **npm** as package manager

## Project Structure
```
src/
  app/
    page.tsx              # Landing page with "Connect with Strava" button
    dashboard/page.tsx    # Main dashboard (client component)
    api/
      auth/strava/route.ts    # Redirects to Strava OAuth
      auth/callback/route.ts  # Handles OAuth callback, stores tokens
      auth/logout/route.ts    # Clears tokens, redirects with 303 (GET after POST)
      activities/route.ts     # Fetches cycling activities from Strava API
  components/
    SummaryCards.tsx       # Total rides, distance, elevation, time
    RecentRides.tsx        # Table of last 20 rides
    DistanceChart.tsx      # Weekly distance bar chart (ISO week start via ms arithmetic)
    SpeedChart.tsx         # Average speed trend line chart
    ElevationChart.tsx     # Elevation gain per ride area chart
  lib/
    strava.ts             # Strava API client (auth URLs, token exchange, fetch activities)
    tokens.ts             # Cookie-based token storage with auto-refresh
    format.ts             # Formatting helpers (distance, duration, speed, elevation, date)
```

## Environment Variables
Stored in `.env.local` (gitignored). See `.env.example` for template.
- `STRAVA_CLIENT_ID` — from Strava API settings
- `STRAVA_CLIENT_SECRET` — from Strava API settings
- `NEXTAUTH_URL` — `http://localhost:3000`

## Key Decisions
- Tokens stored in HTTP-only cookies (not localStorage) for security
- OAuth CSRF protection via cryptographic state parameter with timing-safe comparison
- Token exchange response validated before storage (prevents storing undefined tokens on Strava error)
- Auto token refresh when access token is within 60s of expiry
- Token refresh uses promise-based mutex to serialize concurrent requests, with retry logic for cookie persistence (Strava refresh tokens are single-use)
- Filters activities to cycling only via `sport_type` field (not `type`): Ride, VirtualRide, MountainBikeRide, GravelRide
- Fetches up to 200 activities (2 pages of 100)
- Dark mode via Tailwind `prefers-color-scheme`
- Strava orange (#FC4C02) used as accent color

## Development
```bash
npm run dev    # Start dev server on localhost:3000 (uses webpack; Turbopack has tailwindcss resolution issues)
npm run build  # Production build (known Next.js 16 prerender bug on /_not-found, doesn't affect dev)
```

## Issue Tracking
- All bugs, improvements, and tasks are tracked as [GitHub Issues](https://github.com/williawk/strava-dashboard/issues)
- Use `gh issue create` to file new issues with appropriate labels (`bug`, `security`, `improvement`)
- Include severity (Critical/Warning/Suggestion), affected file paths, and a proposed fix
- Prioritize `security` and `bug` labels before `improvement`

## GitHub
- Repo: https://github.com/williawk/strava-dashboard
