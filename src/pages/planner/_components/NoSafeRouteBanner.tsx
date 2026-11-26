export function NoSafeRouteBanner() {
  return (
    <div className="banner banner--danger" role="alert">
      <p className="banner__title">Every route has No Travel conditions at this departure time.</p>
      <p>
        Try a later departure: move the forecast slider on the map to find a calmer window, then
        change the departure time.
      </p>
    </div>
  );
}
