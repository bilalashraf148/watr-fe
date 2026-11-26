import axios from "axios";
import { env } from "@/config/env";

// The single HTTP client. watr-be uses Django session auth: cookies travel same-origin (Vite proxies
// /api in development) and writes carry Django's CSRF token.
export const httpClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});
