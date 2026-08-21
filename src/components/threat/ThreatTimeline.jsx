import React, { useRef, useState } from "react";
import { fmtNum } from "@/lib/gameData";
import { CLASS_COLOR, fmtClock, targetLabel } from "./threatModel";

const PX_PER_MIN = 8;
const ML = 64, MR = 80, MT = 18;
const PLOT_H = 330;
const AXIS_Y = MT + PLOT_H; // 348
const LANE_H = 34; // upgrade tick lane below the axis
const SVG_H = AXIS_Y + LANE_H + 40;
const BAR_H = PLOT_H - 26; // headroom above the tallest column

// One horizontal SVG board: threat columns + cumulative area + upgrade ticks.
// Scrolls horizontally inside its own container instead of compressing (readable at 1440px).
export default function ThreatTimeline({ model, targetClass }) {
  const { waves, upgrades, maxDps, cumPoints, cumMax, tEnd } = model;
  const wrapRef = useRef(null);
  const [tip, setTip] = useState(null);

  const innerW = Math.max(1320, ML + MR + (tEnd / 60) * PX_PER_MIN);
  const xs = (t) => ML + (t / 60) * PX_PER_MIN;
  const yDps = (v) => AXIS_Y - (v / maxDps) * BAR_H;
  const yCum = (v) => AXIS_Y - (v / cumMax) * BAR_H;

  // Step-after cumulative area path (guaranteed waves only). Cheap enough to build per render.
  let cumLine = "";
  if (cumPoints.length) {
    cumLine = `M ${xs(cumPoints[0].t)} ${yCum(cumPoints[0].v)}`;
    for (let i = 1; i < cumPoints.length; i++) cumLine += ` H ${xs(cumPoints[i].t)} V ${yCum(cumPoints[i].v)}`;
  }
  const cumArea = cumLine ? `${cumLine} V ${AXIS_Y} H ${xs(cumPoints[0].t)} Z` : "";

  const minuteTicks = [];
  for (let m = 0; m <= Math.ceil(tEnd / 60); m += 20) minuteTicks.push(m);
  const dpsTicks = [0.25, 0.5, 0.75, 1].map((f) => f * maxDps);

  const place = (e, payload) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(Math.max(e.clientX - rect.left + 14, 8), rect.width - 336);
    const top = Math.min(Math.max(e.clientY - rect.top + 12, 8), rect.height - 40);
    setTip({ left, top, ...payload });
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="overflow-x-auto">
        <svg width={innerW} height={SVG_H} className="block" role="img" aria-label={`Enemy wave timeline, DPS ${targetLabel(targetClass)}`}>
          {/* horizontal gridlines + left DPS axis */}
          {dpsTicks.map((v) => (
            <g key={v}>
              <line x1={ML} x2={innerW - MR} y1={yDps(v)} y2={yDps(v)} stroke="hsl(var(--border))" strokeDasharray="2 6" />
              <text x={ML - 6} y={yDps(v) + 3} textAnchor="end" fontFamily="IBM Plex Mono" fontSize="9" fill="hsl(var(--muted-foreground))">{fmtNum(v)}</text>
            </g>
          ))}
          {/* right cumulative axis */}
          {[0.5, 1].map((f) => (
            <text key={f} x={innerW - MR + 6} y={yCum(f * cumMax) + 3} fontFamily="IBM Plex Mono" fontSize="9" fill="hsl(26 88% 52% / 0.8)">{fmtNum(f * cumMax)}</text>
          ))}

          {/* cumulative threat area (behind columns) */}
          <path d={cumArea} fill="hsl(26 88% 52% / 0.10)" />
          <path d={cumLine} fill="none" stroke="hsl(26 88% 52% / 0.55)" strokeWidth="1.5" />

          {/* wave columns */}
          {waves.map((w) => {
            const x = xs(w.t0);
            const wd = Math.max(5, xs(w.t1) - xs(w.t0));
            let cursor = AXIS_Y;
            return (
              <g key={w.id} opacity={w.ghost ? 0.38 : 1}>
                {w.segments.map((s) => {
                  const h = (s.dps / maxDps) * BAR_H;
                  if (h <= 0) return null;
                  cursor -= h;
                  return <rect key={s.slot} x={x} y={cursor} width={wd} height={h} fill={CLASS_COLOR[s.unitClass] || CLASS_COLOR.Unresolved} stroke="hsl(var(--background))" strokeWidth="0.5" />;
                })}
                {/* zero-DPS stub so empty/unresolved waves stay visible */}
                {w.dps <= 0 && <rect x={x} y={AXIS_Y - 3} width={wd} height={3} fill={CLASS_COLOR.Unresolved} />}
                {w.ghost && (
                  <>
                    <rect x={x - 1} y={Math.min(cursor, AXIS_Y - 4) - 3} width={wd + 2} height={AXIS_Y - Math.min(cursor, AXIS_Y - 4) + 3} fill="none" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeWidth="1" />
                    <text x={x + wd / 2} y={Math.min(cursor, AXIS_Y - 4) - 8} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="9" fill="hsl(var(--muted-foreground))">{w.effProb}%</text>
                  </>
                )}
                <text x={x + wd / 2} y={AXIS_Y + 12} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="8" fill={w.isAlt ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground) / 0.7)"}>
                  {w.isAlt ? "ALT" : `W${w.index ?? "?"}`}
                </text>
              </g>
            );
          })}

          {/* time axis */}
          <line x1={ML} x2={innerW - MR} y1={AXIS_Y} y2={AXIS_Y} stroke="hsl(var(--border))" />
          {minuteTicks.map((m) => (
            <g key={m}>
              <line x1={xs(m * 60)} x2={xs(m * 60)} y1={AXIS_Y} y2={AXIS_Y + 4} stroke="hsl(var(--muted-foreground))" />
              <text x={xs(m * 60)} y={AXIS_Y + LANE_H + 26} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="9" fill="hsl(var(--muted-foreground))">{m}m</text>
            </g>
          ))}

          {/* AI upgrade grants — ticks below the axis */}
          {upgrades.map((u) => (
            <g key={u.id}
              onMouseMove={(e) => place(e, { upg: u })}
              onMouseLeave={() => setTip(null)}
              className="cursor-crosshair"
            >
              <path d={`M ${xs(u.t)} ${AXIS_Y + 18} l 5 12 h -10 Z`} fill="hsl(var(--primary))" opacity="0.9" />
              <rect x={xs(u.t) - 8} y={AXIS_Y + 14} width={16} height={20} fill="transparent" />
            </g>
          ))}

          {/* hover hit zones on top (full column height, slightly widened) */}
          {waves.map((w) => {
            const x = xs(w.t0);
            const wd = Math.max(5, xs(w.t1) - xs(w.t0));
            return (
              <rect key={`hit-${w.id}`} x={x - 3} y={MT} width={wd + 6} height={PLOT_H}
                fill="transparent" className="cursor-crosshair"
                onMouseMove={(e) => place(e, { wave: w })}
                onMouseLeave={() => setTip(null)}
              />
            );
          })}

          {/* axis titles */}
          <text x={ML} y={MT - 6} fontFamily="IBM Plex Mono" fontSize="9" fill="hsl(var(--muted-foreground))" style={{ textTransform: "uppercase", letterSpacing: "0.15em" }}>
            wave dps {targetLabel(targetClass)}
          </text>
          <text x={innerW - MR} y={MT - 6} textAnchor="end" fontFamily="IBM Plex Mono" fontSize="9" fill="hsl(26 88% 52% / 0.8)" style={{ textTransform: "uppercase", letterSpacing: "0.15em" }}>
            cumulative dps {targetLabel(targetClass)}
          </text>
        </svg>
      </div>

      {tip?.wave && <WaveTip tip={tip} targetClass={targetClass} />}
      {tip?.upg && (
        <div className="absolute z-20 w-[320px] pointer-events-none schematic-panel bg-popover p-3" style={{ left: tip.left, top: tip.top }}>
          <div className="tech-label text-primary mb-1">AI upgrade · t {fmtClock(tip.upg.t)}</div>
          <div className="font-mono text-[10px] leading-relaxed text-foreground/90">
            {tip.upg.research.map((r, i) => <div key={i}>· {r}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}

function WaveTip({ tip, targetClass }) {
  const w = tip.wave;
  return (
    <div className="absolute z-20 w-[330px] pointer-events-none schematic-panel bg-popover p-3" style={{ left: tip.left, top: tip.top }}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display font-bold text-sm tracking-[0.12em] uppercase">{w.name}</span>
        <span className="font-mono text-[10px] text-muted-foreground">t {fmtClock(w.t0)}{w.jitter > 0 ? ` – ${fmtClock(w.t1)}` : ""}</span>
      </div>
      {w.isAlt && <div className="tech-label text-accent mt-0.5">replaces wave {w.replacesWave} · {w.effProb}% chance</div>}
      {!w.isAlt && w.ghost && <div className="tech-label text-accent mt-0.5">spawn probability {w.effProb}%</div>}
      <div className="grid grid-cols-3 gap-2 my-2 font-mono text-center">
        {[["DPS " + targetLabel(targetClass), fmtNum(w.dps, w.dps < 100 ? 1 : 0)], ["WAVE HP", fmtNum(w.hp)], ["UNITS", `${w.unitCount}${w.extraMax > 0 ? `+${w.extraMax}` : ""}`]].map(([k, v]) => (
          <div key={k}>
            <div className="text-sm font-semibold text-primary ember-glow leading-none">{v}</div>
            <div className="text-[8px] tracking-[0.15em] text-muted-foreground mt-1 uppercase">{k}</div>
          </div>
        ))}
      </div>
      <div className="space-y-0.5">
        {w.segments.map((s) => (
          <div key={s.slot} className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="inline-block w-2 h-2 shrink-0" style={{ background: CLASS_COLOR[s.unitClass] || CLASS_COLOR.Unresolved }} />
            <span className={s.unresolved ? "text-muted-foreground" : "text-foreground/90"}>
              {s.count}{s.randomExtra > 0 ? `±${s.randomExtra}` : ""}× {s.name}
              {s.unresolved ? " — excluded from DPS/HP" : ` (${s.unitClass})`}
              {s.delta !== 0 ? ` [${s.delta > 0 ? "+" : ""}${s.delta} diff]` : ""}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {w.formations.map((f) => (
          <span key={f} className="px-1.5 py-0.5 border border-border font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{f}</span>
        ))}
        {w.stance && <span className="px-1.5 py-0.5 border border-primary/50 text-primary font-mono text-[9px] uppercase tracking-wider">{w.stance}</span>}
        <span className="px-1.5 py-0.5 border border-border font-mono text-[9px] uppercase tracking-wider text-muted-foreground">stations {w.stations}</span>
      </div>
      {w.jitter > 0 && <div className="tech-label mt-2">column width = ±{Math.round(w.jitter)}s spawn jitter</div>}
    </div>
  );
}
