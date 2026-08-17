import React from "react";
import { Star, GitCompare } from "lucide-react";
import { Cell, EntityIcon, TierPips, CLASS_HEX, rowClass } from "./Cells";
import { CLASSES } from "./catalog";
import { fmtNum } from "@/lib/gameData";

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

// ---- Heatmap: dps vs target class ----------------------------------------------------------
export function HeatmapView({ rows, kindKey, selectedId, onSelect }) {
  const withDps = rows.filter((r) => r.dps_vs_class && Object.values(r.dps_vs_class).some((v) => v > 0));
  if (!withDps.length) return <div className="schematic-panel p-8 tech-label text-center">Heatmap needs entries with armament — switch to Weapons, Modules, Ships or Turrets.</div>;
  const max = Math.max(...withDps.flatMap((r) => Object.values(r.dps_vs_class)));
  const short = (c) => c.replace("Unit", "").replace("Module", " mod").replace("Structural", "Struct.").replace("Facility", "Facil.");
  return (
    <div className="schematic-panel overflow-auto h-full">
      <table className="text-xs border-separate border-spacing-0 w-full">
        <thead className="sticky top-0 bg-secondary/95 z-10">
          <tr><th className="tech-label px-2 py-2 text-left border-b border-border">Entry</th>
            {CLASSES.map((c) => <th key={c} className="tech-label px-1 py-2 border-b border-border text-center whitespace-nowrap" title={c}>{short(c)}</th>)}
            <th className="tech-label px-2 py-2 border-b border-border text-right">DPS</th></tr>
        </thead>
        <tbody>
          {withDps.map((r) => (
            <tr key={r.game_id} onClick={() => onSelect(r.game_id)} className={`cursor-pointer ${r.game_id === selectedId ? "bg-primary/10" : "hover:bg-secondary/40"}`}>
              <td className="px-2 py-1 border-b border-border/60 whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><EntityIcon row={r} kindKey={kindKey} size={13} />{r.name}</span></td>
              {CLASSES.map((c) => { const v = r.dps_vs_class[c] || 0; const p = max ? v / max : 0;
                return <td key={c} className="px-1 py-1 border-b border-border/60 text-center font-mono text-[10px] tabular-nums" style={{ background: `hsl(var(--primary) / ${(p * 0.75).toFixed(2)})`, color: p > 0.55 ? "hsl(var(--primary-foreground))" : undefined }} title={`${r.name} vs ${c}: ${fmtNum(v, 1)} dps`}>{v ? fmtNum(v, 0) : ""}</td>; })}
              <td className="px-2 py-1 border-b border-border/60 text-right font-mono text-[10px]">{fmtNum(r.dps_total ?? r.dps, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
