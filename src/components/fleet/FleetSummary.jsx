import React from "react";
import StatBar from "@/components/shared/StatBar";
import { fmtNum } from "@/lib/gameData";

// TOTALS band from fleetPlan.totals — headline mono readouts + StatBars.
// Deliberately NO class-free DPS figure here: comparative DPS lives in FleetContribution,
// always against a named target class.
export default function FleetSummary({ totals, stamp = "" }) {
  const t = /** @type {any} */ (totals) || {};
  const net = t.energy_net || 0;
  const eMax = Math.max(t.energy_production || 0, t.energy_use || 0, 1);
  const headline = [
    ["COST RU", fmtNum(t.cost_resources || 0)],
    ["CREW", fmtNum(t.cost_population || 0)],
    ["BUILD S", fmtNum(t.construction_time || 0)],
    ["PARTS", fmtNum(t.part_count || 0)],
    ["ENERGY NET /S", `${net >= 0 ? "+" : ""}${fmtNum(net, 1)}`, net < 0],
  ].map(([label, value, danger = false]) => [String(label), value, danger]);
  return (
    <div className="schematic-panel p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="tech-label">Force totals</div>
        {stamp && <div className="tech-label">{stamp}</div>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center mb-5">
        {headline.map(([label, value, danger]) => (
          <div key={String(label)} className={`border py-2.5 px-1 ${danger ? "border-[#ff2d55] bg-[#ff2d55]/10" : "border-border bg-black/30"}`}>
            <div className={`text-xl font-semibold leading-none ${danger ? "text-[#ff2d55]" : "text-primary ember-glow"}`}>{value}</div>
            <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1.5">{label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        <StatBar label="Max health" value={t.max_health || 0} max={t.max_health || 0} unit="hp" />
        <StatBar label="Mass" value={t.mass || 0} max={t.mass || 0} />
        <StatBar label="Energy production" value={t.energy_production || 0} max={eMax} unit="/s" color="bg-[#38bdf8]" />
        <StatBar label="Energy use" value={t.energy_use || 0} max={eMax} unit="/s" color={net < 0 ? "bg-[#ff2d55]" : "bg-[#ffb020]"} />
        <StatBar label="Cargo capacity" value={t.cargo_capacity || 0} max={t.cargo_capacity || 0} />
        <StatBar label="Extraction rate" value={t.extraction_rate || 0} max={t.extraction_rate || 0} unit="/s" color="bg-[#22c55e]" />
      </div>
      {net < 0 && (
        <div className="mt-3 font-mono text-[10px] text-[#ff2d55] uppercase tracking-wider">
          ⚠ Energy deficit {fmtNum(net, 1)}/s — add reactor capacity
        </div>
      )}
    </div>
  );
}
