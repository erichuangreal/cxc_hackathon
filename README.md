# cxc_hackathon

## Backend

From project root:
```bash
python3 -m venv venv
source venv/bin/activate   
pip install requests python-dotenv google-generativeai
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8002
```
API runs at `http://localhost:8002`.

## Frontend

From project root:
```bash
cd frontend
npm install
npm run dev
```
App runs at `http://localhost:5173` and proxies `/api` to the backend.

source: https://www.kaggle.com/datasets/ziya07/forest-health-and-ecological-diversity

Independent variables
- elevation
- temperature
- humidity
- total nitrogen (Soil_TN)
- total phosphorus (Soil_TP)
- fire_risk_index

Dependent variables
- health_status
