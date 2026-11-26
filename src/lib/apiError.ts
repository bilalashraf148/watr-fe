import { isAxiosError } from "axios";

// Reads a DRF error body: {"detail": "..."}, {"non_field_errors": [...]} or {"<field>": [...]}
// (nested for object fields, e.g. {"origin": {"lat": [...]}}).
export type ApiError = {
  status: number | null;
  message: string;
  fieldErrors: Record<string, string>;
};

function firstMessage(value: unknown): string | null {
  if (typeof value === "string") return value;
  const items = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? Object.values(value)
      : [];
  for (const item of items) {
    const message = firstMessage(item);
    if (message) return message;
  }
  return null;
}

export function readApiError(error: unknown): ApiError {
  if (!isAxiosError(error)) {
    return {
      status: null,
      message: "The server sent an unexpected response. Try again.",
      fieldErrors: {},
    };
  }
  if (!error.response) {
    return {
      status: null,
      message: "Can't reach the server. Check your connection and try again.",
      fieldErrors: {},
    };
  }

  const { status, data } = error.response;
  const body: Record<string, unknown> = data && typeof data === "object" ? { ...data } : {};
  const detail = firstMessage(body.detail) ?? firstMessage(body.non_field_errors);
  delete body.detail;
  delete body.non_field_errors;

  const fieldErrors: Record<string, string> = {};
  for (const [field, value] of Object.entries(body)) {
    const message = firstMessage(value);
    if (message) fieldErrors[field] = message;
  }

  const fallback =
    Object.keys(fieldErrors).length > 0
      ? "Check the highlighted fields."
      : `Request failed (${status}). Try again.`;
  return { status, message: detail ?? fallback, fieldErrors };
}
