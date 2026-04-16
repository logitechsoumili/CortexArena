"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Navigation, Compass, Clock, MapPin, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

/* ═══════════ Types ═══════════ */
interface Zone {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  status: string;
  type: string;
  wait_time: number;
  predicted_status: string;
}

interface UserInsightsProps {
  zones: Zone[];
}

/* ═══════════ Insight Card ═══════════ */
function InsightCard({
  icon,
  title,
  value,
  subtext,
  accent,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtext: string;
  accent: string;
  delay: number;
}) {
  const accentStyles: Record<string, { bg: string; text: string; glow: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "rgba(16,185,129,0.15)", border: "border-emerald-500/20" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", glow: "rgba(34,211,238,0.15)", border: "border-cyan-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", glow: "rgba(251,146,60,0.15)", border: "border-amber-500/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", glow: "rgba(168,85,247,0.15)", border: "border-purple-500/20" },
  };

  const style = accentStyles[accent] || accentStyles.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ x: 6, transition: { duration: 0.2 } }}
      className={`group relative overflow-hidden p-4 rounded-xl border ${style.border} bg-gradient-to-r from-slate-900/80 to-slate-800/40 cursor-default transition-all duration-300`}
      style={{ boxShadow: `0 0 0 0 ${style.glow}` }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${style.glow}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${style.glow}`;
      }}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${style.bg} ${style.text} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.15em] mb-0.5">{title}</div>
          <motion.div
            key={value}
            initial={{ opacity: 0.5, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-bold text-slate-100 truncate"
          >
            {value}
          </motion.div>
          <div className={`text-[10px] font-mono mt-0.5 ${style.text} opacity-80`}>{subtext}</div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════ Main ═══════════ */
export default function UserInsights({ zones }: UserInsightsProps) {
  const insights = useMemo(() => {
    const concourseZones = zones.filter((z) => z.type === "concourse");
    const leastCrowded = [...concourseZones].sort(
      (a, b) => a.occupancy / a.capacity - b.occupancy / b.capacity
    )[0];
    const congestedCount = zones.filter((z) => z.status !== "nominal").length;
    const avgDensity =
      concourseZones.reduce((acc, z) => acc + (z.occupancy / z.capacity), 0) /
      (concourseZones.length || 1);
    
    // Use the actual wait_time from backend zones
    const facilityZones = zones.filter(z => z.type === "concourse" || z.type === "gate");
    const activeWait = facilityZones.length > 0 
      ? Math.round(facilityZones.reduce((acc, z) => acc + (z.wait_time || 0), 0) / facilityZones.length)
      : 0;

    const leastDensity = leastCrowded
      ? Math.round((leastCrowded.occupancy / leastCrowded.capacity) * 100)
      : 0;

    // Calculate general trend based on predicted_status
    const criticalPredictions = zones.filter(z => z.predicted_status === "critical").length;
    const congestedPredictions = zones.filter(z => z.predicted_status === "congested").length;
    let trend = "STABLE";
    let trendSub = "NO SURGES DETECTED";
    let trendAccent = "emerald";

    if (criticalPredictions > 0) { trend = "CRITICAL SURGE"; trendSub = "IMMEDIATE ACTION REQ"; trendAccent = "purple"; }
    else if (congestedPredictions > congestedCount) { trend = "CONGESTING"; trendSub = "↑ RISING DENSITY"; trendAccent = "amber"; }
    else if (avgDensity < 0.3) { trend = "OPTIMAL"; trendSub = "UNIMPEDED FLOW"; trendAccent = "cyan"; }

    return { leastCrowded, congestedCount, estWait: activeWait, leastDensity, avgDensity, trend, trendSub, trendAccent };
  }, [zones]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-cyan-500/10">
          <Compass size={16} className="text-cyan-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-[0.15em]">Attendee Guidance</h2>
          <p className="text-[9px] text-slate-600 font-mono uppercase">AI-Powered Recommendations</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-2.5">
        <InsightCard
          icon={<Navigation size={18} />}
          title="Optimal Exit Route"
          value={`Gate ${insights.leastCrowded?.id.split("_")[0] || "—"} Concourse`}
          subtext="FLOW: UNIMPEDED"
          accent="emerald"
          delay={0.3}
        />
        <InsightCard
          icon={<MapPin size={18} />}
          title="Least Crowded Zone"
          value={insights.leastCrowded?.name || "Calculating..."}
          subtext={`${insights.leastDensity}% CAPACITY`}
          accent="cyan"
          delay={0.4}
        />
        <InsightCard
          icon={<Clock size={18} />}
          title="Est. Facility Wait"
          value={`${insights.estWait} Minutes`}
          subtext={insights.congestedCount > 5 ? "↑ RISING TREND" : "— STEADY FLOW"}
          accent="amber"
          delay={0.5}
        />
        <InsightCard
          icon={<TrendingDown size={18} />}
          title="Congestion Hotspots"
          value={`${insights.congestedCount} Active Zone${insights.congestedCount !== 1 ? "s" : ""}`}
          subtext={insights.congestedCount === 0 ? "ALL CLEAR" : "MONITORING"}
          accent="purple"
          delay={0.6}
        />
        <InsightCard
          icon={<TrendingUp size={18} />}
          title="AI Predictive Trend"
          value={insights.trend}
          subtext={insights.trendSub}
          accent={insights.trendAccent}
          delay={0.7}
        />
      </div>

      {/* AI Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/30 to-purple-950/20 border border-cyan-500/10"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-cyan-400 animate-pulse" />
          <span className="text-[10px] text-cyan-300/70 leading-tight font-mono italic">
            AI agents dynamically re-routing concourse traffic to minimize bottlenecks
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
