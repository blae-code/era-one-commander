import React, { useMemo, useState } from "react";
import { CLASS_HEX, rowClass } from "./Cells";
import { fmtNum } from "@/lib/gameData";

// Parallel-coordinates plot: every filtered row drawn as a line across all numeric columns,
// each axis normalised to its own min/max. Reveals trade-off shapes no table can show.
export default function ParallelView({ rows, kind, kindKey, ctx, columns, selectedId, onSelect, compareIds }) {
  const [hover, setHover] = useState(null);
  const axes = useMemo(() => {
    const nums = columns.filter((c) => c.type === "num" || c.type === "pct").slice(0, 9);
    return nums.map((c) => {
      const vals = rows.map((r) => c.get(r, ctx)).filter((v) => typeof v === "number" && !Number.isNaN(v));
      return { col: c, min: vals.length ? Math.min(...vals) : 0, max: vals.length ? Math.max(...vals) : 1 };
    }).filter((a) => a.max > a.min);
  }, [columns, rows, ctx]);

  const W = 1000, H = 420, padX = 54, padY = 34;
  const step = axes.length > 1 ? (W - padX * 2) / (axes.length - 1) : 0;
  const yOf = (a, v) => padY + (1 - (v - a.min) / (a.max - a.min)) * (H - padY * 2);

  const lines = useMemo(() => rows.slice(0, 400).map((r) => {
    const pts = axes.map((a, i) => {
      const v = a.col.get(r, ctx);
      return typeof v === "number" && !Number.isNaN(v) ? [padX + i * step, yOf(a, v)] : null;
    });
    return { row: r, pts, cls: rowClass(r, kindKey) };
  }), [rows, axes, ctx, step, kindKey]);

  if (axes.length < 2) return <div className="schematic-panel p-12 tech-label text-center">Enable at least two numeric columns to plot parallel coordinates.</div>;

  const path = (pts) => pts.filter(Boolean).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <div className="schematic-panel plate-texture h-full overflow-auto p-2">
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="tech-label">Parallel coordinates // {axes.length} axes · {Math.min(rows.length, 400)} of {rows.length} rows</div>
        <div className="font-mono text-[9px] text-muted-foreground">{hover ? `${hover.name} · ${hover.game_id}` : "hover a line to read it · click to open"}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[calc(100%-24px)] min-h-[380px]">
        {axes.map((a, i) => (
          <g key={a.col.key}>
            <line x1={padX + i * step} y1={padY} x2={padX + i * step} y2={H - padY} stroke="hsl(14 11% 24%)" />
            <text x={padX + i * step} y={padY - 12} textAnchor="middle" fill="hsl(18 8% 60%)" style={{ fontFamily: "IBM Plex Mono", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>{a.col.label}</text>
            <text x={padX + i * step} y={padY - 2} textAnchor="middle" fill="hsl(9 64% 55%)" style={{ fontFamily: "IBM Plex Mono", fontSize: 8 }}>{fmtNum(a.max, a.col.dec ?? 0)}</text>
            <text x={padX + i * step} y={H - padY + 12} textAnchor="middle" fill="hsl(18 8% 45%)" style={{ fontFamily: "IBM Plex Mono", fontSize: 8 }}>{fmtNum(a.min, a.col.dec ?? 0)}</text>
          </g>
        ))}
        {lines.map(({ row, pts, cls }) => {
          const sel = row.game_id === selectedId, cmp = compareIds?.includes(row.game_id), hot = hover?.game_id === row.game_id;
          const color = sel ? "hsl(9 64% 58%)" : cmp ? "#2f9bff" : CLASS_HEX[cls] || "hsl(18 8% 60%)";
          return (
            <path key={row.game_id} d={path(pts)} fill="none" stroke={color}
              strokeWidth={sel || hot ? 2.4 : cmp ? 1.8 : 1}
              strokeOpacity={sel || cmp || hot ? 1 : hover ? 0.12 : 0.32}
              className="cursor-pointer"
              onMouseEnter={() => setHover(row)} onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(row.game_id)} />
          );
        })}
      </svg>
    </div>
  );
}