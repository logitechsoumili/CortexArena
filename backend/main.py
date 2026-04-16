import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from core.simulation_engine import SimulationEngine
from core.orchestrator import Orchestrator
from api.websocket_manager import manager

app = FastAPI(title="Cortex Arena API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
