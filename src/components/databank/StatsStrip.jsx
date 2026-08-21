import React, { useMemo, useState } from "react";
import { fmtNum } from "@/lib/gameData";

// Distribution strip: pick any numeric column, see min/median/avg/max + a histogram.
// Clicking a histogram bar applies a range filter (when the column supports ranges).
export default function StatsStrip({ rows, kind, ctx, db }) {
  const numCols = kind.columns.filter((c) => (c.type === "num" || c.type === "pct") && db.visibleCols.includes(c.key));
  const [manual, setManual] = useState(null);
  const col = numCols.find((c) => c.key === manual) || numCols.find((c) => c.key === db.sortKey) || numCols[0];

  const d = useMemo(() => {
    if (!col) return null;
    const vals = rows.map((r) => col.get(r, ctx)).filter((v) => typeof v === "number").sort((a, b) => a - b);
    if (!vals.length) return null;
    const min = vals[0], max = vals[vals.length - 1], span = max - min || 1;
    const bins = 28, hist = new Array(bins).fill(0);
    for (const v of vals) hist[Math.min(bins - 1, Math.floor(((v - min) / span) * bins))]++;
    return { n: vals.length, min, max, span, avg: vals.reduce((a, b) => a + b, 0) / vals.length, med: vals[Math.floor(vals.length / 2)], hist, hmax: Math.max(...hist) };
  }, [rows, col, ctx]);

  if (!col || !d) return null;
  const canFilter = kind.ranges.includes(col.key);
  const f = (v) => fmtNum(v, col.dec ?? 1);

  return (
    <div className="schematic-panel px-3 py-2 mb-3 flex items-center gap-4 flex-wrap" role="group" aria-label={`${col.label} distribution, ${d.n} values`}>
      <select value={col.key} onChange={(e) => setManual(e.target.value)} aria-label="Distribution column"
        className="h-6 bg-background/60 border border-border px-1 font-mono text-[10px] uppercase tracking-wider outline-none focus:border-primary text-foreground">
        {numCols.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
      </select>
      {[["MIN", d.min], ["MEDIAN", d.med], ["AVG", d.avg], ["MAX", d.max]].map(([k, v]) => (
        <div key={k} className="font-mono text-center">
          <div className="text-xs text-primary leading-none tabular-nums">{f(v)}</div>
          <div className="text-[8px] tracking-[0.2em] text-muted-foreground mt-0.5">{k}</div>
        </div>
      ))}
      <div className="flex items-end gap-px h-7 flex-1 min-w-[160px]">
        {d.hist.map((n, i) => {
          const lo = d.min + (d.span * i) / d.hist.length, hi = d.min + (d.span * (i + 1)) / d.hist.length;
          const apply = canFilter ? () => db.setRange(col.key, Math.floor(lo), Math.ceil(hi)) : undefined;
          return (
            <div key={i}
              onClick={apply}
              role={canFilter ? "button" : undefined}
              tabIndex={canFilter ? 0 : undefined}
              aria-label={canFilter ? `Filter ${col.label} to ${f(lo)} – ${f(hi)} (${n} entries)` : undefined}
              onKeyDown={canFilter ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); apply(); } } : undefined}
              className={`flex-1 bg-primary/60 hover:bg-primary transition-colors ${canFilter ? "cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary" : ""}`}
              style={{ height: `${n ? Math.max(8, (n / d.hmax) * 100) : 2}%`, opacity: n ? 1 : 0.25 }}
              title={`${f(lo)} – ${f(hi)}: ${n} entries${canFilter ? " · click to filter" : ""}`} />
          );
        })}
      </div>
      <span className="tech-label whitespace-nowrap">{d.n} values · {col.label} distribution</span>
    </div>
  );
}