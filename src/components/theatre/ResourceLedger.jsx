import React, { useMemo } from "react";
import { resourceLedger, rgbaCss, fmtQty } from "./theatreModel";
import RailPanel from "./RailPanel";

// Per-RU totals, placement counts and discrete tier breakdown over the scenario's
// asteroid placements; colours are the game's own Resource.color_rgba.
export default function ResourceLedger({ marks, resourcesById }) {
  const ledger = useMemo(() => resourceLedger(marks), [marks]);
  const grand = useMemo(() => ledger.reduce((s, e) => s + e.total, 0), [ledger]);

  return (
    <RailPanel title="Resource ledger" meta={grand ? `${fmtQty(grand)} RU` : null}>
      {ledger.length === 0 ? (
        <div className="tech-label py-3 text-center">No harvestable placements on this map</div>
      ) : (
        <>
          {/* stacked share bar */}
          <div className="flex h-3 border border-border/70 bg-black/50 mb-2 overflow-hidden">
            {ledger.map((e) => (
              <div
                key={e.ru}
                title={`${resourcesById?.[e.ru]?.name || e.ru} ${fmtQty(e.total)}`}
                style={{
                  width: `${(e.total / grand) * 100}%`,
                  background: rgbaCss(resourcesById?.[e.ru]?.color_rgba, 0.9),
                }}
              />
            ))}
          </div>
          {ledger.map((e) => {
            const res = resourcesById?.[e.ru];
            const color = rgbaCss(res?.color_rgba, 1);
            return (
              <div key={e.ru} className="py-1.5 border-b border-border/30 last:border-0">
                <div className="flex items-baseline justify-between font-mono text-[10px]">
                  <span className="uppercase tracking-[0.1em]">
                    <span style={{ color }}>■</span> {res?.name || e.ru}
                  </span>
                  <span className="tabular-nums">
                    <span className="text-foreground ember-glow">{fmtQty(e.total)}</span>
                    <span className="text-muted-foreground text-[9px] ml-1.5">× {e.count} sites</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {e.tiers.map(([q, n]) => (
                    <span
                      key={q}
                      className="border border-border/60 px-1 py-[1px] font-mono text-[8px] text-muted-foreground bg-black/40"
                    >
                      {fmtQty(q)} ×{n}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </RailPanel>
  );
}
