import React from "react";
import { Link } from "react-router-dom";
import { Zap, RotateCcw, ArrowUpRight } from "lucide-react";
import { fmtNum, useStatDefinitions } from "@/lib/gameData";
import { useResearchCall } from "./useResearch";

// researchImpact's cumulative_by_entity mixes two key shapes in one object:
// Add/Subtract accumulate under the bare stat name as a signed sum; Multiply/Set are
// stored under "<stat>:<operation>". Split on ":" before labelling, or "MaxSpeed:Multiply"
// renders as a stat name.
function fmtCum(key, v, labels) {
  const i = key.indexOf(":");
  if (i === -1) {
    const label = labels?.[key] || key;
    return `${label} ${v >= 0 ? "+" : "−"}${fmtNum(Math.abs(v), 2)}`;
  }
  const stat = key.slice(0, i), op = key.slice(i + 1);
  const label = labels?.[stat] || stat;
  if (op === "Multiply") return `${label} ×${fmtNum(v, 2)}`;
  if (op === "Set") return `${label} = ${fmtNum(v, 2)}`;
  return `${label} ${op} ${fmtNum(v, 2)}`;
}

const KIND_ROUTE = { Module: "Module", Unit: "Unit", Weapon: "Weapon", Turret: "Turret" };

function ChipList({ label, ids, ctx }) {
  if (!ids || ids.length === 0) return null;
  return (
    <div>
      <div className="tech-label mb-1">{label} · {ids.length}</div>
      <div className="flex flex-wrap gap-1">
        {ids.map((id) => {
          const row = ctx.byId[id];
          const kind = ctx.kindOf?.(id);
          const chip = (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-border font-mono text-[9px] hover:border-primary hover:text-primary">
              {row?.name || id}{KIND_ROUTE[kind] && <ArrowUpRight size={8} className="text-muted-foreground" />}
            </span>
          );
          return KIND_ROUTE[kind]
            ? <Link key={id} to={`/database?kind=${KIND_ROUTE[kind]}&sel=${id}`}>{chip}</Link>
            : <span key={id}>{chip}</span>;
        })}
      </div>
    </div>
  );
}

// IMPACT PANEL — researchImpact for the selected node (cumulative along its prerequisite
// path, minus the HAVE set): which concrete hardware changes by how much, and what unlocks.
export default function ImpactPanel({ id, have, ctx, onSelect, stamp }) {
  const { labels } = useStatDefinitions();
  const { data, loading, error, reload } = useResearchCall("researchImpact", { targets: [id], have }, !!id);

  if (!id) return null;

  const cum = data?.cumulative_by_entity || {};
  const cumEntries = Object.entries(cum);
  const unlocked = data?.unlocked || {};
  const pathIds = new Set((data?.path || []).map((n) => n.game_id));

  return (
    <div className="schematic-panel plate-texture p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="tech-label inline-flex items-center gap-1.5"><Zap size={11} /> Cumulative impact</div>
        {loading && <span className="font-mono text-[9px] text-accent animate-pulse">COMPUTING…</span>}
      </div>

      {error ? (
        <div className="border border-destructive/60 bg-destructive/10 p-3 text-center">
          <div className="tech-label text-destructive">Couldn&apos;t load the impact</div>
          <div className="font-mono text-[10px] text-muted-foreground mt-1 break-all">{error}</div>
          <button onClick={reload} className="mt-2 px-2 py-1 border border-primary font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-primary/20 inline-flex items-center gap-1">
            <RotateCcw size={10} /> Retry
          </button>
        </div>
      ) : !data ? (
        <div className="p-6 tech-label text-center animate-pulse">Tracing modifier chains…</div>
      ) : (
        <>
          <p className="text-[10px] text-muted-foreground leading-snug">
            Everything this milestone and its outstanding prerequisites ({data?.totals?.nodes ?? 0} node{(data?.totals?.nodes ?? 0) === 1 ? "" : "s"}) do to concrete hardware.
          </p>

          {cumEntries.length === 0 && (
            <div className="tech-label text-center py-2">No stat changes on this path — unlocks only.</div>
          )}
          {cumEntries.length > 0 && (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {cumEntries.map(([gid, stats]) => {
                const row = ctx.byId[gid];
                const isResearch = pathIds.has(gid) || ctx.kindOf?.(gid) === "ResearchNode";
                return (
                  <div key={gid} className="border border-border/50 bg-black/20 px-2 py-1">
                    <div className="flex items-center justify-between gap-2">
                      {isResearch ? (
                        <button onClick={() => onSelect(gid)} className="text-[10px] font-medium truncate hover:text-primary text-left">{row?.name || gid}</button>
                      ) : (
                        <span className="text-[10px] font-medium truncate">{row?.name || gid}</span>
                      )}
                      <span className="font-mono text-[8px] text-muted-foreground shrink-0">{ctx.kindOf?.(gid) || "?"}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(stats).map(([k, v]) => (
                        <span key={k} className="px-1 py-0.5 border border-border/60 font-mono text-[8.5px] text-accent">{fmtCum(k, v, labels)}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <ChipList label="Modules unlocked" ids={unlocked.modules} ctx={ctx} />
          <ChipList label="Units unlocked" ids={unlocked.units} ctx={ctx} />
          <ChipList label="Weapons unlocked" ids={unlocked.weapons} ctx={ctx} />
          <ChipList label="Turrets unlocked" ids={unlocked.turrets} ctx={ctx} />

          {stamp && <div className="font-mono text-[8px] text-muted-foreground/70 text-right">{stamp}</div>}
        </>
      )}
    </div>
  );
}
