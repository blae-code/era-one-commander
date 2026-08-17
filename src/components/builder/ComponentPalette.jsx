import React, { useState } from "react";
import { CategoryIcon } from "@/components/icons/EraIcons";
import TierBadge from "@/components/shared/TierBadge";
import { fmt } from "@/lib/shipStats";

const CATS = ["all", "weapon", "engine", "reactor", "shield", "module"];

export default function ComponentPalette({ components, selected, onSelect }) {
  const [cat, setCat] = useState("all");
  const list = cat === "all" ? components : components.filter((c) => c.category === cat);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap gap-1 mb-2">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-2 py-1 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
              cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {list.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(selected?.id === c.id ? null : c)}
            className={`w-full text-left px-2.5 py-2 border flex items-center gap-2.5 transition-colors ${
              selected?.id === c.id ? "border-accent bg-accent/10" : "border-border bg-card hover:border-accent/50"
            }`}
          >
            <CategoryIcon category={c.category} size={16} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium leading-tight truncate">{c.name}</div>
              <div className="font-mono text-[9px] text-muted-foreground">
                {c.grid_w || 1}×{c.grid_h || 1} · {fmt(c.mass)}t · {c.power >= 0 ? "+" : ""}{fmt(c.power)}MW
              </div>
            </div>
            <TierBadge tier={c.tier} />
          </button>
        ))}
        {list.length === 0 && <div className="tech-label py-4 text-center">No components</div>}
      </div>
    </div>
  );
}