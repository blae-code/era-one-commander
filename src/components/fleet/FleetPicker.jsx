import React from "react";
import { Plus, Minus, X } from "lucide-react";
import { fmt } from "@/lib/shipStats";

// Roster editor: pick blueprints and set how many of each hull the fleet fields.
export default function FleetPicker({ blueprints, roster, onAdd, onSetQty, onRemove }) {
  const inFleet = (id) => roster.find((r) => r.id === id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <div className="tech-label mb-2">Available designs</div>
        <div className="border border-border divide-y divide-border max-h-[320px] overflow-y-auto">
          {blueprints.length === 0 && <div className="bg-card px-3 py-6 text-center tech-label">No blueprints registered</div>}
          {blueprints.map((bp) => {
            const entry = inFleet(bp.id);
            return (
              <button
                key={bp.id}
                onClick={() => onAdd(bp)}
                className="w-full bg-card px-3 py-2 flex items-center justify-between gap-3 text-left hover:bg-secondary/60 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-display font-semibold text-sm truncate">{bp.name}</div>
                  <div className="tech-label">{bp.hull_name} · {bp.ship_class}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-muted-foreground">{fmt(bp.stats?.dps)} dps</span>
                  {entry ? (
                    <span className="font-mono text-[10px] text-primary">×{entry.qty}</span>
                  ) : (
                    <Plus size={13} className="text-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="tech-label mb-2">Fleet roster // {roster.reduce((s, r) => s + r.qty, 0)} hulls</div>
        <div className="border border-border divide-y divide-border max-h-[320px] overflow-y-auto">
          {roster.length === 0 && <div className="bg-card px-3 py-6 text-center tech-label">Select designs to compose a fleet</div>}
          {roster.map((r) => (
            <div key={r.id} className="bg-card px-3 py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display font-semibold text-sm truncate">{r.name}</div>
                <div className="tech-label">{fmt((r.stats?.dps || 0) * r.qty)} dps · {fmt((r.stats?.hp || 0) * r.qty)} hp</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onSetQty(r.id, r.qty - 1)} className="p-1 border border-border hover:border-primary transition-colors" aria-label="Decrease">
                  <Minus size={11} />
                </button>
                <span className="font-mono text-xs w-7 text-center">{r.qty}</span>
                <button onClick={() => onSetQty(r.id, r.qty + 1)} className="p-1 border border-border hover:border-primary transition-colors" aria-label="Increase">
                  <Plus size={11} />
                </button>
                <button onClick={() => onRemove(r.id)} className="p-1 ml-1 border border-border text-[#ff2d55] hover:border-[#ff2d55] transition-colors" aria-label="Remove">
                  <X size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}