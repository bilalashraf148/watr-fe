import { useCallback, useState } from "react";
import { type TripPlanRequest } from "@/services/trips/trips.api";

export function usePlannerParams() {
  const [request, setRequestState] = useState<TripPlanRequest | null>(null);
  const [routeId, setRouteId] = useState<string | null>(null);

  const setRequest = useCallback((next: TripPlanRequest) => {
    setRequestState(next);
    setRouteId(null); // new search → start on recommended route
  }, []);

  const selectRoute = useCallback((id: string) => setRouteId(id), []);

  return {
    /** The submitted trip request, or null when no search has been made. */
    request,
    /** The route id the user picked, if any. */
    routeId,
    /** A new search: stores in state. */
    setRequest,
    selectRoute,
  };
}
