import React from "react";
import StatBar from "@/components/shared/StatBar";
import PowerGauge from "@/components/shared/PowerGauge";
import { fmt } from "@/lib/shipStats";

export default function StatsPanel({ stats }) {
  return (
    <div className="space-y-3">
      <PowerGauge gen={stats.power_gen} use={stats.power_use} />
      <div className="schematic-panel p-3 space-y-3">
        <StatBar label="Hull Integrity" value={stats.hp} max={20000} unit="HP" color="bg-[#a1786b]" />
        <StatBar label="Shield Capacity" value={stats.shield} max={10000} unit="SP" color="bg-[#8c9aa3]" />
        <StatBar label="Firepower" value={stats.dps} max={2000} unit="DPS" color="bg-[#d4713f]" />
        <StatBar label="Thrust" value={stats.thrust} max={5000} unit="kN" color="bg-[#b8963f]" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="schematic-panel p-2.5 text-center">
          <div className="tech-label">Total Mass</div>
          <div className="font-mono text-lg font-semibold">{fmt(stats.mass)}<span className="text-xs text-muted-foreground">t</span></div>
        </div>
        <div className="schematic-panel p-2.5 text-center">
          <div className="tech-label">TWR</div>
          <div className={`font-mono text-lg font-semibold ${stats.twr >= 1 ? "text-emerald-400" : "text-amber-400"}`}>
            {fmt(stats.twr, 2)}
          </div>
        </div>
        <div className="schematic-panel p-2.5 text-center col-span-2">
          <div className="tech-label">Cargo Capacity</div>
          <div className="font-mono text-lg font-semibold">{fmt(stats.cargo)}<span className="text-xs text-muted-foreground">m³</span></div>
        </div>
      </div>
    </div>
  );
}