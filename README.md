# Cortex Arena: AI Crowd Orchestration System

Cortex Arena is a predictive crowd management platform designed for large-scale sporting and entertainment venues. It leverages real-time simulation and autonomous AI orchestration to improve attendee movement, safety, and overall venue experience.

## Chosen Vertical
The system is tailored for the Sports and Large-Scale Venue vertical. It addresses the unique challenges of high-density spikes common in stadiums, such as halftime rushes, goal-scoring celebrations, and synchronized mass exits.

## Approach and Logic
The platform is built on a dual-layer architecture:

1. Backend (Python/FastAPI):
- The core logic resides in a custom-built Simulation Engine that models crowd dynamics across 24 distinct stadium zones.
- An AI Orchestrator acts as the "brain," monitoring zone densities and triggering interventions when thresholds are breached.
- Logic follows a reactive and predictive pattern: the system projects density trends 90 seconds into the future (linear extrapolation) and applies pre-emptive logic to mitigate forecasted bottlenecks.

2. Frontend (Next.js/React):
- A websocket-driven dashboard provides sub-second latency updates from the simulation.
- Visual elements (Flow Arrows, Heatmaps) use Framer Motion for high-fidelity animations, ensuring that operators and attendees see smooth transitions rather than jarring state changes.

## How the Solution Works
The system manages crowd flow through three primary mechanisms:

1. Real-Time Monitoring:
- Every zone tracks its capacity and occupancy. Statuses are categorized as Nominal (<75%), Congested (75-90%), and Critical (>90%).
- Wait times are calculated using an exponential growth function. As density increases, wait times spike non-linearly to reflect the physics of crowd bottlenecks.

2. Autonomous Interventions:
- When a zone hits Critical status, the AI Orchestrator automatically triggers "Digital Signage Redirects."
- The logic identifies the least crowded neighboring zone and reroutes traffic, visualized in the UI by intensity-weighted flow arrows.

3. Attendee Guidance (Guide View):
- A specialized view for venue visitors provides personalized "Optimal Exit Routes" and "Least Crowded Zone" recommendations, translating complex stadium data into actionable instructions.

## Assumptions Made
During the design and implementation of Cortex Arena, the following assumptions were made:

- High Compliance: The model assumes that a significant percentage of attendees will follow digital signage and AI-guided recommendations once alerted.
- Homogeneous Movement: The simulation assumes attendees move at a consistent average speed unless slowed down by physical density (exponential wait-time logic).
- Network Reliability: The solution assumes consistent WebSocket connectivity throughout the venue for real-time telemetry.
- Static Infrastructure: The stadium layout (Inner, Outer, and Concourse rings) is assumed to be fixed for the duration of the event.

## Deployment
The project is containerized using Docker and is configured for deployment on Google Cloud Run.

To run locally:
1. From the root directory, run: docker-compose up
2. Access the dashboard at http://localhost:3000
3. Access the API documentation at http://localhost:8000/docs
