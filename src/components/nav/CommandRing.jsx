import React, { useState } from "react";
import { motion } from "framer-motion";
import { SECTORS } from "@/components/nav/sectors";
import SectorTools from "@/components/nav/SectorTools";

const C = 200; // svg center
const R_IN = 96;
const R_OUT = 168;
const R_SEL = 184;

const pt = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

function arcPath(start, end, rIn, rOut) {
  const [x1, y1] = pt(rOut, start);
  const [x2, y2] = pt(rOut, end);
  const [x3, y3] = pt(rIn, end);
  const [x4, y4] = pt(rIn, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${large} 0 ${x4} ${y4} Z`;
}

export default function CommandRing() {
  const [active, setActive] = useState(null);
  const sector = SECTORS.find((s) => s.id === active);

  return (
    <div className="schematic-panel p-5 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-center">
      {/* Ring */}
      <div className="relative mx-auto">
        <svg width={400} height={400} viewBox="0 0 400 400" className="select-none">
          {/* tick ring */}
          {Array.from({ length: 72 }).map((_, i) => {
            const deg = i * 5;
            const [ax, ay] = pt(R_OUT + 8, deg);
            const [bx, by] = pt(R_OUT + (i % 6 === 0 ? 18 : 13), deg);
            return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke="hsl(var(--primary))" strokeOpacity={i % 6 === 0 ? 0.5 : 0.18} strokeWidth="1" />;
          })}

          {/* sweep */}
          <motion.line
            x1={C}
            y1={C}
            x2={C + R_OUT}
            y2={C}
            stroke="hsl(var(--accent))"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            style={{ originX: "200px", originY: "200px" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          />

          {/* sectors */}
          {SECTORS.map((s) => {
            const isActive = active === s.id;
            return (
              <g key={s.id} onClick={() => setActive(isActive ? null : s.id)} className="cursor-pointer">
                <motion.path
                  d={arcPath(s.start, s.end, R_IN, isActive ? R_SEL : R_OUT)}
                  fill={isActive ? "hsl(var(--primary) / 0.28)" : "hsl(var(--card))"}
                  stroke={isActive ? "hsl(var(--accent))" : "hsl(var(--border))"}
                  strokeWidth={isActive ? 2 : 1}
                  initial={false}
                  animate={{ opacity: 1 }}
                  className="transition-colors hover:fill-[hsl(var(--primary)/0.16)]"
                />
                {(() => {
                  const mid = (s.start + s.end) / 2;
                  const [lx, ly] = pt((R_IN + (isActive ? R_SEL : R_OUT)) / 2, mid);
                  return (
                    <>
                      <text
                        x={lx}
                        y={ly - 2}
                        textAnchor="middle"
                        className="font-display"
                        style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}
                        fill={isActive ? "hsl(var(--accent))" : "hsl(var(--foreground))"}
                      >
                        {s.label.toUpperCase()}
                      </text>
                      <text
                        x={lx}
                        y={ly + 13}
                        textAnchor="middle"
                        style={{ fontSize: 9, fontFamily: "IBM Plex Mono", letterSpacing: "0.2em" }}
                        fill="hsl(var(--muted-foreground))"
                      >
                        {s.code}
                      </text>
                    </>
                  );
                })()}
              </g>
            );
          })}

          {/* hub */}
          <circle cx={C} cy={C} r={R_IN - 10} fill="hsl(12 12% 5%)" stroke="hsl(var(--primary))" strokeOpacity="0.5" />
          <circle cx={C} cy={C} r={R_IN - 24} fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.2" strokeDasharray="3 4" />
          <text x={C} y={C - 4} textAnchor="middle" className="font-display" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.18em" }} fill="hsl(var(--primary))">
            ERA ONE
          </text>
          <text x={C} y={C + 14} textAnchor="middle" style={{ fontSize: 9, fontFamily: "IBM Plex Mono", letterSpacing: "0.22em" }} fill="hsl(var(--muted-foreground))">
            COMMAND RING
          </text>
        </svg>
      </div>

      {/* Expanded sector readout */}
      <div className="min-h-[180px]">
        {sector ? (
          <SectorTools sector={sector} />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-[3px] w-8 hazard-stripes-ember" />
              <span className="tech-label text-primary/90">Awaiting sector selection</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Engage a ring sector to deploy its tools. Archives holds the dataset and comparison engine,
              Foundry holds registered blueprints, Ops handles ingestion and sync.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {SECTORS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className="border border-border px-3 py-1.5 clip-plate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}