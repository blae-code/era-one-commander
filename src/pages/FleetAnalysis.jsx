import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import FleetPicker from "@/components/fleet/FleetPicker";
import FleetSummary from "@/components/fleet/FleetSummary";
import FleetContribution from "@/components/fleet/FleetContribution";
import FleetComposition from "@/components/fleet/FleetComposition";
import FleetHeader from "@/components/fleet/FleetHeader";

const SUM_KEYS = ["mass", "hp", "dps", "thrust", "power_gen", "power_use", "shield", "cargo"];

export default function FleetAnalysis() {
  const [roster, setRoster] = useState([]);

  const { data: blueprints = [], isLoading } = useQuery({
    queryKey: ["blueprints"],
    queryFn: () => base44.entities.Blueprint.list("-created_date", 200),
  });

  const addDesign = (bp) =>
    setRoster((prev) =>
      prev.some((r) => r.id === bp.id)
        ? prev.map((r) => (r.id === bp.id ? { ...r, qty: r.qty + 1 } : r))
        : [...prev, { id: bp.id, name: bp.name, ship_class: bp.ship_class, role: bp.role, stats: bp.stats || {}, qty: 1 }]
    );
  const setQty = (id, qty) =>
    setRoster((prev) => (qty <= 0 ? prev.filter((r) => r.id !== id) : prev.map((r) => (r.id === id ? { ...r, qty } : r))));
  const removeDesign = (id) => setRoster((prev) => prev.filter((r) => r.id !== id));

  const totals = SUM_KEYS.reduce((acc, key) => {
    acc[key] = roster.reduce((s, r) => s + (r.stats?.[key] || 0) * r.qty, 0);
    return acc;
  }, {});
  const hulls = roster.reduce((s, r) => s + r.qty, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <FleetHeader totals={totals} hulls={hulls} designs={roster.length} onClear={() => setRoster([])} />

      {isLoading ? (
        <div className="schematic-panel p-16 text-center tech-label">Loading designs…</div>
      ) : (
        <div className="space-y-5">
          <FleetPicker blueprints={blueprints} roster={roster} onAdd={addDesign} onSetQty={setQty} onRemove={removeDesign} />

          {roster.length > 0 ? (
            <>
              <FleetSummary totals={totals} hulls={hulls} designs={roster.length} />
              <FleetComposition roster={roster} hulls={hulls} />
              <FleetContribution roster={roster} />
            </>
          ) : (
            <div className="schematic-panel p-16 text-center tech-label">Add designs to generate the fleet readout</div>
          )}
        </div>
      )}
    </div>
  );
}