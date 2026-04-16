import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from api.websocket_manager import manager
from core.state import engine, orchestrator
from api.chat_routes import router as chat_router

app = FastAPI(title="Cortex Arena API")

# CORS – set ALLOWED_ORIGINS env var to restrict in production
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
cors_origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register specialized routes
app.include_router(chat_router, prefix="/api")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
