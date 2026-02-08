// src/components/panel/FeaturesPanel.jsx
import { useState, useCallback, useEffect } from "react";

const FEATURE_KEYS = [
  "elevation",
  "temperature",
  "humidity",
  "soil_tn",
  "soil_tp",
  "soil_ap",
  "soil_an",
];

const FEATURE_CONFIG = {
  elevation: { label: "Elevation", min: 0, max: 4000, step: 1, unit: "m" },
  temperature: { label: "Temperature", min: -20, max: 50, step: 0.5, unit: "°C" },
  humidity: { label: "Humidity", min: 0, max: 100, step: 1, unit: "%" },
  soil_tn: { label: "Soil Total Nitrogen", min: 0, max: 2, step: 0.01 },
  soil_tp: { label: "Soil Total Phosphorus", min: 0, max: 2, step: 0.01 },
  soil_ap: { label: "Soil Available Phosphorus", min: 0, max: 2, step: 0.01 },
  soil_an: { label: "Soil Available Nitrogen", min: 0, max: 2, step: 0.01 },
};

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return null;
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const row = lines[1].split(",").map((c) => c.trim());
  const obj = {};
  headers.forEach((h, i) => {
    const val = row[i];
    if (val === "" || val == null) return;
    const num = Number(val);
    obj[h] = Number.isFinite(num) ? num : val;
  });
  return obj;
}

function mapCSVToFeatures(csvObj) {
  const mapping = {
    elevation: ["elevation"],
    temperature: ["temperature", "temp"],
    humidity: ["humidity"],
    soil_tn: ["soil_tn", "soiltn", "tn"],
    soil_tp: ["soil_tp", "soiltp", "tp"],
    soil_ap: ["soil_ap", "soilap", "ap"],
    soil_an: ["soil_an", "soilan", "an"],
  };
  const out = {};
  for (const key of FEATURE_KEYS) {
    const aliases = mapping[key] || [key];
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(csvObj, alias)) {
        const v = csvObj[alias];
        if (typeof v === "number" && Number.isFinite(v)) {
          out[key] = v;
          break;
        }
      }
    }
  }
  return out;
}

export default function FeaturesPanel({
  features = {},
  baseFeatures = {},
  source = {},
  isLoading = false,
  onFeaturesChange,
  onRun,
  runDisabled,
}) {
  const [overrides, setOverrides] = useState({});
  const [csvError, setCsvError] = useState(null);

  useEffect(() => {
    // New location selection: clear overrides so sliders reflect freshly fetched values
    setOverrides({});
  }, [baseFeatures]);

  const currentFeatures = useCallback(() => {
    const out = { ...features };
    FEATURE_KEYS.forEach((k) => {
      if (overrides[k] !== undefined && overrides[k] !== null) {
        out[k] = overrides[k];
      }
    });
    return out;
  }, [features, overrides]);

  const getValue = (key) => {
    if (overrides[key] !== undefined && overrides[key] !== null) return overrides[key];
    const v = features[key];
    return v != null && Number.isFinite(v) ? v : 0;
  };

  const getSourceBadge = (key) => {
    if (overrides[key] !== undefined && overrides[key] !== null) return "Override";
    const s = source[key];
    if (s === "api" || s === "proxy") return "Auto";
    return "Default";
  };

  const handleOverride = (key, value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    setOverrides((prev) => ({ ...prev, [key]: num }));
    const next = { ...currentFeatures(), [key]: num };
    onFeaturesChange?.(next);
  };

  const handleReset = (key) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    const next = { ...features };
    FEATURE_KEYS.forEach((k) => {
      if (k !== key && overrides[k] !== undefined && overrides[k] !== null) next[k] = overrides[k];
    });
    const baseVal = baseFeatures[key];
    const fallback = FEATURE_CONFIG[key]?.min ?? 0;
    next[key] =
      baseVal != null && Number.isFinite(baseVal)
        ? baseVal
        : features[key] != null && Number.isFinite(features[key])
          ? features[key]
          : fallback;
    onFeaturesChange?.({ ...next });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result;
        const csvObj = parseCSV(text);
        if (!csvObj || !Object.keys(csvObj).length) {
          setCsvError("Could not parse CSV or no columns found.");
          return;
        }
        const mapped = mapCSVToFeatures(csvObj);
        if (!Object.keys(mapped).length) {
          setCsvError("No columns matched known feature names.");
          return;
        }
        setOverrides((prev) => ({ ...prev, ...mapped }));
        onFeaturesChange?.({ ...currentFeatures(), ...mapped });
      } catch (err) {
        setCsvError(err.message || "Failed to parse CSV.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRun = () => {
    onRun?.(currentFeatures());
  };

  const handleResetAll = () => {
    setOverrides({});
    if (Object.keys(baseFeatures || {}).length) {
      onFeaturesChange?.({ ...baseFeatures });
    } else {
      onFeaturesChange?.({ ...features });
    }
  };

  const hasOverrides = Object.keys(overrides).length > 0;

  if (isLoading) {
    return (
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Features</div>
        <p style={styles.sub}>Fetching from APIs…</p>
        <div style={styles.skeletonList}>
          {FEATURE_KEYS.map((key) => (
            <div key={key} style={styles.skeletonRow}>
              <div style={styles.skeletonLabel} className="features-skeleton-shimmer" />
              <div style={styles.skeletonValue} className="features-skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.sectionTitle}>Features</div>
      <p style={styles.sub}>Adjust values or upload CSV, then run prediction.</p>

      <div style={styles.uploadRow}>
        <label style={styles.uploadLabel}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
          <span style={styles.uploadBtn}>Upload CSV</span>
        </label>
        {csvError && <span style={styles.csvError}>{csvError}</span>}
      </div>

      <div style={styles.featureList}>
        {FEATURE_KEYS.map((key) => {
          const config = FEATURE_CONFIG[key] || { label: key, min: 0, max: 100, step: 0.1 };
          const value = getValue(key);
          const badge = getSourceBadge(key);
          const isOverride = badge === "Override";
          return (
            <div key={key} style={styles.featureRow}>
              <div style={styles.featureHeader}>
                <span style={styles.featureLabel}>{config.label}</span>
                <span
                  style={{
                    ...styles.badge,
                    ...(badge === "Auto"
                      ? styles.badgeAuto
                      : badge === "Override"
                        ? styles.badgeOverride
                        : styles.badgeDefault),
                  }}
                >
                  {badge}
                </span>
              </div>
              <div style={styles.featureControls}>
                <input
                  type="range"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  value={value}
                  onChange={(e) => handleOverride(key, e.target.value)}
                  style={styles.slider}
                />
                <input
                  type="number"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  value={value}
                  onChange={(e) => handleOverride(key, e.target.value)}
                  style={styles.numberInput}
                />
                {config.unit && <span style={styles.unit}>{config.unit}</span>}
                {isOverride && (
                  <button
                    type="button"
                    style={styles.resetBtn}
                    onClick={() => handleReset(key)}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.btnRow}>
        <button
          type="button"
          style={{
            ...styles.btnSecondary,
            opacity: hasOverrides ? 1 : 0.65,
            cursor: hasOverrides ? "pointer" : "not-allowed",
          }}
          disabled={!hasOverrides}
          onClick={handleResetAll}
        >
          Reset settings
        </button>
        <button
          style={styles.btnPrimary}
          onClick={handleRun}
          disabled={runDisabled}
        >
          Run prediction
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #123322",
    borderRadius: 14,
    padding: 12,
    background: "rgba(0,0,0,0.35)",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 800,
    marginBottom: 4,
    color: "#fff",
  },
  sub: {
    margin: "0 0 10px",
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
  uploadRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  uploadLabel: { cursor: "pointer" },
  uploadBtn: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #2eea77",
    background: "#0b2a16",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
  },
  csvError: {
    fontSize: 12,
    color: "#e88",
  },
  featureList: {
    maxHeight: 320,
    overflow: "auto",
    marginBottom: 12,
  },
  featureRow: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  featureHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  featureLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontWeight: 600,
  },
  badge: {
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 6,
  },
  badgeAuto: { background: "rgba(46,234,119,0.2)", color: "#2eea77" },
  badgeOverride: { background: "rgba(255,200,80,0.25)", color: "#ffc850" },
  badgeDefault: { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" },
  featureControls: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  slider: {
    flex: "1 1 80px",
    minWidth: 60,
    accentColor: "#2eea77",
  },
  numberInput: {
    width: 72,
    padding: "4px 6px",
    borderRadius: 8,
    border: "1px solid #123322",
    background: "#050a07",
    color: "#fff",
    fontSize: 13,
  },
  unit: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  resetBtn: {
    padding: "4px 8px",
    fontSize: 11,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "rgba(255,255,255,0.8)",
    cursor: "pointer",
  },
  btnRow: { marginTop: 8, display: "flex", flexDirection: "column", gap: 8 },
  btnSecondary: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "transparent",
    color: "#fff",
    fontWeight: 700,
  },
  btnPrimary: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #2eea77",
    background: "#0b2a16",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },

  skeletonList: { marginTop: 8 },
  skeletonRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  skeletonLabel: {
    height: 14,
    width: "40%",
    borderRadius: 6,
    background: "linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.08) 75%)",
    backgroundSize: "200% 100%",
  },
  skeletonValue: {
    height: 14,
    width: "30%",
    borderRadius: 6,
    background: "linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 75%)",
    backgroundSize: "200% 100%",
  },
};
