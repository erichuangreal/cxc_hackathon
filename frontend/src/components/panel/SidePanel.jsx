// src/components/panel/SidePanel.jsx
import FeaturesPanel from "./FeaturesPanel";
import ResultsCard from "./ResultsCard";

export default function SidePanel({
  selectedPoint,
  features,
  baseFeatures,
  source,
  fetchLoading,
  predictLoading,
  result,
  error,
  onClear,
  onFeaturesChange,
  onRunPredict,
  dataVersion = 0,
}) {
  return (
    <aside style={styles.panel}>
      <h1 style={styles.title}>Tree Condition</h1>
      <p style={styles.sub}>
        Click the map to fetch features, adjust values or upload CSV, then run prediction.
      </p>

      {selectedPoint && (
        <div style={styles.coords}>
          <span style={styles.coord}>
            {selectedPoint.lat.toFixed(5)}, {selectedPoint.lon.toFixed(5)}
          </span>
          <button style={styles.clearBtn} onClick={onClear}>
            Clear
          </button>
        </div>
      )}

      {error ? <div style={styles.error}>{error}</div> : null}

      <FeaturesPanel
        key={dataVersion}
        features={features}
        baseFeatures={baseFeatures}
        source={source}
        isLoading={fetchLoading}
        onFeaturesChange={onFeaturesChange}
        onRun={onRunPredict}
        runDisabled={predictLoading}
      />

      <ResultsCard result={result} isLoading={predictLoading} />
    </aside>
  );
}

const styles = {
  panel: {
    height: "100%",
    padding: "16px 16px 32px 16px",
    overflow: "auto",
    background: "#07110b",
    borderLeft: "1px solid #123322",
    color: "#ffffff",
  },
  title: { margin: "0 0 6px", fontSize: 18, fontWeight: 800 },
  sub: {
    margin: "0 0 14px",
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    lineHeight: 1.35,
  },
  coords: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  coord: { fontVariantNumeric: "tabular-nums" },
  clearBtn: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid #123322",
    background: "#050a07",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  error: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,100,100,0.4)",
    background: "rgba(80,0,0,0.25)",
    color: "#ffcccc",
    fontSize: 13,
  },
};
