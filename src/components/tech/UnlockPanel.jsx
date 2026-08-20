import React from "react";
import { Link } from "react-router-dom";
import { Cpu, Rocket, ArrowUpRight, X } from "lucide-react";
import { fmtNum, fmtModifier } from "@/lib/gameData";
import { pathCost, lineage, TYPE_COLOR } from "@/lib/techTree";

const Row = ({ label, value }) => (
  <div className="flex justify-between font-mono text-[10px] py-0.5 border-b border-border/40">
    <span className="text-muted-foreground uppercase tracking-[0.12em]">{label}</span><span>{value}</span>
  </div>
);

// Readout for the selected milestone: prerequisite chain cost, the hardware it opens, and stat upgrades.
export default function UnlockPanel({ tree, id, ctx, onSelect, onClear }) {
  if (!id) return (
    <div className="schematic-panel plate-texture p-4">
      <div className="tech-label">No milestone selected</div>
      <p className="text-[11px] text-muted-foreground mt-2">Pick a plate on the canvas to isolate its prerequisite chain, downstream research and the modules it unlocks.</p>
    </div>
  );
  const node = tree.byId.get(id);
  const cost = pathCost(tree, id);
  const { ancestors, descendants } = lineage(tree, id);
  const mods = (tree.unlocksModules.get(id) || []).map((m) => ctx.byId[m]).filter(Boolean);
  const units = (tree.unlocksUnits.get(id) || []).map((m) => ctx.byId[m]).filter(Boolean);
  const prereqs = (tree.parents.get(id) || []).map((p) => tree.byId.get(p)).filter(Boolean);
  const color = TYPE_COLOR[node.research_type] || "#b0a49b";

  return (
    <div className="schematic-panel plate-texture p-3 space-y-3">
      <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-display font-bold text-sm tracking-[0.12em] uppercase leading-tight">{node.name}</div>
          <div className="font-mono text-[9px] mt-0.5" style={{ color }}>{node.research_type} · ERA {node.tier} · {node.game_id}</div>
        </div>
        <button onClick={onClear} className="text-muted-foreground hover:text-primary shrink-0"><X size={14} /></button>
      </div>
      {(node.description || node.info) && <p className="text-[11px] text-muted-foreground leading-snug">{node.description || node.info}</p>}

      <div>
        <div className="tech-label mb-1">Full path cost (with prerequisites)</div>
        <Row label="Milestones" value={cost.steps} />
        <Row label="Resources" value={`${fmtNum(cost.resources)} RU`} />
        <Row label="Research" value={fmtNum(cost.research)} />
        <Row label="Build time" value={`${fmtNum(cost.time)} s`} />
        <Row label="Opens downstream" value={`${descendants.size} nodes`} />
      </div>

      {prereqs.length > 0 && (
        <div>
          <div className="tech-label mb-1">Direct prerequisites ({ancestors.size} total)</div>
          <div className="flex flex-wrap gap-1">
            {prereqs.map((p) => <button key={p.game_id} onClick={() => onSelect(p.game_id)} className="px-1.5 py-0.5 border border-border font-mono text-[9px] hover:border-primary hover:text-primary">{p.name}</button>)}
          </div>
        </div>
      )}

      {mods.length > 0 && (
        <div>
          <div className="tech-label mb-1 inline-flex items-center gap-1"><Cpu size={10} /> Modules unlocked · {mods.length}</div>
          <div className="space-y-1">
            {mods.map((m) => (
              <Link key={m.game_id} to={`/database?kind=Module&sel=${m.game_id}`} className="flex items-center gap-2 px-2 py-1 border border-border/60 hover:border-primary group">
                <span className="text-[11px] flex-1 truncate group-hover:text-primary">{m.name}</span>
                <span className="font-mono text-[9px] text-muted-foreground">{m.module_type}</span>
                <span className="font-mono text-[9px] text-accent">{fmtNum(m.cost_resources)} RU</span>
                <ArrowUpRight size={10} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {units.length > 0 && (
        <div>
          <div className="tech-label mb-1 inline-flex items-center gap-1"><Rocket size={10} /> Hulls unlocked · {units.length}</div>
          <div className="flex flex-wrap gap-1">
            {units.map((u) => <Link key={u.game_id} to={`/database?kind=Unit&sel=${u.game_id}`} className="px-1.5 py-0.5 border border-border font-mono text-[9px] hover:border-primary hover:text-primary">{u.name}</Link>)}
          </div>
        </div>
      )}

      {(node.modifiers || []).length > 0 && (
        <div>
          <div className="tech-label mb-1">Stat effects</div>
          <div className="flex flex-wrap gap-1">
            {node.modifiers.map((m, i) => <span key={i} className="px-1.5 py-0.5 border border-border/60 font-mono text-[9px] text-foreground">{fmtModifier(m, ctx.statLabels)}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}