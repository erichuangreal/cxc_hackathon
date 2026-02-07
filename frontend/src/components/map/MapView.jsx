// src/components/map/MapView.jsx
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, Popup, useMap } from "react-leaflet";
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
const USA_BOUNDS = {
  latMin: 24.396308, // Florida Keys
  latMax: 49.384358, // Northern border
  lonMin: -124.848974, // West coast
  lonMax: -66.885444, // East coast
};

function RecenterOnSelect({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    map.setView(position, Math.max(map.getZoom(), 6), { animate: true });
  }, [map, position]);
  return null;
}

function MapClickHandler({ onSelectPoint }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onSelectPoint?.(lat, lng);
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

  const resetErrors = () => setSearchError("");

  const isWithinUS = (lat, lon) =>
    lat >= USA_BOUNDS.latMin &&
    lat <= USA_BOUNDS.latMax &&
    lon >= USA_BOUNDS.lonMin &&
    lon <= USA_BOUNDS.lonMax;

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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(nameQuery)}&limit=1`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (!data?.length) {
        setSearchError("No results found.");
        return;
      }
      const { lat, lon } = data[0];
      if (!isWithinUS(parseFloat(lat), parseFloat(lon))) {
        setShowComingSoon(true);
        return;
      }
      onSelectPoint?.(parseFloat(lat), parseFloat(lon));
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
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onSelectPoint={onSelectPoint} />
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
    bottom: 14,
    left: 14,
    zIndex: 900,
    pointerEvents: "none",
  },
  image: {
    width: 60,
    height: 60,
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
