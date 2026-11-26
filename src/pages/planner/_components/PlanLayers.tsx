import type { ExpressionSpecification } from "maplibre-gl";
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import type { Route, TripPlan } from "@/services/trips/trips.api";
import type { MapColors } from "../_hooks/useRiskColors";

const LAYER = {
  heatmap: "risk-heatmap",
  routeHit: "routes-hit",
  routes: "routes",
  selectedRoute: "route-selected",
  checkpoints: "checkpoints",
} as const;

const MAX_RISK_SCORE = 4;

// GeoJSON built once per plan (or per selected route); the heatmap slider never rebuilds it.
function toRouteLines(plan: TripPlan) {
  return {
    type: "FeatureCollection" as const,
    features: plan.routes.flatMap((route) =>
      route.segments.map((segment) => ({
        type: "Feature" as const,
        properties: { route_id: route.id, level: segment.level },
        geometry: { type: "LineString" as const, coordinates: segment.coordinates },
      })),
    ),
  };
}

// One point per grid cell; property h<N> = the cell's risk score at frame N, scaled to 0–1.
function toHeatmapPoints(plan: TripPlan) {
  return {
    type: "FeatureCollection" as const,
    features: plan.heatmap.cells.map((cell) => ({
      type: "Feature" as const,
      properties: Object.fromEntries(
        cell.risk.map((score, hour) => [`h${hour}`, score / MAX_RISK_SCORE]),
      ),
      geometry: { type: "Point" as const, coordinates: [cell.lon, cell.lat] },
    })),
  };
}

function toCheckpointPoints(route: Route) {
  return {
    type: "FeatureCollection" as const,
    features: route.checkpoints.map((checkpoint) => ({
      type: "Feature" as const,
      properties: { index: checkpoint.index, level: checkpoint.risk.level },
      geometry: { type: "Point" as const, coordinates: [checkpoint.lon, checkpoint.lat] },
    })),
  };
}

const levelColor = ({ levels }: MapColors): ExpressionSpecification => [
  "match",
  ["get", "level"],
  "low",
  levels.low,
  "moderate",
  levels.moderate,
  "high",
  levels.high,
  "severe",
  levels.severe,
  "no_travel",
  levels.no_travel,
  levels.low,
];

// Heatmap radius ≈ 1.5 grid cells at every zoom (512 px tiles: 512 / 360 px per degree at zoom 0),
// with an intensity that makes a field of equal scores render at density ≈ score / 4.
function heatmapRadius(cellSizeDeg: number): ExpressionSpecification {
  const radiusAtZoom0 = ((cellSizeDeg * 512) / 360) * 1.5;
  return [
    "interpolate",
    ["exponential", 2],
    ["zoom"],
    0,
    radiusAtZoom0,
    14,
    radiusAtZoom0 * 2 ** 14,
  ];
}

type PlanLayersProps = {
  plan: TripPlan;
  selectedRoute: Route | undefined;
  heatmapHour: number;
  showHeatmap: boolean;
  colors: MapColors;
};

// Layer stack, bottom to top: heatmap → route hit area → unselected routes → selected route → checkpoints.
export function PlanLayers({
  plan,
  selectedRoute,
  heatmapHour,
  showHeatmap,
  colors,
}: PlanLayersProps) {
  const routeLines = useMemo(() => toRouteLines(plan), [plan]);
  const heatmapPoints = useMemo(() => toHeatmapPoints(plan), [plan]);
  const checkpointPoints = useMemo(
    () => (selectedRoute ? toCheckpointPoints(selectedRoute) : null),
    [selectedRoute],
  );
  const lineColor = useMemo(() => levelColor(colors), [colors]);
  const radius = useMemo(
    () => heatmapRadius(plan.heatmap.cell_size_deg),
    [plan.heatmap.cell_size_deg],
  );
  const selectedId = selectedRoute?.id ?? "";

  return (
    <>
      <Source id="heatmap" type="geojson" data={heatmapPoints}>
        <Layer
          id={LAYER.heatmap}
          type="heatmap"
          layout={{ visibility: showHeatmap ? "visible" : "none" }}
          paint={{
            "heatmap-weight": ["get", `h${heatmapHour}`],
            "heatmap-radius": radius,
            "heatmap-intensity": 1.6,
            "heatmap-opacity": 0.55,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "transparent",
              0.2,
              colors.levels.moderate,
              0.45,
              colors.levels.high,
              0.7,
              colors.levels.severe,
              0.95,
              colors.levels.no_travel,
            ],
          }}
        />
      </Source>

      <Source id="routes" type="geojson" data={routeLines}>
        <Layer
          id={LAYER.routeHit}
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{ "line-color": colors.outline, "line-width": 18, "line-opacity": 0 }}
        />
        <Layer
          id={LAYER.routes}
          type="line"
          filter={["!=", ["get", "route_id"], selectedId]}
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{ "line-color": lineColor, "line-width": 3, "line-opacity": 0.5 }}
        />
        <Layer
          id={LAYER.selectedRoute}
          type="line"
          filter={["==", ["get", "route_id"], selectedId]}
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{ "line-color": lineColor, "line-width": 7 }}
        />
      </Source>

      {checkpointPoints && (
        <Source id="checkpoints" type="geojson" data={checkpointPoints}>
          <Layer
            id={LAYER.checkpoints}
            type="circle"
            paint={{
              "circle-color": lineColor,
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 4, 10, 7],
              "circle-stroke-color": colors.outline,
              "circle-stroke-width": 1.5,
            }}
          />
        </Source>
      )}
    </>
  );
}
