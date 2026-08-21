import React, { useMemo, useState } from "react";
import { Plus, Minus, X, Search } from "lucide-react";
import TierBadge from "@/components/shared/TierBadge";
import { fmtNum } from "@/lib/gameData";

const KIND_FILTERS = [
  ["all", "ALL"],
  ["Unit", "UNITS"],
  ["Module", "MODULES"],
];

// Roster editor over the REAL catalog: search Units + Modules, add with count steppers.
// NOTE: fleetPlan coerces count 0 to 1 server-side, so the stepper never emits 0 —
// decrementing below 1 removes the line instead.
export default function FleetPicker({ units = [], modules = [], roster = [], byId = {}, onAdd, onSetCount, onRemove }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");

  const pool = useMemo(() => {
    const rows = [];
    if (kind !== "Module")
      for (const u of units)
        rows.push({ game_id: u.game_id, name: u.name, tier: u.tier, cls: u.unit_class, kind: "Unit", cost: u.cost_resources });
    if (kind !== "Unit")
      for (const m of modules)
        rows.push({ game_id: m.game_id, name: m.name, tier: m.tier, cls: m.module_class, kind: "Module", cost: m.cost_resources });
    const needle = q.trim().toLowerCase();
    const hits = needle
      ? rows.filter((r) => (r.name || "").toLowerCase().includes(needle) || (r.game_id || "").toLowerCase().includes(needle))
      : rows;
    return { shown: hits.slice(0, 80), total: hits.length };
  }, [units, modules, q, kind]);

  const inRoster = useMemo(() => {
    const m = new Map();
    for (const r of roster) m.set(r.game_id, r.count);
    return m;
  }, [roster]);

  return (
    <div className="schematic-panel p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="tech-label">Catalog · units &amp; modules</div>
            <div className="flex gap-1">
              {KIND_FILTERS.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`px-2 py-1 font-mono text-[9px] uppercase tracking-wider border transition-colors ${
                    kind === k
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="SEARCH NAME OR GAME_ID…"
              className="w-full bg-black/30 border border-input pl-8 pr-3 py-2 font-mono text-[11px] uppercase tracking-wider placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary rounded-none"
            />
          </div>
          <div className="border border-border divide-y divide-border max-h-[300px] overflow-y-auto">
            {pool.shown.length === 0 && <div className="bg-card px-3 py-6 text-center tech-label">No catalog match</div>}
            {pool.shown.map((r) => {
              const count = inRoster.get(r.game_id);
              return (
                <button
                  key={`${r.kind}:${r.game_id}`}
                  onClick={() => onAdd(r.game_id)}
                  className="w-full bg-card px-3 py-2 flex items-center justify-between gap-3 text-left hover:bg-secondary/60 transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <TierBadge tier={r.tier || 1} />
                    <div className="min-w-0">
                      <div className="font-display font-semibold text-sm truncate">{r.name || r.game_id}</div>
                      <div className="tech-label">{r.game_id} · {r.cls || r.kind}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                    <span className="text-muted-foreground">{fmtNum(r.cost)} RU</span>
                    {count ? <span className="text-primary ember-glow">×{count}</span> : <Plus size={12} className="text-muted-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
          {pool.total > pool.shown.length && (
            <div className="tech-label mt-1.5">{pool.shown.length} of {pool.total} shown — refine the search</div>
          )}
        </div>

        <div>
          <div className="tech-label mb-2">Current roster</div>
          {roster.length === 0 ? (
            <div className="border border-dashed border-border px-3 py-8 text-center tech-label">
              Nothing fielded yet — pick from the catalog
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 content-start">
              {roster.map((r) => {
                const row = byId[r.game_id];
                return (
                  <div key={r.game_id} className="flex items-center gap-2 border border-primary/40 bg-primary/10 pl-2.5 pr-1.5 py-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider max-w-[180px] truncate" title={r.game_id}>
                      {row?.name || r.game_id}
                    </span>
                    <div className="flex items-center border border-border bg-black/30">
                      <button
                        aria-label={`decrease ${r.game_id}`}
                        onClick={() => (r.count <= 1 ? onRemove(r.game_id) : onSetCount(r.game_id, r.count - 1))}
                        className="px-1.5 py-1 text-muted-foreground hover:text-primary"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="font-mono text-[11px] px-1.5 text-primary ember-glow">{r.count}</span>
                      <button
                        aria-label={`increase ${r.game_id}`}
                        onClick={() => onSetCount(r.game_id, r.count + 1)}
                        className="px-1.5 py-1 text-muted-foreground hover:text-primary"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <button
                      aria-label={`remove ${r.game_id}`}
                      onClick={() => onRemove(r.game_id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
