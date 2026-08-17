import React from "react";
import { fmt } from "@/lib/shipStats";

export default function StatBar({ label, value, max, unit = "", color = "bg-primary", decimals = 0 }) {
  const pct = max > 0 ? Math.min(100, ((value || 0) / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="tech-label">{label}</span>
        <span className="font-mono text-xs font-medium">
          {fmt(value, decimals)}
          {unit && <span className="text-muted-foreground ml-0.5">{unit}</span>}
        </span>
      </div>
      <div className="h-1.5 bg-secondary overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}