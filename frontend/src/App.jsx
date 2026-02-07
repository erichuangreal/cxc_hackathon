// src/App.jsx
import { useState, useCallback } from "react";
import MapView from "./components/map/MapView";
import SidePanel from "./components/panel/SidePanel";

const API_BASE = "/api";

export default function App() {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [features, setFeatures] = useState({});
  const [source, setSource] = useState({});
  const [fetchLoading, setFetchLoading] = useState(false);
  const [predictLoading, setPredictLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleMapClick = useCallback(async (lat, lon) => {
    setSelectedPoint({ lat, lon });
    setError(null);
    setFetchLoading(true);
    setResult(null);
    try {
      const res = await fetch(
        `${API_BASE}/fetch-features?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const { source: src, ...feat } = data;
      setSource(src || {});
      setFeatures({
        elevation: feat.elevation,
        temperature: feat.temperature,
        humidity: feat.humidity,
        soil_tn: feat.soil_tn,
        soil_tp: feat.soil_tp,
        soil_ap: feat.soil_ap,
        soil_an: feat.soil_an,
      });
    } catch (err) {
      setError(err.message || "Failed to fetch features");
      setFeatures({});
      setSource({});
    } finally {
      setFetchLoading(false);
    }
  }, []);

  const handleRunPredict = useCallback(async (currentFeatures) => {
    setError(null);
    setPredictLoading(true);
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: currentFeatures }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Prediction failed");
      setResult(null);
    } finally {
      setPredictLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setSelectedPoint(null);
    setFeatures({});
    setSource({});
    setResult(null);
    setError(null);
  }, []);

  const isLoading = fetchLoading || predictLoading;
  const loadingMessage = fetchLoading
    ? "Fetching location data…"
    : predictLoading
      ? "Running prediction…"
      : "";

  return (
    <>
      {isLoading && (
        <div style={overlayStyles.overlay}>
          <div style={overlayStyles.barTrack}>
            <div style={overlayStyles.barFill} />
          </div>
          {loadingMessage && (
            <div style={overlayStyles.message}>{loadingMessage}</div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(200px, 1fr) 360px", height: "100vh", overflow: "hidden" }}>
        <div style={{ minHeight: 0, height: "100%", position: "relative" }}>
          <MapView selectedPoint={selectedPoint} onSelectPoint={handleMapClick} />
        </div>

        <SidePanel
        selectedPoint={selectedPoint}
        features={features}
        source={source}
        fetchLoading={fetchLoading}
        predictLoading={predictLoading}
        result={result}
        error={error}
        onClear={handleClear}
        onFeaturesChange={setFeatures}
        onRunPredict={handleRunPredict}
      />
      </div>
    </>
  );
}

const overlayStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(2, 5, 3, 0.85)",
    pointerEvents: "auto",
  },
  barTrack: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  barFill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    width: "40%",
    background: "linear-gradient(90deg, transparent, #2eea77, transparent)",
    animation: "loading-bar 1.2s ease-in-out infinite",
  },
  message: {
    marginTop: 12,
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    fontWeight: 600,
  },
};
