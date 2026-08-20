import React from "react";
import { fmt } from "@/lib/shipStats";

// Segmented load bar: fills toward a cap, turns red past it, and shows the
// projected addition as a lighter amber segment.
function Bar({ label, used, cap, projected, unit }) {
  const over = cap > 0 && used > cap;
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
  const projPct = cap > 0 && projected > used ? Math.min(100 - pct, ((projected - used) / cap) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between font-mono text-[9px]">
        <span className="tracking-[0.16em] text-muted-foreground">{label}</span>
        <span className={over ? "text-[#ff4d4d]" : "text-foreground/80"}>
          {fmt(used, 0)}{projPct > 0 ? ` → ${fmt(projected, 0)}` : ""} / {fmt(cap, 0)} {unit}
        </span>
      </div>
      <div className="mt-1 h-2 bg-black/50 border border-border flex overflow-hidden">
        <div className={over ? "bg-destructive" : "bg-primary"} style={{ width: `${pct}%` }} />
        {projPct > 0 && <div className="bg-accent/70" style={{ width: `${projPct}%` }} />}
      </div>
    </div>
  );
}

export default function BudgetBars({ stats, projected, massCap, payload, projectedPayload }) {
  return (
    <div className="px-2 py-2 border-b border-border space-y-2">
      <Bar label="POWER DRAW" used={stats.power_use || 0} projected={projected ? projected.power_use || 0 : stats.power_use || 0} cap={stats.power_gen || 0} unit="PWR" />
      <Bar label="FRAME MASS" used={payload} projected={projectedPayload} cap={massCap} unit="T" />
    </div>
  );
}