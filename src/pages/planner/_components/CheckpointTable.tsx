import { useId } from "react";
import type { Route } from "@/services/trips/trips.api";
import { formatDateTime, formatMiles } from "@/shared/format";
import { RiskBadge } from "./RiskBadge";

type CheckpointTableProps = {
  route: Route;
};

// The selected route's checkpoints: the accessible, non-map view of the map's checkpoint dots.
export function CheckpointTable({ route }: CheckpointTableProps) {
  const headingId = useId();

  return (
    <section className="panel" aria-labelledby={headingId}>
      <h2 id={headingId} className="panel__title">
        Checkpoints — {route.name}
      </h2>
      {/* Native scroll container: vertical + horizontal */}
      <div className="checkpoint-table-wrap">
        <table className="checkpoint-table">
          <thead>
            <tr>
              <th scope="col">Mile</th>
              <th scope="col">ETA</th>
              <th scope="col">Wind / gust</th>
              <th scope="col">Rain</th>
              <th scope="col">Snow</th>
              <th scope="col">Risk</th>
            </tr>
          </thead>
          <tbody>
            {route.checkpoints.map((checkpoint) => (
              <tr key={checkpoint.index}>
                <td>{formatMiles(checkpoint.distance_miles)}</td>
                <td>{formatDateTime(checkpoint.eta)}</td>
                <td>
                  {Math.round(checkpoint.weather.wind_mph)} /{" "}
                  {Math.round(checkpoint.weather.gust_mph)} mph
                </td>
                <td>{checkpoint.weather.rain_in_hr.toFixed(2)} in/h</td>
                <td>{checkpoint.weather.snow_in_hr.toFixed(2)} in/h</td>
                <td>
                  <RiskBadge level={checkpoint.risk.level} />
                  {checkpoint.risk.drivers.length > 0 && (
                    <span className="risk-drivers">
                      {" "}
                      ({checkpoint.risk.drivers.join(", ")})
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
