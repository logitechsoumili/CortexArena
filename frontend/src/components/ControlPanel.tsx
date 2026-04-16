"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Users, Play, LogOut, Goal, Loader2, Wifi, Brain, Hand } from "lucide-react";
import { API_BASE } from "@/lib/config";

/* ═══════════ Types ═══════════ */
interface ControlPanelProps {
  currentScenario: string;
  aiMode?: string;
}

const scenarios = [
  { id: "steady", name: "Steady State", icon: Play, gradient: "from-slate-600 to-slate-700", activeGlow: "rgba(100,116,139,0.3)", desc: "Default ambient pattern" },
  { id: "halftime", name: "Halftime Surge", icon: Users, gradient: "from-amber-600 to-orange-600", activeGlow: "rgba(251,146,60,0.3)", desc: "Mass movement to facilities" },
  { id: "goal", name: "Goal Spike", icon: Goal, gradient: "from-red-600 to-rose-600", activeGlow: "rgba(239,68,68,0.3)", desc: "Sectored density surge" },
  { id: "exit", name: "Exit Rush", icon: LogOut, gradient: "from-blue-600 to-indigo-600", activeGlow: "rgba(59,130,246,0.3)", desc: "Final whistle evacuation" },
];

/* ═══════════ Component ═══════════ */
export default function ControlPanel({ currentScenario, aiMode = "autonomous" }: ControlPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const triggerScenario = async (id: string) => {
    setLoading(id);
    try { await fetch(`${API_BASE}/simulate/${id}`, { method: "POST" }); } catch {}
    setTimeout(() => setLoading(null), 800);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }} className="glass-panel p-6 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10">
            <Zap size={16} className="text-amber-400 fill-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-200">Scenario Control</h2>
            <p className="text-[9px] text-slate-600 font-mono uppercase">Manual Override Interface</p>
          </div>
        </div>
        {/* AI Mode Display */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
          aiMode === "autonomous"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        }`}>
          {aiMode === "autonomous" ? <Brain size={9} /> : <Hand size={9} />}
          {aiMode === "autonomous" ? "AI Active" : "Manual"}
        </div>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-2 gap-3">
        {scenarios.map((s) => {
          const isActive = currentScenario === s.name;
          const isLoading = loading === s.id;
          return (
            <motion.button key={s.id} onClick={() => triggerScenario(s.id)} whileTap={{ scale: 0.96 }}
              className="relative group text-left" disabled={isLoading}>
              <div className={`relative overflow-hidden flex flex-col items-start p-4 rounded-xl border transition-all duration-500 ease-out ${
                isActive ? "border-cyan-500/50 bg-cyan-950/30" : "border-slate-800/80 bg-slate-900/30 hover:border-slate-600/80 hover:bg-slate-800/40"
              }`} style={isActive ? { boxShadow: `0 0 25px ${s.activeGlow}, inset 0 0 25px ${s.activeGlow}` } : {}}>
                {isActive && <div className="absolute inset-0 animate-shimmer opacity-40 pointer-events-none" />}
                <div className={`p-2 rounded-lg mb-3 transition-all duration-300 ${
                  isActive ? `bg-gradient-to-br ${s.gradient} text-white shadow-lg` : "bg-slate-800/80 text-slate-500 group-hover:text-slate-300"
                }`}>
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div key="loader" initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 1, rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}><Loader2 size={16} /></motion.div>
                    ) : (
                      <motion.div key="icon" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                        <s.icon size={16} /></motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className={`text-xs font-bold uppercase tracking-wide transition-colors duration-300 ${
                  isActive ? "text-cyan-300" : "text-slate-300 group-hover:text-white"}`}>{s.name}</span>
                <span className="text-[9px] text-slate-500 mt-1 leading-tight">{s.desc}</span>
                {isActive && (
                  <motion.div layoutId="activeIndicator"
                    className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cyan-400"
                    style={{ boxShadow: "0 0 8px rgba(34,211,238,0.6)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi size={12} className="text-emerald-500" />
            <span className="text-[10px] text-slate-400 font-mono">WebSocket</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] text-emerald-400 font-bold font-mono uppercase tracking-wider">Connected</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
