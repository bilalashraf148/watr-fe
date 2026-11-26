# watr-fe

React 19 + TypeScript + Vite app for WATR: ranked truck routes, checkpoints and a 0–48 h weather-risk
heatmap on a MapLibre map. All logic comes from `../watr-be`.

## Requirements

- Node 22, npm 10
- watr-be running on port 8000 (with `TOMTOM_API_KEY`)

## Run

```bash
npm install
npm run dev    # http://localhost:5173, /api proxied to localhost:8000
```

## Check & build

```bash
npm run typecheck && npm run lint && npm run format:check
npm run build      # dist/
npm run preview    # serves dist/ on port 4173 with the same /api proxy
```

Production: serve `dist/` and `/api/` from the same origin (watr-be sends no CORS headers).

## Environment (optional, `.env.local`)

| Variable             | Default                                        |
| -------------------- | ---------------------------------------------- |
| `VITE_API_BASE_URL`  | `/api/v1`                                      |
| `VITE_MAP_STYLE_URL` | `https://tiles.openfreemap.org/styles/liberty` |

`VITE_*` values are public: no secrets.

## Third parties

- Map: MapLibre GL, react-map-gl, OpenFreeMap tiles (© OpenStreetMap contributors)
- React 19, React Router 7, TanStack Query 5, Axios, Zod 4, React Hook Form
- UI: Sonner (toasts), Radix UI (Select, Separator, ScrollArea)
- Dev: TypeScript 7, oxlint, Prettier

## Features

- Trip form with TomTom place autocomplete (debounced), departure time (no past times), load weight, checkpoint interval (10/25/50 mi)
- Three route options from TomTom native truck routing
- Lexicographical recommendation: No Travel → Severe → High → Avg risk → Duration
- MapLibre map: risk-coloured routes, checkpoint dots, origin/destination pins
- 49-frame heatmap slider (0–48 h) — instant layer-weight switching
- Horizontal scrolling checkpoint table with sticky headers
- Mobile sidebar drawer with backdrop and body scroll lock
- Lazy-loaded map layers with loading skeletons
- Sonner toasts for errors (auto-dismiss)

## How it works

1. `TripForm` (React Hook Form + Zod) writes the request to URL params (`usePlannerParams`).
2. `useTripPlan` → `POST /api/v1/trips/plan/`; the response is validated by Zod (`services/trips/trips.api.ts`).
3. Sidebar: `RouteCard`s (rank, recommendation, miles per risk level) and `CheckpointTable`.
4. `TripMap`: risk-coloured route segments, checkpoint popups, heatmap layer. The MapLibre worker
   URL is set in `lib/maplibre.ts`.
5. The slider only changes the heatmap's `heatmap-weight` (`h0`…`h48`): no requests.
6. Errors (`lib/apiError.ts`): field errors on the form, `detail` in a banner with Try again.

Code: `app/` (providers, router) · `config/` (env, endpoints, routes) · `lib/` · `services/` (API,
queries) · `pages/planner/` (page, components, hooks) · `shared/`.

## Deployment

- **Frontend**: Vercel (auto-deploys on push to `master`)
  - Set `VITE_API_BASE_URL` to Railway backend URL (e.g., `https://watr-be-production.up.railway.app/api/v1`)
- **Backend**: Railway (auto-deploys on push to `master`)
  - Requires: `DATABASE_URL`, `TOMTOM_API_KEY`, `DJANGO_SECRET_KEY`, `CORS_ALLOWED_ORIGINS` (Vercel domain)
  - PostgreSQL add-on in same Railway project
