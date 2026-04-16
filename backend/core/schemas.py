from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class Zone(BaseModel):
    id: str
    name: str
    capacity: int
    occupancy: int
    type: str  # 'seating', 'concourse', 'gate', 'facility'
    status: str = "nominal"
    neighbors: List[str] = []
    predicted_status: str = "nominal"
    predicted_occupancy: int = 0
    wait_time: float = 0  # in minutes

    @property
    def density(self) -> float:
        return self.occupancy / self.capacity if self.capacity > 0 else 0


class OrchestratorLog(BaseModel):
    timestamp: str
    message: str
    level: str = "info"  # info, warning, success, action, alert
    category: str = "system"  # trigger, action, impact, resolved, mode


class ImpactDelta(BaseModel):
    efficiency_before: float = 0
    efficiency_after: float = 0
    efficiency_delta: float = 0
    congestion_before: int = 0
    congestion_after: int = 0
    congestion_delta: int = 0


class StadiumKPIs(BaseModel):
    total_occupancy: int
    congestion_count: int
    avg_flow_efficiency: float
    system_status: str
    prediction_confidence: float = 85.0
    avg_wait_time: float = 0  # in minutes
    impact: ImpactDelta = ImpactDelta()


class FlowArrow(BaseModel):
    from_zone: str
    to_zone: str
    intensity: float = 0.5  # 0-1


class StadiumState(BaseModel):
    zones: List[Zone]
    logs: List[OrchestratorLog]
    kpis: StadiumKPIs
    current_scenario: str
    ai_mode: str = "autonomous"  # "autonomous" | "manual"
    flow_arrows: List[FlowArrow] = []
