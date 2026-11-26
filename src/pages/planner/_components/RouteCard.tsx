import * as Separator from "@radix-ui/react-separator";
import type { Route } from "@/services/trips/trips.api";
import { formatDateTime, formatDuration, formatMiles } from "@/shared/format";
import { RiskBadge } from "./RiskBadge";
import { RiskMilesBar } from "./RiskMilesBar";

type RouteCardProps = {
  route: Route;
  recommended: boolean;
  recommendationReason: string;
  selected: boolean;
  onSelect: () => void;
};

export function RouteCard({
  route,
  recommended,
  recommendationReason,
  selected,
  onSelect,
}: RouteCardProps) {
  const { risk_summary: risk } = route;

  return (
    <button
      type="button"
      className={selected ? "route-card route-card--selected" : "route-card"}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="route-card__header">
        <span className="route-card__name">{route.name}</span>
        <span className="route-card__rank">Rank {route.rank}</span>
        {recommended && <span className="badge badge--recommended">✓ Recommended</span>}
      </span>
      {recommended && <span className="route-card__reason">{recommendationReason}</span>}

      <Separator.Root decorative className="route-card__separator" />

      <span className="route-card__stats">
        <span className="stat">
          <span className="stat__label">Distance</span>
          {formatMiles(route.distance_miles)}
        </span>
        <span className="stat">
          <span className="stat__label">Duration</span>
          {formatDuration(route.duration_seconds)}
        </span>
        <span className="stat">
          <span className="stat__label">Arrival</span>
          {formatDateTime(route.arrival_time)}
        </span>
        <span className="stat">
          <span className="stat__label">Average risk</span>
          {risk.average_risk.toFixed(2)} / 4
        </span>
        <span className="stat">
          <span className="stat__label">Highest risk</span>
          <RiskBadge level={risk.max_level} />
        </span>
      </span>

      <Separator.Root decorative className="route-card__separator" />

      <RiskMilesBar milesByLevel={risk.miles_by_level} />
    </button>
  );
}
