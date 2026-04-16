# Cortex Arena: AI Crowd Orchestration System

Cortex Arena is a predictive crowd management platform designed for large-scale sporting and entertainment venues. It leverages real-time simulation and autonomous AI orchestration to improve attendee movement, safety, and overall venue experience.

## Chosen Vertical
The system is tailored for the Sports and Large-Scale Venue vertical. It addresses the unique challenges of high-density spikes common in stadiums, such as halftime rushes, goal-scoring celebrations, and synchronized mass exits.

## Platform Showcase

### Interactive Cortex Assistant
The Cortex Assistant is a real-time AI concierge that provides attendees with navigation guidance and facility information based on live stadium congestion.

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/56deb181-5e19-4612-9c15-ed39a5dc15fc" />


### Dynamic Operator Interface
The dashboard provides a high-fidelity visual representation of stadium topology, featuring predictive density heatmaps and an autonomous AI Orchestrator console for real-time crowd management.

<img width="1920" height="1080" alt="Screenshot (1401)" src="https://github.com/user-attachments/assets/f2ef3e0e-383e-4ab7-844a-80cf5e8ff541" />
<img width="1920" height="1080" alt="Screenshot (1402)" src="https://github.com/user-attachments/assets/29945ab1-1e6b-4387-8d9d-2b55bc3336f5" />


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
Cortex Arena is deployed on Google Cloud Run using a containerized, serverless architecture.

- Frontend (Next.js) and Backend (FastAPI) are deployed as separate services
- Real-time communication is handled via secure HTTP and WebSocket (WSS)
- Environment variables (e.g., GOOGLE_API_KEY) are managed securely through Cloud Run

### Live Application
Access the platform here:
https://cortex-frontend-263130631276.asia-south1.run.app

### Prerequisites (For Local Development)
- Google AI API Key (Set as `GOOGLE_API_KEY` in `.env`)
- Python 3.11+
- Node.js 20+

### To run locally:
1. From the root directory, run: `docker-compose up`
2. Access the dashboard at http://localhost:3000
3. Access the API documentation at http://localhost:8000/docs
