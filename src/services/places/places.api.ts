import { z } from "zod";
import { ENDPOINTS } from "@/config/endpoints";
import { httpClient } from "@/lib/httpClient";

export const placeSchema = z.object({
  label: z.string(),
  lat: z.number(),
  lon: z.number(),
});
export type Place = z.infer<typeof placeSchema>;

const placeSearchSchema = z.object({ results: z.array(placeSchema) });

export const placesApi = {
  search: async (q: string): Promise<Place[]> =>
    placeSearchSchema.parse((await httpClient.get(ENDPOINTS.places, { params: { q } })).data)
      .results,
};
