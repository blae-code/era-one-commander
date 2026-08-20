import React from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { CategoryIcon } from "@/components/icons/EraIcons";

export default function BuildWarnings({ warnings, onRemove }) {
  if (!warnings.length) {
    return (
      <div className="schematic-panel p-2.5 flex items-center gap-2 border-[#2ecc71]/50">
        <CheckCircle2 size={14} className="text-[#2ecc71]" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#2ecc71]">✔ Build within tolerances</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {warnings.map((w) => (
        <div key={w.id} className="schematic-panel p-2.5 border-destructive/60 bg-destructive/5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-destructive shrink-0" />
            <div className="min-w-0">
              <div className="font-display text-[11px] uppercase tracking-wider text-destructive leading-none">✖ {w.label}</div>
              <div className="font-mono text-[9px] text-muted-foreground mt-1">{w.detail} · over by {Math.round(w.over)} {w.unit}</div>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            {w.offenders.map((p) => (
              <div key={p.key} className="flex items-center gap-1.5 font-mono text-[10px] bg-black/30 border border-destructive/30 px-1.5 py-1">
                <CategoryIcon category={p.component.category} size={11} />
                <span className="truncate">{p.component.name}</span>
                <span className="ml-auto text-destructive shrink-0">▲ {Math.round(w.valueOf(p))} {w.unit}</span>
                <span className="text-muted-foreground text-[9px] shrink-0">[{p.x},{p.y}]</span>
                <button title="Remove module" onClick={() => onRemove(p.key)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <X size={11} />
                </button>
              </div>
            ))}
            {w.offenders.length === 0 && <div className="tech-label">No single module attributable — reduce total load</div>}
          </div>
        </div>
      ))}
    </div>
  );
}