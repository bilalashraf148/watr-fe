import { RISK_LABELS, RISK_LEVELS } from "@/shared/risk";

export function MapLegend() {
  return (
    <div className="map-legend">
      <p className="map-legend__title">Risk level</p>
      <ul className="map-legend__list">
        {RISK_LEVELS.map((level) => (
          <li key={level} className="map-legend__item">
            <span className={`risk-dot risk-dot--${level}`} aria-hidden="true" />
            {RISK_LABELS[level]}
          </li>
        ))}
      </ul>
      <p className="map-legend__note">
        Lines and dots: risk at each checkpoint's ETA. Shading: forecast risk at the slider hour.
      </p>
    </div>
  );
}
