import React, { useState } from "react";
import TechNode from "./TechNode";

const NODE_W = 214, NODE_H = 62;

// Scrollable blueprint canvas: tier columns, elbowed conduit lines, plates on top.
export default function TechCanvas({ tree, selectedId, lineage: lin, have, onSelect, onToggleHave }) {
  const [hover, setHover] = useState(null);
  const { ancestors, descendants } = lin;
  const isolating = !!selectedId;

  const stateOf = (id) => {
    if (id === selectedId) return "selected";
    if (ancestors.has(id)) return "ancestor";
    if (descendants.has(id)) return "descendant";
    return isolating ? "dim" : "idle";
  };
  const edgeStyle = (e) => {
    const a = stateOf(e.from), b = stateOf(e.to);
    const onPath = ["selected", "ancestor"].includes(a) && ["selected", "ancestor"].includes(b);
    const onFwd = ["selected", "descendant"].includes(a) && ["selected", "descendant"].includes(b);
    const touchesHover = hover && (e.from === hover || e.to === hover);
    if (onPath) return { stroke: "hsl(9 64% 55%)", width: 1.8, opacity: 0.95 };
    if (onFwd) return { stroke: "hsl(40 60% 55%)", width: 1.4, opacity: 0.85 };
    if (touchesHover) return { stroke: "hsl(26 88% 52%)", width: 1.4, opacity: 0.9 };
    return { stroke: "hsl(22 10% 45%)", width: 1, opacity: isolating ? 0.12 : 0.3 };
  };

  return (
    <div className="schematic-panel plate-texture h-full overflow-auto bp-grid">
      <div className="relative" style={{ width: tree.width, height: tree.height }}>
        {/* tier column headers */}
        {tree.tiers.map((t, i) => (
          <div key={t} className="absolute top-0 tech-label" style={{ left: 28 + i * tree.COL_W, top: 6 }}>
            LAYER {t} <span className="text-muted-foreground/60">· {tree.colCount?.get(t) ?? 0}</span>
          </div>
        ))}

        <svg className="absolute inset-0 pointer-events-none" width={tree.width} height={tree.height}>
          {tree.edges.map((e, i) => {
            const a = tree.pos.get(e.from), b = tree.pos.get(e.to);
            if (!a || !b) return null;
            const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2;
            const mx = x1 + (x2 - x1) / 2;
            const s = edgeStyle(e);
            return <path key={i} d={`M${x1} ${y1} H${mx} V${y2} H${x2}`} fill="none" stroke={s.stroke} strokeWidth={s.width} opacity={s.opacity} />;
          })}
        </svg>

        {tree.nodes.map((n) => {
          const p = tree.pos.get(n.game_id);
          return <TechNode key={n.game_id} node={n} x={p.x} y={p.y + 18} state={stateOf(n.game_id)}
            mods={(tree.unlocksModules.get(n.game_id) || []).length} units={(tree.unlocksUnits.get(n.game_id) || []).length}
            owned={have?.has(n.game_id)} onSelect={onSelect} onHover={setHover} onToggleHave={onToggleHave} />;
        })}
      </div>
    </div>
  );
}