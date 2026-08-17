import React, { useState } from "react";
import { motion } from "framer-motion";
import { CategoryIcon } from "@/components/icons/EraIcons";

const CELL = 52;

const CAT_BG = {
  weapon: "bg-red-500/10 border-red-500/60",
  engine: "bg-amber-500/10 border-amber-500/60",
  reactor: "bg-emerald-500/10 border-emerald-500/60",
  shield: "bg-cyan-500/10 border-cyan-500/60",
  module: "bg-violet-500/10 border-violet-500/60",
};

export default function BuildGrid({ hull, placements, selectedComponent, onPlace, onRemove }) {
  const [hover, setHover] = useState(null);
  if (!hull) return <div className="tech-label text-center py-16">Select a hull to begin construction</div>;

  const W = hull.grid_width || 8;
  const H = hull.grid_height || 6;

  const occupied = new Set();
  placements.forEach((p) => {
    for (let dx = 0; dx < p.w; dx++)
      for (let dy = 0; dy < p.h; dy++) occupied.add(`${p.x + dx},${p.y + dy}`);
  });

  const canPlace = (x, y, w, h) => {
    if (x + w > W || y + h > H) return false;
    for (let dx = 0; dx < w; dx++)
      for (let dy = 0; dy < h; dy++) if (occupied.has(`${x + dx},${y + dy}`)) return false;
    return true;
  };

  const cw = selectedComponent?.grid_w || 1;
  const ch = selectedComponent?.grid_h || 1;

  return (
    <div className="inline-block relative p-4 bg-card border border-border shadow-sm">
      <div className="tech-label absolute -top-2 left-4 bg-card px-1.5">{hull.name} // {W}×{H} FRAME</div>
      <div className="relative" style={{ width: W * CELL, height: H * CELL }}>
        {/* cells */}
        {Array.from({ length: W * H }).map((_, i) => {
          const x = i % W, y = Math.floor(i / W);
          const isHoverZone = hover && selectedComponent &&
            x >= hover.x && x < hover.x + cw && y >= hover.y && y < hover.y + ch;
          const valid = hover && canPlace(hover.x, hover.y, cw, ch);
          return (
            <div
              key={i}
              onMouseEnter={() => setHover({ x, y })}
              onMouseLeave={() => setHover(null)}
              onClick={() => selectedComponent && canPlace(x, y, cw, ch) && onPlace(selectedComponent, x, y)}
              className={`absolute border border-primary/15 transition-colors ${
                isHoverZone ? (valid ? "bg-emerald-400/25 cursor-pointer" : "bg-red-400/25 cursor-not-allowed") : "hover:bg-primary/5"
              }`}
              style={{ left: x * CELL, top: y * CELL, width: CELL, height: CELL }}
            />
          );
        })}
        {/* placed modules */}
        {placements.map((p) => (
          <motion.button
            key={p.key}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => onRemove(p.key)}
            title={`${p.component.name} — click to remove`}
            className={`absolute flex flex-col items-center justify-center gap-0.5 border-2 ${CAT_BG[p.component.category] || "bg-secondary border-border"} hover:brightness-90`}
            style={{ left: p.x * CELL + 2, top: p.y * CELL + 2, width: p.w * CELL - 4, height: p.h * CELL - 4 }}
          >
            <CategoryIcon category={p.component.category} size={p.w > 1 || p.h > 1 ? 22 : 16} />
            <span className="font-mono text-[8px] leading-none text-foreground/70 px-0.5 truncate max-w-full">
              {p.component.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}