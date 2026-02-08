// src/components/BottomInfoBar.jsx
import React from "react";

export default function BottomInfoBar({ open, loading, data, error, onClose }) {
  if (!open) return null;

  const photos = Array.isArray(data?.photos) ? data.photos.slice(0, 8) : [];
  const hasPhotos = photos.length > 0;

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <div style={styles.headerRow}>
          <div style={styles.title}>{data?.placeName || "Location info"}</div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close location info">
            ×
          </button>
        </div>

        {loading ? (
          <div>
            <div style={styles.loadingText}>Loading…</div>
            <div style={styles.photoStrip}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={styles.photoPlaceholder} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div style={styles.error}>{error}</div>
        ) : (
          <>
            <div style={styles.photoStrip}>
              {hasPhotos ? (
                photos.map((src, i) => (
                  <img key={i} src={src} alt={`Location ${i + 1}`} style={styles.photo} />
                ))
              ) : (
                <div style={styles.noPhotos}>No photos available</div>
              )}
            </div>
            {data?.description ? (
              <div style={styles.description}>{data.description}</div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "absolute",
    inset: "auto 12px 12px 12px",
    zIndex: 1500,
    pointerEvents: "none",
    display: "flex",
    justifyContent: "center",
  },
  inner: {
    width: "100%",
    maxWidth: 1100,
    background: "rgba(6, 12, 8, 0.88)",
    border: "1px solid rgba(46,234,119,0.25)",
    borderRadius: 14,
    boxShadow: "0 18px 48px rgba(0,0,0,0.45)",
    padding: "12px 14px",
    color: "#e9f9ef",
    backdropFilter: "blur(6px)",
    pointerEvents: "auto",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: 800, color: "#f4fff8" },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "#f4fff8",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
  },
  loadingText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 8,
  },
  photoStrip: {
    display: "grid",
    gridAutoFlow: "column",
    gridAutoColumns: "140px",
    gap: 8,
    overflowX: "auto",
    padding: "4px 2px 4px 0",
  },
  photo: {
    width: "100%",
    height: 96,
    objectFit: "cover",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  photoPlaceholder: {
    height: 96,
    borderRadius: 10,
    background: "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.16), rgba(255,255,255,0.08))",
  },
  noPhotos: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    padding: "8px 0",
  },
  description: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 1.5,
    color: "rgba(233,249,239,0.9)",
    whiteSpace: "pre-line",
  },
  error: {
    marginTop: 4,
    padding: 10,
    borderRadius: 10,
    border: "1px solid rgba(255,120,120,0.35)",
    background: "rgba(80,0,0,0.25)",
    color: "#ffd7d7",
    fontSize: 13,
  },
};
