import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { placeSchema } from "@/services/places/places.api";
import {
  CHECKPOINT_INTERVALS,
  checkpointIntervalSchema,
  MAX_LOAD_WEIGHT_LB,
  type TripPlanRequest,
} from "@/services/trips/trips.api";
import { fromLocalInputValue, toLocalInputValue } from "@/shared/format";
import { PlaceInput } from "./PlaceInput";

const MINUTE_MS = 60_000;
const DEPARTURE_WINDOW_MS = 7 * 24 * 60 * MINUTE_MS;
const DEFAULT_INTERVAL = 25;

const toNextMinute = (date: Date) => new Date(Math.ceil(date.getTime() / MINUTE_MS) * MINUTE_MS);

const pickedPlace = (what: string) =>
  placeSchema.nullable().transform((place, ctx) => {
    if (place) return place;
    ctx.addIssue({ code: "custom", message: `Pick the ${what} from the suggestions.` });
    return z.NEVER;
  });

// Same rules as watr-be; the API stays the authority and its 400 errors land on these fields.
const formSchema = z.object({
  origin: pickedPlace("origin"),
  destination: pickedPlace("destination"),
  departure_time: z.string().transform((value, ctx) => {
    const time = new Date(value).getTime();
    if (!value || Number.isNaN(time)) {
      ctx.addIssue({ code: "custom", message: "Enter a departure date and time." });
      return z.NEVER;
    }
    // Compare at minute precision: round now down to the current minute so the current minute is allowed
    const nowMinute = Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;
    if (time < nowMinute || time > nowMinute + DEPARTURE_WINDOW_MS) {
      ctx.addIssue({
        code: "custom",
        message: "Departure must be between now and 7 days from now.",
      });
      return z.NEVER;
    }
    return fromLocalInputValue(value);
  }),
  load_weight_lb: z
    .string()
    .trim()
    .min(1, "Enter the load weight.")
    .transform(Number)
    .pipe(
      z
        .number({ error: "Enter the load weight in pounds." })
        .int("Use whole pounds.")
        .min(1, "The load must be at least 1 lb.")
        .max(MAX_LOAD_WEIGHT_LB, "The load can't be more than 80,000 lb."),
    ),
  checkpoint_interval_miles: z.string().transform(Number).pipe(checkpointIntervalSchema),
});
type FormInput = z.input<typeof formSchema>;

const FIELDS = [
  "origin",
  "destination",
  "departure_time",
  "load_weight_lb",
  "checkpoint_interval_miles",
] as const satisfies readonly (keyof FormInput)[];

const toFormValues = (request: TripPlanRequest | null): FormInput => ({
  origin: request?.origin ?? null,
  destination: request?.destination ?? null,
  departure_time: toLocalInputValue(request?.departure_time ?? toNextMinute(new Date())),
  load_weight_lb: request ? String(request.load_weight_lb) : "",
  checkpoint_interval_miles: String(request?.checkpoint_interval_miles ?? DEFAULT_INTERVAL),
});

type TripFormProps = {
  /** The request in the URL; the form starts from it. */
  request: TripPlanRequest | null;
  disabled: boolean;
  /** API 400 field errors, keyed by request field. */
  serverErrors: Record<string, string>;
  /** API 400 message that belongs to no single field. */
  formError: string | null;
  onSubmit: (request: TripPlanRequest) => void;
};

export function TripForm({ request, disabled, serverErrors, formError, onSubmit }: TripFormProps) {
  const id = useId();
  const [departureRange] = useState(() => ({
    min: toLocalInputValue(toNextMinute(new Date())),
    max: toLocalInputValue(new Date(Date.now() + DEPARTURE_WINDOW_MS)),
  }));

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormInput, unknown, TripPlanRequest>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(request),
  });

  // The API is the authority: show its 400 field errors on the matching fields.
  useEffect(() => {
    for (const field of FIELDS) {
      const message = serverErrors[field];
      if (message) setError(field, { type: "server", message });
    }
  }, [serverErrors, setError]);

  const departureError = errors.departure_time?.message;
  const loadError = errors.load_weight_lb?.message;
  const intervalError = errors.checkpoint_interval_miles?.message;

  return (
    <form className="trip-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <fieldset className="trip-form__fields" disabled={disabled}>
        <legend className="visually-hidden">Trip details</legend>

        <Controller
          name="origin"
          control={control}
          render={({ field, fieldState }) => (
            <PlaceInput
              ref={field.ref}
              label="Origin"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="destination"
          control={control}
          render={({ field, fieldState }) => (
            <PlaceInput
              ref={field.ref}
              label="Destination"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        <div className="field">
          <label htmlFor={`${id}-departure`} className="field__label">
            Departure (your local time)
          </label>
          <input
            id={`${id}-departure`}
            className="input"
            type="datetime-local"
            min={departureRange.min}
            max={departureRange.max}
            aria-invalid={departureError ? true : undefined}
            aria-describedby={departureError ? `${id}-departure-error` : undefined}
            {...register("departure_time")}
          />
          {departureError && (
            <p id={`${id}-departure-error`} className="field__error">
              {departureError}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={`${id}-load`} className="field__label">
            Load weight (lb)
          </label>
          <input
            id={`${id}-load`}
            className="input"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_LOAD_WEIGHT_LB}
            step={1}
            placeholder="e.g. 42000"
            aria-invalid={loadError ? true : undefined}
            aria-describedby={loadError ? `${id}-load-error` : undefined}
            {...register("load_weight_lb")}
          />
          {loadError && (
            <p id={`${id}-load-error`} className="field__error">
              {loadError}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={`${id}-interval`} className="field__label">
            Checkpoint every
          </label>
          <select
            id={`${id}-interval`}
            className="input select"
            aria-invalid={intervalError ? true : undefined}
            aria-describedby={intervalError ? `${id}-interval-error` : undefined}
            {...register("checkpoint_interval_miles")}
          >
            {CHECKPOINT_INTERVALS.map((miles) => (
              <option key={miles} value={String(miles)}>
                {miles} mi
              </option>
            ))}
          </select>
          {intervalError && (
            <p id={`${id}-interval-error`} className="field__error">
              {intervalError}
            </p>
          )}
        </div>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="button button--primary">
            Plan routes
          </button>
        </div>
      </fieldset>
    </form>
  );
}
