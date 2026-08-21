import React from "react";
import { CategoryIcon } from "@/components/icons/EraIcons";
import { fmtNum } from "@/lib/gameData";

// Industrial bill-of-materials list: rank bar behind each row, tabular columns.
export default function CostLineList({ lines, maxHeight = "none" }) {
  const maxRu = Math.max(1, ...lines.map((l) => l.ru));
  return (
    <div className="overflow-y-auto" style={{ maxHeight }}>
      <div className="grid grid-cols-[1fr_44px_72px_60px_72px] gap-2 px-1 pb-1 border-b border-border font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground sticky top-0 bg-card z-10">
        <span>Item</span><span className="text-right">Qty</span><span className="text-right">RU</span><span className="text-right">Crew</span><span className="text-right">Build s</span>
      </div>
      {lines.map((l) => (
        <div key={l.key} className="relative grid grid-cols-[1fr_44px_72px_60px_72px] gap-2 items-center px-1 py-1 border-b border-border/40 font-mono text-[11px]">
          <span className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${(l.ru / maxRu) * 100}%` }} />
          <span className="relative flex items-center gap-1.5 min-w-0">
            <CategoryIcon category={l.category} size={12} />
            <span className="truncate">{l.name}</span>
            {l.tier > 0 && <span className="shrink-0 border border-border px-1 text-[8px] text-muted-foreground">T{l.tier}</span>}
            {!l.rec && <span className="text-[#ffd21a] text-[9px] shrink-0">▲</span>}
          </span>
          <span className="relative text-right text-muted-foreground">×{l.qty}</span>
          <span className="relative text-right tabular-nums">{fmtNum(l.ru)}</span>
          <span className="relative text-right tabular-nums text-muted-foreground">{fmtNum(l.crew)}</span>
          <span className="relative text-right tabular-nums text-muted-foreground">{fmtNum(l.time, 1)}</span>
        </div>
      ))}
      {lines.length === 0 && <div className="tech-label py-6 text-center">Nothing selected</div>}
    </div>
  );
}