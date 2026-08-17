import React from "react";
import { BarChart, Bar, XAxis, YAxis, Cell, LabelList, ResponsiveContainer, ReferenceLine } from "recharts";
import { fmtNum } from "@/lib/gameData";

// Two visual comparisons derived from the Weapon record:
//  1. Damage mitigation / amplification per target class (from class_damage_multipliers).
//  2. Projectile travel time across range bands — projectile speed itself is target-independent
//     in the game data, so what varies by engagement is time-to-impact, not the speed value.
const GOOD = "#38bdf8";
const BAD = "#ff2d55";
const NEUTRAL = "#8b98a6";
const SPEED = "#ff7a1a";

const axis = { fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(36 10% 65%)" };
const labelStyle = { fontSize: 10, fontFamily: "IBM Plex Mono", fill: "hsl(40 18% 95%)" };

function Panel({ title, note, children }) {
  return (
    <div className="schematic-panel p-3">
      <div className="tech-label mb-2">
        {title}
        {note ? <span className="text-muted-foreground/60"> // {note}</span> : null}
      </div>
      {children}
    </div>
  );
}

export default function WeaponTargetCharts({ weapon: r }) {
  const classes = r.class_damage_multipliers || [];
  const baseDps = r.dps || 0;

  // Positive = damage lost vs the weapon's base value, negative = bonus damage.
  const mitigation = [...classes]
    .sort((a, b) => (a.multiplier ?? 1) - (b.multiplier ?? 1))
    .map((m) => {
      const mult = m.multiplier ?? 1;
      return {
        name: m.entity_class,
        reduction: (1 - mult) * 100,
        effectiveDps: baseDps * mult,
        mult,
      };
    });

  const speed = r.bullet_speed || 0;
  const range = r.range || 0;
  const bands = speed > 0 && range > 0
    ? [0.25, 0.5, 0.75, 1].map((f) => ({
        name: `${Math.round(f * 100)}%`,
        distance: range * f,
        time: (range * f) / speed,
      }))
    : [];

  if (mitigation.length === 0 && bands.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      {mitigation.length > 0 && (
        <Panel title="Damage reduction by target class" note="vs. base damage">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mitigation} margin={{ top: 16, right: 6, bottom: 0, left: -14 }}>
              <XAxis dataKey="name" tick={axis} axisLine={{ stroke: "hsl(30 7% 24%)" }} tickLine={false} interval={0} />
              <YAxis tick={axis} axisLine={false} tickLine={false} width={42} unit="%" />
              <ReferenceLine y={0} stroke="hsl(30 7% 30%)" />
              <Bar dataKey="reduction" barSize={30} isAnimationActive={false}>
                {mitigation.map((d) => (
                  <Cell key={d.name} fill={d.reduction > 0 ? BAD : d.reduction < 0 ? GOOD : NEUTRAL} fillOpacity={0.85} />
                ))}
                <LabelList dataKey="reduction" position="top" formatter={(v) => `${v > 0 ? "−" : v < 0 ? "+" : ""}${fmtNum(Math.abs(v), 0)}%`} style={labelStyle} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-px bg-border border border-border">
            {mitigation.map((d) => (
              <div key={d.name} className="bg-card px-2 py-1 flex items-baseline justify-between gap-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground truncate">{d.name}</span>
                <span className="font-mono text-[10px] font-semibold">{fmtNum(d.effectiveDps, 1)} dps</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {bands.length > 0 && (
        <Panel title="Projectile travel time by engagement range" note={`${fmtNum(speed, 1)} speed · uniform vs all targets`}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bands} margin={{ top: 16, right: 6, bottom: 0, left: -14 }}>
              <XAxis dataKey="name" tick={axis} axisLine={{ stroke: "hsl(30 7% 24%)" }} tickLine={false} interval={0} />
              <YAxis tick={axis} axisLine={false} tickLine={false} width={42} unit="s" />
              <Bar dataKey="time" barSize={30} fill={SPEED} fillOpacity={0.85} isAnimationActive={false}>
                <LabelList dataKey="time" position="top" formatter={(v) => `${fmtNum(v, 2)}s`} style={labelStyle} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-px bg-border border border-border">
            {bands.map((d) => (
              <div key={d.name} className="bg-card px-2 py-1 flex items-baseline justify-between gap-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{d.name} range</span>
                <span className="font-mono text-[10px] font-semibold">{fmtNum(d.distance, 1)}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}