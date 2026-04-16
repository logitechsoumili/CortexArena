"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════ Types ═══════════ */
interface Zone {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  status: string;
  type: string;
  predicted_status?: string;
  predicted_occupancy?: number;
}

interface FlowArrow {
  from_zone: string;
  to_zone: string;
  intensity: number;
}

interface StadiumMapProps {
  zones: Zone[];
  flowArrows?: FlowArrow[];
  predictive?: boolean;
  attendeeMode?: boolean;
}

/* ═══════════ Constants ═══════════ */
const sectors = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const CX = 300;
const CY = 300;

const ringData = [
  { name: "inner", inner: 70, outer: 125, label: "Premium" },
  { name: "outer", inner: 130, outer: 190, label: "Standard" },
  { name: "concourse", inner: 195, outer: 252, label: "Concourse" },
];

/* ═══════════ Helpers ═══════════ */
function arcPath(cx: number, cy: number, rIn: number, rOut: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const gap = 1.2;
  const s = toRad(startDeg + gap / 2);
  const e = toRad(endDeg - gap / 2);
  const x1 = cx + rIn * Math.cos(s), y1 = cy + rIn * Math.sin(s);
  const x2 = cx + rOut * Math.cos(s), y2 = cy + rOut * Math.sin(s);
  const x3 = cx + rOut * Math.cos(e), y3 = cy + rOut * Math.sin(e);
  const x4 = cx + rIn * Math.cos(e), y4 = cy + rIn * Math.sin(e);
  return `M ${x1} ${y1} L ${x2} ${y2} A ${rOut} ${rOut} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rIn} ${rIn} 0 0 0 ${x1} ${y1} Z`;
}

function densityColor(density: number, status: string): string {
  if (status === "critical") return "#ef4444";
  if (status === "congested") return "#fb923c";
  if (density > 0.5) return "#0e7490";
  if (density > 0.3) return "#164e63";
  return "#1e293b";
}

function glowFilter(status: string): string {
  if (status === "critical") return "url(#glow-red)";
  if (status === "congested") return "url(#glow-orange)";
  return "none";
}

function getZoneCenter(zoneId: string): { x: number; y: number } | null {
  const parts = zoneId.split("_");
  const sector = parts[0];
  const ring = parts.slice(1).join("_");
  const sIdx = sectors.indexOf(sector);
  const rData = ringData.find((r) => r.name === ring);
  if (sIdx === -1 || !rData) return null;
  const angleStep = 360 / sectors.length;
  const midAngle = sIdx * angleStep - 90;
  const midR = (rData.inner + rData.outer) / 2;
  return {
    x: CX + midR * Math.cos((midAngle * Math.PI) / 180),
    y: CY + midR * Math.sin((midAngle * Math.PI) / 180),
  };
}

/* ═══════════ Component ═══════════ */
export default function StadiumMap({ zones, flowArrows = [], predictive = false, attendeeMode = false }: StadiumMapProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const zoneMap = useMemo(() => {
    const m: Record<string, Zone> = {};
    zones.forEach((z) => (m[z.id] = z));
    return m;
  }, [zones]);

  const handleHover = useCallback((id: string | null) => setHoveredZone(id), []);

  // In attendee mode, find the "best" exit concourse for highlighting
  const bestExitId = useMemo(() => {
    if (!attendeeMode) return null;
    const concourses = zones.filter((z) => z.type === "concourse");
    const best = concourses.sort((a, b) => a.occupancy / a.capacity - b.occupancy / b.capacity)[0];
    return best?.id || null;
  }, [zones, attendeeMode]);

  return (
    <div className="relative w-full aspect-square max-w-[620px] mx-auto">
      <div className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)" }} />

      <svg viewBox="0 0 600 600" className="w-full h-full relative z-10">
        <defs>
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="#22d3ee" floodOpacity="0.3" /><feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="#ef4444" floodOpacity="0.4" /><feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feFlood floodColor="#fb923c" floodOpacity="0.35" /><feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-hover" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feFlood floodColor="#22d3ee" floodOpacity="0.5" /><feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="#10b981" floodOpacity="0.4" /><feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="rgba(34,211,238,0.6)" />
          </marker>
        </defs>

        {/* Decorative rings */}
        <circle cx={CX} cy={CY} r="268" fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="1" strokeDasharray="3 6"
          className="animate-rotate-slow" style={{ transformOrigin: "300px 300px" }} />
        <circle cx={CX} cy={CY} r="278" fill="none" stroke="rgba(168,85,247,0.06)" strokeWidth="0.5"
          className="animate-rotate-reverse" style={{ transformOrigin: "300px 300px" }} />
        <circle cx={CX} cy={CY} r="260" fill="none" stroke="rgba(51,65,85,0.3)" strokeWidth="0.5" />

        {/* Scan sweep */}
        <g className="animate-rotate-slow" style={{ transformOrigin: "300px 300px" }}>
          <line x1={CX} y1={CY} x2={CX} y2={CY - 255} stroke="rgba(34,211,238,0.12)" strokeWidth="1" />
          <circle cx={CX} cy={CY - 255} r="3" fill="rgba(34,211,238,0.4)" />
        </g>

        {/* Zone segments */}
        {sectors.map((sector, sIdx) => {
          const angleStep = 360 / sectors.length;
          const startAngle = sIdx * angleStep - 90 - angleStep / 2;
          const endAngle = startAngle + angleStep;

          return ringData.map((ring) => {
            const zoneId = `${sector}_${ring.name}`;
            const zone = zoneMap[zoneId];
            if (!zone) return null;

            const useStatus = predictive ? (zone.predicted_status || zone.status) : zone.status;
            const useOccupancy = predictive ? (zone.predicted_occupancy ?? zone.occupancy) : zone.occupancy;
            const density = zone.capacity > 0 ? useOccupancy / zone.capacity : 0;
            const fill = densityColor(density, useStatus);
            const isHovered = hoveredZone === zoneId;
            const isBestExit = attendeeMode && zoneId === bestExitId;
            const filter = isBestExit ? "url(#glow-green)" : isHovered ? "url(#glow-hover)" : glowFilter(useStatus);

            // Show prediction overlay: dashed outline on zones predicted to congest
            const showPredictionOverlay = predictive && zone.status === "nominal" &&
              (zone.predicted_status === "congested" || zone.predicted_status === "critical");

            return (
              <React.Fragment key={zoneId}>
                <motion.path
                  d={arcPath(CX, CY, ring.inner, ring.outer, startAngle, endAngle)}
                  initial={{ fill: "#1e293b", opacity: 0.6 }}
                  animate={{
                    fill: isBestExit ? "#065f46" : fill,
                    opacity: isHovered ? 1 : isBestExit ? 0.9 : useStatus === "critical" ? 0.9 : 0.75,
                    scale: isHovered ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  filter={filter}
                  stroke={isBestExit ? "#10b981" : isHovered ? "#22d3ee" : "rgba(15,23,42,0.8)"}
                  strokeWidth={isBestExit ? 2 : isHovered ? 2 : 1}
                  className="cursor-pointer"
                  style={{ transformOrigin: `${CX}px ${CY}px` }}
                  onMouseEnter={() => handleHover(zoneId)}
                  onMouseLeave={() => handleHover(null)}
                />
                {showPredictionOverlay && (
                  <path
                    d={arcPath(CX, CY, ring.inner + 2, ring.outer - 2, startAngle, endAngle)}
                    fill="none"
                    stroke={zone.predicted_status === "critical" ? "#ef4444" : "#fb923c"}
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    opacity="0.7"
                    className="animate-glow-pulse"
                  />
                )}
              </React.Fragment>
            );
          });
        })}

        {/* Flow arrows (digital signage) */}
        {flowArrows.map((arrow, i) => {
          const from = getZoneCenter(arrow.from_zone);
          const to = getZoneCenter(arrow.to_zone);
          if (!from || !to) return null;
          const dx = to.x - from.x, dy = to.y - from.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const nx = dx / len, ny = dy / len;
          const sx = from.x + nx * 15, sy = from.y + ny * 15;
          const ex = to.x - nx * 15, ey = to.y - ny * 15;
          return (
            <motion.line
              key={`arrow-${i}`}
              x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={`rgba(34,211,238,${0.2 + arrow.intensity * 0.5})`}
              strokeWidth={1 + arrow.intensity * 2}
              markerEnd="url(#arrowhead)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
          );
        })}

        {/* Center */}
        <circle cx={CX} cy={CY} r="60" fill="#020617" stroke="rgba(34,211,238,0.2)" strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r="55" fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="0.5" strokeDasharray="4 4" />
        <circle cx={CX} cy={CY} r="30" fill="none" stroke="rgba(34,211,238,0.1)" strokeWidth="0.5" />
        <circle cx={CX} cy={CY} r="4" fill="rgba(34,211,238,0.4)" />
        <text x={CX} y={CY - 10} textAnchor="middle" fill="rgba(34,211,238,0.5)" fontSize="8" fontFamily="monospace" fontWeight="bold">CORTEX ARENA</text>
        <text x={CX} y={CY + 5} textAnchor="middle" fill="rgba(34,211,238,0.3)" fontSize="6" fontFamily="monospace">
          {predictive ? "FORECAST" : "LIVE FEED"}
        </text>

        {/* Sector labels */}
        {sectors.map((sector, i) => {
          const angle = i * 45 - 90;
          const rx = CX + 275 * Math.cos((angle * Math.PI) / 180);
          const ry = CY + 275 * Math.sin((angle * Math.PI) / 180);
          return (
            <text key={sector} x={rx} y={ry} textAnchor="middle" dominantBaseline="central"
              fill="rgba(148,163,184,0.6)" fontSize="10" fontFamily="var(--font-geist-mono), monospace" fontWeight="600">
              {sector}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredZone && zoneMap[hoveredZone] && (
          <motion.div key="tooltip" initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 glass-panel rounded-xl px-5 py-3 border border-cyan-500/20 pointer-events-none"
            style={{ boxShadow: "0 0 30px rgba(34,211,238,0.1)" }}>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${
                (predictive ? zoneMap[hoveredZone].predicted_status : zoneMap[hoveredZone].status) === "critical" ? "bg-red-500 animate-pulse" :
                (predictive ? zoneMap[hoveredZone].predicted_status : zoneMap[hoveredZone].status) === "congested" ? "bg-orange-400 animate-pulse" :
                "bg-cyan-400"
              }`} />
              <div>
                <div className="text-xs font-bold text-slate-200 tracking-wide">{zoneMap[hoveredZone].name}</div>
                <div className="flex gap-4 mt-0.5">
                  <span className="text-[10px] font-mono text-slate-400">
                    {(predictive ? zoneMap[hoveredZone].predicted_occupancy : zoneMap[hoveredZone].occupancy)?.toLocaleString()} / {zoneMap[hoveredZone].capacity.toLocaleString()}
                  </span>
                  <span className={`text-[10px] font-mono font-bold uppercase ${
                    (predictive ? zoneMap[hoveredZone].predicted_status : zoneMap[hoveredZone].status) === "critical" ? "text-red-400" :
                    (predictive ? zoneMap[hoveredZone].predicted_status : zoneMap[hoveredZone].status) === "congested" ? "text-amber-400" :
                    "text-emerald-400"
                  }`}>
                    {Math.round(((predictive ? (zoneMap[hoveredZone].predicted_occupancy ?? 0) : zoneMap[hoveredZone].occupancy) / zoneMap[hoveredZone].capacity) * 100)}%
                  </span>
                </div>
                {predictive && zoneMap[hoveredZone].predicted_status !== zoneMap[hoveredZone].status && (
                  <div className="text-[9px] text-amber-400 font-mono mt-1 animate-pulse">
                    ⚠ Predicted to reach {zoneMap[hoveredZone].predicted_status} in ~90s
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-6 text-[10px] font-mono uppercase tracking-wider text-slate-500">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-700" /> Nominal</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> Congested</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Critical</div>
        {predictive && <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-dashed border-amber-400" /> Predicted</div>}
        {attendeeMode && <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Best Exit</div>}
      </div>
    </div>
  );
}
