import { z } from "zod";
import { ENDPOINTS } from "@/config/endpoints";
import { httpClient } from "@/lib/httpClient";
import type { Place } from "@/services/places/places.api";

// Mirrors the watr-be trip plan contract. Risk is computed by the API only — never recomputed here.

export const riskLevelSchema = z.enum(["low", "moderate", "high", "severe", "no_travel"]);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const CHECKPOINT_INTERVALS = [10, 25, 50] as const;
export const checkpointIntervalSchema = z.literal(CHECKPOINT_INTERVALS, {
  error: "Pick a checkpoint interval: 10, 25 or 50 miles.",
});
export type CheckpointInterval = z.infer<typeof checkpointIntervalSchema>;

export const MAX_LOAD_WEIGHT_LB = 80_000;

const isoDateTime = z.iso.datetime({ offset: true });
const riskScore = z.number().int().min(0).max(4);

const weatherSchema = z.object({
  wind_mph: z.number(),
  gust_mph: z.number(),
  rain_in_hr: z.number(),
  snow_in_hr: z.number(),
});

const riskSchema = z.object({
  level: riskLevelSchema,
  score: riskScore,
  drivers: z.array(z.enum(["wind", "rain", "snow", "load"])),
});

const checkpointSchema = z.object({
  index: z.number().int(),
  distance_miles: z.number(),
  lat: z.number(),
  lon: z.number(),
  eta: isoDateTime,
  weather: weatherSchema,
  risk: riskSchema,
});
export type Checkpoint = z.infer<typeof checkpointSchema>;

const segmentSchema = z.object({
  level: riskLevelSchema,
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

const routeSchema = z.object({
  id: z.string(),
  name: z.string(),
  rank: z.number().int(),
  source: z.enum(["provider", "detour"]),
  distance_miles: z.number(),
  duration_seconds: z.number(),
  arrival_time: isoDateTime,
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  risk_summary: z.object({
    max_level: riskLevelSchema,
    average_risk: z.number(),
    miles_by_level: z.object({
      low: z.number(),
      moderate: z.number(),
      high: z.number(),
      severe: z.number(),
      no_travel: z.number(),
    }),
  }),
  segments: z.array(segmentSchema),
  checkpoints: z.array(checkpointSchema),
});
export type Route = z.infer<typeof routeSchema>;

const heatmapSchema = z
  .object({
    start_time: isoDateTime,
    hours: z.number().int().positive(),
    cell_size_deg: z.number().positive(),
    cells: z.array(z.object({ lat: z.number(), lon: z.number(), risk: z.array(riskScore) })),
  })
  .refine((heatmap) => heatmap.cells.every((cell) => cell.risk.length === heatmap.hours), {
    message: "Every heatmap cell must have one risk score per hour.",
  });
export type Heatmap = z.infer<typeof heatmapSchema>;

const tripPlanSchema = z.object({
  departure_time: isoDateTime,
  load_weight_lb: z.number().int(),
  checkpoint_interval_miles: z.number().int(),
  recommended_route_id: z.string().nullable(),
  recommendation_reason: z.string(),
  no_safe_route: z.boolean(),
  routes_note: z.string().nullable(),
  routes: z.array(routeSchema),
  heatmap: heatmapSchema,
});
export type TripPlan = z.infer<typeof tripPlanSchema>;

export type TripPlanRequest = {
  origin: Place;
  destination: Place;
  departure_time: string; // ISO 8601 with offset
  load_weight_lb: number;
  checkpoint_interval_miles: CheckpointInterval;
};

export const tripsApi = {
  plan: async (request: TripPlanRequest): Promise<TripPlan> =>
    tripPlanSchema.parse((await httpClient.post(ENDPOINTS.tripPlan, request)).data),
};
