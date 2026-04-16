import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from core.simulation_engine import SimulationEngine
from core.orchestrator import Orchestrator
from api.websocket_manager import manager
from core.facilities import get_facility_status
from pydantic import BaseModel
from google import genai

app = FastAPI(title="Cortex Arena API")

# CORS – set ALLOWED_ORIGINS env var to restrict in production
# e.g. ALLOWED_ORIGINS=https://frontend-xyz.run.app
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
cors_origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global simulation state
engine = SimulationEngine()
orchestrator = Orchestrator(engine)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(run_simulation())


async def run_simulation():
    while True:
        engine.step()
        orchestrator.run_cycle()
        state = engine.get_state().dict()
        await manager.broadcast(state)
        await asyncio.sleep(1.0)


@app.websocket("/ws/simulation")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.post("/simulate/{scenario}")
async def set_scenario(scenario: str):
    scenarios = {
        "steady": "Steady State",
        "halftime": "Halftime Surge",
        "goal": "Goal Spike",
        "exit": "Exit Rush",
    }

    if scenario in scenarios:
        engine.current_scenario = scenarios[scenario]
        engine.add_log(
            f"MANUAL OVERRIDE: Scenario changed to {engine.current_scenario}",
            level="info",
            category="action",
        )
        return {"status": "success", "current": engine.current_scenario}
    return {"status": "error", "message": "Invalid scenario"}


@app.post("/mode/{mode}")
async def set_mode(mode: str):
    if mode in ("autonomous", "manual"):
        old = engine.ai_mode
        engine.ai_mode = mode
        if mode == "manual":
            engine.add_log(
                "MODE CHANGE: AI switched to MANUAL. Orchestrator interventions disabled.",
                level="warning",
                category="mode",
            )
        else:
            engine.add_log(
                "MODE CHANGE: AI switched to AUTONOMOUS. Orchestrator re-engaged.",
                level="success",
                category="mode",
            )
        return {"status": "success", "mode": mode}
    return {"status": "error", "message": "Invalid mode. Use 'autonomous' or 'manual'."}


@app.get("/health")
def health():
    return {"status": "alive", "engine": "running", "mode": engine.ai_mode}


class ChatRequest(BaseModel):
    message: str


@app.post("/api/chat")
async def chat(request: ChatRequest):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return {"response": "I'm sorry, my neural uplink is currently offline. Please configure a Google API Key."}

    try:
        # 1. Gather real-time context
        food_status = get_facility_status("food", engine.zones)
        washroom_status = get_facility_status("washroom", engine.zones)
        exit_status = get_facility_status("exit", engine.zones)

        # 2. Build Prompt
        prompt = f"""
        You are the 'Cortex Arena' AI Concierge. Use the current stadium telemetry below 
        to answer the user's question accurately. 
        Current Scenario: {engine.current_scenario}
        
        FACILITY DATA (Name | Zone | Density):
        - WASHROOMS: {", ".join([f"{f['name']} ({f['density']*100}%)" for f in washroom_status])}
        - FOOD STANDS: {", ".join([f"{f['name']} ({f['density']*100}%)" for f in food_status])}
        - EXITS: {", ".join([f"{f['name']} ({f['density']*100}%)" for f in exit_status])}

        RULES:
        - Be concise and professional. Use a slightly futuristic 'Cortex AI' tone.
        - Recommend the LOWEST DENSITY facility when asked for 'nearest' or 'best' option.
        - If a zone is 'critical' (>90%), advise the user to avoid it for their safety and comfort.

        USER QUESTION: {request.message}
        """

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return {"response": response.text.strip()}

    except Exception as e:
        print(f"Chat error: {e}")
        return {"response": "System error. My diagnostics indicate a connection interruption."}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
