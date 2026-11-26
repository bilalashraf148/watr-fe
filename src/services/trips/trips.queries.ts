import { keepPreviousData, queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { tripsApi, type TripPlanRequest } from "./trips.api";

export const tripKeys = {
  all: ["trips"] as const,
  plan: (request: TripPlanRequest | null) => [...tripKeys.all, "plan", request] as const,
};

// 4xx answers are final (the user fixes the form and resubmits), so no retries.
// The previous plan stays visible (dimmed) while a new one loads.
export const tripPlanOptions = (request: TripPlanRequest | null) =>
  queryOptions({
    queryKey: tripKeys.plan(request),
    queryFn: request ? () => tripsApi.plan(request) : skipToken,
    staleTime: 10 * 60_000,
    retry: false,
    placeholderData: keepPreviousData,
  });

export const useTripPlan = (request: TripPlanRequest | null) => useQuery(tripPlanOptions(request));
