import React from "react";
import { HullIcon } from "@/components/icons/EraIcons";

export default function BlueprintPushList({ blueprints, selected, onToggle }) {
  return (
    <div className="max-h-[420px] overflow-y-auto">
      {blueprints.length === 0 ? (
        <div className="tech-label py-8 text-center">No blueprints registered</div>
      ) : (
        blueprints.map((bp) => {
          const on = selected.includes(bp.id);
          return (
            <button key={bp.id} onClick={() => onToggle(bp.id)}
              className={`w-full flex items-center gap-2 px-1 py-1.5 border-b border-border/40 text-left ${on ? "bg-primary/10" : ""}`}>
              <span className={`w-3 h-3 border shrink-0 ${on ? "bg-primary border-primary" : "border-border"}`} />
              <HullIcon size={13} className="text-muted-foreground shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xs truncate">{bp.name}</span>
                <span className="block font-mono text-[9px] text-muted-foreground truncate">{bp.hull_name || "—"} · {(bp.placements || []).length} modules</span>
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}