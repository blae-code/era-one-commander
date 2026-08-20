import React, { useMemo, useState } from "react";
import { GitFork, Maximize2, FileText } from "lucide-react";
import { buildTechTree, lineage, TYPE_COLOR } from "@/lib/techTree";
import TechCanvas from "@/components/tech/TechCanvas";
import UnlockPanel from "@/components/tech/UnlockPanel";

// Databank view: the full research lattice. Click a plate to isolate its requirement chain and
// unlock path; the readout links straight into module/hull records.
export default function TreeView({ ctx, rows, onSelectId }) {
  const [sel, setSel] = useState(null);
  const tree = useMemo(() => buildTechTree(ctx.research, ctx.modules, ctx.units), [ctx.research, ctx.modules, ctx.units]);
  const lin = useMemo(() => lineage(tree, sel), [tree, sel]);
  const visible = useMemo(() => new Set((rows || []).map((r) => r.game_id)), [rows]);

  if (!tree.nodes.length) return <div className="schematic-panel p-10 tech-label text-center">No research data loaded.</div>;

  return (
    <div className="h-full flex flex-col min-h-0 gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="tech-label inline-flex items-center gap-1"><GitFork size={11} /> Tech lattice · {tree.nodes.length} milestones · {tree.edges.length} links</span>
        <div className="flex items-center gap-3 font-mono text-[9px] text-muted-foreground">
          {Object.entries(TYPE_COLOR).map(([t, c]) => <span key={t} className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5" style={{ background: c }} />{t}</span>)}
        </div>
        {sel && (
          <>
            <span className="font-mono text-[10px] text-primary">{lin.ancestors.size} required · {lin.descendants.size} downstream</span>
            <button onClick={() => onSelectId?.(sel)} className="inline-flex items-center gap-1 px-2 h-7 border border-border font-mono text-[10px] uppercase tracking-[0.12em] hover:border-primary hover:text-primary"><FileText size={11} /> full record</button>
            <button onClick={() => setSel(null)} className="inline-flex items-center gap-1 px-2 h-7 border border-primary bg-primary/20 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-primary/30"><Maximize2 size={11} /> whole tree</button>
          </>
        )}
        <span className="tech-label ml-auto">{visible.size} of {tree.nodes.length} match current filters</span>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-3">
        <div className="min-h-0 min-w-0"><TechCanvas tree={tree} selectedId={sel} lineage={lin} onSelect={setSel} /></div>
        <div className="overflow-y-auto min-h-0"><UnlockPanel tree={tree} id={sel} ctx={ctx} onSelect={setSel} onClear={() => setSel(null)} /></div>
      </div>
    </div>
  );
}