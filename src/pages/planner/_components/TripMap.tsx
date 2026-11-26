import "maplibre-gl/dist/maplibre-gl.css";
import type { LngLatBoundsLike } from "maplibre-gl";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  Marker,
  Popup,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import { env } from "@/config/env";
import { maplibregl } from "@/lib/maplibre";
import type { Place } from "@/services/places/places.api";
import type { TripPlan } from "@/services/trips/trips.api";
import { formatDateTime, formatMiles } from "@/shared/format";
import { RISK_LABELS } from "@/shared/risk";
import { useRiskColors } from "../_hooks/useRiskColors";

const INITIAL_VIEW = { longitude: -96, latitude: 38.5, zoom: 3.3 };
const FIT_OPTIONS = { padding: 56, maxZoom: 10 };

// Lazy-load heavy map layers (not needed until plan exists)
const PlanLayers = lazy(() => import("./PlanLayers").then((m) => ({ default: m.PlanLayers })));

const LAYER = {
  heatmap: "risk-heatmap",
  routeHit: "routes-hit",
  routes: "routes",
  selectedRoute: "route-selected",
  checkpoints: "checkpoints",
} as const;
const INTERACTIVE_LAYER_IDS: string[] = [LAYER.checkpoints, LAYER.routeHit];

function toBounds(plan: TripPlan): LngLatBoundsLike | null {
  if (plan.routes.length === 0) return null;
  return plan.routes.reduce<[number, number, number, number]>(
    ([west, south, east, north], { bbox }) => [
      Math.min(west, bbox[0]),
      Math.min(south, bbox[1]),
      Math.max(east, bbox[2]),
      Math.max(north, bbox[3]),
    ],
    [Infinity, Infinity, -Infinity, -Infinity],
  );
}

type TripMapProps = {
  plan: TripPlan | undefined;
  origin: Place | null;
  destination: Place | null;
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
  heatmapHour: number;
  showHeatmap: boolean;
  /** A new plan is loading: the current one stays visible, dimmed. */
  dimmed: boolean;
};

export function TripMap({
  plan,
  origin,
  destination,
  selectedRouteId,
  onSelectRoute,
  heatmapHour,
  showHeatmap,
  dimmed,
}: TripMapProps) {
  const mapRef = useRef<MapRef>(null);
  const colors = useRiskColors();
  const [hovering, setHovering] = useState(false);
  const [popup, setPopup] = useState<{ routeId: string; index: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const bounds = useMemo(() => (plan ? toBounds(plan) : null), [plan]);
  const selectedRoute = plan?.routes.find((route) => route.id === selectedRouteId);
  const popupCheckpoint =
    popup && popup.routeId === selectedRoute?.id
      ? selectedRoute.checkpoints.find((checkpoint) => checkpoint.index === popup.index)
      : undefined;

  // Fit the map to every route when a new plan arrives (onLoad covers a plan that came first).
  useEffect(() => {
    if (bounds) mapRef.current?.fitBounds(bounds, FIT_OPTIONS);
  }, [bounds]);

  const handleClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (feature?.layer.id === LAYER.checkpoints && selectedRoute) {
        setPopup({ routeId: selectedRoute.id, index: Number(feature.properties.index) });
        return;
      }
      setPopup(null);
      const routeId: unknown = feature?.properties.route_id;
      if (typeof routeId === "string") onSelectRoute(routeId);
    },
    [selectedRoute, onSelectRoute],
  );

  return (
    <div className={dimmed ? "trip-map trip-map--dimmed" : "trip-map"} aria-busy={dimmed}>
      <MapLibreMap
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={env.VITE_MAP_STYLE_URL}
        initialViewState={INITIAL_VIEW}
        interactiveLayerIds={INTERACTIVE_LAYER_IDS}
        cursor={hovering ? "pointer" : ""}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={handleClick}
        onLoad={(event) => {
          if (bounds) event.target.fitBounds(bounds, { ...FIT_OPTIONS, duration: 0 });
          setMapLoaded(true);
        }}
      >
        {!mapLoaded && <div className="map-loading-skeleton" aria-busy="true" role="status" />}
        {plan && (
          <Suspense
            fallback={<div className="map-layers-loading" aria-busy="true" role="status" />}
          >
            <PlanLayers
              plan={plan}
              selectedRoute={selectedRoute}
              heatmapHour={heatmapHour}
              showHeatmap={showHeatmap}
              colors={colors}
            />
          </Suspense>
        )}

        {origin && (
          <Marker longitude={origin.lon} latitude={origin.lat} anchor="center">
            <span className="map-pin" role="img" aria-label={`Origin: ${origin.label}`}>
              A
            </span>
          </Marker>
        )}
        {destination && (
          <Marker longitude={destination.lon} latitude={destination.lat} anchor="center">
            <span className="map-pin" role="img" aria-label={`Destination: ${destination.label}`}>
              B
            </span>
          </Marker>
        )}

        {popupCheckpoint && (
          <Popup
            longitude={popupCheckpoint.lon}
            latitude={popupCheckpoint.lat}
            anchor="bottom"
            closeOnClick={false}
            onClose={() => setPopup(null)}
          >
            <div className="checkpoint-popup">
              <p className="checkpoint-popup__title">
                Checkpoint at {formatMiles(popupCheckpoint.distance_miles)}
              </p>
              <dl className="checkpoint-popup__list">
                <dt>ETA</dt>
                <dd>{formatDateTime(popupCheckpoint.eta)}</dd>
                <dt>Wind / gust</dt>
                <dd>
                  {Math.round(popupCheckpoint.weather.wind_mph)} /{" "}
                  {Math.round(popupCheckpoint.weather.gust_mph)} mph
                </dd>
                <dt>Rain</dt>
                <dd>{popupCheckpoint.weather.rain_in_hr.toFixed(2)} in/h</dd>
                <dt>Snow</dt>
                <dd>{popupCheckpoint.weather.snow_in_hr.toFixed(2)} in/h</dd>
                <dt>Risk</dt>
                <dd>{RISK_LABELS[popupCheckpoint.risk.level]}</dd>
                <dt>Drivers</dt>
                <dd className="risk-drivers">
                  {popupCheckpoint.risk.drivers.length > 0
                    ? popupCheckpoint.risk.drivers.join(", ")
                    : "none"}
                </dd>
              </dl>
            </div>
          </Popup>
        )}
      </MapLibreMap>
    </div>
  );
}
