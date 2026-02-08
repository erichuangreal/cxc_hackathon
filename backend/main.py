"""
FastAPI app: CORS, /api/fetch-features, /api/predict.
"""
import os
import requests
from dotenv import load_dotenv
import google.generativeai as genai

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from backend.services.fetch import fetch_features_for_point
    from backend.services.predict import predict
except ImportError:
    from services.fetch import fetch_features_for_point
    from services.predict import predict

app = FastAPI(title="GrowWiseAI API", version="0.1.0")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, "..", "googlies.env")
load_dotenv(ENV_PATH)
MAPS_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _get_fetch_features_impl(lat: float, lon: float):
    """Fetch all features for a point (lat, lon). Cached by rounded coordinates."""
    try:
        result = await fetch_features_for_point(lat, lon)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/fetch-features")
async def get_fetch_features(lat: float, lon: float):
    return await _get_fetch_features_impl(lat, lon)


# Alias for Vercel (Python module names cannot use hyphens; rewrite sends /api/fetch-features here)
@app.get("/api/fetch_features")
async def get_fetch_features_alias(lat: float, lon: float):
    return await _get_fetch_features_impl(lat, lon)


class PredictRequest(BaseModel):
    features: dict


@app.post("/api/predict")
def post_predict(request: PredictRequest):
    """
    Run prediction on provided features.
    Expects keys matching model (e.g. Elevation, Temperature, ...).
    Accepts snake_case keys and normalizes to model names.
    """
    raw = request.features or {}
    # Normalize: accept both PascalCase and snake_case
    feature_map = {
        "elevation": "Elevation",
        "temperature": "Temperature",
        "humidity": "Humidity",
        "soil_tn": "Soil_TN",
        "soil_tp": "Soil_TP",
        "soil_ap": "Soil_AP",
        "soil_an": "Soil_AN",
        "fire_risk_index": "Fire_Risk_Index",
        "slope": "Slope",
        "menhinick_index": "Menhinick_Index",
        "gleason_index": "Gleason_Index",
        "disturbance_level": "Disturbance_Level",
    }
    features = dict(raw)
    for snake, pascal in feature_map.items():
        if snake in features and pascal not in features:
            features[pascal] = features[snake]
    try:
        return predict(features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/location-card")
def get_location_card(lat: float, lon: float):
    if not MAPS_KEY or not GEMINI_KEY:
        raise HTTPException(
            status_code=500,
            detail="Missing GOOGLE_MAPS_API_KEY or GEMINI_API_KEY in backend/.env"
        )

    # Places API: try nearby first (1.2 km), then fall back to 20 km
    types = ["park", "famous_natural_feature", "tourist_attraction", "well_known_green_space",
             "well_known_national_forest", "well_known_conservation_areas"]
    place = None

    for radius_m in (1200, 5_000):  # 1.2 km, then 5 km
        for t in types:
            url = (
                "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
                f"?location={lat},{lon}&radius={radius_m}&type={t}&key={MAPS_KEY}"
            )
            data = requests.get(url, timeout=10).json()
            results = data.get("results", [])
            if results:
                place = results[0]
                break
        if place is not None:
            break

    place_name = (place or {}).get("name", f"{lat:.5f}, {lon:.5f}")

    # For Gemini: describe location without coords when we have a place name
    location_for_prompt = place_name if place else "No named place found for this point."

    photos = []
    for p in (place or {}).get("photos", [])[:8]:
        ref = p.get("photo_reference")
        if ref:
            photos.append(
                "https://maps.googleapis.com/maps/api/place/photo"
                f"?maxwidth=800&photoreference={ref}&key={MAPS_KEY}"
            )

    # Gemini description: no coords in prompt or in output
    model = genai.GenerativeModel("models/gemini-2.0-flash")
    prompt = f"""
Location: {location_for_prompt}
Do not start the paragraph with "Here is a description of the location..." or anything like that.
Do not include latitude, longitude, or coordinates in your description.
Write 2-4 sentences describing the environment and list 5 common trees likely in this region as well as 3 common factors affecting this region.
Common trees: tree1, tree2, tree3, tree4, tree5
Add paragraph break here.
Common factors that may affect the trees in the future: factor1, factor2, factor3 (don't use ands in each factor)
"""
    resp = model.generate_content(prompt)
    description = getattr(resp, "text", None) or str(resp)

    return {
        "lat": lat,
        "lon": lon,
        "placeName": place_name,
        "photos": photos,
        "description": description,
    }

