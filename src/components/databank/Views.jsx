import React from "react";
import { Star, GitCompare } from "lucide-react";
import { Cell, EntityIcon, TierPips, CLASS_HEX, rowClass } from "./Cells";

// ---- Card grid --------------------------------------------------------------------------------
export function CardGrid({ rows, kind, kindKey, ctx, columns, stats, selectedId, onSelect, favorites, onFav, compareIds, onCompare }) {
  const numCols = columns.filter((c) => (c.type === "num" || c.type === "pct") && c.key !== "tier").slice(0, 6);
  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 overflow-auto h-full pr-1">
      {rows.map((r) => {
        const sel = r.game_id === selectedId, fav = favorites.has(r.game_id), cmp = compareIds.includes(r.game_id);
        const cls = rowClass(r, kindKey);
        return (
          <div key={r.game_id} onClick={() => onSelect(r.game_id)}
            className={`schematic-panel p-3 cursor-pointer transition-colors ${sel ? "border-primary/70 bg-primary/5" : "hover:border-primary/40"}`}
            style={{ borderLeft: `3px solid ${CLASS_HEX[cls] || "hsl(var(--primary))"}` }}>
            <div className="flex items-start gap-2">
              <EntityIcon row={r} kindKey={kindKey} size={20} />
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-sm leading-tight truncate">{r.name}</div>
                <div className="font-mono text-[9px] text-muted-foreground truncate">{r.game_id}{r.info ? ` · ${r.info}` : ""} <TierPips tier={r.tier} /></div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onFav(r.game_id); }} className={fav ? "text-[#ffd21a]" : "text-muted-foreground/40"}><Star size={13} fill={fav ? "currentColor" : "none"} /></button>
              <button onClick={(e) => { e.stopPropagation(); onCompare(r.game_id); }} className={cmp ? "text-[#2f9bff]" : "text-muted-foreground/40"}><GitCompare size={13} /></button>
            </div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 mt-2.5">
              {numCols.map((c) => (
                <div key={c.key}>
                  <div className="font-mono text-[8px] tracking-widest text-muted-foreground uppercase">{c.label}</div>
                  <Cell col={c} row={r} ctx={ctx} stats={stats} />
                </div>
              ))}
            </div>
            {r.description && <p className="text-[11px] text-muted-foreground leading-snug mt-2 line-clamp-2">{r.description}</p>}
          </div>
        );
      })}
      {rows.length === 0 && <div className="tech-label text-center py-12 col-span-full">No entries match</div>}
    </div>
  );
}

// Heatmap lives in HeatmapMatrix.jsx