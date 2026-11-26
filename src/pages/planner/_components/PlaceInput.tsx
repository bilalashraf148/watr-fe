import { useId, useState, type KeyboardEvent, type Ref } from "react";
import { readApiError } from "@/lib/apiError";
import type { Place } from "@/services/places/places.api";
import { PLACE_SEARCH_MIN_CHARS, usePlaceSearch } from "@/services/places/places.queries";
import { useDebouncedValue } from "@/shared/useDebouncedValue";

const SEARCH_DEBOUNCE_MS = 300;

type PlaceInputProps = {
  label: string;
  /** Only a place picked from the suggestions is a value; typing clears it. */
  value: Place | null;
  onChange: (place: Place | null) => void;
  onBlur: () => void;
  error?: string;
  ref?: Ref<HTMLInputElement>;
};

const placeKey = (place: Place) => `${place.label}|${place.lat}|${place.lon}`;

// Accessible combobox (ARIA 1.2 list autocomplete): Arrow keys move, Enter picks, Escape closes.
export function PlaceInput({ label, value, onChange, onBlur, error, ref }: PlaceInputProps) {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const statusId = `${id}-status`;
  const errorId = `${id}-error`;

  const [text, setText] = useState(value?.label ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const typed = value ? "" : text.trim();
  const query = useDebouncedValue(typed, SEARCH_DEBOUNCE_MS);
  const search = usePlaceSearch(query);

  const tooShort = typed.length < PLACE_SEARCH_MIN_CHARS;
  const results = !tooShort && query.length >= PLACE_SEARCH_MIN_CHARS ? (search.data ?? []) : [];
  const active = activeIndex < results.length ? activeIndex : -1;
  const showOptions = open && results.length > 0;

  let status: string | null = null;
  if (open && !value) {
    if (tooShort) status = `Type at least ${PLACE_SEARCH_MIN_CHARS} characters.`;
    else if (typed !== query || search.isFetching) status = "Searching…";
    else if (search.isError) status = readApiError(search.error).message;
    else if (results.length === 0) status = "No places found.";
  }

  const choose = (place: Place) => {
    onChange(place);
    setText(place.label);
    setOpen(false);
    setActiveIndex(-1);
  };

  const move = (step: 1 | -1) => {
    setOpen(true);
    if (results.length === 0) return;
    setActiveIndex((current) => {
      const from = current < results.length ? current : -1;
      if (from === -1) return step === 1 ? 0 : results.length - 1;
      return (from + step + results.length) % results.length;
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        break;
      case "Enter":
        if (showOptions && active >= 0) {
          event.preventDefault();
          choose(results[active]);
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
          setActiveIndex(-1);
        }
        break;
    }
  };

  const describedBy = [status ? statusId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className="field combobox">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className="input"
        type="text"
        role="combobox"
        autoComplete="off"
        maxLength={100}
        placeholder="City, address or place"
        value={text}
        aria-autocomplete="list"
        aria-expanded={showOptions}
        aria-controls={listboxId}
        aria-activedescendant={showOptions && active >= 0 ? `${id}-option-${active}` : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        onChange={(event) => {
          setText(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
          if (value) onChange(null);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setOpen(false);
          setActiveIndex(-1);
          onBlur();
        }}
      />
      <ul
        id={listboxId}
        role="listbox"
        aria-label={`${label} suggestions`}
        className="combobox__listbox"
        hidden={!showOptions}
      >
        {results.map((place, index) => (
          <li
            key={placeKey(place)}
            id={`${id}-option-${index}`}
            role="option"
            aria-selected={index === active}
            className={
              index === active ? "combobox__option combobox__option--active" : "combobox__option"
            }
            // Keep focus in the input so blur does not close the list before the click lands.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(place)}
          >
            {place.label}
          </li>
        ))}
      </ul>
      {/* Always mounted so screen readers announce changes to it. */}
      <p id={statusId} className="combobox__status muted" role="status">
        {status}
      </p>
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}
