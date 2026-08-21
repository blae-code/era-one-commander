import React from "react";
import { ENTITY_CLASSES, CLASS_LABEL, DEFAULT_CLASS } from "./classes";
import { fmtNum } from "@/lib/gameData";

// DPS-vs-class strip: fleetPlan.totals.dps_vs_class across the 13 EntityClasses.
// The selected target class is ALWAYS named beside the headline number (RULE-3);
// there is deliberately no class-free total anywhere on this panel.
export default function FleetContribution({ dpsVsClass = {}, selected = DEFAULT_CLASS, onSelect, capability = "" }) {
  const max = Math.max(1, ...ENTITY_CLASSES.map((c) => dpsVsClass?.[c] || 0));
  const value = dpsVsClass?.[selected] || 0;
  return (
    <div className="schematic-panel p-4">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="tech-label mb-1">Fleet DPS · by target class</div>
          <div className="font-mono">
            <span className="text-2xl font-semibold text-primary ember-glow">{fmtNum(value, 1)}</span>
            <span className="text-xs text-muted-foreground ml-2 uppercase tracking-wider">
              dps vs <span className="text-foreground">{selected}</span>
              {selected === DEFAULT_CLASS ? " (default)" : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 max-w-[560px] justify-end">
          {ENTITY_CLASSES.map((c) => (
            <button
              key={c}
              onClick={() => onSelect?.(c)}
              title={c}
              className={`px-2 py-1 font-mono text-[9px] uppercase tracking-wider border transition-colors ${
                selected === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
              }`}
            >
              {CLASS_LABEL[c] || c}
              {c === DEFAULT_CLASS ? " *" : ""}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        {ENTITY_CLASSES.map((c) => {
          const v = dpsVsClass?.[c] || 0;
          const active = c === selected;
          return (
            <button key={c} onClick={() => onSelect?.(c)} title={c} className="w-full flex items-center gap-2 group text-left">
              <span className={`w-28 shrink-0 font-mono text-[9px] uppercase tracking-wider ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                {CLASS_LABEL[c] || c}
              </span>
              <span className="flex-1 h-2 bg-secondary overflow-hidden">
                <span
                  className={`block h-full transition-all duration-300 ${active ? "bg-primary" : "bg-primary/40 group-hover:bg-primary/60"}`}
                  style={{ width: `${(v / max) * 100}%` }}
                />
              </span>
              <span className={`w-16 shrink-0 text-right font-mono text-[10px] ${active ? "text-primary ember-glow" : "text-muted-foreground"}`}>
                {fmtNum(v, 1)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="tech-label mt-3">* default target class{capability ? ` · backend: ${capability}` : ""}</p>
    </div>
  );
}
