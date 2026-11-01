from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="FitPilot AI", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], allow_methods=["GET"], allow_headers=["*"])

@app.get('/health')
def health():
    return {"status": "ok", "service": "FitPilot AI", "day": 1, "analysis_mode": "local_cli"}

@app.get('/api/features')
def features():
    return {"pose_analysis": "cli_prototype", "teaching_library": "planned", "training_plan": "planned", "calories": "planned"}
