# Cortex Arena: AI Crowd Orchestration System

**Cortex Arena** is a predictive, decision-grade AI platform designed to improve the physical event experience at large-scale venues (stadiums, arenas, conventions). By leveraging real-time crowd simulation and autonomous AI orchestration, it addresses congestion, waiting times, and safety coordination.

## 🏟 Features
- **Predictive Dashboards**: Real-time visualization of crowd density and flow.
- **AI Orchestration**: Autonomous scenario management (Halftime Surge, Exit Rush, Goal Spikes).
- **Wait Time Analytics**: Exponential wait time modeling based on zone congestion.
- **Attendee-Centric Navigation**: Personalized views for venue attendees to minimize friction.
- **Digital Signage Integration**: Simulated coordination via flow redirects.

## 🚀 Getting Started

### Local Development

#### Backend (FastAPI)
1. Navigate to `backend/`
2. Install dependencies: `pip install -r requirements.txt`
3. Start the server: `uvicorn main:app --reload`
   - API will be available at `http://localhost:8000`
   - WebSocket at `ws://localhost:8000/ws/simulation`

#### Frontend (Next.js)
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
   - Dashboard will be available at `http://localhost:3000`

### 🐳 Docker Deployment (Google Cloud Run)
The system is optimized for containerized deployment on Google Cloud Run.

#### Build and Run Locally
```bash
# Build Backend
docker build -t cortex-backend -f backend/Dockerfile ./backend

# Build Frontend
docker build -t cortex-frontend -f frontend/Dockerfile ./frontend

# Run with Docker Compose
docker-compose up
```

## 🧠 Technology Stack
- **Backend**: Python 3.12, FastAPI, Pydantic, WebSockets.
- **Frontend**: Next.js 15+, TailwindCSS, Framer Motion, Lucide Icons.
- **Simulation**: Custom vector-based crowd dynamics engine with exponential wait time modeling.

## 📜 License
© 2026 Cortex Arena Dynamics Corp. All Rights Reserved.
