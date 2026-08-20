import React from "react";
import { Link } from "react-router-dom";
import { ARCHETYPES } from "@/lib/archetypes";

// One clustered design: designation, confidence bar and what drove the classification.
export default function ArchetypeChip({ item }) {
  const { bp, confidence, secondary, drivers } = item;
  const s = bp.stats || {};
  const a = ARCHETYPES[secondary];

  return (
    <Link to={`/blueprints/${bp.id}`} className="block border border-border bg-card/70 p-2.5 hover:border-primary transition-colors group">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display font-semibold text-[13px] truncate group-hover:text-primary">{bp.name}</span>
        <span className="font-mono text-[9px] text-muted-foreground shrink-0">{Math.round(confidence * 100)}%</span>
      </div>
      <div className="h-[3px] bg-secondary mt-1.5 mb-2">
        <div className="h-full" style={{ width: `${Math.round(confidence * 100)}%`, background: ARCHETYPES[item.archetype].color }} />
      </div>
      <div className="grid grid-cols-3 gap-1 font-mono text-[9px] text-muted-foreground">
        <span>DPS {Math.round(s.dps || 0)}</span>
        <span>HP {Math.round((s.hp || 0) + (s.shield || 0))}</span>
        <span>TWR {(s.twr || 0).toFixed(2)}</span>
      </div>
      <div className="tech-label mt-1.5 truncate">
        {drivers.map((d) => d.label).join(" · ")} · else {a.label}
      </div>
    </Link>
  );
}