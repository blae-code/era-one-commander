import React from "react";
import { fmtVal, labelize, personaHex, splitFields } from "./dossierModel";

// Side-by-side comparison of all five personalities.
// The varying/identical split is computed from the rows at runtime — knowing what is NOT
// a difference is as informative as the deltas, so the identical block is shown, greyed.
export default function CompareBoard({ rows = [], stamp = "" }) {
  const { varying, identical } = splitFields(rows);

  return (
    <div className="space-y-4">
      <div className="schematic-panel p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
          <div className="font-display font-bold uppercase tracking-[0.15em] text-sm">
            Divergent parameters <span className="text-primary font-mono text-xs ml-1">×{varying.length}</span>
          </div>
          <div className="tech-label">{stamp}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full font-mono text-[10px] align-top">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left tech-label font-normal py-2 pr-3 sticky left-0 bg-card z-10">parameter</th>
                {rows.map((r) => (
                  <th key={r.game_id} className="text-left py-2 px-3 uppercase tracking-[0.14em]" style={{ color: personaHex(r) }}>
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {varying.map((f) => (
                <tr key={f} className="border-b border-border/40 hover:bg-primary/5">
                  <td className="py-1.5 pr-3 tech-label sticky left-0 bg-card z-10 whitespace-nowrap">{labelize(f)}</td>
                  {rows.map((r) => (
                    <td key={r.game_id} className="py-1.5 px-3 whitespace-pre-wrap break-words align-top tabular-nums max-w-[220px]">
                      {fmtVal(r[f])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="schematic-panel p-4 opacity-60">
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
          <div className="font-display font-bold uppercase tracking-[0.15em] text-sm text-muted-foreground">
            Identical across all five <span className="font-mono text-xs ml-1">×{identical.length}</span>
          </div>
          <div className="tech-label">shared value shown once — these are NOT differentiators</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[10px] text-muted-foreground">
            <tbody>
              {identical.map((f) => (
                <tr key={f} className="border-b border-border/30">
                  <td className="py-1 pr-4 tech-label whitespace-nowrap">{labelize(f)}</td>
                  <td className="py-1 whitespace-pre-wrap break-words tabular-nums">{fmtVal(rows[0] ? rows[0][f] : undefined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
