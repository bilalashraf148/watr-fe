import { useState } from "react";
import type { RiskLevel } from "@/services/trips/trips.api";
import { RISK_COLOR_TOKENS, RISK_LEVELS } from "@/shared/risk";

export type MapColors = {
  levels: Record<RiskLevel, string>;
  outline: string;
};

// MapLibre paint properties need concrete colour strings, not CSS variables: read the theme tokens
// (src/index.css) once. The risk and map tokens are the same in light and dark mode.
function readMapColors(): MapColors {
  const style = getComputedStyle(document.documentElement);
  const read = (token: string) => style.getPropertyValue(token).trim();
  return {
    levels: Object.fromEntries(
      RISK_LEVELS.map((level) => [level, read(RISK_COLOR_TOKENS[level])]),
    ) as Record<RiskLevel, string>,
    outline: read("--map-outline"),
  };
}

export function useRiskColors(): MapColors {
  const [colors] = useState(readMapColors);
  return colors;
}
