// src/logic/payload/buildPayload.js
export function buildPayload({ lat, lon, radiusKm }) {
  return {
    lat: Number(lat.toFixed(6)),
    lon: Number(lon.toFixed(6)),
    radius_km: radiusKm,
  };
}
