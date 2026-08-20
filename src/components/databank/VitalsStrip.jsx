import React, { useMemo } from "react";
import { SegBar, ArcGauge } from "./Readouts";

// Tactical vitals readout for a single databank record, scaled against the
// current dataset (peer maxima) so bars read like in-game load meters.
const peak = (rows, key) => rows.reduce((m, r) => Math.max(m, Number(r?.[key]) || 0), 0);

export default function VitalsStrip({ row, peers = [] }) {
  const max = useMemo(() => {
    const keys = ["max_health", "armor", "max_ablative_shield", "max_perimeter_shield", "energy_production", "energy_per_second", "energy_use", "mass", "mass_total", "cost_resources", "dps", "range", "rate_of_fire"];
    const out = {};
    for (const k of keys) out[k] = peak(peers.length ? peers : [row], k);
    return out;
  }, [peers, row]);

  const powerDraw = Number(row.energy_per_second ?? row.energy_use ?? 0);
  const mass = Number(row.mass ?? row.mass_total ?? 0);
  const isCombat = row.dps !== undefined && !row.module_class && !row.unit_class;

  const bars = isCombat
    ? [
        { label: "Damage /s", value: Number(row.dps) || 0, max: max.dps, color: "#ff7a1a", dec: 1 },
        { label: "Range", value: Number(row.range) || 0, max: max.range, color: "#2f9bff" },
        { label: "Cycle rate", value: Number(row.rate_of_fire) || 0, max: max.rate_of_fire, color: "#ffd21a", dec: 2, unit: "/s" },
      ]
    : [
        { label: "Hull integrity", value: Number(row.max_health) || 0, max: max.max_health, color: "#8cff5a" },
        { label: "Armor", value: Number(row.armor) || 0, max: max.armor, color: "#c9d6e3", dec: 1 },
        { label: "Ablative shield", value: Number(row.max_ablative_shield) || 0, max: max.max_ablative_shield, color: "#2f9bff" },
        { label: "Perim. shield", value: Number(row.max_perimeter_shield) || 0, max: max.max_perimeter_shield, color: "#00d1c1" },
        { label: "Power out", value: Number(row.energy_production) || 0, max: max.energy_production, color: "#ffd21a", dec: 1 },
        { label: "Power draw", value: powerDraw, max: Math.max(max.energy_per_second, max.energy_use), color: "#ff7a1a", dec: 1, danger: true },
      ];

  const anyValue = bars.some((b) => b.value > 0) || mass > 0 || Number(row.cost_resources) > 0;
  if (!anyValue) return null;

  return (
    <div className="schematic-panel plate-texture p-3 mb-4">
      <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
      <div className="tech-label mb-2">Tactical readout // scaled to dataset peak</div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
        <div className="space-y-1.5">
          {bars.filter((b) => b.max > 0).map((b) => <SegBar key={b.label} {...b} />)}
        </div>
        <div className="flex gap-1 justify-center">
          <ArcGauge label="Mass" value={mass} max={Math.max(max.mass, max.mass_total)} dec={1} color="#c9d6e3" />
          <ArcGauge label="Cost RU" value={Number(row.cost_resources) || 0} max={max.cost_resources} color="#ffd21a" />
          {isCombat && <ArcGauge label="Armor pen" value={(Number(row.armor_penetration) || 0) * 100} max={100} unit="%" color="#ff7a1a" />}
        </div>
      </div>
    </div>
  );
}