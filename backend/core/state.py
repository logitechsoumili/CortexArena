from .simulation_engine import SimulationEngine
from .orchestrator import Orchestrator

# Singleton state for the application
engine = SimulationEngine()
orchestrator = Orchestrator(engine)
