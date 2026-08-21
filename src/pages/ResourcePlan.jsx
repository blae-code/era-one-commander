import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertTriangle, Boxes, DatabaseZap, Trash2 } from "lucide-react";
import { fmtNum, useGameCatalog, useGameEntityRows } from "@/lib/gameData";
import { aggregateQueue } from "@/components/resources/queueMath";
import CostLineList from "@/components/resources/CostLineList";
import TotalsBar from "@/components/resources/TotalsBar";
import DesignQueueList from "@/components/resources/DesignQueueList";
import EconomyPanel from "@/components/resources/EconomyPanel";

// Resource planning deck over the REAL dataset: queue shipped GameBlueprint designs and
// imported PlayerDesign rows with build counts, aggregate cost/crew/build-time and the
// per-module bill of materials, then model the queue's economy via economyModel.

const LS_KEY = "resourceplan:queue";
const loadQueue = () => {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
};

export default function ResourcePlan() {
  const qc = useQueryClient();
  const cat = useGameCatalog(true); // extended: brings the 41 shipped GameBlueprint rows
  const player = useGameEntityRows("PlayerDesign"); // may be empty; user-imported .station designs
  const [counts, setCounts] = useState(loadQueue);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(counts));
    } catch {
      /* storage full/unavailable — queue just won't persist */
    }
  }, [counts]);

  const bump = (id, d) => setCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + d) }));
  const clear = () => setCounts({});

  const designs = useMemo(
    () => [
      ...cat.blueprints.map((d) => ({ ...d, _source: "shipped" })),
      ...player.rows.map((d) => ({ ...d, _source: "player" })),
    ],
    [cat.blueprints, player.rows]
  );

  const queued = useMemo(
    () => designs.filter((d) => (counts[d.game_id] || 0) > 0).map((d) => ({ design: d, count: counts[d.game_id] })),
    [designs, counts]
  );
  const totalUnits = queued.reduce((n, x) => n + x.count, 0);

  const agg = useMemo(() => aggregateQueue(queued, cat.byId), [queued, cat.byId]);

  const economyEntries = useMemo(
    () => [...agg.moduleQty.entries()].filter(([, n]) => n > 0).map(([game_id, count]) => ({ game_id, count })),
    [agg]
  );

  const stampRow = cat.blueprints[0] || player.rows[0];
  const stamp = stampRow ? `game ${stampRow.game_version} · build ${stampRow.game_build}` : null;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="schematic-panel rust-wash p-5 mb-5 flex items-center justify-between flex-wrap gap-4">
        <div className="absolute bottom-0 left-0 right-0 h-[3px] hazard-stripes opacity-70" />
        <div className="flex items-center gap-4">
          <div className="border border-primary/40 p-2 bg-black/40 welded-frame"><Boxes size={30} className="text-primary" /></div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">RESOURCE PLANNING</h1>
            <p className="tech-label mt-1.5">Aggregate bill of materials across your production queue</p>
            {stamp && <p className="font-mono text-[9px] tracking-[0.16em] text-muted-foreground mt-1">{stamp}</p>}
          </div>
        </div>
        <div className="flex items-center gap-6 font-mono text-center">
          <div>
            <div className="text-2xl text-primary ember-glow leading-none">{fmtNum(agg.totals.ru)}</div>
            <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">TOTAL RU</div>
          </div>
          <div>
            <div className="text-2xl text-primary ember-glow leading-none">{fmtNum(totalUnits)}</div>
            <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">BUILDS QUEUED</div>
          </div>
        </div>
      </div>

      {cat.isError ? (
        <div className="schematic-panel p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
          <AlertTriangle size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-[0.15em]">DATALINK FAILURE</div>
          <p className="tech-label mt-1">Couldn&apos;t load the catalog: {String(cat.error?.message || cat.error)}</p>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["game"] })}
            className="mt-4 px-4 h-8 font-mono text-[10px] uppercase tracking-wider border border-primary bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : cat.isEmpty && !cat.isLoading ? (
        <div className="schematic-panel p-8 text-center">
          <DatabaseZap size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-wider">No game data loaded yet</div>
          <p className="tech-label mt-1">
            Import the dataset from the <Link to="/gamedata" className="text-primary underline">Game Data</Link> page (admin).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
          {/* queue picker */}
          <div className="schematic-panel plate-texture p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="tech-label">Production queue // {queued.length} design(s)</div>
              {queued.length > 0 && (
                <button onClick={clear} className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:text-primary">
                  <Trash2 size={10} /> Flush
                </button>
              )}
            </div>
            <DesignQueueList
              designs={designs}
              counts={counts}
              onBump={bump}
              loading={cat.isLoading || player.isLoading}
              playerState={{ isError: player.isError, onRetry: () => qc.invalidateQueries({ queryKey: ["game", "PlayerDesign"] }) }}
            />
          </div>

          {/* aggregated materials + economy */}
          <div className="space-y-5 min-w-0">
            <div className="schematic-panel plate-texture p-3">
              <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
              <div className="tech-label mb-2">Materials required // {agg.lines.length} module type(s)</div>
              <TotalsBar totals={agg.totals} />
              <div className="grid grid-cols-2 gap-2 border-b border-border py-2">
                <div>
                  <div className="font-mono text-lg text-primary ember-glow leading-none">{fmtNum(agg.seqTime, 1)}s</div>
                  <div className="text-[8px] font-mono tracking-[0.18em] text-muted-foreground mt-1">BUILD TIME · SEQUENTIAL Σ (ONE YARD)</div>
                </div>
                <div>
                  <div className="font-mono text-lg text-primary ember-glow leading-none">{fmtNum(agg.criticalTime, 1)}s</div>
                  <div className="text-[8px] font-mono tracking-[0.18em] text-muted-foreground mt-1">CRITICAL PATH · LONGEST SINGLE DESIGN (PARALLEL)</div>
                </div>
              </div>
              <div className="mt-2">
                {cat.isLoading ? (
                  <div className="tech-label py-8 text-center animate-pulse">Costing manifest…</div>
                ) : (
                  <CostLineList lines={agg.lines} maxHeight="440px" />
                )}
              </div>
              {agg.unknown.length > 0 && (
                <div className="tech-label mt-2 text-[#ffd21a]">
                  ▲ {agg.unknown.length} module id(s) not in the catalog — costed at zero: {agg.unknown.join(", ")}
                </div>
              )}
            </div>

            <EconomyPanel entries={economyEntries} stamp={stamp} />
          </div>
        </div>
      )}
    </div>
  );
}
