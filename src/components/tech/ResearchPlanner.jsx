import React from "react";
import { ListOrdered, Check, RotateCcw, X, AlertTriangle } from "lucide-react";
import { fmtNum } from "@/lib/gameData";
import { TYPE_COLOR } from "@/lib/techTree";
import { useResearchCall } from "./useResearch";

// PATH MODE — server-computed research plan (researchPath): the topological, buildable-first
// chain to the pinned/selected targets, minus everything in the HAVE set. Per-node cost plus
// a running-total band; totals stamped with the dataset build.
export default function ResearchPlanner({ tree, targets, have, onToggleHave, pins, onUnpin, onSelect, stamp }) {
  const enabled = targets.length > 0;
  const { data, loading, error, reload } = useResearchCall("researchPath", { targets, have }, enabled);

  if (!enabled) {
    return (
      <div className="schematic-panel plate-texture p-4">
        <div className="tech-label inline-flex items-center gap-1.5"><ListOrdered size={11} /> Research path</div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Select a milestone (or pin several) to chart the cheapest lawful order of research.
          Mark nodes you already hold as RESEARCHED — the path prunes them.
        </p>
      </div>
    );
  }

  const haveSet = new Set(have);
  const path = data?.path || [];
  const totals = data?.totals;
  const missing = data?.missing || [];
  let runRu = 0, runT = 0;

  return (
    <div className="schematic-panel plate-texture p-3 space-y-2">
      <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes-ember opacity-60" />
      <div className="flex items-center justify-between gap-2">
        <div className="tech-label inline-flex items-center gap-1.5"><ListOrdered size={11} /> Research path · {targets.length} target{targets.length > 1 ? "s" : ""}</div>
        {loading && <span className="font-mono text-[9px] text-accent animate-pulse">COMPUTING…</span>}
      </div>

      {pins.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {pins.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-accent/60 font-mono text-[9px] text-accent">
              {tree.byId.get(id)?.name || id}
              <button onClick={() => onUnpin(id)} className="hover:text-primary" aria-label={`unpin ${id}`}><X size={9} /></button>
            </span>
          ))}
        </div>
      )}

      {error ? (
        <div className="border border-destructive/60 bg-destructive/10 p-3 text-center">
          <div className="tech-label text-destructive">Couldn&apos;t compute the path</div>
          <div className="font-mono text-[10px] text-muted-foreground mt-1 break-all">{error}</div>
          <button onClick={reload} className="mt-2 px-2 py-1 border border-primary font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-primary/20 inline-flex items-center gap-1">
            <RotateCcw size={10} /> Retry
          </button>
        </div>
      ) : !data && loading ? (
        <div className="p-6 tech-label text-center animate-pulse">Charting research order…</div>
      ) : (
        <>
          {missing.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 border border-[#ffb020]/50 bg-[#ffb020]/10 p-1.5">
              <AlertTriangle size={10} className="text-[#ffb020]" />
              <span className="font-mono text-[9px] text-[#ffb020] uppercase tracking-[0.12em]">unknown targets:</span>
              {missing.map((m) => <span key={m} className="font-mono text-[9px] text-[#ffb020]">{m}</span>)}
            </div>
          )}

          {path.length === 0 ? (
            <div className="p-4 tech-label text-center">Nothing left to research — every target is already covered by your RESEARCHED set.</div>
          ) : (
            <div className="space-y-px">
              <div className="grid grid-cols-[18px_1fr_58px_46px_58px_24px] gap-1 tech-label !text-[8px] pb-1 border-b border-border/60">
                <span>#</span><span>Milestone</span><span className="text-right">RU</span><span className="text-right">Time</span><span className="text-right">Σ RU</span><span />
              </div>
              {path.map((n, i) => {
                runRu += n.cost_resources || 0; runT += n.construction_time || 0;
                const owned = haveSet.has(n.game_id);
                return (
                  <div key={n.game_id} className="grid grid-cols-[18px_1fr_58px_46px_58px_24px] gap-1 items-center py-0.5 border-b border-border/30 group">
                    <span className="font-mono text-[9px] text-muted-foreground">{i + 1}</span>
                    <button onClick={() => onSelect(n.game_id)} className="min-w-0 text-left inline-flex items-center gap-1.5 hover:text-primary">
                      <span className="w-1.5 h-1.5 shrink-0" style={{ background: TYPE_COLOR[n.research_type] || "#b0a49b" }} />
                      <span className="text-[10px] truncate">{n.name}</span>
                      <span className="font-mono text-[8px] text-muted-foreground shrink-0">T{n.tier}</span>
                    </button>
                    <span className="font-mono text-[9px] text-right">{fmtNum(n.cost_resources)}</span>
                    <span className="font-mono text-[9px] text-right text-muted-foreground">{fmtNum(n.construction_time)}s</span>
                    <span className="font-mono text-[9px] text-right text-accent/80">{fmtNum(runRu)}</span>
                    <button onClick={() => onToggleHave(n.game_id)}
                      title={owned ? "unmark researched" : "mark already researched"}
                      className={`justify-self-end w-4 h-4 border inline-flex items-center justify-center ${owned ? "border-[#22c55e] text-[#22c55e]" : "border-border text-muted-foreground/40 hover:border-[#22c55e] hover:text-[#22c55e]"}`}>
                      <Check size={9} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {totals && (
            <div className="pt-1">
              <div className="grid grid-cols-4 gap-1 text-center">
                {[["NODES", fmtNum(totals.nodes)], ["RU", fmtNum(totals.cost_resources)], ["ENERGY", fmtNum(totals.cost_energy)], ["TIME", `${fmtNum(totals.construction_time)}s`]].map(([k, v]) => (
                  <div key={k} className="border border-border/60 bg-black/30 py-1">
                    <div className="font-mono text-[11px] text-primary ember-glow leading-none">{v}</div>
                    <div className="text-[8px] font-mono tracking-[0.18em] text-muted-foreground mt-0.5">{k}</div>
                  </div>
                ))}
              </div>
              {path.length > 0 && runT > 0 && (
                <div className="font-mono text-[8px] text-muted-foreground mt-1 text-right">time total assumes sequential research</div>
              )}
              {stamp && <div className="font-mono text-[8px] text-muted-foreground/70 mt-0.5 text-right">{stamp}</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
