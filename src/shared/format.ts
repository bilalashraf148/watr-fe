const milesFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const pad = (value: number) => String(value).padStart(2, "0");

export const formatMiles = (miles: number) => `${milesFormat.format(miles)} mi`;

// 54000 → "15 h 0 min", 2400 → "40 min"
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

// Browser local time with the short timezone name, e.g. "Thu, Nov 26, 8:00 AM CST".
export const formatDateTime = (value: string | Date) => dateTimeFormat.format(new Date(value));

// <input type="datetime-local"> value ("YYYY-MM-DDTHH:mm", local time) for a date or ISO string.
export function toLocalInputValue(value: string | Date): string {
  const date = new Date(value);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

// datetime-local value → ISO 8601 with the browser's UTC offset, e.g. "2026-11-26T08:00:00-06:00".
export function fromLocalInputValue(value: string): string {
  const date = new Date(value); // date-time without offset parses as local time
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  return `${toLocalInputValue(date)}:${pad(date.getSeconds())}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}
