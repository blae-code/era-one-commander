import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Boxes, Minus, Plus } from "lucide-react";
import { fmtNum } from "@/lib/gameData";
import { useCostResolver, costPlacements, mergeCostLines } from "@/lib/blueprintCost";
import CostLineList from "@/components/resources/CostLineList";
import TotalsBar from "@/components/resources/TotalsBar";

// Resource planning deck: pick blueprints (with build counts) and get one aggregated
// bill of materials across the whole production queue.
export default function ResourcePlan() {
  const { data: blueprints = [], isLoading } = useQuery({ queryKey: ["blueprints", "all"], queryFn: () => base44.entities.Blueprint.list("-created_date", 200) });
  const { resolve, isLoading: costing } = useCostResolver();
  const [counts, setCounts] = useState({});

  const bump = (id, d) => setCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + d) }));

  const perBp = useMemo(
    () => blueprints.map((bp) => ({ bp, n: counts[bp.id] || 0, cost: costPlacements(bp.placements || [], resolve, counts[bp.id] || 0) })),
    [blueprints, counts, resolve]
  );
  const selected = perBp.filter((x) => x.n > 0);
  const agg = useMemo(() => mergeCostLines(selected.map((x) => x.cost)), [selected]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="schematic-panel rust-wash p-5 mb-5 flex items-center justify-between flex-wrap gap-4">
        <div className="absolute bottom-0 left-0 right-0 h-[3px] hazard-stripes opacity-70" />
        <div className="flex items-center gap-4">
          <div className="border border-primary/40 p-2 bg-black/40 welded-frame"><Boxes size={30} className="text-primary" /></div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">RESOURCE PLANNING</h1>
            <p className="tech-label mt-1.5">Aggregate bill of materials across your production queue</p>
          </div>
        </div>
        <div className="font-mono text-center">
          <div className="text-2xl text-primary ember-glow leading-none">{fmtNum(agg.totals.ru)}</div>
          <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">TOTAL RU</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        {/* queue picker */}
        <div className="schematic-panel plate-texture p-3">
          <div className="tech-label mb-2">Production queue // {selected.length} design(s)</div>
          {isLoading ? (
            <div className="tech-label py-8 text-center animate-pulse">Loading designs…</div>
          ) : blueprints.length === 0 ? (
            <div className="tech-label py-8 text-center">No blueprints registered</div>
          ) : (
            <div className="space-y-px max-h-[560px] overflow-y-auto">
              {perBp.map(({ bp, n, cost }) => (
                <div key={bp.id} className={`flex items-center gap-2 px-1 py-1.5 border-b border-border/40 ${n ? "bg-primary/5" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-xs truncate">{bp.name}</div>
                    <div className="font-mono text-[9px] text-muted-foreground truncate">{bp.hull_name || "—"} · {(bp.placements || []).length} modules{n ? ` · ${fmtNum(cost.totals.ru)} RU` : ""}</div>
                  </div>
                  <button onClick={() => bump(bp.id, -1)} className="border border-border w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50"><Minus size={11} /></button>
                  <span className="font-mono text-xs w-6 text-center tabular-nums">{n}</span>
                  <button onClick={() => bump(bp.id, 1)} className="border border-border w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50"><Plus size={11} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* aggregated materials */}
        <div className="schematic-panel plate-texture p-3">
          <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
          <div className="tech-label mb-2">Materials required // {agg.lines.length} component type(s)</div>
          <TotalsBar totals={agg.totals} />
          <div className="mt-2">
            {costing ? <div className="tech-label py-8 text-center animate-pulse">Costing manifest…</div> : <CostLineList lines={agg.lines} maxHeight="520px" />}
          </div>
          {agg.unresolved > 0 && <div className="tech-label mt-2 text-[#ffd21a]">▲ {agg.unresolved} placement(s) not matched in the game dataset</div>}
        </div>
      </div>
    </div>
  );
}