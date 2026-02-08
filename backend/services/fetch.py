"""
Auto-fetch service: Open-Meteo, Open-Elevation, SoilGrids, fire proxy, medians.
Cache by (round(lat, 2), round(lon, 2)).
"""
import asyncio
from functools import lru_cache
from pathlib import Path

import httpx

# Feature names matching model (exact casing)
FEATURE_NAMES = [
    "Slope",
    "Elevation",
    "Temperature",
    "Humidity",
    "Soil_TN",
    "Soil_TP",
    "Soil_AP",
    "Soil_AN",
    "Menhinick_Index",
    "Gleason_Index",
    "Disturbance_Level",
    "Fire_Risk_Index",
]

# Medians from forest_health_data_with_target.csv (for default/fallback)
MEDIANS = {
    "Slope": 21.808936091032585,
    "Elevation": 1503.5730226128198,
    "Temperature": 21.754533316862897,
    "Humidity": 59.614943703539744,
    "Soil_TN": 0.5113024573782637,
    "Soil_TP": 0.24975360936595653,
    "Soil_AP": 0.24747083523271096,
    "Soil_AN": 0.24380308068303527,
    "Menhinick_Index": 1.7524116930921474,
    "Gleason_Index": 2.9693736440949037,
    "Disturbance_Level": 0.5230227736391104,
    "Fire_Risk_Index": 0.5164885287315552,
}

# Keys that come from APIs (snake_case in response)
API_KEYS = [
    "elevation",
    "temperature",
    "humidity",
    "soil_tn",
    "soil_tp",
    "soil_ap",
    "soil_an",
    "fire_risk_index",
]


def _cache_key(lat: float, lon: float) -> tuple[float, float]:
    return (round(lat, 3), round(lon, 3))


# In-memory cache for fetch results keyed by (lat, lon) rounded to 0.001° (~100m)
_fetch_cache: dict[tuple[float, float], dict] = {}
_cache_lock = asyncio.Lock()


async def _open_meteo(client: httpx.AsyncClient, lat: float, lon: float) -> tuple[float | None, float | None]:
    """Fetch temperature (°C) and relative humidity (%). Uses daily max temp (expected high) for better desert/daytime representation; falls back to current. Humidity from current."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m",
        "daily": "temperature_2m_max,temperature_2m_mean",
        "timezone": "auto",
        "forecast_days": 1,
    }
    try:
        r = await client.get(url, params=params, timeout=6.0)
        r.raise_for_status()
        data = r.json()
        # Prefer daily max (expected high for the day) so desert/daytime heat is represented
        daily = data.get("daily") or {}
        max_temps = daily.get("temperature_2m_max") or []
        temp = float(max_temps[0]) if max_temps else None
        if temp is None:
            cur = data.get("current") or {}
            temp = cur.get("temperature_2m")
            temp = float(temp) if temp is not None else None
        cur = data.get("current") or {}
        humidity = cur.get("relative_humidity_2m")
        humidity = float(humidity) if humidity is not None else None
        return (temp, humidity)
    except Exception:
        return (None, None)


async def _open_elevation(client: httpx.AsyncClient, lat: float, lon: float) -> float | None:
    """Fetch elevation (m) for a point."""
    url = "https://api.open-elevation.com/api/v1/lookup"
    params = {"locations": f"{lat},{lon}"}
    try:
        r = await client.get(url, params=params, timeout=6.0)
        r.raise_for_status()
        data = r.json()
        results = data.get("results") or []
        if results:
            return float(results[0].get("elevation", 0))
        return None
    except Exception:
        return None


def _parse_soilgrids_response(data: dict) -> tuple[dict, float | None]:
    """Parse SoilGrids response; return (out dict, soc_g_kg for fallbacks)."""
    out = {"soil_tn": None, "soil_tp": None, "soil_ap": None, "soil_an": None}
    soc_g_kg = None
    props = data.get("properties") or {}
    layers = props.get("layers") or []
    for layer in layers:
        name = (layer.get("name") or "").lower()
        depths = layer.get("depths") or []
        vals = []
        for d in depths:
            values = d.get("values") or {}
            v = values.get("mean") or values.get("Q0.5")
            if v is not None:
                vals.append(float(v))
        if not vals:
            continue
        mean_val = sum(vals) / len(vals)
        if "nitrogen" in name or "n_total" in name:
            # SoilGrids N is cg/kg; mean_val/100 = g/kg. Map to training range [0.01, 0.25].
            # Training soil_TN ~0.01–0.22; 100 cg/kg ≈ 0.1 in training scale.
            raw_g_kg = mean_val / 100.0
            soil_tn = min(0.25, max(0.01, raw_g_kg * 0.12))
            out["soil_tn"] = round(soil_tn, 4)
            out["soil_an"] = round(soil_tn * 0.033, 4)  # AN/TN ~0.033 from training
        elif "soc" in name or "organic_carbon" in name:
            soc_g_kg = mean_val / 10.0
            soil_p = min(1.0, max(0.05, soc_g_kg * 0.012))
            out["soil_tp"] = round(soil_p, 4)
            out["soil_ap"] = round(soil_p * 0.95, 4)
    if out["soil_tn"] is None and soc_g_kg is not None and soc_g_kg > 0:
        # SOC g/kg; C:N ~10:1 so N ≈ soc/10 g/kg. Map to training range [0.01, 0.25].
        soil_tn_proxy = min(0.25, max(0.01, soc_g_kg * 0.002))
        out["soil_tn"] = round(soil_tn_proxy, 4)
        out["soil_an"] = round(soil_tn_proxy * 0.033, 4)
    return out, soc_g_kg


async def _soilgrids(client: httpx.AsyncClient, lat: float, lon: float) -> dict[str, float | None]:
    """Fetch SoilGrids nitrogen + SOC. Single call (5/min limit)."""
    url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    out = {"soil_tn": None, "soil_tp": None, "soil_ap": None, "soil_an": None}
    try:
        params = {"lat": lat, "lon": lon, "property": ["nitrogen", "soc"]}
        r = await client.get(url, params=params, timeout=10.0)
        r.raise_for_status()
        data = r.json()
        parsed, _ = _parse_soilgrids_response(data)
        out.update(parsed)
    except Exception:
        pass
    return out


def _climate_nitrogen_proxy(
    elevation: float | None,
    temperature: float | None,
    humidity: float | None,
) -> tuple[float, float]:
    """
    Estimate soil TN and AN from climate when SoilGrids returns null.
    Warmer/wetter → higher N (more mineralization, organic matter).
    Higher elevation → lower N (cooler, less vegetation).
    Returns (soil_tn, soil_an) in training range [0.01, 0.22].
    """
    elev = elevation if elevation is not None else MEDIANS["Elevation"]
    temp = temperature if temperature is not None else MEDIANS["Temperature"]
    humid = humidity if humidity is not None else MEDIANS["Humidity"]
    elev = max(0, min(5000, elev))
    temp = max(-20, min(50, temp))
    humid = max(0, min(100, humid))
    # Base ~0.08; +temp/humidity; -elevation. Output in training range [0.01, 0.22].
    soil_tn = 0.08 + 0.003 * (temp - 15) + 0.001 * (humid - 50) - 0.00001 * elev
    soil_tn = round(min(0.22, max(0.01, soil_tn)), 4)
    soil_an = round(soil_tn * 0.033, 4)  # AN/TN ~0.033 from training
    return (soil_tn, soil_an)


# Baseline for nitrogen amplification; factor 10 preserves gradient while making ~0.01 visible
_NITROGEN_BASELINE = 0.51
_NITROGEN_AMPLIFY = 10


def _amplify_nitrogen(raw_tn: float) -> float:
    """Amplify small nitrogen differences for visible variation; preserve gradient. Clamp to [0.1, 1.0]."""
    diff = raw_tn - _NITROGEN_BASELINE
    amplified = _NITROGEN_BASELINE + diff * _NITROGEN_AMPLIFY
    return round(min(1.0, max(0.1, amplified)), 4)


def _fire_risk_proxy(temperature: float | None, humidity: float | None) -> float:
    """Simple proxy: (1 - humidity/100) * min(1, temp/40), normalized to [0,1]."""
    if temperature is None:
        temperature = MEDIANS["Temperature"]
    if humidity is None:
        humidity = MEDIANS["Humidity"]
    h = max(0, min(100, humidity)) / 100.0
    t = max(0, min(50, temperature)) / 40.0
    raw = (1.0 - h) * min(1.0, t)
    return round(min(1.0, max(0.0, raw)), 4)


def _model_feature_dict(
    elevation: float | None,
    temperature: float | None,
    humidity: float | None,
    soil: dict[str, float | None],
    fire_risk: float,
) -> dict[str, float]:
    """Build full feature dict for the model (all 12 features)."""
    features = dict(MEDIANS)
    if elevation is not None:
        features["Elevation"] = elevation
    if temperature is not None:
        features["Temperature"] = temperature
    if humidity is not None:
        features["Humidity"] = humidity
    features["Fire_Risk_Index"] = fire_risk
    if soil.get("soil_tn") is not None:
        features["Soil_TN"] = soil["soil_tn"]
    if soil.get("soil_tp") is not None:
        features["Soil_TP"] = soil["soil_tp"]
    if soil.get("soil_ap") is not None:
        features["Soil_AP"] = soil["soil_ap"]
    if soil.get("soil_an") is not None:
        features["Soil_AN"] = soil["soil_an"]
    return features


def _source_dict(
    elevation: float | None,
    temperature: float | None,
    humidity: float | None,
    soil: dict[str, float | None],
    climate_nitrogen: bool = False,
) -> dict[str, str]:
    """Which source each feature came from: 'api', 'default', or 'proxy'."""
    source = {}
    for k in FEATURE_NAMES:
        key_lower = k.lower().replace("_", "")
        if k == "Elevation":
            source["elevation"] = "api" if elevation is not None else "default"
        elif k == "Temperature":
            source["temperature"] = "api" if temperature is not None else "default"
        elif k == "Humidity":
            source["humidity"] = "api" if humidity is not None else "default"
        elif k in ("Soil_TN", "Soil_TP", "Soil_AP", "Soil_AN"):
            sk = k.lower()
            if climate_nitrogen and k in ("Soil_TN", "Soil_AN"):
                source[sk] = "proxy"
            else:
                source[sk] = "api" if (soil.get(sk) is not None) else "default"
        elif k == "Fire_Risk_Index":
            source["fire_risk_index"] = "proxy"
        else:
            source[k.lower()] = "default"
    return source


async def fetch_features_for_point(lat: float, lon: float) -> dict:
    """
    Fetch all features for (lat, lon). Uses cache key (round(lat,2), round(lon,2)).
    Returns dict with snake_case keys for API response + 'source' map.
    """
    key = _cache_key(lat, lon)
    async with _cache_lock:
        if key in _fetch_cache:
            return _fetch_cache[key].copy()

    async with httpx.AsyncClient() as client:
        meteo_task = _open_meteo(client, lat, lon)
        elev_task = _open_elevation(client, lat, lon)
        soil_task = _soilgrids(client, lat, lon)
        (temp, humidity), elevation, soil = await asyncio.gather(meteo_task, elev_task, soil_task)

    # Climate-based nitrogen fallback when SoilGrids returns null (location-varying)
    climate_nitrogen_used = soil.get("soil_tn") is None
    if climate_nitrogen_used:
        soil["soil_tn"], soil["soil_an"] = _climate_nitrogen_proxy(elevation, temp, humidity)
    # Ensure soil_an = soil_tn * 0.033 when we have soil_tn (AN/TN from training)
    if soil.get("soil_tn") is not None:
        soil["soil_an"] = round(soil["soil_tn"] * 0.033, 4)

    fire_risk = _fire_risk_proxy(temp, humidity)
    features = _model_feature_dict(elevation, temp, humidity, soil, fire_risk)
    source = _source_dict(elevation, temp, humidity, soil, climate_nitrogen=climate_nitrogen_used)

    # Response: snake_case for JSON, plus source
    response = {
        "elevation": features["Elevation"],
        "temperature": features["Temperature"],
        "humidity": features["Humidity"],
        "soil_tn": features["Soil_TN"],
        "soil_tp": features["Soil_TP"],
        "soil_ap": features["Soil_AP"],
        "soil_an": features["Soil_AN"],
        "fire_risk_index": features["Fire_Risk_Index"],
        "slope": features["Slope"],
        "menhinick_index": features["Menhinick_Index"],
        "gleason_index": features["Gleason_Index"],
        "disturbance_level": features["Disturbance_Level"],
        "source": source,
    }

    async with _cache_lock:
        _fetch_cache[key] = response.copy()

    return response
