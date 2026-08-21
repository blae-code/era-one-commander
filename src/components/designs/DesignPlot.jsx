import React, { useMemo } from "react";
import { classHex, MODULE_CLASS_HEX } from "./designModel";

// 2D orthographic plot of a module graph. Pure SVG, world-space coordinates from part.position[3].
// view: "top" (x horizontal / z vertical) | "side" (x horizontal / y vertical).
// Edges are drawn parent -> child; the root part is anchored with a dashed crosshair,
// the command part carries a dashed halo. Click a node to select; selection syncs with the tree.
export default function DesignPlot({
  parts = [], byId = {}, view = "top",
  rootIndex = null, commandIndex = null,
  selected = null, hovered = null, onSelect, onHover,
}) {
  const model = useMemo(() => {
    const pts = parts
      .filter((p) => Array.isArray(p.position) && p.position.length >= 3)
      .map((p) => ({ p, h: p.position[0], v: view === "top" ? p.position[2] : p.position[1] }));
    if (!pts.length) return null;
    const hs = pts.map((pt) => pt.h), vs = pts.map((pt) => pt.v);
    const minH = Math.min(...hs), maxH = Math.max(...hs);
    const minV = Math.min(...vs), maxV = Math.max(...vs);
    const spanH = Math.max(maxH - minH, 0.5), spanV = Math.max(maxV - minV, 0.5);
    const span = Math.max(spanH, spanV);
    const r = Math.min(0.42, Math.max(0.1, span / 34));
    const pad = span * 0.1 + r * 2.5;
    const byIdx = new Map(pts.map((pt) => [pt.p.index, pt]));
    const edges = pts
      .filter((pt) => pt.p.parent >= 0 && byIdx.has(pt.p.parent))
      .map((pt) => ({ from: byIdx.get(pt.p.parent), to: pt }));
    return {
      pts, edges, byIdx, r,
      vb: `${minH - pad} ${-maxV - pad} ${spanH + pad * 2} ${spanV + pad * 2}`,
      minH: minH - pad, maxH: maxH + pad, minV: minV - pad, maxV: maxV + pad,
    };
  }, [parts, view]);

  if (!model) {
    return <div className="h-full flex items-center justify-center tech-label">No part positions to plot</div>;
  }

  const root = model.byIdx.get(rootIndex);
  const classesPresent = [...new Set(model.pts.map(({ p }) => (p.module_id && byId[p.module_id]?.module_class) || "Unknown"))];

  return (
    <div className="relative h-full w-full">
      <svg viewBox={model.vb} preserveAspectRatio="xMidYMid meet" className="h-full w-full block">
        <defs>
          <pattern id="drydock-grid" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M1 0 V1 H0" fill="none" stroke="hsl(20 50% 60% / 0.1)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
          </pattern>
        </defs>
        <rect x={model.minH} y={-model.maxV} width={model.maxH - model.minH} height={model.maxV - model.minV} fill="url(#drydock-grid)" />

        {root && (
          <g stroke="hsl(9 64% 50% / 0.45)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke">
            <line x1={model.minH} x2={model.maxH} y1={-root.v} y2={-root.v} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1={root.h} x2={root.h} y1={-model.maxV} y2={-model.minV} strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </g>
        )}

        {model.edges.map(({ from, to }) => (
          <line
            key={`e${to.p.index}`}
            x1={from.h} y1={-from.v} x2={to.h} y2={-to.v}
            stroke="hsl(20 12% 45% / 0.8)" strokeWidth="1.2" vectorEffect="non-scaling-stroke"
          />
        ))}

        {model.pts.map(({ p, h, v }) => {
          const cls = (p.module_id && byId[p.module_id]?.module_class) || "Unknown";
          const hex = classHex(cls);
          const isRoot = p.index === rootIndex;
          const isCmd = p.index === commandIndex;
          const isSel = p.index === selected;
          const isHov = p.index === hovered;
          const r = model.r * (isCmd || isRoot ? 1.3 : 1);
          return (
            <g
              key={p.index}
              className="cursor-pointer"
              onClick={() => onSelect?.(p.index)}
              onMouseEnter={() => onHover?.(p.index)}
              onMouseLeave={() => onHover?.(null)}
            >
              <circle cx={h} cy={-v} r={model.r * 2.4} fill="transparent" />
              {(isCmd || isRoot) && (
                <circle cx={h} cy={-v} r={r * 1.9} fill="none" stroke={hex} strokeWidth="1" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
              )}
              <circle
                cx={h} cy={-v} r={r}
                fill={hex} fillOpacity={isSel || isHov ? 1 : 0.85}
                stroke={isSel ? "#ffffff" : "hsl(14 11% 7%)"} strokeWidth={isSel ? 1.8 : 0.8} vectorEffect="non-scaling-stroke"
              />
              {isHov && !isSel && (
                <circle cx={h} cy={-v} r={r * 1.5} fill="none" stroke="hsl(26 88% 52%)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute top-2 left-2 tech-label pointer-events-none">
        {view === "top" ? "TOP · X/Z" : "SIDE · X/Y"}
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center gap-x-3 gap-y-1 pointer-events-none">
        {classesPresent.map((cls) => (
          <span key={cls} className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            <span className="inline-block w-2 h-2" style={{ background: MODULE_CLASS_HEX[cls] || MODULE_CLASS_HEX.Unknown }} />
            {cls}
          </span>
        ))}
        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          dashed halo = command · crosshair = root
        </span>
      </div>
    </div>
  );
}
