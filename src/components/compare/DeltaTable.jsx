import React from "react";
import { fmt } from "@/lib/shipStats";

export default function DeltaTable({ a, b, rows }) {
  return (
    <div className="schematic-panel divide-y divide-border">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-3 py-2 bg-secondary/50">
        <div className="font-display font-semibold text-sm text-[#d4713f] truncate">{a?.name || "—"}</div>
        <div className="tech-label self-center">VS</div>
        <div className="font-display font-semibold text-sm text-[#8c9aa3] text-right truncate">{b?.name || "—"}</div>
      </div>
      {rows.map(({ key, label, unit, decimals = 0, lowerBetter }) => {
        const va = a?.[key] ?? 0;
        const vb = b?.[key] ?? 0;
        const diff = va - vb;
        const aWins = lowerBetter ? va < vb : va > vb;
        const tie = va === vb;
        return (
          <div key={key} className="grid grid-cols-[1fr_auto_1fr] gap-2 px-3 py-2 items-center">
            <div className={`font-mono text-sm ${!tie && aWins ? "font-semibold text-[#d4713f]" : "text-foreground/70"}`}>
              {fmt(va, decimals)}{unit}
            </div>
            <div className="text-center min-w-[110px]">
              <div className="tech-label">{label}</div>
              {!tie && (
                <div className={`font-mono text-[10px] ${diff > 0 ? "text-[#d4713f]" : "text-[#8c9aa3]"}`}>
                  {diff > 0 ? "▲" : "▼"} {fmt(Math.abs(diff), decimals)}
                </div>
              )}
            </div>
            <div className={`font-mono text-sm text-right ${!tie && !aWins ? "font-semibold text-[#8c9aa3]" : "text-foreground/70"}`}>
              {fmt(vb, decimals)}{unit}
            </div>
          </div>
        );
      })}
    </div>
  );
}