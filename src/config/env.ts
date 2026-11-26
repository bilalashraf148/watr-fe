import { z } from "zod";

// The only reader of import.meta.env. VITE_* values are bundled into public JS: never put secrets here.
const schema = z.object({
  VITE_API_BASE_URL: z.string().min(1).default("/api/v1"),
  VITE_MAP_STYLE_URL: z.url().default("https://tiles.openfreemap.org/styles/liberty"),
});

export const env = schema.parse(import.meta.env);
