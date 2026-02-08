# GrowWiseAI / Envirodata API

Backend: FastAPI. When running locally: `uvicorn main:app --reload` from `backend/` → base URL `http://127.0.0.1:8000`.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/fetch-features?lat=<float>&lon=<float>` | Fetch features for a (lat, lon) point. Cached by coordinates. |
| POST | `/api/predict` | Run tree-health prediction on a `features` object (see below). |
| GET | `/health` | Health check; returns `{"status":"ok"}`. |

### GET `/api/fetch-features`

- **Query:** `lat` (float), `lon` (float).
- **Response:** JSON with snake_case keys. The app uses only the 7 model features: `elevation`, `temperature`, `humidity`, `soil_tn`, `soil_tp`, `soil_ap`, `soil_an`, plus `source` (per-feature `"api"` / `"default"` / `"proxy"`). Fetch may also return `slope`, `fire_risk_index`, etc., but the model ignores them.

### POST `/api/predict`

- **Body:** `{ "features": { ... } }` — keys can be PascalCase or snake_case (e.g. `Elevation` or `elevation`, `Soil_TN` or `soil_tn`).
- **Model uses 7 features:** `elevation`, `temperature`, `humidity`, `soil_TN`, `soil_TP`, `soil_AP`, `soil_AN`. Missing values are filled with training medians.
- **Response:** `status` (healthy | unhealthy), `label` (unhealthy | subhealthy | healthy | very_healthy), `survivability`, `confidence`, `key_factors`, `explanation`, `probabilities`.

---

## Feature mapping: auto vs default (model’s 7 features only)

Where each of the **7 model features** comes from when using **fetch-features**.

| Feature | Source | API / Default |
|--------|--------|----------------|
| Elevation | Auto | Open-Elevation `api.open-elevation.com/api/v1/lookup` |
| Temperature | Auto | Open-Meteo `api.open-meteo.com/v1/forecast?current=temperature_2m,relative_humidity_2m` |
| Humidity | Auto | Open-Meteo (same call) |
| Soil Total Nitrogen (TN), Available Nitrogen (AN) | Auto | SoilGrids `nitrogen`; fallback: `soc` C:N ~10:1 proxy when N is null |
| Soil Total Phosphorus (TP), Available Phosphorus (AP) | Auto | SoilGrids `soc` as P proxy (P:C ~0.01) — SoilGrids has no P layer |
