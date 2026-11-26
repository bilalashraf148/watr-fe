import type { RiskLevel } from "@/services/trips/trips.api";
import { formatMiles } from "@/shared/format";
import { RISK_LABELS, RISK_LEVELS } from "@/shared/risk";

type RiskMilesBarProps = {
  milesByLevel: Record<RiskLevel, number>;
};

// Stacked bar of the route's miles per risk level, with a text legend.
export function RiskMilesBar({ milesByLevel }: RiskMilesBarProps) {
  const total = RISK_LEVELS.reduce((sum, level) => sum + milesByLevel[level], 0);
  const summary = RISK_LEVELS.map(
    (level) => `${RISK_LABELS[level]} ${formatMiles(milesByLevel[level])}`,
  ).join(", ");

  return (
    <span className="risk-bar">
      <span className="risk-bar__track" role="img" aria-label={`Miles by risk: ${summary}`}>
        {total > 0 &&
          RISK_LEVELS.filter((level) => milesByLevel[level] > 0).map((level) => (
            <span
              key={level}
              className={`risk-bar__part risk-fill--${level}`}
              style={{ flexBasis: `${(milesByLevel[level] / total) * 100}%` }}
            />
          ))}
      </span>
      <span className="risk-bar__legend" aria-hidden="true">
        {RISK_LEVELS.map((level) => (
          <span
            key={level}
            className={milesByLevel[level] > 0 ? "risk-bar__item" : "risk-bar__item muted"}
          >
            <span className={`risk-dot risk-dot--${level}`} />
            {RISK_LABELS[level]} {formatMiles(milesByLevel[level])}
          </span>
        ))}
      </span>
    </span>
  );
}
