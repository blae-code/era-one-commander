import React from "react";
import { commitRange, personaHex } from "./dossierModel";

// THE key visual: all five min_max_units_for_attack windows on ONE shared 0–30 unit scale,
// each personality a labelled band, so the commit thresholds read comparatively.
const MAX = 30;
const W = 760;
const PAD_L = 118;
const PAD_R = 84;
const ROW_H = 30;

export default function CommitBar({ rows = [], selectedId = null, onSelect = (_id) => {} }) {
  const ordered = [...rows].sort((a, b) => commitRange(a)[0] - commitRange(b)[0]);
  const H = ordered.length * ROW_H + 30;
  const x = (v) => PAD_L + (Math.max(0, Math.min(MAX, v)) / MAX) * (W - PAD_L - PAD_R);

  return (
    <div className="schematic-panel p-4 relative">
      <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes-ember opacity-60" />
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
        <div className="font-display font-bold uppercase tracking-[0.15em] text-sm">Commit thresholds</div>
        <div className="tech-label">min_max_units_for_attack · shared scale 0–{MAX} units</div>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label="Attack commit thresholds by personality">
          {/* grid + axis */}
          {Array.from({ length: MAX / 5 + 1 }).map((_, i) => {
            const v = i * 5;
            return (
              <g key={v}>
                <line x1={x(v)} y1={4} x2={x(v)} y2={H - 22} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray={v % 10 === 0 ? "" : "2 4"} />
                <text x={x(v)} y={H - 8} textAnchor="middle" fill="hsl(var(--muted-foreground))" style={{ fontSize: 9, fontFamily: "IBM Plex Mono" }}>
                  {v}
                </text>
              </g>
            );
          })}
          {ordered.map((r, i) => {
            const [min, max] = commitRange(r);
            const hex = personaHex(r);
            const sel = r.game_id === selectedId;
            const y = i * ROW_H + 8;
            const exact = min === max;
            return (
              <g key={r.game_id} onClick={() => onSelect(r.game_id)} style={{ cursor: "pointer" }}>
                {/* row hit area */}
                <rect x={0} y={y - 4} width={W} height={ROW_H - 4} fill={sel ? "hsl(var(--primary) / 0.08)" : "transparent"} />
                <text x={4} y={y + 9} fill={sel ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"} style={{ fontSize: 10, fontFamily: "IBM Plex Mono", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  {String(r.name || r.game_id).toUpperCase()}
                </text>
                {/* faint full track */}
                <line x1={x(0)} y1={y + 5} x2={x(MAX)} y2={y + 5} stroke="hsl(var(--secondary))" strokeWidth="10" strokeOpacity="0.55" />
                {exact ? (
                  <g>
                    <rect x={x(min) - 2.5} y={y - 2} width={5} height={14} fill={hex} stroke={sel ? "hsl(var(--foreground))" : "none"} strokeWidth="1" />
                    <path d={`M ${x(min)} ${y - 7} l 4 5 l -8 0 z`} fill={hex} />
                  </g>
                ) : (
                  <rect x={x(min)} y={y} width={Math.max(2, x(max) - x(min))} height={10} fill={hex} fillOpacity="0.85" stroke={sel ? "hsl(var(--foreground))" : hex} strokeWidth="1" />
                )}
                <text x={W - 4} y={y + 9} textAnchor="end" fill={hex} style={{ fontSize: 11, fontFamily: "IBM Plex Mono" }}>
                  {exact ? `= ${min}` : `${min}–${max}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="tech-label mt-1 text-[9px]">
        A band = the unit count this AI masses before it launches an attack wave. A diamond = a fixed commit point.
      </div>
    </div>
  );
}
