import random
import copy
from typing import List, Dict
from collections import deque
from datetime import datetime
from .schemas import Zone, OrchestratorLog, StadiumKPIs, StadiumState, ImpactDelta, FlowArrow


class SimulationEngine:
    def __init__(self):
        self.zones: Dict[str, Zone] = {}
        self.logs: List[OrchestratorLog] = []
        self.current_scenario = "Steady State"
        self.ai_mode = "autonomous"  # "autonomous" | "manual"
        self.flow_arrows: List[FlowArrow] = []
        self.tick = 0

        # History for prediction confidence (last 10 density snapshots)
        self._density_history: deque = deque(maxlen=12)
        # Impact tracking
        self._prev_efficiency = 0.0
        self._prev_congestion = 0

        self._initialize_stadium()

    def _initialize_stadium(self):
        sectors = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
        rings = [
            ("inner", 500),
            ("outer", 1000),
            ("concourse", 1500),
        ]

        for ring_name, capacity in rings:
            for sector in sectors:
                zone_id = f"{sector}_{ring_name}"
                occ = int(capacity * random.uniform(0.3, 0.6))
                self.zones[zone_id] = Zone(
                    id=zone_id,
                    name=f"{sector} Sector - {ring_name.capitalize()}",
                    capacity=capacity,
                    occupancy=occ,
                    predicted_occupancy=occ,
                    type=ring_name,
                )

        for sector_idx, sector in enumerate(sectors):
            prev_sector = sectors[(sector_idx - 1) % len(sectors)]
            next_sector = sectors[(sector_idx + 1) % len(sectors)]

            for ring_name, _ in rings:
                zone_id = f"{sector}_{ring_name}"
                self.zones[zone_id].neighbors.extend(
                    [f"{prev_sector}_{ring_name}", f"{next_sector}_{ring_name}"]
                )

            self.zones[f"{sector}_inner"].neighbors.append(f"{sector}_outer")
            self.zones[f"{sector}_outer"].neighbors.extend(
                [f"{sector}_inner", f"{sector}_concourse"]
            )
            self.zones[f"{sector}_concourse"].neighbors.append(f"{sector}_outer")

    # ────────────────── Step ──────────────────
    def step(self):
        self.tick += 1
        new_occ = {z_id: z.occupancy for z_id, z in self.zones.items()}

        if self.current_scenario == "Halftime Surge":
            for z_id, zone in self.zones.items():
                if zone.type in ["inner", "outer"] and zone.occupancy > 10:
                    target = f"{z_id.split('_')[0]}_concourse"
                    transfer = int(zone.occupancy * 0.05)
                    new_occ[z_id] -= transfer
                    new_occ[target] += transfer

        elif self.current_scenario == "Exit Rush":
            for z_id, zone in self.zones.items():
                if zone.type in ["inner", "outer"] and zone.occupancy > 10:
                    target = f"{z_id.split('_')[0]}_concourse"
                    transfer = int(zone.occupancy * 0.1)
                    new_occ[z_id] -= transfer
                    new_occ[target] += transfer
                elif zone.type == "concourse":
                    leave = int(zone.occupancy * 0.08)
                    new_occ[z_id] -= leave

        elif self.current_scenario == "Goal Spike":
            for sector in ["N", "S"]:
                z_id = f"{sector}_inner"
                new_occ[z_id] = min(
                    self.zones[z_id].capacity, new_occ[z_id] + 50
                )

        # Apply with noise
        for z_id, zone in self.zones.items():
            noise = random.randint(-5, 5)
            self.zones[z_id].occupancy = max(
                0, min(zone.capacity + 200, new_occ[z_id] + noise)
            )
            d = self.zones[z_id].occupancy / self.zones[z_id].capacity if self.zones[z_id].capacity > 0 else 0
            if d > 0.9:
                self.zones[z_id].status = "critical"
            elif d > 0.75:
                self.zones[z_id].status = "congested"
            else:
                self.zones[z_id].status = "nominal"
            
            # Exponential Wait Time Calculation
            self.zones[z_id].wait_time = self._calculate_zone_wait_time(self.zones[z_id])

        # Save density snapshot for confidence calc
        snap = {z_id: z.occupancy / z.capacity if z.capacity > 0 else 0 for z_id, z in self.zones.items()}
        self._density_history.append(snap)

        # Run prediction
        self._run_prediction()

    # ────────────────── Prediction ──────────────────
    def _run_prediction(self):
        """Project densities ~90-120s ahead using current rates."""
        if len(self._density_history) < 3:
            for z_id, zone in self.zones.items():
                zone.predicted_occupancy = zone.occupancy
                zone.predicted_status = zone.status
            return

        steps_ahead = 90  # seconds / tick_rate ≈ 90 ticks projection
        # Use simple linear extrapolation from recent 4 snapshots
        recent = list(self._density_history)[-4:]
        for z_id, zone in self.zones.items():
            densities = [s.get(z_id, 0) for s in recent]
            if len(densities) >= 2:
                avg_rate = (densities[-1] - densities[0]) / len(densities)
                projected_density = densities[-1] + avg_rate * min(steps_ahead, 10)
                projected_density = max(0, min(1.3, projected_density))
            else:
                projected_density = densities[-1]

            pred_occ = int(projected_density * zone.capacity)
            zone.predicted_occupancy = min(zone.capacity + 200, max(0, pred_occ))

            if projected_density > 0.9:
                zone.predicted_status = "critical"
            elif projected_density > 0.75:
                zone.predicted_status = "congested"
            else:
                zone.predicted_status = "nominal"

    # ────────────────── Prediction Confidence ──────────────────
    def get_prediction_confidence(self) -> float:
        if len(self._density_history) < 3:
            return 50.0
        recent = list(self._density_history)[-6:]
        variances = []
        for z_id in self.zones:
            vals = [s.get(z_id, 0) for s in recent]
            if len(vals) >= 2:
                mean = sum(vals) / len(vals)
                var = sum((v - mean) ** 2 for v in vals) / len(vals)
                variances.append(var)
        avg_var = sum(variances) / len(variances) if variances else 0
        confidence = max(40, min(98, 95 - avg_var * 500))
        return round(confidence, 1)

    def _calculate_zone_wait_time(self, zone: Zone) -> float:
        import math
        if zone.type == "inner" or zone.type == "outer":
            return 0.0 # Seats have no wait time
        
        # Base wait time for concourse/gates
        base = 2.0
        # Exponential growth: wait = base + factor * exp(density * 3)
        # 0.5 density -> ~2 + 1 * 4.4 = 6.4 min
        # 0.9 density -> ~2 + 1 * 14.8 = 16.8 min
        # 1.1 density -> ~2 + 1 * 27.1 = 29.1 min
        wait = base + (1.5 * math.exp(zone.density * 2.8))
        return round(wait, 1)

    # ────────────────── State ──────────────────
    def get_state(self) -> StadiumState:
        total_occ = sum(z.occupancy for z in self.zones.values())
        congestion_count = sum(
            1 for z in self.zones.values() if z.status in ["critical", "congested"]
        )
        efficiency = (
            1.0 - (congestion_count / len(self.zones)) if self.zones else 1.0
        )
        eff_pct = round(efficiency * 100, 1)

        impact = ImpactDelta(
            efficiency_before=self._prev_efficiency,
            efficiency_after=eff_pct,
            efficiency_delta=round(eff_pct - self._prev_efficiency, 1),
            congestion_before=self._prev_congestion,
            congestion_after=congestion_count,
            congestion_delta=congestion_count - self._prev_congestion,
        )
        self._prev_efficiency = eff_pct
        self._prev_congestion = congestion_count

        kpis = StadiumKPIs(
            total_occupancy=total_occ,
            congestion_count=congestion_count,
            avg_flow_efficiency=eff_pct,
            system_status=(
                "OPTIMAL" if congestion_count == 0
                else "CAUTION" if congestion_count < 3
                else "HEAVILY CONGESTED"
            ),
            prediction_confidence=self.get_prediction_confidence(),
            avg_wait_time=round(sum(z.wait_time for z in self.zones.values() if z.wait_time > 0) / 
                               max(1, sum(1 for z in self.zones.values() if z.wait_time > 0)), 1),
            impact=impact,
        )

        return StadiumState(
            zones=list(self.zones.values()),
            logs=self.logs[-15:],
            kpis=kpis,
            current_scenario=self.current_scenario,
            ai_mode=self.ai_mode,
            flow_arrows=self.flow_arrows[-8:],
        )

    def add_log(self, message: str, level: str = "info", category: str = "system"):
        self.logs.append(
            OrchestratorLog(
                timestamp=datetime.now().strftime("%H:%M:%S"),
                message=message,
                level=level,
                category=category,
            )
        )
