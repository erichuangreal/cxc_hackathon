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


@app.get("/api/fetch-features")
async def get_fetch_features(lat: float, lon: float):
    """Fetch all features for a point (lat, lon). Cached by rounded coordinates."""
    try:
        result = await fetch_features_for_point(lat, lon)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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

    #PlacesAPI Description
    types = ["park", "natural_feature", "tourist_attraction"]
    place = None

    for t in types:
        url = (
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
            f"?location={lat},{lon}&radius=1200&type={t}&key={MAPS_KEY}"
        )
        data = requests.get(url, timeout=10).json()
        results = data.get("results", [])
        if results:
            place = results[0]
            break

    place_name = (place or {}).get("name", "this area")

    photos = []
    for p in (place or {}).get("photos", [])[:8]:
        ref = p.get("photo_reference")
        if ref:
            photos.append(
                "https://maps.googleapis.com/maps/api/place/photo"
                f"?maxwidth=800&photoreference={ref}&key={MAPS_KEY}"
            )

    #Gemini Description
    model = genai.GenerativeModel("models/gemini-2.0-flash")
    prompt = f"""
Location: lat {lat}, lon {lon}. Nearby place: {place_name}.
Write 2-4 sentences describing the environment and list 5 common trees likely in this region as well as 3 common factors affecting this region.
Common trees: tree1, tree2, tree3, tree4, tree5
Common factors that may affect the trees in the future: factor1, factor2, factor3
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

