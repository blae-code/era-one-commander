import React from "react";
import { Cpu, Rocket } from "lucide-react";
import { TYPE_COLOR } from "@/lib/techTree";

// One riveted plate on the tech canvas. Dimmed when a lineage is isolated and it sits outside it.
export default function TechNode({ node, x, y, state, mods, units, onSelect, onHover }) {
  const color = TYPE_COLOR[node.research_type] || "#b0a49b";
  const style = {
    selected: "border-accent bg-[#2b1512]",
    ancestor: "border-primary bg-[#1c100e]",
    descendant: "border-[#7a6a3a] bg-[#161310]",
    dim: "border-border/40 bg-card/40 opacity-35",
    idle: "border-border bg-card",
  }[state];

  return (
    <button
      onClick={() => onSelect(node.game_id)}
      onMouseEnter={() => onHover?.(node.game_id)}
      onMouseLeave={() => onHover?.(null)}
      title={node.description || node.info || node.name}
      className={`absolute w-[214px] h-[62px] text-left px-2 py-1.5 border clip-plate plate-texture welded-frame transition-colors hover:border-accent ${style}`}
      style={{ left: x, top: y }}
    >
      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: color }} />
      <div className="pl-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-medium leading-tight truncate">{node.name}</span>
          <span className="font-mono text-[8px] text-muted-foreground shrink-0">T{node.tier}</span>
        </div>
        <div className="font-mono text-[8px] uppercase tracking-[0.14em] mt-0.5" style={{ color }}>{node.research_type}</div>
        <div className="flex items-center gap-2 mt-1 font-mono text-[9px] text-muted-foreground">
          <span>{(node.cost_resources || 0).toLocaleString()} RU</span>
          {mods > 0 && <span className="inline-flex items-center gap-0.5 text-accent"><Cpu size={9} />{mods}</span>}
          {units > 0 && <span className="inline-flex items-center gap-0.5 text-primary"><Rocket size={9} />{units}</span>}
        </div>
      </div>
    </button>
  );
}