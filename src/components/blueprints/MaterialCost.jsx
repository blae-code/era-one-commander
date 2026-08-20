import React, { useMemo } from "react";
import { Boxes } from "lucide-react";
import { useCostResolver, costPlacements } from "@/lib/blueprintCost";
import CostLineList from "@/components/resources/CostLineList";
import TotalsBar from "@/components/resources/TotalsBar";

// Bill of materials for a single blueprint.
export default function MaterialCost({ placements = [] }) {
  const { resolve, isLoading } = useCostResolver();
  const { lines, totals, unresolved } = useMemo(() => costPlacements(placements, resolve), [placements, resolve]);

  return (
    <div className="schematic-panel plate-texture p-3 mt-3">
      <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
      <div className="flex items-center gap-2 mb-2">
        <Boxes size={14} className="text-primary" />
        <div className="tech-label">Material Cost // bill of materials</div>
      </div>
      <TotalsBar totals={totals} />
      <div className="mt-2">
        {isLoading ? <div className="tech-label py-4 text-center animate-pulse">Costing manifest…</div> : <CostLineList lines={lines} maxHeight="16rem" />}
      </div>
      {unresolved > 0 && <div className="tech-label mt-2 text-[#ffd21a]">▲ {unresolved} placement(s) not matched in the game dataset</div>}
    </div>
  );
}