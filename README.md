# Cortex Arena: AI Crowd Orchestration System

Cortex Arena is a predictive crowd management platform designed for large-scale sporting and entertainment venues. It leverages real-time simulation and autonomous AI orchestration to improve attendee movement, safety, and overall venue experience.

## Chosen Vertical
The system is tailored for the Sports and Large-Scale Venue vertical. It addresses the unique challenges of high-density spikes common in stadiums, such as halftime rushes, goal-scoring celebrations, and synchronized mass exits.

## Platform Showcase

### Interactive Cortex Assistant
The Cortex Assistant is a real-time AI concierge that provides attendees with navigation guidance and facility information based on live stadium congestion.

![Cortex Assistant Placeholder](path/to/chatbot_screenshot.png)

### Dynamic Operator Interface
The dashboard provides a high-fidelity visual representation of stadium topology, featuring predictive density heatmaps and an autonomous AI Orchestrator console for real-time crowd management.

![Dashboard Interface Placeholder](path/to/interface_screenshot.png)

## Approach and Logic
The platform is built on a multi-layer architecture combining deterministic logic with generative intelligence:

1. Backend (Python/FastAPI):
- **Simulation Engine**: A custom-built engine modeling crowd dynamics across 24 distinct stadium zones.
- **AI Orchestrator**: Monitors zone densities and triggers interventions. Now features an **Autonomous/Manual toggle** for intervention control.
- **Predictive Analytics**: The system projects density trends 90 seconds into the future, allowing for pre-emptive bottlenecks mitigation.
- **Gemini Optimization**: Integrated **Gemini Flash Lite** with a global cooldown and response caching to ensure high reliability and mitigate rate limits (429 errors).

2. Frontend (Next.js/React):
- **Real-Time Telemetry**: Websocket-driven dashboard providing sub-second latency updates.
- **Visual Fidelity**: Uses Framer Motion for smooth transitions in flow arrows and heatmaps.
- **Guidance System**: Real-time attendee routing via digital signage and the interactive concierge.

## How the Solution Works
The system manages crowd flow through four primary mechanisms:

1. **Real-Time Monitoring**:
- Tracks capacity and occupancy across all zones (Nominal, Congested, Critical).
- Impact metrics include Total Occupancy, Congested Zones, Flow Efficiency, and Avg. Wait Time.

2. **Autonomous Interventions**:
- Automatically triggers redirects when zones hit critical thresholds.
- Identifies the least crowded neighboring zones to reroute traffic effectively.

3. **Situational AI Insights**:
- Provides high-level situational awareness logs, explaining the *why* behind automated actions.

4. **Reliability Layer**:
- Implements a robust backend with retry logic, fallbacks, and cost-efficient LLM utilization.

## Assumptions Made
During the design and implementation of Cortex Arena, the following assumptions were made:
- High Compliance: Attendees follow digital signage and AI-guided recommendations.
- Network Reliability: Consistent WebSocket connectivity for real-time telemetry.
- Static Infrastructure: Fixed stadium layout during the event duration.

## Deployment
The project is containerized using Docker and is successfully **deployed on Google Cloud Run**.

### Live Access
The platform is accessible via the Cloud Run endpoints for both the frontend dashboard and backend API services.

### Prerequisites (For Local Development)
- Google AI API Key (Set as `GOOGLE_API_KEY` in `.env`)
- Python 3.11+
- Node.js 20+

### To run locally:
1. From the root directory, run: `docker-compose up`
2. Access the dashboard at http://localhost:3000
3. Access the API documentation at http://localhost:8000/docs
