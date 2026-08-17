import React from "react";
import { Ship, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/shipStats";

// Command-Deck style banner for Fleet Analysis: identity block, live fleet readout, clear action.
export default function FleetHeader({ totals, hulls, designs, onClear }) {
  const readout = [
    ["DESIGNS", String(designs).padStart(2, "0"), null],
    ["HULLS", String(hulls).padStart(2, "0"), null],
    ["FLEET DPS", fmt(totals.dps), "#ff7a1a"],
    ["SHIELDS", fmt(totals.shield), "#eef4fa"],
    ["HULL HP", fmt(totals.hp), "#38bdf8"],
  ];

  return (
    <div className="schematic-panel p-4 mb-4 flex items-center justify-between gap-4 bg-gradient-to-r from-card to-primary/5">
      <div className="flex items-center gap-4 min-w-0">
        <Ship size={38} className="text-primary shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">FLEET ANALYSIS</h1>
          <p className="tech-label mt-1.5 truncate">
            {designs ? `Roster // ${designs} design${designs > 1 ? "s" : ""} · ${hulls} hulls fielded` : "Add saved blueprints to build a roster"}
          </p>
        </div>
      </div>

      <div className="hidden xl:flex gap-6 font-mono text-center">
        {readout.map(([k, v, hex]) => (
          <div key={k}>
            <div className="text-xl font-semibold leading-none" style={{ color: hex || "hsl(var(--primary))" }}>{v}</div>
            <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div>
          </div>
        ))}
      </div>

      <div className="shrink-0">
        <Button variant="outline" className="rounded-none font-display uppercase tracking-wider" disabled={designs === 0} onClick={onClear}>
          <Trash2 size={14} className="mr-1.5" /> Clear fleet
        </Button>
      </div>
    </div>
  );
}