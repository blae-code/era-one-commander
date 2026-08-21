import React, { useMemo, useState } from "react";
import { fmtNum } from "@/lib/gameData";
import { orderOfBattle, teamColor, TARGET_CLASSES, fmtQty } from "./theatreModel";
import RailPanel from "./RailPanel";

const SORTS = [
  ["count", "COUNT"],
  ["hp", "HP"],
  ["dps", "DPS"],
];

// Enemy-side (Rogue/Team2) modules+units aggregated by identifier, catalog-joined.
// RULE-3: DPS is dps_vs_class vs the SELECTED target class, named in the panel header.
export default function OrderOfBattle({ marks, byId, targetClass, onTargetClass, activeId }) {
  const [sort, setSort] = useState("count");
  const rows = useMemo(() => {
    const r = orderOfBattle(marks, byId, targetClass);
    r.sort((a, b) => (b[sort] || 0) - (a[sort] || 0));
    return r;
  }, [marks, byId, targetClass, sort]);

  const totals = useMemo(() => {
    let count = 0, hp = 0, dps = 0;
    for (const r of rows) { count += r.count; hp += r.hp; dps += r.dps; }
    return { count, hp, dps };
  }, [rows]);

  return (
    <RailPanel title="Order of battle" meta={`DPS vs ${targetClass}`}>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="tech-label shrink-0">Target class</span>
        <select
          value={targetClass}
          onChange={(e) => onTargetClass(e.target.value)}
          className="rounded-none bg-black/50 border border-border font-mono text-[10px] px-1.5 py-1 text-foreground focus:border-primary outline-none"
        >
          {TARGET_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="mx-1 h-4 w-px bg-border" />
        {SORTS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setSort(k)}
            className={`px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] border ${sort === k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="tech-label py-3 text-center">No enemy-side installations or units on this map</div>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_36px_52px_52px_56px] gap-1 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground pb-1 border-b border-border/60">
            <span>Asset</span><span className="text-right">Qty</span><span className="text-right">HP Σ</span>
            <span className="text-right">Cost Σ</span><span className="text-right">DPS Σ</span>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {rows.map((r) => (
              <div
                key={r.id}
                className={`grid grid-cols-[1fr_36px_52px_52px_56px] gap-1 items-center py-[3px] font-mono text-[10px] border-b border-border/30 ${activeId === r.id ? "bg-primary/15" : ""}`}
              >
                <span className="truncate" title={r.id}>
                  <span style={{ color: teamColor(r.team) }}>■</span>{" "}
                  <span className="text-foreground/90">{r.name}</span>
                  <span className="text-muted-foreground text-[8px] ml-1 uppercase">{r.kind}</span>
                </span>
                <span className="text-right tabular-nums">{r.count}</span>
                <span className="text-right tabular-nums text-muted-foreground">{fmtQty(r.hp)}</span>
                <span className="text-right tabular-nums text-muted-foreground">{fmtQty(r.cost)}</span>
                <span className="text-right tabular-nums text-primary">{fmtNum(r.dps, 1)}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_36px_52px_52px_56px] gap-1 pt-1 font-mono text-[10px] font-semibold">
            <span className="tech-label">Σ vs {targetClass}</span>
            <span className="text-right tabular-nums">{totals.count}</span>
            <span className="text-right tabular-nums">{fmtQty(totals.hp)}</span>
            <span />
            <span className="text-right tabular-nums text-primary ember-glow">{fmtNum(totals.dps, 0)}</span>
          </div>
        </>
      )}
    </RailPanel>
  );
}
