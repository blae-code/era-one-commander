import React from "react";
import { fmt } from "@/lib/shipStats";
import PowerGauge from "@/components/shared/PowerGauge";

// Aggregate readout for the whole fleet: headline combat totals plus derived fleet averages.
const CARDS = [
  { key: "dps", label: "Total DPS", accent: "text-[#ff7a1a]" },
  { key: "shield", label: "Combined Shields", accent: "text-[#eef4fa]" },
  { key: "hp", label: "Total Hull HP", accent: "text-[#38bdf8]" },
  { key: "thrust", label: "Total Thrust", unit: "kN", accent: "text-[#2f9bff]" },
  { key: "mass", label: "Fleet Mass", unit: "t", accent: "text-muted-foreground" },
  { key: "cargo", label: "Cargo Capacity", unit: "m³", accent: "text-[#ffd21a]" },
];

export default function FleetSummary({ totals, hulls, designs }) {
  const effectiveHp = (totals.hp || 0) + (totals.shield || 0);
  const twr = totals.mass > 0 ? totals.thrust / totals.mass : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-px bg-border border border-border">
        {CARDS.map(({ key, label, unit, accent }) => (
          <div key={key} className="bg-card p-3">
            <div className="tech-label">{label}</div>
            <div className={`font-display font-bold text-2xl leading-tight mt-0.5 ${accent}`}>
              {fmt(totals[key])}
              {unit && <span className="font-mono text-[10px] text-muted-foreground ml-1">{unit}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="schematic-panel p-3">
          <div className="tech-label mb-2">Fleet power grid</div>
          <PowerGauge gen={totals.power_gen || 0} use={totals.power_use || 0} />
        </div>
        <div className="schematic-panel p-3">
          <div className="tech-label mb-2">Derived fleet metrics</div>
          <div className="border border-border divide-y divide-border">
            {[
              ["Designs fielded", `${designs}`],
              ["Hulls fielded", `${hulls}`],
              ["Effective HP", `${fmt(effectiveHp)}`, "hull + shields"],
              ["Fleet TWR", fmt(twr, 2), twr >= 1 ? "✔ agile" : "▲ sluggish"],
              ["DPS per hull", hulls ? fmt((totals.dps || 0) / hulls, 1) : "—"],
              ["DPS per 1k mass", totals.mass ? fmt(((totals.dps || 0) / totals.mass) * 1000, 1) : "—"],
            ].map(([k, v, hint]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 px-2.5 py-1.5 bg-card">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k}</span>
                <span className="font-mono text-xs font-semibold">
                  {v}
                  {hint ? <span className="ml-1.5 font-normal text-[10px] text-muted-foreground">{hint}</span> : null}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}