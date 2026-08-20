import React, { useMemo } from "react";
import { Boxes } from "lucide-react";
import { clusterBlueprints } from "@/lib/archetypes";
import ArchetypeChip from "./ArchetypeChip";

// Auto-clustering board: every saved design falls into a tactical role column.
export default function ArchetypeBoard({ blueprints }) {
  const { groups } = useMemo(() => clusterBlueprints(blueprints), [blueprints]);
  const live = groups.filter((g) => g.items.length);

  return (
    <div className="space-y-3">
      <div className="schematic-panel p-3 flex items-start gap-3">
        <Boxes size={18} className="text-primary shrink-0 mt-0.5" />
        <p className="text-[12px] leading-5 text-muted-foreground">
          Designs are scored against role profiles built from their own telemetry — damage density, effective HP per tonne, thrust-to-weight, and the share of weapon, shield/utility and cargo mounts. Scales are relative to your saved fleet, so clusters shift as you register new builds. The percentage is how clearly a design sits in its role rather than the runner-up.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {live.map((g) => (
          <div key={g.key} className="schematic-panel p-3 flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 shrink-0" style={{ background: g.color }} />
              <span className="font-display font-bold text-sm tracking-[0.14em] uppercase truncate">{g.label}</span>
              <span className="font-mono text-[9px] text-muted-foreground ml-auto">{g.code} · {g.items.length}</span>
            </div>
            <p className="tech-label leading-4 mb-2.5">{g.blurb}</p>
            <div className="space-y-2">
              {g.items.map((item) => <ArchetypeChip key={item.bp.id} item={item} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}