"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Shield, Users, BarChart3, Radio,
  Hexagon, Satellite, Eye, UserCircle, Brain,
  Hand, ArrowUpRight, ArrowDownRight,
  Timer, Gauge, Clock
} from "lucide-react";
import StadiumMap from "@/components/StadiumMap";
import AIConsole from "@/components/AIConsole";
import ControlPanel from "@/components/ControlPanel";
import UserInsights from "@/components/UserInsights";

/* ═══════════ Animated Counter ═══════════ */
function useAnimatedValue(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>(0);
  const fromRef = useRef<number>(target);

  useEffect(() => {
    const from = fromRef.current;
    const diff = target - from;
    if (Math.abs(diff) < 0.5) { fromRef.current = target; setDisplay(target); return; }

    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round((from + diff * eased) * 10) / 10;
      setDisplay(current);
      if (progress < 1) { rafRef.current = requestAnimationFrame(animate); }
      else { fromRef.current = target; }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}

/* ═══════════ Status Badge ═══════════ */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; glow: string }> = {
    OPTIMAL: { color: "text-emerald-400", bg: "bg-emerald-500/15", glow: "0 0 12px rgba(16,185,129,0.3)" },
    CAUTION: { color: "text-amber-400", bg: "bg-amber-500/15", glow: "0 0 12px rgba(251,146,60,0.3)" },
    "HEAVILY CONGESTED": { color: "text-red-400", bg: "bg-red-500/15", glow: "0 0 12px rgba(239,68,68,0.3)" },
  };
  const c = config[status] || config.OPTIMAL;
  return (
    <motion.div key={status} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${c.bg} ${c.color} text-[10px] font-bold uppercase tracking-[0.15em] font-mono`}
      style={{ boxShadow: c.glow }}>
      <div className={`w-1.5 h-1.5 rounded-full bg-current ${status !== "OPTIMAL" ? "animate-pulse" : ""}`} />
      {status}
    </motion.div>
  );
}

/* ═══════════ Delta Indicator ═══════════ */
function DeltaIndicator({ value, suffix = "", invert = false }: { value: number; suffix?: string; invert?: boolean }) {
  if (value === 0) return null;
  const isPositive = invert ? value < 0 : value > 0;
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold font-mono ${isPositive ? "text-emerald-400" : "text-red-400"}`}
    >
      {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {value > 0 ? "+" : ""}{value}{suffix}
    </motion.span>
  );
}

/* ═══════════ KPI Card ═══════════ */
function KPICard({
  icon, label, rawValue, displayValue, unit = "", accent = "cyan", delta,
}: {
  icon: React.ReactNode; label: string; rawValue?: number; displayValue?: string;
  unit?: string; accent?: string; delta?: React.ReactNode;
}) {
  const animated = useAnimatedValue(rawValue ?? 0);
  const value = displayValue ?? (rawValue !== undefined ? Math.round(animated).toLocaleString() : "—");
  const accentColors: Record<string, string> = {
    cyan: "from-cyan-500/10 to-transparent border-cyan-500/15",
    amber: "from-amber-500/10 to-transparent border-amber-500/15",
    emerald: "from-emerald-500/10 to-transparent border-emerald-500/15",
    purple: "from-purple-500/10 to-transparent border-purple-500/15",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className={`p-5 rounded-2xl border bg-gradient-to-br ${accentColors[accent]} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <motion.span key={value} initial={{ opacity: 0.6, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black text-slate-50 tabular-nums tracking-tight">{value}</motion.span>
        {unit && <span className="text-xs text-slate-500 font-mono">{unit}</span>}
      </div>
      {delta && <div className="mt-1.5">{delta}</div>}
    </motion.div>
  );
}

/* ═══════════ Toggle Pill ═══════════ */
function TogglePill({
  leftLabel, rightLabel, leftIcon, rightIcon, active, onChange
}: {
  leftLabel: string; rightLabel: string; leftIcon?: React.ReactNode; rightIcon?: React.ReactNode;
  active: "left" | "right"; onChange: (v: "left" | "right") => void;
}) {
  return (
    <div className="flex bg-slate-900/80 rounded-full p-0.5 border border-slate-800/60 text-[10px] font-bold uppercase tracking-wider">
      {(["left", "right"] as const).map((side) => (
        <button key={side} onClick={() => onChange(side)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
            active === side ? "bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.15)]" : "text-slate-500 hover:text-slate-400"
          }`}>
          {side === "left" ? leftIcon : rightIcon}
          {side === "left" ? leftLabel : rightLabel}
        </button>
      ))}
    </div>
  );
}


/* ═══════════ Main Dashboard ═══════════ */
export default function CortexArenaDashboard() {
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState(false);
  const [connected, setConnected] = useState(false);

  // New toggles
  const [viewMode, setViewMode] = useState<"left" | "right">("left"); // operator | attendee
  const [timeMode, setTimeMode] = useState<"left" | "right">("left"); // now | +2min

  const isAttendeeView = viewMode === "right";
  const isPredictive = timeMode === "right";

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    const connect = () => {
      ws = new WebSocket("ws://localhost:8000/ws/simulation");
      ws.onopen = () => { setConnected(true); setError(false); };
      ws.onmessage = (event) => setState(JSON.parse(event.data));
      ws.onerror = () => setError(true);
      ws.onclose = () => { setConnected(false); reconnectTimer = setTimeout(connect, 3000); };
    };
    connect();
    return () => { ws?.close(); clearTimeout(reconnectTimer); };
  }, []);

  const toggleAIMode = async () => {
    if (!state) return;
    const newMode = state.ai_mode === "autonomous" ? "manual" : "autonomous";
    try { await fetch(`http://localhost:8000/mode/${newMode}`, { method: "POST" }); } catch {}
  };

  /* ═══════ Loading Screen ═══════ */
  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617]">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="relative flex flex-col items-center">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-2 border-cyan-500/10 rounded-full" />
            <div className="absolute inset-2 border-2 border-purple-500/10 rounded-full animate-rotate-reverse" style={{ transformOrigin: "center" }} />
            <div className="absolute inset-4 border-2 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center"><Hexagon size={24} className="text-cyan-500/50" /></div>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-cyan-400 neon-text-cyan mb-2">Cortex Arena</h1>
          <p className="text-xs font-mono text-slate-600 uppercase tracking-[0.2em] mb-6">Initializing Orchestration Engine</p>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-500"
                animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }} />
            ))}
          </div>
          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-red-400/80 text-xs font-mono">⚠ Backend unreachable · Retrying...</motion.p>}
        </motion.div>
      </div>
    );
  }

  const impact = state.kpis?.impact;

  /* ═══════ Attendee View ═══════ */
  if (isAttendeeView) {
    return (
      <div className="min-h-screen grid-bg">
        <main className="min-h-screen p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
          {/* Simplified Header */}
          <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <UserCircle className="text-cyan-400" size={22} />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-white">
                  Cortex Arena<span className="text-cyan-400">:</span><span className="text-slate-400">Guide</span>
                </h1>
                <p className="text-[9px] text-slate-500 font-mono uppercase">Your Personal Stadium Assistant</p>
              </div>
            </div>
            <TogglePill leftLabel="Operator" rightLabel="Attendee" leftIcon={<Eye size={10} />} rightIcon={<UserCircle size={10} />}
              active={viewMode} onChange={setViewMode} />
          </motion.header>

          {/* Simplified Map + Guidance */}
          <div className="dashboard-grid">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-panel rounded-2xl p-6">
              <StadiumMap zones={state.zones} flowArrows={state.flow_arrows} predictive={false} attendeeMode />
            </motion.div>
            <div className="glass-panel p-6 rounded-2xl">
              <UserInsights zones={state.zones} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ═══════ Operator Dashboard ═══════ */
  return (
    <div className="min-h-screen grid-bg">
      <main className="min-h-screen p-4 lg:p-8 xl:p-10 max-w-[1680px] mx-auto space-y-6">

        {/* ═══════ Header ═══════ */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <Shield className="text-cyan-400" size={24} />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ boxShadow: "0 0 8px rgba(34,211,238,0.6)" }} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">
                Cortex Arena<span className="text-cyan-400">:</span><span className="text-slate-400">OS</span>
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.12em]">AI Crowd Orchestration System</p>
                <StatusBadge status={state.kpis.system_status} />
              </div>
            </div>
          </div>

          {/* Toolbar: Toggles + Telemetry */}
          <div className="flex items-center gap-3 flex-wrap">
            <TogglePill leftLabel="Now" rightLabel="+2 Min" leftIcon={<Timer size={10} />} rightIcon={<Gauge size={10} />}
              active={timeMode} onChange={setTimeMode} />
            <TogglePill leftLabel="Operator" rightLabel="Attendee" leftIcon={<Eye size={10} />} rightIcon={<UserCircle size={10} />}
              active={viewMode} onChange={setViewMode} />

            {/* AI Mode Toggle */}
            <button onClick={toggleAIMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 ${
                state.ai_mode === "autonomous"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}>
              {state.ai_mode === "autonomous" ? <Brain size={10} /> : <Hand size={10} />}
              {state.ai_mode === "autonomous" ? "AI Auto" : "Manual"}
            </button>

            <div className="flex items-center gap-2 text-[9px] font-mono text-slate-600 uppercase">
              <Satellite size={10} className={connected ? "text-emerald-500" : "text-red-500"} />
              <span>{connected ? "Live" : "…"}</span>
              <span className="text-slate-800">·</span>
              <span>Confidence: {state.kpis.prediction_confidence}%</span>
            </div>
          </div>
        </motion.header>

        {/* ═══════ KPI Ribbon ═══════ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="kpi-ribbon">
          <KPICard icon={<Users className="text-cyan-400" size={16} />}
            label="Total Occupancy" rawValue={state.kpis.total_occupancy} accent="cyan" />
          <KPICard icon={<Activity className="text-amber-400" size={16} />}
            label="Congested Zones" rawValue={state.kpis.congestion_count} accent="amber"
            delta={impact && <DeltaIndicator value={impact.congestion_delta} invert />} />
          <KPICard icon={<BarChart3 className="text-emerald-400" size={16} />}
            label="Flow Efficiency" displayValue={`${state.kpis.avg_flow_efficiency}`} unit="%" accent="emerald"
            delta={impact && <DeltaIndicator value={impact.efficiency_delta} suffix="%" />} />
          <KPICard icon={<Clock className="text-purple-400" size={16} />}
            label="Avg. Wait Time" displayValue={`${state.kpis.avg_wait_time}`} unit="min" accent="purple" />
          <KPICard icon={<Radio className="text-blue-400" size={16} />}
            label="Active Scenario" displayValue={state.current_scenario} accent="cyan" />
        </motion.div>

        {/* ═══════ Main Grid ═══════ */}
        <div className="dashboard-grid">
          <div className="flex flex-col space-y-6 h-full">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }} className="glass-panel rounded-2xl p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.12em]">
                    {isPredictive ? "Predicted Topology (+2 min)" : "Live Stadium Topology"}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-600">{state.zones.length} Zones</span>
              </div>
              <StadiumMap zones={state.zones} flowArrows={state.flow_arrows} predictive={isPredictive} />
            </motion.div>
            <div className="h-72 lg:h-80">
              <AIConsole logs={state.logs} />
            </div>
          </div>

          <div className="flex flex-col space-y-6 h-full">
            <ControlPanel currentScenario={state.current_scenario} aiMode={state.ai_mode} />
            <div className="glass-panel p-6 rounded-2xl flex-grow">
              <UserInsights zones={state.zones} />
            </div>
          </div>
        </div>

        {/* ═══════ Footer ═══════ */}
        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="flex justify-between items-center text-[9px] text-slate-700 font-mono uppercase tracking-wider border-t border-slate-800/50 pt-6 pb-2">
          <span>Session FM-XRY-772 · Encrypted</span>
          <span>© 2026 Cortex Arena Dynamics Corp.</span>
        </motion.footer>
      </main>
    </div>
  );
}
