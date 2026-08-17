import React from "react";
import { CategoryIcon } from "@/components/icons/EraIcons";
import TierBadge from "@/components/shared/TierBadge";
import StatBar from "@/components/shared/StatBar";
import { fmt } from "@/lib/shipStats";

const STAT_ROWS = [
  { key: "dps", label: "Damage / Sec", max: 500, color: "bg-red-500" },
  { key: "range", label: "Range", max: 5000, color: "bg-orange-500", unit: "m" },
  { key: "fire_rate", label: "Fire Rate", max: 10, color: "bg-rose-400", decimals: 1 },
  { key: "thrust", label: "Thrust", max: 2000, color: "bg-amber-500", unit: "kN" },
  { key: "shield_hp", label: "Shield Capacity", max: 5000, color: "bg-cyan-500" },
  { key: "shield_regen", label: "Shield Regen", max: 100, color: "bg-teal-500", unit: "/s" },
  { key: "cargo", label: "Cargo", max: 2000, color: "bg-violet-500", unit: "m³" },
];

export default function ComponentDetail({ component: c }) {
  if (!c) return <div className="tech-label text-center py-16">Select a component to inspect</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-3 border border-border bg-secondary/50">
          <CategoryIcon category={c.category} size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-xl leading-tight">{c.name}</h2>
            <TierBadge tier={c.tier} />
          </div>
          <div className="tech-label mt-0.5">{c.category} · {c.subtype}{c.manufacturer ? ` · ${c.manufacturer}` : ""}</div>
        </div>
      </div>
      {c.description && <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>}
      <div className="grid grid-cols-3 gap-px bg-border border border-border">
        {[
          ["MASS", `${fmt(c.mass)}t`],
          ["POWER", `${c.power >= 0 ? "+" : ""}${fmt(c.power)}MW`],
          ["SIZE", `${c.grid_w || 1}×${c.grid_h || 1}`],
        ].map(([k, v]) => (
          <div key={k} className="bg-card p-2.5 text-center">
            <div className="font-mono text-[9px] text-muted-foreground tracking-widest">{k}</div>
            <div className="font-mono text-sm font-semibold">{v}</div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {STAT_ROWS.filter((r) => c[r.key]).map((r) => (
          <StatBar key={r.key} label={r.label} value={c[r.key]} max={r.max} unit={r.unit} color={r.color} decimals={r.decimals} />
        ))}
        {c.hp > 0 && <StatBar label="Module HP" value={c.hp} max={3000} color="bg-blue-600" />}
      </div>
      {c.damage_type && <div className="tech-label">Damage Type // {c.damage_type}</div>}
    </div>
  );
}