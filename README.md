# Cortex Arena: AI Crowd Orchestration System

Cortex Arena is a predictive crowd management platform designed for large-scale sporting and entertainment venues. It leverages real-time simulation and autonomous AI orchestration to improve attendee movement, safety, and overall venue experience.

## Chosen Vertical
The system is tailored for the Sports and Large-Scale Venue vertical. It addresses the unique challenges of high-density spikes common in stadiums, such as halftime rushes, goal-scoring celebrations, and synchronized mass exits.

## Approach and Logic
The platform is built on a multi-layer architecture combining deterministic logic with generative intelligence:

1. Backend (Python/FastAPI):
- The core logic resides in a custom-built Simulation Engine that models crowd dynamics across 24 distinct stadium zones.
- An AI Orchestrator acts as the "brain," monitoring zone densities and triggering interventions when thresholds are breached.
- Supplementary Intelligence: A Google Gemini integration provides high-level situational insights, explaining crowd behavior patterns in the operator console.
- Logic follows a reactive and predictive pattern: the system projects density trends 90 seconds into the future and applies pre-emptive logic to mitigate forecasted bottlenecks.

2. Frontend (Next.js/React):
- A websocket-driven dashboard provides sub-second latency updates from the simulation.
- Visual elements (Flow Arrows, Heatmaps) use Framer Motion for high-fidelity animations, ensuring that operators and attendees see smooth transitions.
- Interactive Concierge: A holographic chat assistant powered by Gemini allows attendees to query the system for facilities and navigation.

## How the Solution Works
The system manages crowd flow through four primary mechanisms:

1. Real-Time Monitoring:
- Every zone tracks its capacity and occupancy. Statuses are categorized as Nominal (<75%), Congested (75-90%), and Critical (>90%).
- Wait times are calculated using an exponential growth function based on density.

2. Autonomous Interventions:
- When a zone hits Critical status, the AI Orchestrator automatically triggers "Digital Signage Redirects."
- The logic identifies the least crowded neighboring zone and reroutes traffic, visualized by intensity-weighted flow arrows.

3. Situational AI Insights:
- The system analyzes aggregate stadium metrics to provide "AI INSIGHT" logs in the console. These insights explain the *why* behind crowd movements and suggest long-term strategic adjustments.

4. Interactive AI Assistant:
- A floating chat assistant (Cortex Assistant) helps attendees find amenities like washrooms, food stalls, and exits.
- It provides live recommendations based on current zone traffic, directing users to the least crowded facilities in real-time.

## Assumptions Made
During the design and implementation of Cortex Arena, the following assumptions were made:

- High Compliance: The model assumes that a significant percentage of attendees will follow digital signage and AI-guided recommendations once alerted.
- Homogeneous Movement: The simulation assumes attendees move at a consistent average speed unless slowed down by physical density.
- Network Reliability: The solution assumes consistent WebSocket connectivity throughout the venue for real-time telemetry.
- Static Infrastructure: The stadium layout is assumed to be fixed for the duration of the event.

## Deployment
The project is containerized using Docker and is configured for deployment on Google Cloud Run.

### Prerequisites
- Google AI API Key (Set as `GOOGLE_API_KEY` in `.env`)
- Python 3.11+
- Node.js 20+

### To run locally:
1. From the root directory, run: `docker-compose up`
2. Access the dashboard at http://localhost:3000
3. Access the API documentation at http://localhost:8000/docs
