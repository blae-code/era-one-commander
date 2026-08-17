import React from "react";
import { fmt } from "@/lib/shipStats";

export default function PowerGauge({ gen = 0, use = 0 }) {
  const net = gen - use;
  const pct = gen > 0 ? Math.min(100, (use / gen) * 100) : use > 0 ? 100 : 0;
  const ok = net >= 0;
  return (
    <div className={`p-3 border ${ok ? "border-border bg-card" : "border-[#ff2d55] bg-[#ff2d55]/10"}`}>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="tech-label">Power Grid</span>
        <span className={`font-mono text-xs font-semibold ${ok ? "text-[#38bdf8]" : "text-[#ff2d55]"}`}>
          {ok ? "✔ " : "✖ "}{net >= 0 ? "+" : ""}{fmt(net)} MW
        </span>
      </div>
      <div className="h-2 bg-secondary relative overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${pct > 90 ? "bg-[#ff2d55]" : pct > 70 ? "bg-[#ffb020]" : "bg-[#38bdf8]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 font-mono text-[10px] text-muted-foreground">
        <span>DRAW {fmt(use)}</span>
        <span>OUTPUT {fmt(gen)}</span>
      </div>
      {!ok && <div className="mt-1.5 font-mono text-[10px] text-[#ff2d55] uppercase tracking-wider">⚠ Power deficit — add reactor capacity</div>}
    </div>
  );
}