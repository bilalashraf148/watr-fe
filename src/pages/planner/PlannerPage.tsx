import { hashKey } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { readApiError } from "@/lib/apiError";
import type { TripPlanRequest } from "@/services/trips/trips.api";
import { useTripPlan } from "@/services/trips/trips.queries";
import { CheckpointTable } from "./_components/CheckpointTable";
import { HeatmapControls } from "./_components/HeatmapControls";
import { MapLegend } from "./_components/MapLegend";
import { RouteList } from "./_components/RouteList";
import { TripForm } from "./_components/TripForm";
import { TripMap } from "./_components/TripMap";
import { usePlannerParams } from "./_hooks/usePlannerParams";
import { showErrorToast } from "@/hooks/useToast";

const NO_FIELD_ERRORS: Record<string, string> = {};

export default function PlannerPage() {
  const { request, routeId, setRequest, selectRoute } = usePlannerParams();
  const { data, error, fetchStatus, isPending, isPlaceholderData, refetch } = useTripPlan(request);
  const [heatmapHour, setHeatmapHour] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toastShownRef = useRef(false);

  // Lock body scroll when sidebar drawer is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // While a new request loads, `data` is the previous plan (kept on the map, dimmed).
  const plan = request ? data : undefined;
  const loading =
    request !== null && fetchStatus === "fetching" && (isPending || isPlaceholderData);
  const apiError = useMemo(() => (error && !plan ? readApiError(error) : null), [error, plan]);
  const isFieldError = apiError?.status === 400;
  const hour = plan ? Math.min(heatmapHour, plan.heatmap.hours - 1) : 0;

  const selectedRoute = useMemo(
    () =>
      plan
        ? (plan.routes.find((route) => route.id === routeId) ??
          plan.routes.find((route) => route.id === plan.recommended_route_id) ??
          plan.routes[0])
        : undefined,
    [plan, routeId],
  );

  // Show non-field errors as toasts (using ref to avoid cascading renders)
  useEffect(() => {
    if (apiError && !isFieldError && !toastShownRef.current) {
      showErrorToast("Failed to plan routes", apiError.message);
      toastShownRef.current = true;
    } else if (!apiError || isFieldError) {
      toastShownRef.current = false;
    }
  }, [apiError, isFieldError]);

  const handleSubmit = useCallback(
    (next: TripPlanRequest) => {
      if (request && hashKey([next]) === hashKey([request])) {
        // Same search as the URL: only a failed one is worth asking again.
        if (error) void refetch();
        return;
      }
      setRequest(next);
    },
    [request, error, refetch, setRequest],
  );

  const status = useMemo<ReactNode>(() => {
    if (loading) {
      return (
        <div className="route-loading" aria-busy="true" role="status">
          <div className="route-loading__spinner" aria-hidden="true" />
          <p>Planning routes…</p>
        </div>
      );
    }
    if (plan) {
      return (
        <>
          <RouteList
            plan={plan}
            selectedRouteId={selectedRoute?.id ?? null}
            onSelectRoute={selectRoute}
          />
          {selectedRoute && <CheckpointTable route={selectedRoute} />}
        </>
      );
    }
    if (!apiError) {
      return (
        <p className="muted">
          Pick an origin and a destination from the suggestions, a departure time, the load and a
          checkpoint interval. WATR compares up to 3 truck routes by the forecast wind, rain and
          snow at each checkpoint's arrival time, and recommends the safest.
        </p>
      );
    }
    return null;
  }, [loading, plan, selectedRoute, selectRoute, apiError]);

  return (
    <main className="planner">
      {/* Mobile sidebar drawer */}
      <aside
        className={`planner__sidebar ${sidebarOpen ? "planner__sidebar--open" : ""}`}
        aria-hidden={!sidebarOpen}
      >
        <header className="planner__header">
          <h1 className="planner__title">WATR</h1>
          <p className="muted">Weather-aware truck routing</p>
        </header>
        <TripForm
          key={request ? hashKey([request]) : "new"}
          request={request}
          disabled={loading}
          serverErrors={isFieldError ? apiError.fieldErrors : NO_FIELD_ERRORS}
          formError={isFieldError ? apiError.message : null}
          onSubmit={handleSubmit}
        />
        {status}
      </aside>

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          className="planner__backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <section className="planner__map" aria-label="Route map">
        {/* Mobile drawer toggle button */}
        <button
          className="planner__drawer-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open trip details"
          aria-expanded={sidebarOpen}
          aria-controls="planner-sidebar"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <TripMap
          plan={plan}
          origin={request?.origin ?? null}
          destination={request?.destination ?? null}
          selectedRouteId={selectedRoute?.id ?? null}
          onSelectRoute={selectRoute}
          heatmapHour={hour}
          showHeatmap={showHeatmap}
          dimmed={loading}
        />
        {plan && (
          <div className="map-panel">
            <HeatmapControls
              startTime={plan.heatmap.start_time}
              hours={plan.heatmap.hours}
              hour={hour}
              onHourChange={setHeatmapHour}
              visible={showHeatmap}
              onVisibleChange={setShowHeatmap}
            />
            <MapLegend />
          </div>
        )}
      </section>
    </main>
  );
}
