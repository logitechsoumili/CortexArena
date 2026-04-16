from .simulation_engine import SimulationEngine
from .schemas import Zone, FlowArrow
import os
import threading
from google import genai


class Orchestrator:
    def __init__(self, engine: SimulationEngine):
        self.engine = engine
        self.active_interventions: set = set()
        
        # Initialize Gemini
        api_key = os.getenv("GOOGLE_API_KEY")
        self.gemini_active = False
        if api_key:
            try:
                self.client = genai.Client(api_key=api_key)
                self.gemini_active = True
            except Exception as e:
                print(f"Gemini init failed: {e}")

    def run_cycle(self):
        """Monitor simulation and make decisions. Skips actions in manual mode."""
        if self.engine.ai_mode == "manual":
            return
        self._check_congestion()
        self._balance_load()
        self._predictive_alerts()
        
        # Periodic high-level AI insight (every 40 ticks ~ 1.5 min)
        if self.gemini_active and self.engine.tick % 40 == 0:
            threading.Thread(target=self._generate_gemini_insight).start()

    # ── Congestion Detection + Response ──
    def _check_congestion(self):
        for zone in self.engine.zones.values():
            zone_id = zone.id
            density = zone.occupancy / zone.capacity if zone.capacity > 0 else 0

            if zone.status == "critical" and zone_id not in self.active_interventions:
                self.active_interventions.add(zone_id)
                # TRIGGER log
                self.engine.add_log(
                    f"TRIGGER: {zone.name} exceeded 90% capacity ({int(density*100)}%). Threshold breach detected.",
                    level="warning",
                    category="trigger",
                )
                # ACTION
                impact = self._apply_redirection(zone)
                if impact:
                    # IMPACT log
                    self.engine.add_log(
                        f"IMPACT: Expected to reduce congestion in {impact} zone(s) within 30s.",
                        level="info",
                        category="impact",
                    )

            elif zone.status == "nominal" and zone_id in self.active_interventions:
                self.active_interventions.remove(zone_id)
                self.engine.add_log(
                    f"RESOLVED: {zone.name} stabilized at {int(density*100)}%. Resuming standard operations.",
                    level="success",
                    category="resolved",
                )

    def _apply_redirection(self, congested_zone: Zone) -> int:
        neighbors = [self.engine.zones[n_id] for n_id in congested_zone.neighbors]
        best = min(neighbors, key=lambda z: z.occupancy)

        if best.density < 0.6:
            transfer = int(congested_zone.occupancy * 0.15)
            congested_zone.occupancy -= transfer
            best.occupancy += transfer

            self.engine.add_log(
                f"ACTION: Redirecting {transfer} attendees from {congested_zone.id} → {best.id} via digital signage.",
                level="info",
                category="action",
            )

            # Record flow arrow
            self.engine.flow_arrows.append(
                FlowArrow(
                    from_zone=congested_zone.id,
                    to_zone=best.id,
                    intensity=min(1.0, transfer / 200),
                )
            )
            return 2  # estimated zones impacted
        return 0

    # ── Aggregate Load Balancing ──
    def _balance_load(self):
        congested_count = sum(
            1 for z in self.engine.zones.values() if z.status == "congested"
        )
        if congested_count > 4:
            self.engine.add_log(
                f"TRIGGER: Aggregate congestion high ({congested_count} zones). Opening all auxiliary exits.",
                level="warning",
                category="trigger",
            )
            self.engine.add_log(
                f"ACTION: Auxiliary exit protocol activated. Distributing flow across perimeter gates.",
                level="info",
                category="action",
            )

    # ── Predictive Warnings ──
    def _predictive_alerts(self):
        """Alert operators about future congestion from predictions."""
        if self.engine.tick % 5 != 0:
            return  # Only check every 5 ticks to avoid log spam

        for zone in self.engine.zones.values():
            if zone.status == "nominal" and zone.predicted_status in ["congested", "critical"]:
                pred_density = zone.predicted_occupancy / zone.capacity if zone.capacity > 0 else 0
                self.engine.add_log(
                    f"PREDICTION: {zone.name} expected to reach {int(pred_density*100)}% in ~90s. Pre-emptive action queued.",
                    level="warning",
                    category="trigger",
                )
                # Pre-emptive mild redirection
                neighbors = [self.engine.zones[n_id] for n_id in zone.neighbors]
                best = min(neighbors, key=lambda z: z.occupancy)
                if best.density < 0.5:
                    transfer = int(zone.occupancy * 0.05)
                    zone.occupancy -= transfer
                    best.occupancy += transfer
                    self.engine.add_log(
                        f"ACTION: Pre-emptive redirect of {transfer} attendees from {zone.id} → {best.id}.",
                        level="info",
                        category="action",
                    )
                    self.engine.flow_arrows.append(
                        FlowArrow(from_zone=zone.id, to_zone=best.id, intensity=0.3)
                    )

    # ── Gemini Insights (Supplementary) ──
    def _generate_gemini_insight(self):
        """Generate high-level situational analysis using Gemini."""
        try:
            # Prepare a concise summary for Gemini
            high_density_zones = [
                f"{z.name} ({int(z.density*100)}%)" 
                for z in self.engine.zones.values() if z.density > 0.7
            ]
            
            prompt = f"""
            You are the "Cortex AI" stadium orchestrator. 
            Current Scenario: {self.engine.current_scenario}
            Congested Zones: {', '.join(high_density_zones) if high_density_zones else 'None'}
            Overall Efficiency: {self.engine.get_state().kpis.avg_flow_efficiency}%
            
            Provide ONE brief (15-20 words) high-level situational insight OR explanation 
            for the current stadium state. Focus on crowd psychology or strategic flow.
            Start the response with "AI INSIGHT: "
            """
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            insight_text = response.text.strip()
            
            # Label strictly as AI INSIGHT
            if not insight_text.startswith("AI INSIGHT:"):
                insight_text = f"AI INSIGHT: {insight_text}"
                
            self.engine.add_log(
                insight_text,
                level="info",
                category="ai_insight"
            )
        except Exception as e:
            print(f"Gemini insight error: {e}")
