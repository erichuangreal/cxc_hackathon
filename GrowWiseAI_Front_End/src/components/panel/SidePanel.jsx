// src/components/panel/SidePanel.jsx
import ResultsCard from "./ResultsCard";

export default function SidePanel({
  radiusKm,
  setRadiusKm,
  minKm = 1,
  maxKm = 200,
  step = 1,
  result,      // { label, survivability, confidence, explanation, key_factors, status }
  isLoading,
  error,
  onClear,     // optional
  onRun,       // optional (if you don't auto-run)
}) {
  return (
    <aside style={styles.panel}>
      <h1 style={styles.title}>Tree Condition</h1>
      <p style={styles.sub}>
        Adjust radius, then click the map to generate a prediction.
      </p>

      {/* Slider card */}
      <div style={styles.card}>
        <div style={styles.row}>
          <span style={styles.k}>Radius (km)</span>
          <span style={styles.v}>{radiusKm}</span>
        </div>

        <input
          aria-label="Radius in kilometers"
          type="range"
          min={minKm}
          max={maxKm}
          step={step}
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          style={styles.slider}
        />

        <div style={styles.sliderTicks}>
          <span style={styles.tick}>{minKm}</span>
          <span style={styles.tick}>{Math.round((minKm + maxKm) / 2)}</span>
          <span style={styles.tick}>{maxKm}</span>
        </div>

        <div style={styles.btnRow}>
          <button style={styles.btn} onClick={onClear} disabled={!onClear}>
            Clear
          </button>
          <button style={styles.btnPrimary} onClick={onRun} disabled={!onRun || isLoading}>
            {isLoading ? "Running..." : "Run"}
          </button>
        </div>

        {error ? <div style={styles.error}>{error}</div> : null}
      </div>

      {/* Results display */}
      <ResultsCard result={result} isLoading={isLoading} />
    </aside>
  );
}

const styles = {
  panel: {
    height: "100%",
    padding: 16,
    overflow: "auto",
    background: "#07110b",          // deep green-black
    borderLeft: "1px solid #123322",
    color: "#ffffff",
  },
  title: { margin: "0 0 6px", fontSize: 18, fontWeight: 800 },
  sub: { margin: "0 0 14px", color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.35 },

  card: {
    border: "1px solid #123322",
    borderRadius: 14,
    padding: 12,
    background: "rgba(0,0,0,0.35)",
    marginBottom: 12,
  },
  row: { display: "flex", justifyContent: "space-between", gap: 10, margin: "8px 0", fontSize: 14 },
  k: { color: "rgba(255,255,255,0.65)" },
  v: { fontVariantNumeric: "tabular-nums", fontWeight: 700 },

  slider: {
    width: "100%",
    accentColor: "#2eea77", // green slider thumb/track (supported in modern browsers)
    marginTop: 6,
  },
  sliderTicks: {
    marginTop: 8,
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
  tick: { fontVariantNumeric: "tabular-nums" },

  btnRow: { display: "flex", gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #123322",
    background: "#050a07",
    color: "#fff",
    cursor: "pointer",
  },
  btnPrimary: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #2eea77",
    background: "#0b2a16",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },
  error: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    fontSize: 13,
  },
};
