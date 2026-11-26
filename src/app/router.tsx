import { createBrowserRouter } from "react-router";
import { ROUTES } from "@/config/routes";

// Pages load lazily per route. Protected routes go under an auth guard layout route
// (element renders <Outlet /> when allowed) once authentication exists.
export const router = createBrowserRouter([
  {
    hydrateFallbackElement: <p className="page muted">Loading…</p>,
    children: [
      {
        path: ROUTES.home,
        lazy: async () => ({ Component: (await import("@/pages/planner/PlannerPage")).default }),
      },
      {
        path: "*",
        lazy: async () => ({ Component: (await import("@/pages/not-found/NotFoundPage")).default }),
      },
    ],
  },
]);
