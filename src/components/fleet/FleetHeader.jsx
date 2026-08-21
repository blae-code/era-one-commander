import React from "react";
import { Ship } from "lucide-react";

// Page header: title, dataset stamp, headline mono readout, clear-roster control.
export default function FleetHeader({ readout = [], stamp = "", onClear, canClear = false }) {
  return (
    <div className="schematic-panel rust-wash p-5 mb-5 flex items-center justify-between flex-wrap gap-4">
      <div className="absolute bottom-0 left-0 right-0 h-[3px] hazard-stripes opacity-70" />
      <div className="flex items-center gap-4">
        <div className="border border-primary/40 p-2 bg-black/40 welded-frame">
          <Ship size={30} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none uppercase">Fleet Analysis</h1>
          <p className="tech-label mt-1.5">Force composition · fleetPlan roll-up · {stamp || "no dataset"}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex gap-6 font-mono text-center">
          {readout.map(([k, v]) => (
            <div key={k}>
              <div className="text-lg font-semibold text-primary leading-none ember-glow">{v}</div>
              <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div>
            </div>
          ))}
        </div>
        {canClear && (
          <button
            onClick={onClear}
            className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border border-border hover:border-primary hover:text-primary transition-colors"
          >
            Clear roster
          </button>
        )}
      </div>
    </div>
  );
}
