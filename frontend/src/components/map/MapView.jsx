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
import logo from "../../assets/logo.png";

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

// Fallback bounding box ONLY (used while polygons load)
const USA_BOUNDS = {
  latMin: 24.396308,
  latMax: 49.384358,
  lonMin: -124.848974,
  lonMax: -66.885444,
};

// Lock panning roughly around lower-48
const LOWER48_BOUNDS = L.latLngBounds(
  L.latLng(24.396308, -124.848974),
  L.latLng(49.384358, -66.885444)
);

// Try multiple sources (GitHub raw sometimes fails on some networks)
const US_STATES_GEOJSON_URLS = [
  "https://cdn.jsdelivr.net/gh/PublicaMundi/MappingAPI@master/data/us-states.json",
  "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/us-states.json",
];

/* ---------------- geometry helpers: point-in-(multi)polygon ---------------- */

function nearlyEqual(a, b, eps = 1e-10) {
  return Math.abs(a - b) <= eps;
}

function pointOnSegment(px, py, ax, ay, bx, by) {
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax);
  if (!nearlyEqual(cross, 0)) return false;

  const dot = (px - ax) * (bx - ax) + (py - ay) * (bx - ax);
  if (dot < 0) return false;

  const lenSq = (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
  if (dot > lenSq) return false;

  return true;
}

function pointInRing(lon, lat, ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    // boundary counts as inside
    if (pointOnSegment(lon, lat, xj, yj, xi, yi)) return true;

    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function pointInPolygon(lon, lat, polygonCoords) {
  if (!polygonCoords || polygonCoords.length === 0) return false;

  const outer = polygonCoords[0];
  if (!pointInRing(lon, lat, outer)) return false;

  // holes
  for (let i = 1; i < polygonCoords.length; i++) {
    if (pointInRing(lon, lat, polygonCoords[i])) return false;
  }

  return true;
}

function pointInGeoJSON(lon, lat, geojson) {
  if (!geojson?.features?.length) return false;

  for (const f of geojson.features) {
    const g = f.geometry;
    if (!g) continue;

    if (g.type === "Polygon") {
      if (pointInPolygon(lon, lat, g.coordinates)) return true;
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.coordinates) {
        if (pointInPolygon(lon, lat, poly)) return true;
      }
    }
  }

  return false;
}

/* ---------------- map helpers ---------------- */

function RecenterOnSelect({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    map.setView(position, Math.max(map.getZoom(), 6), { animate: true });
  }, [map, position]);
  return null;
}

function MapClickAndCursorGuard({ onSelectPoint, allowedGeoJSON }) {
  const map = useMap();

  const isWithinAllowed = (lat, lon) => {
    // Perfect check once polygons are loaded
    if (allowedGeoJSON) return pointInGeoJSON(lon, lat, allowedGeoJSON);

    // Fallback while polygons still loading (so the app remains usable)
    return (
      lat >= USA_BOUNDS.latMin &&
      lat <= USA_BOUNDS.latMax &&
      lon >= USA_BOUNDS.lonMin &&
      lon <= USA_BOUNDS.lonMax
    );
  };

  useEffect(() => {
    // start “blocked” until first mousemove sets the correct state
    map.getContainer().classList.add("cursor-x-blocked");
  }, [map]);

  useMapEvents({
    mousemove: (e) => {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;

      const inside = isWithinAllowed(lat, lon);
      const container = map.getContainer();

      if (inside) container.classList.remove("cursor-x-blocked");
      else container.classList.add("cursor-x-blocked");
    },

    click: (e) => {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;

      if (!isWithinAllowed(lat, lon)) return;

      // If polygons are loaded, this is EXACT (no Mexico/Canada, no Alaska)
      onSelectPoint?.(lat, lon);
    },
  });

  return null;
}

export default function MapView({ selectedPoint, onSelectPoint, onBack }) {
  const position = selectedPoint ? [selectedPoint.lat, selectedPoint.lon] : USA_CENTER;

  const [searchMode, setSearchMode] = useState("name");
  const [nameQuery, setNameQuery] = useState("");
  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const [allowedGeoJSON, setAllowedGeoJSON] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPolys() {
      // Try multiple URLs for reliability
      for (const url of US_STATES_GEOJSON_URLS) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;

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
          return;
        } catch {
          // try next url
        }
      }

      // If all failed, keep null (we’ll still allow bounding-box clicks)
      if (!cancelled) setAllowedGeoJSON(null);
    }

    loadPolys();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetErrors = () => setSearchError("");

  const isWithinUS = (lat, lon) => {
    // Perfect border check once loaded
    if (allowedGeoJSON) return pointInGeoJSON(lon, lat, allowedGeoJSON);

    // fallback while loading
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

      {/* Bottom-left Back button */}
      <button
        type="button"
        onClick={() => onBack?.()}
        style={backButtonStyles.button}
        title="Back to landing"
        aria-label="Back to landing"
      >
        <img src={logo} alt="GrowWiseAI" style={backButtonStyles.image} />
        <div style={backButtonStyles.label}>Back</div>
      </button>

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

        {/* Exact lower-48 clickable mask + red X cursor outside */}
        <MapClickAndCursorGuard onSelectPoint={onSelectPoint} allowedGeoJSON={allowedGeoJSON} />

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

const backButtonStyles = {
  button: {
    position: "absolute",
    bottom: 14,
    left: 14,
    zIndex: 1100,
    border: "1px solid rgba(46,234,119,0.25)",
    background: "rgba(6,12,8,0.62)",
    backdropFilter: "blur(6px)",
    borderRadius: 16,
    padding: "10px 10px 8px",
    display: "grid",
    justifyItems: "center",
    gap: 6,
    cursor: "pointer",
    boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
  },
  image: {
    width: 52,
    height: 52,
    objectFit: "contain",
    display: "block",
    filter: "drop-shadow(0 10px 22px rgba(46,234,119,0.20))",
  },
  label: {
    color: "rgba(233,249,239,0.9)",
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: 0.2,
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
