// src/components/panel/SidePanel.jsx
import { useEffect, useMemo, useState } from "react";

const FIELD_ORDER = [
  "elevation",
  "temperature",
  "humidity",
  "soil_tn",
  "soil_tp",
  "soil_ap",
  "soil_an",
];

const FIELD_LABELS = {
  elevation: "Elevation",
  temperature: "Temperature",
  humidity: "Humidity",
  soil_tn: "Soil Total Nitrogen",
  soil_tp: "Soil Total Phosphorus",
  soil_ap: "Soil Available Phosphorus",
  soil_an: "Soil Available Nitrogen",
};

const FIELD_SLIDER = {
  elevation: { min: 0, max: 4000, step: 1 },
  temperature: { min: -30, max: 45, step: 0.1 },
  humidity: { min: 0, max: 100, step: 0.1 },
  soil_tn: { min: 0, max: 5, step: 0.01 },
  soil_tp: { min: 0, max: 5, step: 0.01 },
  soil_ap: { min: 0, max: 5, step: 0.01 },
  soil_an: { min: 0, max: 5, step: 0.01 },
};

function clamp(x, min, max) {
  if (Number.isNaN(x)) return min;
  return Math.min(max, Math.max(min, x));
}

function shallowEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  for (const k of FIELD_ORDER) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

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
  onResetAll,
}) {
  // which fields user has explicitly overridden (enables slider editing)
  const [overridden, setOverridden] = useState({});

  // When user clicks a new point (baseFeatures changes), clear overrides.
  useEffect(() => {
    setOverridden({});
  }, [selectedPoint?.lat, selectedPoint?.lon]);

  const canEdit = !!selectedPoint && !!baseFeatures && !fetchLoading;
  const hasAllBase = !!baseFeatures && FIELD_ORDER.every((k) => baseFeatures[k] !== undefined);

  const isModified = useMemo(() => {
    if (!hasAllBase) return false;
    return !shallowEqual(features, baseFeatures);
  }, [features, baseFeatures, hasAllBase]);

  function setField(key, rawValue) {
    const slider = FIELD_SLIDER[key] || { min: 0, max: 1, step: 0.01 };
    const n = clamp(Number(rawValue), slider.min, slider.max);

    onFeaturesChange({
      ...features,
      [key]: n,
    });
  }

  function handleOverride(key) {
    setOverridden((p) => ({ ...p, [key]: true }));
  }

  function handleResetOne(key) {
    if (!baseFeatures) return;

    onFeaturesChange({
      ...features,
      [key]: baseFeatures[key],
    });

    setOverridden((p) => ({ ...p, [key]: false }));
  }

  function handleResetAll() {
    onResetAll();
    setOverridden({});
  }

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Inputs</div>
          <div style={styles.sub}>
            {selectedPoint ? (
              <>
                Lat: {selectedPoint.lat.toFixed(5)} | Lon: {selectedPoint.lon.toFixed(5)}
              </>
            ) : (
              <>Click inside the contiguous USA to load data.</>
            )}
          </div>
        </div>

        <button style={styles.ghostBtn} onClick={onClear}>
          Clear
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.actionsRow}>
        <button
          style={{ ...styles.btn, ...(canEdit ? styles.primaryBtn : styles.disabledBtn) }}
          disabled={!canEdit}
          onClick={() => onRunPredict(features)}
        >
          {predictLoading ? "Running…" : "Run prediction"}
        </button>

        <button
          style={{
            ...styles.btn,
            ...(canEdit && isModified ? styles.warnBtn : styles.disabledBtn),
          }}
          disabled={!canEdit || !isModified}
          onClick={handleResetAll}
          title={!isModified ? "No changes to reset" : "Reset all sliders to fetched/base values"}
        >
          Reset all
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Feature inputs</div>

        {FIELD_ORDER.map((key) => {
          const label = FIELD_LABELS[key] || key;
          const slider = FIELD_SLIDER[key] || { min: 0, max: 1, step: 0.01 };

          const baseVal = baseFeatures?.[key];
          const currentVal = features?.[key];

          const isOver = !!overridden[key];
          const hasBase = baseVal !== undefined && baseVal !== null;
          const valueToShow = currentVal ?? baseVal ?? slider.min;

          return (
            <div key={key} style={styles.field}>
              <div style={styles.fieldTop}>
                <div style={styles.fieldLabel}>{label}</div>

                <div style={styles.fieldBtns}>
                  <button
                    style={{ ...styles.smallBtn, ...(isOver ? styles.smallBtnOn : {}) }}
                    disabled={!canEdit}
                    onClick={() => handleOverride(key)}
                    title="Enable editing for this field"
                  >
                    Override
                  </button>

                  <button
                    style={styles.smallBtn}
                    disabled={!canEdit || !hasBase}
                    onClick={() => handleResetOne(key)}
                    title="Reset this field to fetched/base"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div style={styles.fieldMid}>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={valueToShow}
                  disabled={!canEdit || !isOver}
                  onChange={(e) => setField(key, e.target.value)}
                  style={styles.slider}
                />

                <input
                  type="number"
                  value={valueToShow}
                  disabled={!canEdit || !isOver}
                  onChange={(e) => setField(key, e.target.value)}
                  style={styles.number}
                />
              </div>

              {hasBase && (
                <div style={styles.baseRow}>
                  Base: <span style={styles.baseVal}>{Number(baseVal).toFixed(2)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Data source</div>
        <pre style={styles.pre}>{JSON.stringify(source || {}, null, 2)}</pre>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Prediction result</div>
        {result ? (
          <pre style={styles.pre}>{JSON.stringify(result, null, 2)}</pre>
        ) : (
          <div style={styles.muted}>No prediction yet.</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  panel: {
    height: "100%",
    overflow: "auto",
    padding: 14,
    background: "#060b07",
    color: "rgba(255,255,255,0.92)",
    borderLeft: "1px solid rgba(255,255,255,0.08)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: 800 },
  sub: { fontSize: 12.5, color: "rgba(255,255,255,0.65)", marginTop: 4 },

  actionsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 },

  btn: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
    padding: "10px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  primaryBtn: {
    borderColor: "rgba(46,234,119,0.35)",
    background: "rgba(46,234,119,0.12)",
  },
  warnBtn: {
    borderColor: "rgba(245,158,11,0.45)",
    background: "rgba(245,158,11,0.12)",
  },
  disabledBtn: {
    opacity: 0.45,
    cursor: "not-allowed",
  },

  ghostBtn: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    color: "rgba(255,255,255,0.85)",
    padding: "8px 10px",
    fontWeight: 800,
    cursor: "pointer",
    height: 36,
  },

  card: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.65)",
    marginBottom: 10,
  },

  field: {
    padding: "10px 0",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  fieldTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  fieldLabel: { fontSize: 14, fontWeight: 800 },
  fieldBtns: { display: "flex", gap: 8 },

  smallBtn: {
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.90)",
    padding: "6px 10px",
    fontWeight: 800,
    cursor: "pointer",
  },
  smallBtnOn: {
    borderColor: "rgba(245,158,11,0.55)",
    background: "rgba(245,158,11,0.18)",
  },

  fieldMid: {
    display: "grid",
    gridTemplateColumns: "1fr 92px",
    gap: 10,
    alignItems: "center",
    marginTop: 10,
  },
  slider: { width: "100%" },
  number: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
    padding: "8px 10px",
    fontWeight: 800,
  },

  baseRow: { marginTop: 8, fontSize: 12.5, color: "rgba(255,255,255,0.65)" },
  baseVal: { color: "rgba(255,255,255,0.92)", fontWeight: 900 },

  pre: {
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },

  muted: { color: "rgba(255,255,255,0.60)", fontSize: 13 },
  error: {
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.10)",
    color: "rgba(255,255,255,0.92)",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    fontWeight: 700,
    fontSize: 13,
  },
};
