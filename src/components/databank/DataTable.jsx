import React, { useEffect, useRef } from "react";
import { ArrowUp, ArrowDown, Star, GitCompare } from "lucide-react";
import { Cell, EntityIcon, TierPips } from "./Cells";

// Sortable, keyboard-navigable table with heat-shaded numeric cells and mini bars.
export default function DataTable({ rows, kind, kindKey, ctx, columns, stats, sortKey, sortDir, onSort, selectedId, onSelect, favorites, onFav, compareIds, onCompare, density, notes }) {
  const ref = useRef(null);
  const pad = density === "compact" ? "py-1" : density === "comfortable" ? "py-3" : "py-1.5";
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      const i = rows.findIndex((r) => r.game_id === selectedId);
      if (e.key === "ArrowDown") { e.preventDefault(); onSelect(rows[Math.min(rows.length - 1, i + 1)]?.game_id); }
      if (e.key === "ArrowUp") { e.preventDefault(); onSelect(rows[Math.max(0, i - 1)]?.game_id); }
      if (e.key === "c" && selectedId) onCompare(selectedId);
      if (e.key === "f" && selectedId) onFav(selectedId);
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [rows, selectedId, onSelect, onCompare, onFav]);

  return (
    <div ref={ref} className="schematic-panel overflow-auto h-full">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur">
          <tr>
            <th className="w-16 px-2 py-2 border-b border-border" />
            {columns.map((c) => (
              <th key={c.key} onClick={() => onSort(c.key)} style={{ minWidth: c.width }}
                className={`tech-label px-2 py-2 font-normal whitespace-nowrap cursor-pointer select-none border-b border-border hover:text-primary ${c.type === "num" || c.type === "pct" ? "text-right" : "text-left"} ${sortKey === c.key ? "text-primary" : ""}`}>
                <span className="inline-flex items-center gap-1">{c.label}{sortKey === c.key ? (sortDir === "desc" ? <ArrowDown size={10} /> : <ArrowUp size={10} />) : null}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const sel = r.game_id === selectedId, fav = favorites.has(r.game_id), cmp = compareIds.includes(r.game_id);
            return (
              <tr key={r.game_id} onClick={() => onSelect(r.game_id)}
                className={`cursor-pointer transition-colors border-b border-border ${sel ? "bg-primary/10" : cmp ? "bg-[#2f9bff]/5" : "hover:bg-secondary/50"}`}>
                <td className={`px-2 ${pad} border-b border-border/60 align-middle`}>
                  <span className="inline-flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onFav(r.game_id); }} title="favourite (f)" className={`p-0.5 ${fav ? "text-[#ffd21a]" : "text-muted-foreground/40 hover:text-muted-foreground"}`}><Star size={12} fill={fav ? "currentColor" : "none"} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onCompare(r.game_id); }} title="compare (c)" className={`p-0.5 ${cmp ? "text-[#2f9bff]" : "text-muted-foreground/40 hover:text-muted-foreground"}`}><GitCompare size={12} /></button>
                  </span>
                </td>
                {columns.map((c, i) => (
                  <td key={c.key} className={`px-2 ${pad} border-b border-border/60 align-middle ${c.type === "list" ? "max-w-[260px]" : ""}`}>
                    {i === 0 && c.key === "name" ? (
                      <span className="flex items-center gap-2 min-w-0">
                        <EntityIcon row={r} kindKey={kindKey} />
                        <span className="min-w-0">
                          <span className="block text-xs font-medium truncate">{r.name}{notes?.[r.game_id] ? <span className="ml-1 text-[9px] text-primary" title={notes[r.game_id]}>✎</span> : null}</span>
                          <span className="block font-mono text-[9px] text-muted-foreground truncate">{r.game_id}{r.info ? ` · ${r.info}` : ""} {r.tier ? <TierPips tier={r.tier} /> : null}</span>
                        </span>
                      </span>
                    ) : <Cell col={c} row={r} ctx={ctx} stats={stats} />}
                  </td>
                ))}
              </tr>
            );
          })}
          {rows.length === 0 && <tr><td colSpan={columns.length + 1} className="tech-label text-center py-12">No entries match — clear a filter or loosen the query</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
