import React from "react";
import { fmtNum } from "@/lib/gameData";

// Industrial tactical readouts: segmented load bars + arc dials.
// Purely presentational — values/maxima are supplied by the caller.

const SEGMENTS = 24;

export function SegBar({ label, value = 0, max = 0, unit = "", dec = 0, color = "hsl(var(--primary))", danger = false }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const lit = Math.round(pct * SEGMENTS);
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground truncate" title={label}>{label}</span>
      <span className="flex-1 flex gap-[2px] h-3.5 border border-border/70 bg-black/50 p-[2px]" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const on = i < lit;
          const hot = danger && i > SEGMENTS * 0.75;
          return (
            <span
              key={i}
              className="flex-1"
              style={{
                background: on ? (hot ? "#ff4d4d" : color) : "hsl(var(--secondary))",
                opacity: on ? (i === lit - 1 ? 1 : 0.82) : 0.5,
                boxShadow: on ? `0 0 4px ${hot ? "#ff4d4d" : color}55` : "none",
              }}
            />
          );
        })}
      </span>
      <span className="w-[74px] text-right font-mono text-[11px] tabular-nums">
        {fmtNum(value, dec)}
        {unit ? <span className="text-muted-foreground text-[9px] ml-0.5">{unit}</span> : null}
      </span>
    </div>
  );
}

export function ArcGauge({ label, value = 0, max = 0, unit = "", dec = 0, color = "hsl(var(--accent))", size = 92 }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const c = size / 2;
  const r = c - 12;
  const A0 = 135, A1 = 405; // sweep 270°
  const polar = (rad, deg) => {
    const a = (deg * Math.PI) / 180;
    return [c + rad * Math.cos(a), c + rad * Math.sin(a)];
  };
  const arc = (from, to, rad) => {
    const [x1, y1] = polar(rad, from);
    const [x2, y2] = polar(rad, to);
    return `M ${x1} ${y1} A ${rad} ${rad} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const needleDeg = A0 + pct * (A1 - A0);
  const [nx, ny] = polar(r - 4, needleDeg);
  return (
    <div className="flex flex-col items-center" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <svg width={size} height={size * 0.82} viewBox={`0 0 ${size} ${size * 0.82}`} aria-hidden="true">
        <path d={arc(A0, A1, r)} fill="none" stroke="hsl(var(--secondary))" strokeWidth="7" />
        <path d={arc(A0, needleDeg, r)} fill="none" stroke={color} strokeWidth="7" />
        {Array.from({ length: 10 }).map((_, i) => {
          const deg = A0 + (i / 9) * (A1 - A0);
          const [ax, ay] = polar(r - 7, deg);
          const [bx, by] = polar(r - 11, deg);
          return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke="hsl(var(--primary))" strokeOpacity={0.45} strokeWidth="1" />;
        })}
        <line x1={c} y1={c} x2={nx} y2={ny} stroke="hsl(var(--foreground))" strokeWidth="1.6" />
        <circle cx={c} cy={c} r="3" fill="hsl(var(--primary))" />
        <text x={c} y={c + 22} textAnchor="middle" style={{ fontSize: 12, fontFamily: "IBM Plex Mono" }} fill="hsl(var(--foreground))">
          {fmtNum(value, dec)}{unit}
        </text>
      </svg>
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground -mt-1">{label}</div>
    </div>
  );
}