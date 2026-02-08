// src/components/map/MapView.jsx
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Fix default marker icons in webpack/vite (otherwise broken icon path)
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const USA_CENTER = [39.5, -98.35];
const USA_ZOOM = 4;

// These are still used as a fallback if the polygon fails to load,
// but the real "perfect border" check uses GeoJSON polygons below.
const USA_BOUNDS = {
  latMin: 24.396308, // Florida Keys
  latMax: 49.384358, // Northern border
  lonMin: -124.848974, // West coast
  lonMax: -66.885444, // East coast
};

// Contiguous US polygons (we will EXCLUDE Alaska & Hawaii)
const US_STATES_GEOJSON_URL =
  "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/us-states.json";

// Keeps map panning mostly around the lower 48
const LOWER48_BOUNDS = L.latLngBounds(
  L.latLng(24.396308, -124.848974),
  L.latLng(49.384358, -66.885444)
);

/* ---------- geometry helpers: point-in-(multi)polygon ---------- */

function nearly_equal(a, b, eps = 1e-10) {
  return Math.abs(a - b) <= eps;
}

function point_on_segment(px, py, ax, ay, bx, by) {
  // collinear + within bounding box of segment
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax);
  if (!nearly_equal(cross, 0)) return false;

  const dot = (px - ax) * (bx - ax) + (py - ay) * (by - ay);
  if (dot < 0) return false;

  const len_sq = (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
  if (dot > len_sq) return false;

  return true;
}

function point_in_ring(lon, lat, ring) {
  // ring: array of [lon, lat]
  // returns true if inside OR on boundary
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    // boundary counts as inside
    if (point_on_segment(lon, lat, xj, yj, xi, yi)) return true;

    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function point_in_polygon(lon, lat, polygon_coords) {
  // polygon_coords: [outerRing, holeRing1, holeRing2, ...]
  if (!polygon_coords || polygon_coords.length === 0) return false;

  const outer = polygon_coords[0];
  if (!point_in_ring(lon, lat, outer)) return false;

  // holes (if inside hole => NOT inside polygon)
  for (let i = 1; i < polygon_coords.length; i++) {
    if (point_in_ring(lon, lat, polygon_coords[i])) return false;
  }

  return true;
}

function point_in_geojson(lon, lat, geojson) {
  if (!geojson?.features?.length) return false;

  for (const f of geojson.features) {
    const g = f.geometry;
    if (!g) continue;

    if (g.type === "Polygon") {
      if (point_in_polygon(lon, lat, g.coordinates)) return true;
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.coordinates) {
        if (point_in_polygon(lon, lat, poly)) return true;
      }
    }
  }

  return false;
}

/* ---------- map helpers ---------- */

function RecenterOnSelect({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    map.setView(position, Math.max(map.getZoom(), 6), { animate: true });
  }, [map, position]);
  return null;
}

function MapClickHandler({ onSelectPoint, allowedGeoJSON }) {
  const map = useMap();

  useMapEvents({
    mousemove: (e) => {
      const container = map.getContainer();

      // If polygons not loaded yet, block clicks & show X
      if (!allowedGeoJSON) {
        container.classList.add("cursor-x-blocked");
        return;
      }

      const inside = point_in_geojson(e.latlng.lng, e.latlng.lat, allowedGeoJSON);
      if (inside) container.classList.remove("cursor-x-blocked");
      else container.classList.add("cursor-x-blocked");
    },

    click: (e) => {
      if (!allowedGeoJSON) return;

      const lat = e.latlng.lat;
      const lon = e.latlng.lng;

      // block if not inside contiguous US polygon
      if (!point_in_geojson(lon, lat, allowedGeoJSON)) return;

      onSelectPoint?.(lat, lon);
    },
  });

  return null;
}

export default function MapView({ selectedPoint, onSelectPoint }) {
  const position = selectedPoint ? [selectedPoint.lat, selectedPoint.lon] : USA_CENTER;

  const [searchMode, setSearchMode] = useState("name");
  const [nameQuery, setNameQuery] = useState("");
  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // NEW: contiguous-USA polygons (Alaska excluded)
  const [allowedGeoJSON, setAllowedGeoJSON] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load_polys() {
      try {
        const res = await fetch(US_STATES_GEOJSON_URL);
        if (!res.ok) throw new Error("Failed to load US polygons");
        const data = await res.json();

        // Keep only contiguous states (exclude Alaska + Hawaii)
        const filtered = {
          type: "FeatureCollection",
          features: (data.features || []).filter((f) => {
            const name = f?.properties?.name;
            if (!name) return false;
            if (name === "Alaska") return false;
            if (name === "Hawaii") return false;
            return true;
          }),
        };

        if (!cancelled) setAllowedGeoJSON(filtered);
      } catch {
        // If this fails, we fall back to bounding box checks,
        // but cursor blocking/click blocking will be strict only when polygons exist.
        if (!cancelled) setAllowedGeoJSON(null);
      }
    }

    load_polys();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetErrors = () => setSearchError("");

  // PERFECT check when polygons loaded, otherwise fallback bounding box
  const isWithinUS = (lat, lon) => {
    if (allowedGeoJSON) return point_in_geojson(lon, lat, allowedGeoJSON);

    return (
      lat >= USA_BOUNDS.latMin &&
      lat <= USA_BOUNDS.latMax &&
      lon >= USA_BOUNDS.lonMin &&
      lon <= USA_BOUNDS.lonMax
    );
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    resetErrors();

    if (searchMode === "coords") {
      const lat = parseFloat(latInput);
      const lon = parseFloat(lonInput);
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        setSearchError("Enter valid latitude and longitude numbers.");
        return;
      }
      if (!isWithinUS(lat, lon)) {
        setShowComingSoon(true);
        return;
      }
      onSelectPoint?.(lat, lon);
      return;
    }

    if (!nameQuery.trim()) {
      setSearchError("Enter a place name to search.");
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          nameQuery
        )}&limit=1`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (!data?.length) {
        setSearchError("No results found.");
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      if (!isWithinUS(lat, lon)) {
        setShowComingSoon(true);
        return;
      }

      onSelectPoint?.(lat, lon);
    } catch (err) {
      setSearchError(err.message || "Unable to search right now.");
    } finally {
      setSearching(false);
    }
  };

  const showCoordInputs = searchMode === "coords";

  return (
    <div style={{ position: "absolute", inset: 0, background: "#020503" }}>
      <div style={searchBarStyles.wrapper}>
        <form style={searchBarStyles.form} onSubmit={handleSearch}>
          <select
            value={searchMode}
            onChange={(e) => {
              setSearchMode(e.target.value);
              resetErrors();
            }}
            style={searchBarStyles.select}
          >
            <option value="name">Name</option>
            <option value="coords">Longitude/Latitude</option>
          </select>

          {showCoordInputs ? (
            <>
              <input
                type="text"
                placeholder="Latitude"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                style={searchBarStyles.input}
              />
              <input
                type="text"
                placeholder="Longitude"
                value={lonInput}
                onChange={(e) => setLonInput(e.target.value)}
                style={searchBarStyles.input}
              />
            </>
          ) : (
            <input
              type="text"
              placeholder="Search place or city"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              style={searchBarStyles.input}
            />
          )}

          <button type="submit" style={searchBarStyles.button} disabled={searching}>
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
        {searchError && <div style={searchBarStyles.error}>{searchError}</div>}
      </div>

      <div style={logoStyles.corner}>
        <img src="/src/assets/logo.png" alt="GrowWise" style={logoStyles.image} />
      </div>

      {showComingSoon && (
        <div style={comingSoonStyles.overlay}>
          <div style={comingSoonStyles.card}>
            <div style={comingSoonStyles.title}>Coming Soon!</div>
            <div style={comingSoonStyles.body}>
              Global search is on the roadmap. For now, please pick a location within the United States.
            </div>
            <button style={comingSoonStyles.button} onClick={() => setShowComingSoon(false)}>
              Back to map
            </button>
          </div>
        </div>
      )}

      <MapContainer
        center={USA_CENTER}
        zoom={USA_ZOOM}
        style={{ height: "100%", width: "100%", position: "absolute", inset: 0 }}
        scrollWheelZoom={true}
        maxBounds={LOWER48_BOUNDS}
        maxBoundsViscosity={1.0}
        worldCopyJump={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* NEW: blocks clicks outside contiguous USA + sets cursor to X */}
        <MapClickHandler onSelectPoint={onSelectPoint} allowedGeoJSON={allowedGeoJSON} />

        <RecenterOnSelect position={selectedPoint ? [selectedPoint.lat, selectedPoint.lon] : null} />

        {selectedPoint && (
          <Marker position={[selectedPoint.lat, selectedPoint.lon]}>
            <Popup>
              {selectedPoint.lat.toFixed(5)}, {selectedPoint.lon.toFixed(5)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

const searchBarStyles = {
  wrapper: {
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  form: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(6, 12, 8, 0.8)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    borderRadius: 12,
    padding: "12px 14px",
    backdropFilter: "blur(6px)",
    minWidth: 620,
  },
  select: {
    background: "rgba(255,255,255,0.08)",
    color: "#f3f5f0",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "9px 12px",
    outline: "none",
    fontSize: 14,
  },
  input: {
    background: "rgba(255,255,255,0.08)",
    color: "#f3f5f0",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "9px 12px",
    outline: "none",
    fontSize: 14,
    minWidth: 260,
    flex: 1,
  },
  button: {
    background: "linear-gradient(135deg, #2eea77, #16c6b7)",
    color: "#041007",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    boxShadow: "0 6px 18px rgba(46, 234, 119, 0.35)",
    transition: "transform 150ms ease, box-shadow 150ms ease",
  },
  error: {
    color: "#ffb4a2",
    fontSize: 13,
    textShadow: "0 1px 6px rgba(0,0,0,0.6)",
  },
};

const logoStyles = {
  corner: {
    position: "absolute",
    bottom: 5,
    left: 5,
    zIndex: 900,
    pointerEvents: "none",
  },
  image: {
    width: 150,
    height: 150,
    objectFit: "cover",
    borderRadius: 0,
  },
};

const comingSoonStyles = {
  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 1200,
    background: "rgba(2,5,3,0.86)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
  },
  card: {
    background: "linear-gradient(145deg, rgba(13,25,17,0.95), rgba(7,15,10,0.92))",
    border: "1px solid rgba(46,234,119,0.25)",
    boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
    borderRadius: 16,
    padding: "22px 26px",
    maxWidth: 420,
    textAlign: "center",
    color: "#e9f9ef",
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 1.5,
    color: "#cfe5d7",
    marginBottom: 18,
  },
  button: {
    background: "linear-gradient(135deg, #2eea77, #16c6b7)",
    color: "#041007",
    border: "none",
    borderRadius: 12,
    padding: "10px 16px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    boxShadow: "0 10px 28px rgba(46,234,119,0.28)",
  },
};
