// Every backend path, relative to env.VITE_API_BASE_URL. watr-be uses trailing slashes.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export const ENDPOINTS = {
  places: `${API_BASE}/places/`,
  tripPlan: `${API_BASE}/trips/plan/`,
} as const;
