import { useQuery } from "@tanstack/react-query";
import { placesApi } from "./places.api";

export const PLACE_SEARCH_MIN_CHARS = 3;

export const placeKeys = {
  all: ["places"] as const,
  search: (q: string) => [...placeKeys.all, "search", q] as const,
};

export function usePlaceSearch(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: placeKeys.search(query),
    queryFn: () => placesApi.search(query),
    enabled: query.length >= PLACE_SEARCH_MIN_CHARS,
    staleTime: 5 * 60_000,
  });
}
