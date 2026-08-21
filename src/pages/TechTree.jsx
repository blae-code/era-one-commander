import React, { useMemo, useState } from "react";
import { GitBranch, Search } from "lucide-react";
import { useGameCatalog, fmtNum } from "@/lib/gameData";
import { buildTechTree, lineage, TYPE_COLOR } from "@/lib/techTree";
import TechCanvas from "@/components/tech/TechCanvas";
import UnlockPanel from "@/components/tech/UnlockPanel";
import ResearchPlanner from "@/components/tech/ResearchPlanner";
import ImpactPanel from "@/components/tech/ImpactPanel";

const HAVE_KEY = "tech:have";
const loadHave = () => {
  try { return new Set(JSON.parse(localStorage.getItem(HAVE_KEY) || "[]")); } catch { return new Set(); }
};

// Tech-tree explorer: research milestones laid out by the dataset's own tree_depth/tree_order,
// wired to the hardware they unlock. Server-side researchPath/researchImpact drive the
// planner (PATH MODE) and impact panels for the selected/pinned milestones.
export default function TechTree() {
  const cat = useGameCatalog(true);
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState("");
  const [have, setHave] = useState(loadHave);
  const [pins, setPins] = useState([]);

  const toggleHave = (id) => setHave((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    try { localStorage.setItem(HAVE_KEY, JSON.stringify([...next])); } catch { /* private mode */ }
    return next;
  });
  const togglePin = (id) => setPins((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const tree = useMemo(() => buildTechTree(cat.research, cat.modules, cat.units), [cat.research, cat.modules, cat.units]);
  const lin = useMemo(() => lineage(tree, sel), [tree, sel]);
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return tree.nodes.filter((n) => `${n.name} ${n.game_id}`.toLowerCase().includes(s)).slice(0, 7);
  }, [q, tree]);

  // PATH MODE targets: every pinned milestone plus the current selection.
  const targets = useMemo(() => {
    const t = [...pins];
    if (sel && !t.includes(sel)) t.push(sel);
    return t;
  }, [pins, sel]);
  const haveArr = useMemo(() => [...have].sort(), [have]);

  // Dataset stamp, read from the rows themselves — never hardcoded.
  const stamp = useMemo(() => {
    const r = cat.research[0] || cat.modules[0];
    return r?.game_version ? `game ${r.game_version} · build ${r.game_build}` : null;
  }, [cat.research, cat.modules]);

  const totalUnlocks = useMemo(() => [...tree.unlocksModules.values()].reduce((a, v) => a + v.length, 0), [tree]);
  const readout = [["MILESTONES", tree.nodes.length], ["LINKS", tree.edges.length], ["MODULE UNLOCKS", totalUnlocks], ["RESEARCHED", have.size]];

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto w-full h-full flex flex-col min-h-0">
      <div className="schematic-panel p-3 mb-3 flex items-center justify-between gap-4 bg-gradient-to-r from-card to-primary/5">
        <div className="flex items-center gap-3 min-w-0">
          <GitBranch size={30} className="text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl tracking-[0.15em] leading-none">TECH TREE</h1>
            <p className="tech-label mt-1 truncate">Research milestones → module & hull unlocks · click a plate to isolate its chain · alt-click = mark researched</p>
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
        {have.size > 0 && (
          <button onClick={() => { setHave(new Set()); try { localStorage.setItem(HAVE_KEY, "[]"); } catch { /* private mode */ } }}
            className="px-2 h-7 border border-border font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:border-[#22c55e] hover:text-[#22c55e]">
            clear researched ({have.size})
          </button>
        )}
        <span className="tech-label ml-auto">{sel ? `${lin.ancestors.size} prerequisites · ${lin.descendants.size} downstream` : "full tree"}</span>
      </div>

      {cat.isLoading ? <div className="schematic-panel p-12 tech-label text-center animate-pulse">Mapping research lattice…</div>
      : cat.isError ? (
        <div className="schematic-panel p-10 text-center">
          <div className="tech-label text-destructive">Couldn&apos;t load the research catalog</div>
          <div className="font-mono text-[10px] text-muted-foreground mt-2 break-all">{String(cat.error?.message || cat.error || "")}</div>
          <button onClick={() => window.location.reload()} className="mt-3 px-3 py-1.5 border border-primary font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-primary/20">Retry</button>
        </div>
      )
      : tree.nodes.length === 0 ? <div className="schematic-panel p-10 tech-label text-center">No research data loaded — import the dataset from Data Ops.</div>
      : (
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-3">
          <div className="min-h-0 min-w-0"><TechCanvas tree={tree} selectedId={sel} lineage={lin} have={have} onSelect={setSel} onToggleHave={toggleHave} /></div>
          <div className="overflow-y-auto min-h-0 space-y-3">
            <UnlockPanel tree={tree} id={sel} ctx={cat} onSelect={setSel} onClear={() => setSel(null)}
              have={have} onToggleHave={toggleHave} pinned={sel ? pins.includes(sel) : false} onPin={togglePin} />
            <ResearchPlanner tree={tree} targets={targets} have={haveArr} onToggleHave={toggleHave}
              pins={pins} onUnpin={togglePin} onSelect={setSel} stamp={stamp} />
            {sel && <ImpactPanel id={sel} have={haveArr} ctx={cat} onSelect={setSel} stamp={stamp} />}
          </div>
        </div>
      )}
    </div>
  );
}
