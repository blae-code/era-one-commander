import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { classHex } from "./designModel";

// Collapsible outline of a design's attachment tree. Rows are colored by module_class
// (module_id joined against useGameCatalog().byId). Selection/hover sync with the plot.
export default function AssemblyTree({
  roots = [], byId = {}, totalParts = 0,
  rootIndex = null, commandIndex = null,
  selected = null, hovered = null, onSelect, onHover,
}) {
  // Large designs start with everything below depth 1 folded so the outline stays scannable.
  const [collapsed, setCollapsed] = useState(() => {
    const set = new Set();
    if (totalParts > 80) {
      const mark = (n) => {
        if (n.part.depth >= 2 && n.children.length) set.add(n.part.index);
        n.children.forEach(mark);
      };
      roots.forEach(mark);
    }
    return set;
  });
  const toggle = (i) => setCollapsed((prev) => {
    const s = new Set(prev);
    if (s.has(i)) s.delete(i); else s.add(i);
    return s;
  });

  const rows = useMemo(() => {
    const out = [];
    const walk = (n) => {
      out.push(n);
      if (!collapsed.has(n.part.index)) n.children.forEach(walk);
    };
    roots.forEach(walk);
    return out;
  }, [roots, collapsed]);

  if (!rows.length) return <div className="p-6 tech-label text-center">No assembly data</div>;

  return (
    <div className="font-mono text-[11px] leading-tight py-1">
      {rows.map((n) => {
        const p = n.part;
        const mod = p.module_id ? byId[p.module_id] : null;
        const cls = mod?.module_class || "Unknown";
        const label = p.name || mod?.name || p.module_id || "unresolved part";
        const isSel = p.index === selected;
        const isHov = p.index === hovered;
        const folded = collapsed.has(p.index);
        return (
          <div
            key={p.index}
            role="button"
            tabIndex={0}
            onClick={() => onSelect?.(p.index)}
            onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(p.index); }}
            onMouseEnter={() => onHover?.(p.index)}
            onMouseLeave={() => onHover?.(null)}
            style={{ paddingLeft: 8 + p.depth * 14 }}
            className={`flex items-center gap-1.5 pr-2 py-[3px] cursor-pointer border-l-2 transition-colors ${
              isSel ? "border-primary bg-primary/15 text-foreground"
              : isHov ? "border-accent/60 bg-accent/5 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            {n.children.length ? (
              <button
                onClick={(e) => { e.stopPropagation(); toggle(p.index); }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={folded ? "expand" : "collapse"}
              >
                {folded ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              </button>
            ) : (
              <span className="w-3 shrink-0" />
            )}
            <span className="inline-block w-2 h-2 shrink-0" style={{ background: classHex(cls) }} />
            <span className="truncate">{label}</span>
            {p.index === commandIndex && <span className="shrink-0 text-[9px] tracking-[0.14em] text-[#ffd21a]">CMD</span>}
            {p.index === rootIndex && p.index !== commandIndex && <span className="shrink-0 text-[9px] tracking-[0.14em] text-primary">ROOT</span>}
            {folded && n.subtree > 1 && <span className="shrink-0 text-[9px] text-muted-foreground">+{n.subtree - 1}</span>}
            <span className="ml-auto shrink-0 text-[9px] text-muted-foreground/70">
              {p.connection !== null && p.connection >= 0 ? `C${p.connection} · ` : ""}#{p.index}
            </span>
          </div>
        );
      })}
    </div>
  );
}
