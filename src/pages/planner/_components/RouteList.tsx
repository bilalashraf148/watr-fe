import { useId } from "react";
import type { TripPlan } from "@/services/trips/trips.api";
import { NoSafeRouteBanner } from "./NoSafeRouteBanner";
import { RouteCard } from "./RouteCard";

type RouteListProps = {
  plan: TripPlan;
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
};

export function RouteList({ plan, selectedRouteId, onSelectRoute }: RouteListProps) {
  const headingId = useId();

  return (
    <section className="panel" aria-labelledby={headingId}>
      <h2 id={headingId} className="panel__title">
        Routes, best first
      </h2>
      {plan.no_safe_route && <NoSafeRouteBanner />}
      {plan.routes_note && <p className="muted">{plan.routes_note}</p>}
      <ol className="route-list">
        {plan.routes.map((route) => (
          <li key={route.id}>
            <RouteCard
              route={route}
              recommended={route.id === plan.recommended_route_id}
              recommendationReason={plan.recommendation_reason}
              selected={route.id === selectedRouteId}
              onSelect={() => onSelectRoute(route.id)}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
