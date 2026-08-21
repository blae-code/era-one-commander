import React from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LineChart, DatabaseZap, AlertTriangle } from "lucide-react";
import { useGameCatalog, fmtNum } from "@/lib/gameData";
import EconomyWorkbench from "@/components/economy/EconomyWorkbench";
import TierCostCurve from "@/components/economy/TierCostCurve";
import ResearchRamp from "@/components/economy/ResearchRamp";
import ValueScatter from "@/components/economy/ValueScatter";

// Research & economy analytics over the installed dataset + the server-side economy workbench.
export default function EconomyAnalysis() {
  const cat = useGameCatalog();
  const qc = useQueryClient();
  const totalRU = cat.research.reduce((a, r) => a + (r.cost_resources || 0), 0);
  const readout = [["NODES", cat.research.length], ["TREE RU", totalRU], ["MODULES", cat.modules.length]];
  const stamp = cat.modules[0] ? `game ${cat.modules[0].game_version || "—"} · build ${cat.modules[0].game_build || "—"}` : "no dataset";

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="schematic-panel rust-wash p-5 mb-5 flex items-center justify-between flex-wrap gap-4">
        <div className="absolute bottom-0 left-0 right-0 h-[3px] hazard-stripes opacity-70" />
        <div className="flex items-center gap-4">
          <div className="border border-primary/40 p-2 bg-black/40 welded-frame"><LineChart size={30} className="text-primary" /></div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">RESEARCH &amp; ECONOMY</h1>
            <p className="tech-label mt-1.5">Tech-tree investment curves · module cost efficiency · {stamp}</p>
          </div>
        </div>
        <div className="hidden lg:flex gap-6 font-mono text-center">
          {readout.map(([k, v]) => (
            <div key={k}><div className="text-lg font-semibold text-primary leading-none ember-glow">{fmtNum(v)}</div><div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div></div>
          ))}
        </div>
      </div>

      {cat.isError ? (
        <div className="schematic-panel p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
          <AlertTriangle size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-[0.15em]">DATALINK FAILURE</div>
          <p className="tech-label mt-1">Couldn't load the economy tables: {String(cat.error?.message || cat.error)}</p>
          <button onClick={() => qc.invalidateQueries({ queryKey: ["game"] })}
            className="mt-4 px-4 h-8 font-mono text-[10px] uppercase tracking-wider border border-primary bg-primary text-primary-foreground hover:bg-primary/80 transition-colors">
            Retry
          </button>
        </div>
      ) : cat.isLoading ? (
        <div className="schematic-panel p-12 tech-label text-center animate-pulse">Crunching economy tables…</div>
      ) : cat.isEmpty ? (
        <div className="schematic-panel p-8 text-center">
          <DatabaseZap size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-wider">No game data loaded yet</div>
          <p className="tech-label mt-1">Import the dataset from the <Link to="/gamedata" className="text-primary underline">Game Data</Link> page.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <EconomyWorkbench modules={cat.modules} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <TierCostCurve research={cat.research} />
            <ResearchRamp research={cat.research} />
          </div>
          <ValueScatter modules={cat.modules} />
        </div>
      )}
    </div>
  );
}
