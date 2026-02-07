// src/components/map/MapView.jsx
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon paths for many Vite setups
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// A lightweight, reliable US-states GeoJSON.
// We will filter out Alaska (and Hawaii) to get contiguous USA only.
const US_STATES_GEOJSON_URL =
  "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/us-states.json";

// Approx bounds for contiguous US (helps keep the view sane)
const LOWER48_BOUNDS = L.latLngBounds(
  L.latLng(24.396308, -124.848974),
  L.latLng(49.384358, -66.885444)
);

function nearlyEqual(a, b, eps = 1e-10) {
  return Math.abs(a - b) <= eps;
}

function pointOnSegment(px, py, ax, ay, bx, by) {
  // collinear + within bounding box
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax);
  if (!nearlyEqual(cross, 0)) return false;

  const dot = (px - ax) * (bx - ax) + (py - ay) * (by - ay);
  if (dot < 0) return false;

  const lenSq = (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
  if (dot > lenSq) return false;

  return true;
}

function pointInRing(lon, lat, ring) {
  // ring: array of [lon, lat]
  // returns true if inside or on boundary
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    // boundary check
    if (pointOnSegment(lon, lat, xj, yj, xi, yi)) return true;

    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function pointInPolygon(lon, lat, polygonCoords) {
  // polygonCoords: [outerRing, holeRing1, holeRing2, ...]
  if (!polygonCoords || polygonCoords.length === 0) return false;

  const outer = polygonCoords[0];
  const inOuter = pointInRing(lon, lat, outer);
  if (!inOuter) return false;

  // if point is inside any hole, it's not inside polygon
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

function ClickGuard({ allowedGeoJSON, onSelectPoint }) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;

      // Only allow clicks inside the contiguous-US polygons
      if (allowedGeoJSON && pointInGeoJSON(lon, lat, allowedGeoJSON)) {
        onSelectPoint(lat, lon);
      }
    },
  });

  return null;
}

export default function MapView({ selectedPoint, onSelectPoint }) {
  const [allowedGeoJSON, setAllowedGeoJSON] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(US_STATES_GEOJSON_URL);
        if (!res.ok) throw new Error("Failed to load US polygons");
        const data = await res.json();

        // Keep only contiguous states:
        // Excluding Alaska & Hawaii (and anything else that might appear).
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
        if (!cancelled) setAllowedGeoJSON(null);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const geoStyle = useMemo(
    () => ({
      color: "rgba(46,234,119,0.85)",
      weight: 1.5,
      fillColor: "rgba(46,234,119,0.10)",
      fillOpacity: 0.25,
    }),
    []
  );

  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4}
      minZoom={3}
      maxZoom={12}
      style={{ height: "100%", width: "100%" }}
      maxBounds={LOWER48_BOUNDS}
      maxBoundsViscosity={1.0}
      worldCopyJump={true}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {allowedGeoJSON && <GeoJSON data={allowedGeoJSON} style={geoStyle} />}

      <ClickGuard allowedGeoJSON={allowedGeoJSON} onSelectPoint={onSelectPoint} />

      {selectedPoint && (
        <Marker position={[selectedPoint.lat, selectedPoint.lon]} />
      )}
    </MapContainer>
  );
}
