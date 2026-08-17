import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Trash2 } from "lucide-react";
import { HullIcon } from "@/components/icons/EraIcons";
import { fmt } from "@/lib/shipStats";

// Command-Deck style banner for the builder: identity block, live readout, primary actions.
export default function BuilderHeader({ hull, loadedName, placements, stats, onClear, onSave }) {
  const readout = [
    ["MODULES", placements.length],
    ["MASS", fmt(stats.mass)],
    ["DPS", fmt(stats.dps)],
    ["HP", fmt(stats.hp)],
    ["NET MW", fmt((stats.power_gen || 0) - (stats.power_use || 0))],
  ];

  return (
    <div className="schematic-panel p-4 mb-4 flex items-center justify-between gap-4 bg-gradient-to-r from-card to-primary/5">
      <div className="flex items-center gap-4 min-w-0">
        <HullIcon size={38} className="text-primary shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">SHIP BUILDER</h1>
          <p className="tech-label mt-1.5 truncate">
            {loadedName ? `Loaded // ${loadedName}` : hull ? `Frame // ${hull.name}` : "Select a hull frame to begin"}
          </p>
        </div>
      </div>

      <div className="hidden xl:flex gap-6 font-mono text-center">
        {readout.map(([k, v]) => (
          <div key={k}>
            <div className="text-xl font-semibold text-primary leading-none">{v}</div>
            <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 shrink-0">
        <Button variant="outline" className="rounded-none font-display uppercase tracking-wider" disabled={placements.length === 0} onClick={onClear}>
          <Trash2 size={14} className="mr-1.5" /> Clear
        </Button>
        <Button className="rounded-none font-display uppercase tracking-wider" disabled={!hull || placements.length === 0} onClick={onSave}>
          <Save size={14} className="mr-1.5" /> Save Blueprint
        </Button>
      </div>
    </div>
  );
}