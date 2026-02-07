// src/components/panel/ResultsCard.jsx

function clamp01(x) {
  if (typeof x !== "number") return 0;
  return Math.max(0, Math.min(1, x));
}

export default function ResultsCard({ result, isLoading }) {
  const status = result?.status ?? "unknown"; // healthy | unhealthy | unknown
  const label =
    result?.label ??
    (status === "healthy"
      ? "Likely healthy"
      : status === "unhealthy"
      ? "Likely unhealthy"
      : "No result yet");

  const survivability = clamp01(result?.survivability);
  const confidence = result?.confidence;
  const factors = Array.isArray(result?.key_factors) ? result.key_factors : [];
  const explanation = result?.explanation ?? "";

  const statusColor =
    status === "healthy"
      ? "#2eea77"
      : status === "unhealthy"
      ? "#7ddc9a"
      : "rgba(255,255,255,0.6)";

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ ...styles.badge, borderColor: statusColor, color: statusColor }}>
          {status.toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          <div style={styles.labelRow}>
            <span style={styles.label}>{label}</span>
            {typeof confidence === "number" && (
              <span style={styles.conf}>
                {Math.round(clamp01(confidence) * 100)}% conf
              </span>
            )}
          </div>

          <div style={styles.meterWrap}>
            <div style={styles.meterTrack}>
              <div
                style={{
                  ...styles.meterFill,
                  width: `${Math.round(survivability * 100)}%`,
                }}
              />
            </div>
            <div style={styles.meterText}>
              Survivability: <b>{Math.round(survivability * 100)}%</b>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={styles.loading}>Generating prediction…</div>
      ) : (
        <>
          {factors.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Key factors</div>
              <ul style={styles.list}>
                {factors.slice(0, 5).map((f, i) => (
                  <li key={i} style={styles.listItem}>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {explanation ? (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Explanation</div>
              <p style={styles.explain}>{explanation}</p>
            </div>
          ) : (
            <div style={styles.hint}>
              Click the map (or press Run) to see results here.
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #123322",
    borderRadius: 14,
    padding: 12,
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
  },

  header: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },

  badge: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.6,
  },

  labelRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
  },

  label: { fontSize: 16, fontWeight: 900 },
  conf: { fontSize: 12, color: "rgba(255,255,255,0.65)" },

  meterWrap: { marginTop: 8 },
  meterTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  meterFill: {
    height: "100%",
    borderRadius: 999,
    background:
      "linear-gradient(90deg, rgba(46,234,119,0.95), rgba(12,150,76,0.95))",
  },
  meterText: {
    marginTop: 6,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },

  section: {
    marginTop: 14,
    borderTop: "1px solid rgba(255,255,255,0.10)",
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.3,
    color: "rgba(255,255,255,0.8)",
  },

  list: { margin: "8px 0 0", paddingLeft: 18 },
  listItem: {
    marginBottom: 6,
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
  },

  explain: {
    margin: "8px 0 0",
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 1.5,
  },

  loading: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
  },

  hint: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    border: "1px dashed rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.70)",
    fontSize: 13,
  },
};
