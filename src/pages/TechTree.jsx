import React, { useMemo, useState } from "react";
import { GitBranch, Search } from "lucide-react";
import { useGameCatalog, fmtNum } from "@/lib/gameData";
import { buildTechTree, lineage, TYPE_COLOR } from "@/lib/techTree";
import TechCanvas from "@/components/tech/TechCanvas";
import UnlockPanel from "@/components/tech/UnlockPanel";

// Tech-tree explorer: research milestones as tier columns, wired to the hardware they unlock.
export default function TechTree() {
  const cat = useGameCatalog(true);
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState("");

  const tree = useMemo(() => buildTechTree(cat.research, cat.modules, cat.units), [cat.research, cat.modules, cat.units]);
  const lin = useMemo(() => lineage(tree, sel), [tree, sel]);
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return tree.nodes.filter((n) => `${n.name} ${n.game_id}`.toLowerCase().includes(s)).slice(0, 7);
  }, [q, tree]);

  const totalUnlocks = useMemo(() => [...tree.unlocksModules.values()].reduce((a, v) => a + v.length, 0), [tree]);
  const readout = [["MILESTONES", tree.nodes.length], ["LINKS", tree.edges.length], ["MODULE UNLOCKS", totalUnlocks], ["ERAS", tree.tiers.length]];

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto w-full h-full flex flex-col min-h-0">
      <div className="schematic-panel p-3 mb-3 flex items-center justify-between gap-4 bg-gradient-to-r from-card to-primary/5">
        <div className="flex items-center gap-3 min-w-0">
          <GitBranch size={30} className="text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl tracking-[0.15em] leading-none">TECH TREE</h1>
            <p className="tech-label mt-1 truncate">Research milestones → module & hull unlocks · click a plate to isolate its prerequisite chain</p>
          </div>
        </div>
        <div className="hidden lg:flex gap-5 font-mono text-center">
          {readout.map(([k, v]) => (<div key={k}><div className="text-lg font-semibold text-primary leading-none">{fmtNum(v)}</div><div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div></div>))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="find a milestone…"
            className="h-7 pl-7 pr-2 w-56 bg-background/60 border border-border font-mono text-[11px] outline-none focus:border-primary" />
          {hits.length > 0 && (
            <div className="absolute z-30 mt-1 w-72 border border-border bg-popover">
              {hits.map((h) => (
                <button key={h.game_id} onClick={() => { setSel(h.game_id); setQ(""); }} className="block w-full text-left px-2 py-1 text-[11px] hover:bg-primary/15">
                  {h.name} <span className="font-mono text-[9px] text-muted-foreground">T{h.tier} · {h.game_id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 ml-2 font-mono text-[9px] text-muted-foreground">
          {Object.entries(TYPE_COLOR).map(([t, c]) => <span key={t} className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5" style={{ background: c }} />{t}</span>)}
        </div>
        {sel && <button onClick={() => setSel(null)} className="px-2 h-7 border border-primary bg-primary/20 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-primary/30">show full tree</button>}
        <span className="tech-label ml-auto">{sel ? `${lin.ancestors.size} prerequisites · ${lin.descendants.size} downstream` : "full tree"}</span>
      </div>

      {cat.isLoading ? <div className="schematic-panel p-12 tech-label text-center animate-pulse">Mapping research lattice…</div>
      : tree.nodes.length === 0 ? <div className="schematic-panel p-10 tech-label text-center">No research data loaded — import the dataset from Data Ops.</div>
      : (
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-3">
          <div className="min-h-0 min-w-0"><TechCanvas tree={tree} selectedId={sel} lineage={lin} onSelect={setSel} /></div>
          <div className="overflow-y-auto min-h-0"><UnlockPanel tree={tree} id={sel} ctx={cat} onSelect={setSel} onClear={() => setSel(null)} /></div>
        </div>
      )}
    </div>
  );
}