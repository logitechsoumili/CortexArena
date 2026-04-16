"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, AlertTriangle, CheckCircle2, Info, ChevronRight,
  Zap, ArrowRight, Target, Settings, Brain
} from "lucide-react";

/* ═══════════ Types ═══════════ */
interface Log {
  timestamp: string;
  message: string;
  level: string;
  category?: string;
}

interface AIConsoleProps {
  logs: Log[];
}

/* ═══════════ Constants ═══════════ */
const categoryConfig: Record<string, { icon: React.ReactNode; color: string; border: string; bg: string; badge: string }> = {
  trigger: {
    icon: <AlertTriangle size={12} />,
    color: "text-red-400",
    border: "border-l-red-500/60",
    bg: "bg-red-500/5",
    badge: "ALERT",
  },
  action: {
    icon: <Zap size={12} />,
    color: "text-cyan-300",
    border: "border-l-cyan-500/50",
    bg: "bg-cyan-500/5",
    badge: "ACTION",
  },
  impact: {
    icon: <Target size={12} />,
    color: "text-blue-400",
    border: "border-l-blue-500/50",
    bg: "bg-blue-500/5",
    badge: "IMPACT",
  },
  resolved: {
    icon: <CheckCircle2 size={12} />,
    color: "text-emerald-400",
    border: "border-l-emerald-500/60",
    bg: "bg-emerald-500/5",
    badge: "RESOLVED",
  },
  mode: {
    icon: <Settings size={12} />,
    color: "text-purple-400",
    border: "border-l-purple-500/50",
    bg: "bg-purple-500/5",
    badge: "MODE",
  },
  system: {
    icon: <Info size={12} />,
    color: "text-cyan-300",
    border: "border-l-cyan-500/30",
    bg: "bg-transparent",
    badge: "INFO",
  },
  ai_insight: {
    icon: <Brain size={12} />,
    color: "text-purple-300",
    border: "border-l-purple-500/60",
    bg: "bg-purple-500/5",
    badge: "AI INSIGHT",
  },
};

const badgeColors: Record<string, string> = {
  ALERT: "text-red-400 bg-red-500/10",
  ACTION: "text-cyan-400 bg-cyan-500/10",
  IMPACT: "text-blue-400 bg-blue-500/10",
  RESOLVED: "text-emerald-400 bg-emerald-500/10",
  MODE: "text-purple-400 bg-purple-500/10",
  INFO: "text-cyan-500 bg-cyan-500/10",
  "AI INSIGHT": "text-purple-300 bg-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]",
};

/* ═══════════ Log Entry ═══════════ */
function LogEntry({ log, index }: { log: Log; index: number }) {
  const cat = log.category || "system";
  const config = categoryConfig[cat] || categoryConfig.system;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3) }}
      className={`group flex items-start gap-3 px-3 py-2 rounded-lg border-l-2 ${config.border} ${config.bg} hover:bg-white/[0.03] transition-colors duration-200`}
    >
      <span className={`mt-0.5 shrink-0 ${config.color} opacity-60 group-hover:opacity-100 transition-opacity`}>
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-mono text-slate-600 tabular-nums">{log.timestamp}</span>
          <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0 rounded ${badgeColors[config.badge] || badgeColors.INFO}`}>
            {config.badge}
          </span>
        </div>
        <p className={`text-xs leading-relaxed ${config.color} opacity-90 break-words font-mono`}>
          {log.message}
        </p>
      </div>
      <ChevronRight size={10} className="mt-1.5 text-slate-700 shrink-0 group-hover:text-slate-500 transition-colors" />
    </motion.div>
  );
}

/* ═══════════ Main ═══════════ */
export default function AIConsole({ logs }: AIConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (scrollRef.current && isLive) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [logs, isLive]);

  const alertCount = logs.filter((l) => l.category === "trigger").length;
  const actionCount = logs.filter((l) => l.category === "action").length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Terminal size={16} className="text-cyan-400" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          </div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-[0.15em]">AI Orchestrator Console</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[8px] font-mono uppercase">
            <span className="text-red-400">{alertCount} alerts</span>
            <span className="text-slate-700">·</span>
            <span className="text-cyan-400">{actionCount} actions</span>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/40" />
            <div className="w-2 h-2 rounded-full bg-amber-500/40" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
          </div>
        </div>
      </div>

      {/* Log Area */}
      <div ref={scrollRef} className="flex-1 px-3 py-3 overflow-y-auto space-y-1"
        onScroll={() => {
          if (!scrollRef.current) return;
          const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
          setIsLive(scrollHeight - scrollTop - clientHeight < 60);
        }}>
        <AnimatePresence mode="popLayout">
          {logs.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-full">
              <div className="text-slate-700 font-mono text-xs animate-pulse">█ Awaiting telemetry stream...</div>
            </motion.div>
          )}
          {logs.map((log, i) => (
            <LogEntry key={`${log.timestamp}-${i}`} log={log} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 py-2 bg-slate-950/60 border-t border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            {isLive ? "Live" : "Paused"} · Broadcast
          </span>
        </div>
        <span className="text-[9px] font-mono text-slate-600">RTT {"<"} 50ms</span>
      </div>
    </motion.div>
  );
}
