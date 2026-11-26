import { riskLevelSchema, type RiskLevel } from "@/services/trips/trips.api";

// Display data for the API's risk levels, lowest first. Levels and scores come from the API.
export const RISK_LEVELS = riskLevelSchema.options;

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  severe: "Severe",
  no_travel: "No Travel",
};

// CSS variables (src/index.css) holding each level's colour.
export const RISK_COLOR_TOKENS: Record<RiskLevel, string> = {
  low: "--risk-low",
  moderate: "--risk-moderate",
  high: "--risk-high",
  severe: "--risk-severe",
  no_travel: "--risk-no-travel",
};
