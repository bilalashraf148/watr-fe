import { useId } from "react";
import { formatDateTime } from "@/shared/format";

const HOUR_MS = 3_600_000;

type HeatmapControlsProps = {
  startTime: string;
  hours: number;
  hour: number;
  onHourChange: (hour: number) => void;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
};

// Changing the hour only re-styles the heatmap layer: no new data, no request.
export function HeatmapControls({
  startTime,
  hours,
  hour,
  onHourChange,
  visible,
  onVisibleChange,
}: HeatmapControlsProps) {
  const sliderId = useId();
  const frameTime = new Date(new Date(startTime).getTime() + hour * HOUR_MS);
  const label = `Forecast: +${hour} h — ${formatDateTime(frameTime)}`;

  return (
    <div className="heatmap-controls">
      <label className="checkbox">
        <input
          type="checkbox"
          checked={visible}
          onChange={(event) => onVisibleChange(event.target.checked)}
        />
        Show weather heatmap
      </label>
      <label htmlFor={sliderId} className="heatmap-controls__label">
        <span className="heatmap-controls__label-text" title={frameTime.toString()}>
          {label}
        </span>
      </label>
      <input
        id={sliderId}
        type="range"
        min={0}
        max={hours - 1}
        step={1}
        value={hour}
        onChange={(e) => onHourChange(Number(e.target.value))}
        disabled={!visible}
        aria-valuetext={label}
        className="slider"
      />
    </div>
  );
}
