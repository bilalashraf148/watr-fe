import type { RiskLevel } from "@/services/trips/trips.api";
import { RISK_LABELS } from "@/shared/risk";

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className="risk-badge">
      <span className={`risk-dot risk-dot--${level}`} aria-hidden="true" />
      {RISK_LABELS[level]}
    </span>
  );
}
