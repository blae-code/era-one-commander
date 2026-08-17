import React from "react";
import { HullIcon } from "@/components/icons/EraIcons";
import { fmt } from "@/lib/shipStats";

export default function HullSelector({ hulls, selectedId, onSelect }) {
  return (
    <div className="space-y-1.5">
      {hulls.map((h) => (
        <button
          key={h.id}
          onClick={() => onSelect(h)}
          className={`w-full text-left p-2.5 border transition-colors flex items-center gap-2.5 ${
            selectedId === h.id
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <HullIcon size={22} className={selectedId === h.id ? "text-primary" : "text-muted-foreground"} />
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold text-sm leading-tight truncate">{h.name}</div>
            <div className="tech-label">{h.ship_class} · {h.grid_width}×{h.grid_height} grid</div>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground text-right">
            <div>{fmt(h.mass)}t</div>
            <div>{fmt(h.hp)} HP</div>
          </div>
        </button>
      ))}
    </div>
  );
}