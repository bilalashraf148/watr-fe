import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

// MapLibre loads its worker from next to its own module, which Vite moves; point it at the file Vite
// serves (dev) and emits (build).
maplibregl.setWorkerUrl(maplibreWorkerUrl);

export { maplibregl };
