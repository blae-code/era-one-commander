import React from "react";
import { fmtNum } from "@/lib/gameData";

// N-way (2-4) side-by-side stat table with best-value highlighting.
// rows: [{ key, label, unit?, dec?, lowerBetter?, neutral?, get? }] — get(row) overrides row[key].
// lowerBetter flips the highlight for cost/mass/energy-draw style metrics; neutral skips it.
export default function DeltaTable({ items, colors, rows }) {
  const val = (r, def) => {
    const v = def.get ? def.get(r) : r?.[def.key];
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <div className="schematic-panel overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-secondary/50">
            <th className="tech-label text-left px-3 py-2 font-normal">METRIC</th>
            {items.map((it, i) => (
              <th
                key={it.game_id}
                className="px-3 py-2 text-right font-display font-semibold text-sm max-w-[170px] truncate"
                style={{ color: colors[i] }}
                title={it.game_id}
              >
                {it.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((def) => {
            const vals = items.map((it) => val(it, def));
            const best = def.lowerBetter ? Math.min(...vals) : Math.max(...vals);
            const allEqual = vals.every((v) => v === vals[0]);
            return (
              <tr key={def.key}>
                <td className="px-3 py-1.5 whitespace-nowrap">
                  <span className="tech-label">{def.label}</span>
                  {def.lowerBetter && (
                    <span className="font-mono text-[9px] text-muted-foreground ml-1.5">▼ lower better</span>
                  )}
                </td>
                {vals.map((v, i) => {
                  const isBest = !def.neutral && !allEqual && v === best;
                  return (
                    <td
                      key={items[i].game_id}
                      className={`px-3 py-1.5 text-right font-mono text-sm ${isBest ? "font-semibold" : "text-foreground/60"}`}
                      style={isBest ? { color: colors[i] } : undefined}
                    >
                      {isBest && <span className="mr-1">▲</span>}
                      {fmtNum(v, def.dec || 0)}{def.unit || ""}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
