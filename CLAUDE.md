# Strava Cycling Dashboard

## Tech Stack
- **Next.js 16** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Recharts** for charts/graphs
- **Zod** for runtime API response validation
- **next-themes** for dark/light mode toggle
- **npm** as package manager

## Project Structure
```
.github/
  workflows/ci.yml        # CI pipeline: typecheck, lint, test, build
  dependabot.yml           # Automated dependency update PRs
docs/
  dashboard-preview.png   # README screenshot of dashboard with dummy data
  screenshot-demo.html    # Standalone HTML demo used to generate the screenshot
  mockups/                # Standalone HTML mockups for reviewing features before implementation
src/
  app/
    page.tsx              # Landing page (client component, floating theme toggle)
    dashboard/page.tsx    # Main dashboard (client component, pre-sorts data for charts)
    api/
      auth/strava/route.ts    # Redirects to Strava OAuth
      auth/callback/route.ts  # Handles OAuth callback, stores tokens
      auth/logout/route.ts    # Clears tokens, redirects with 303 (GET after POST)
      activities/route.ts     # Fetches cycling activities from Strava API
  components/
    SummaryCards.tsx       # Total rides, distance, elevation, time
    PersonalRecords.tsx   # All-time bests (longest ride, most elevation, fastest speed, longest time)
    RecentRides.tsx        # Table of last 20 rides
    DistanceChart.tsx      # Weekly distance bar chart (ISO week start via ms arithmetic)
    SpeedChart.tsx         # Average speed trend line chart
    ElevationChart.tsx     # Elevation gain per ride area chart
    ThemeProvider.tsx      # Client wrapper for next-themes provider
    ThemeToggle.tsx        # Dark/light theme toggle with sun/moon icons
    RideHeatmap.tsx       # Leaflet map with all ride routes as polylines
  lib/
    strava.ts             # Strava API client with Zod-validated responses
    tokens.ts             # Cookie-based token storage with auto-refresh and size checks
    format.ts             # Formatting helpers (distance, duration, speed, elevation, date)
    polyline.ts           # Google encoded polyline decoder
    __tests__/            # Vitest unit tests
```

## Environment Variables
Stored in `.env.local` (gitignored). See `.env.example` for template.
- `STRAVA_CLIENT_ID` — from Strava API settings
- `STRAVA_CLIENT_SECRET` — from Strava API settings

## Key Decisions
- Tokens stored in HTTP-only cookies (not localStorage) for security
- OAuth CSRF protection via cryptographic state parameter with timing-safe comparison
- Strava API responses validated at runtime with Zod schemas (tokens and activities)
- Env vars validated lazily via `requireEnv()` with clear error messages (not module-level to avoid build failures)
- Cookie size checked before write — warns at 75% of 4KB limit, errors at 100%
- Auto token refresh when access token is within 60s of expiry
- Token refresh uses promise-based mutex to serialize concurrent requests, with retry logic for cookie persistence (Strava refresh tokens are single-use)
- Filters activities to cycling only via `sport_type` field (not `type`): Ride, VirtualRide, MountainBikeRide, GravelRide
- Fetches up to 200 activities (2 pages of 100)
- Dark mode via `next-themes` with class-based toggling (`darkMode: 'selector'` via `@custom-variant`), two-state toggle (dark/light, dark default), persisted to localStorage
- Strava orange (#FC4C02) used as accent color via Tailwind arbitrary value `text-[#FC4C02]`
- Personal records use config-driven array with type-safe `NumericField` union for field access
- Dashboard pre-sorts activities once via `useMemo` and passes sorted data to SpeedChart/ElevationChart
- Dashboard layout order: SummaryCards → PersonalRecords → Charts → RideHeatmap → RecentRides
- Dashboard uses `next/link` `<Link>` for internal navigation (enforced by `@next/next/no-html-link-for-pages` lint rule)
- UX mockups are standalone HTML files (pure CSS/JS, no external CDN scripts — browsers block them on `file://` protocol)

## Development
```bash
npm run dev        # Start dev server on localhost:3000 (uses webpack; Turbopack has tailwindcss resolution issues)
npm run build      # Production build (known Next.js 16 prerender bug on /_not-found, doesn't affect dev)
npm run typecheck  # TypeScript type checking (tsc --noEmit)
npm run lint       # ESLint
npm run test       # Vitest unit tests
npm run test:watch # Vitest in watch mode
```

## CI/CD
- **GitHub Actions** runs on every push and PR to `master`: typecheck → lint → test → build
- Workflow at `.github/workflows/ci.yml` with SHA-pinned actions (v6 checkout, v6 setup-node), `contents: read` permissions, and concurrency control (stale runs auto-cancel)
- **Dependabot** (`.github/dependabot.yml`) opens weekly PRs for npm and GitHub Actions dependency updates (max 5 open PRs per ecosystem)
- React ecosystem packages (`react`, `react-dom`, `@types/react`, `@types/react-dom`) are grouped into a single PR to avoid peer dependency conflicts
- GitHub Actions PRs are kept separate (only two actions, independent of each other)
- **Branch protection** on `master`: requires `build` status check to pass (strict mode — branch must be up-to-date), no PR reviews required, enforce admins disabled
- Chart tooltip formatters use `as never` cast to handle recharts' wide `Formatter<ValueType>` type — update the cast if recharts changes the formatter signature again


## Issue Tracking
- All bugs, improvements, and tasks are tracked as [GitHub Issues](https://github.com/williawk/strava-dashboard/issues)
- Use `gh issue create` to file new issues with appropriate labels (`bug`, `security`, `improvement`)
- Include severity (Critical/Warning/Suggestion), affected file paths, and a proposed fix
- Prioritize `security` and `bug` labels before `improvement`

## GitHub
- Repo: https://github.com/williawk/strava-dashboard
