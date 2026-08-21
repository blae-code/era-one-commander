import React, { useMemo } from "react";
import TierBadge from "@/components/shared/TierBadge";
import { fmtNum } from "@/lib/gameData";

// Per-line breakdown from fleetPlan.lines[]. Ranking is re-derived CLIENT-SIDE on
// dps_vs_class[selectedClass] — never on any class-free scalar — and the class the
// ranking targets is named in the column header (RULE-3).
export default function FleetComposition({ lines = [], selectedClass }) {
  const sorted = useMemo(
    () => [...lines].sort((a, b) => (b.dps_vs_class?.[selectedClass] || 0) - (a.dps_vs_class?.[selectedClass] || 0)),
    [lines, selectedClass]
  );

  const headers = ["UNIT / MODULE", "KIND", "TIER", "COUNT", "COST RU", "CREW", "BUILD S", "HP", "MASS", "E-NET /S", `DPS VS ${String(selectedClass || "").toUpperCase()}`];

  return (
    <div className="schematic-panel p-4">
      <div className="tech-label mb-3">Fleet lines · ranked by dps vs {selectedClass}</div>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-[11px]">
          <thead>
            <tr className="text-left">
              {headers.map((h) => (
                <th key={h} className="tech-label font-normal pb-2 pr-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((l) => (
              <tr key={`${l.kind}:${l.game_id}`} className="hover:bg-secondary/40">
                <td className="py-1.5 pr-3">
                  <div className="font-display text-xs">{l.name || l.game_id}</div>
                  <div className="text-[9px] text-muted-foreground">{l.game_id}</div>
                </td>
                <td className="pr-3 uppercase text-[9px] text-muted-foreground">{l.kind}</td>
                <td className="pr-3"><TierBadge tier={l.tier || 1} /></td>
                <td className="pr-3 text-primary ember-glow">×{fmtNum(l.count)}</td>
                <td className="pr-3">{fmtNum(l.cost_resources)}</td>
                <td className="pr-3">{fmtNum(l.cost_population)}</td>
                <td className="pr-3">{fmtNum(l.construction_time)}</td>
                <td className="pr-3">{fmtNum(l.max_health)}</td>
                <td className="pr-3">{fmtNum(l.mass)}</td>
                <td className={`pr-3 ${(l.energy_net || 0) < 0 ? "text-[#ff2d55]" : "text-[#38bdf8]"}`}>
                  {(l.energy_net || 0) >= 0 ? "+" : ""}{fmtNum(l.energy_net, 1)}
                </td>
                <td className="pr-3 text-accent">{fmtNum(l.dps_vs_class?.[selectedClass] || 0, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
