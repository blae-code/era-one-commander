import React, { useMemo, useRef, useState, useCallback } from "react";
import { fmtNum } from "@/lib/gameData";
import { teamColor, rgbaCss, sumResources, isInteractive, fmtQty, TEAM_COLORS } from "./theatreModel";

// Top-down x/z board. Kind = shape, team = colour. All marks render pointer-events:none;
// hover/click resolve through ONE mousemove hit-test over the (already scenario-filtered,
// <= ~800) interactive marks — no per-node handlers.

const KIND_LABEL = [
  ["asteroid", "circle · asteroid"],
  ["module", "diamond · module"],
  ["station", "diamond · station"],
  ["unit", "triangle · unit"],
  ["objective", "ring · objective"],
  ["wreck", "cross · wreck"],
  ["hazard", "wash · hazard"],
];

export default function TheatreBoard({ scenario, marks, band, resourcesById, pinned, onHover, onPin }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null); // { row, px, py }

  const geo = useMemo(() => {
    const bb = scenario?.bbox || {};
    let x0 = Number(bb.x_min), x1 = Number(bb.x_max), z0 = Number(bb.z_min), z1 = Number(bb.z_max);
    if (![x0, x1, z0, z1].every(Number.isFinite)) {
      x0 = z0 = Infinity; x1 = z1 = -Infinity;
      for (const r of marks) {
        x0 = Math.min(x0, r.x); x1 = Math.max(x1, r.x);
        z0 = Math.min(z0, r.z); z1 = Math.max(z1, r.z);
      }
      if (!Number.isFinite(x0)) { x0 = z0 = -50; x1 = z1 = 50; }
    }
    const spanX = Math.max(1, x1 - x0), spanZ = Math.max(1, z1 - z0);
    const padX = spanX * 0.06, padZ = spanZ * 0.06;
    const u = Math.max(spanX, spanZ) / 170; // glyph unit, scales with the map
    let qmax = 0;
    for (const r of marks) if (r.kind === "asteroid") qmax = Math.max(qmax, sumResources(r.resources));
    return {
      x0, z1, u, qmax: qmax || 1,
      vb: { x: x0 - padX, y: -padZ, w: spanX + padX * 2, h: spanZ + padZ * 2 },
    };
  }, [scenario, marks]);

  const sx = (r) => r.x;
  const sy = (r) => geo.z1 - r.z; // +z points up (north-up board)

  const astR = useCallback(
    (r) => geo.u * (1.1 + 3.6 * Math.sqrt(sumResources(r.resources) / geo.qmax)),
    [geo]
  );
  const inBand = useCallback(
    (r) => { const y = Number(r.y) || 0; return y >= band[0] && y <= band[1]; },
    [band]
  );

  const astFill = (r) => {
    const ruId = r.resources ? Object.keys(r.resources)[0] : null;
    const res = ruId && resourcesById ? resourcesById[ruId] : null;
    return res ? rgbaCss(res.color_rgba, 0.85) : "rgba(150,150,150,0.5)";
  };

  // mouse px -> world coords (preserveAspectRatio meet, centered)
  const toWorld = (e) => {
    const el = svgRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const scale = Math.min(rect.width / geo.vb.w, rect.height / geo.vb.h);
    if (!scale) return null;
    const ox = (rect.width - geo.vb.w * scale) / 2;
    const oy = (rect.height - geo.vb.h * scale) / 2;
    return {
      wx: geo.vb.x + (e.clientX - rect.left - ox) / scale,
      wy: geo.vb.y + (e.clientY - rect.top - oy) / scale,
      px: e.clientX - rect.left,
      py: e.clientY - rect.top,
    };
  };

  const hitTest = (wx, wy) => {
    let best = null, bestD = Infinity;
    for (const r of marks) {
      if (!isInteractive(r)) continue;
      const dx = sx(r) - wx, dy = sy(r) - wy;
      const d = Math.hypot(dx, dy);
      const hitR = Math.max(r.kind === "asteroid" ? astR(r) : geo.u * 2.6, geo.u * 2.6);
      if (d <= hitR && d < bestD) { best = r; bestD = d; }
    }
    return best;
  };

  const onMove = (e) => {
    const p = toWorld(e);
    if (!p) return;
    const row = hitTest(p.wx, p.wy);
    setHover(row ? { row, px: p.px, py: p.py } : null);
    onHover && onHover(row || null);
  };
  const onLeave = () => { setHover(null); onHover && onHover(null); };
  const onClick = (e) => {
    const p = toWorld(e);
    if (!p) return;
    const row = hitTest(p.wx, p.wy);
    onPin && onPin(row || null);
  };

  const active = hover?.row || pinned || null;
  const u = geo.u;
  const groups = useMemo(() => {
    const g = { hazard: [], wreck: [], asteroid: [], module: [], station: [], unit: [], objective: [] };
    for (const r of marks) if (g[r.kind]) g[r.kind].push(r);
    return g;
  }, [marks]);

  const op = (r, base) => (inBand(r) ? base : 0.06);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
        viewBox={`${geo.vb.x} ${geo.vb.y} ${geo.vb.w} ${geo.vb.h}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onClick}
      >
        <defs>
          {Object.entries(TEAM_COLORS).map(([team, c]) => (
            <radialGradient key={team} id={`thz-${team}`}>
              <stop offset="0%" stopColor={c} stopOpacity="0.22" />
              <stop offset="70%" stopColor={c} stopOpacity="0.08" />
              <stop offset="100%" stopColor={c} stopOpacity="0" />
            </radialGradient>
          ))}
          <pattern id="th-grid" width={geo.vb.w / 12} height={geo.vb.w / 12} patternUnits="userSpaceOnUse">
            <path
              d={`M ${geo.vb.w / 12} 0 L 0 0 0 ${geo.vb.w / 12}`}
              fill="none" stroke="hsl(9 40% 30%)" strokeOpacity="0.14"
              strokeWidth={u * 0.25}
            />
          </pattern>
        </defs>

        <rect x={geo.vb.x} y={geo.vb.y} width={geo.vb.w} height={geo.vb.h} fill="hsl(12 14% 3.5%)" />
        <rect x={geo.vb.x} y={geo.vb.y} width={geo.vb.w} height={geo.vb.h} fill="url(#th-grid)" />

        <g pointerEvents="none">
          {/* hazards — soft radial washes (no reference table: rendered generically) */}
          {groups.hazard.map((r) => (
            <circle key={r.game_id} cx={sx(r)} cy={sy(r)} r={u * 9} fill={`url(#thz-${r.team in TEAM_COLORS ? r.team : "None"})`} opacity={op(r, 1)} />
          ))}
          {/* wrecks — faint crosses */}
          {groups.wreck.map((r) => (
            <path
              key={r.game_id}
              d={`M ${sx(r) - u} ${sy(r) - u} L ${sx(r) + u} ${sy(r) + u} M ${sx(r) - u} ${sy(r) + u} L ${sx(r) + u} ${sy(r) - u}`}
              stroke={teamColor(r.team)} strokeWidth={u * 0.35} opacity={op(r, 0.4)}
            />
          ))}
          {/* asteroids — circles sized by resource qty (sqrt), tinted by Resource.color_rgba */}
          {groups.asteroid.map((r) => (
            <circle key={r.game_id} cx={sx(r)} cy={sy(r)} r={astR(r)} fill={astFill(r)} opacity={op(r, 0.9)} />
          ))}
          {/* enemy installations & stations — angular glyphs (45° rects) */}
          {groups.module.map((r) => (
            <rect
              key={r.game_id}
              x={-u * 1.1} y={-u * 1.1} width={u * 2.2} height={u * 2.2}
              transform={`translate(${sx(r)} ${sy(r)}) rotate(45)`}
              fill={teamColor(r.team)} opacity={op(r, 0.8)}
            />
          ))}
          {groups.station.map((r) => (
            <rect
              key={r.game_id}
              x={-u * 2} y={-u * 2} width={u * 4} height={u * 4}
              transform={`translate(${sx(r)} ${sy(r)}) rotate(45)`}
              fill="none" stroke={teamColor(r.team)} strokeWidth={u * 0.6} opacity={op(r, 0.95)}
            />
          ))}
          {/* units — triangles */}
          {groups.unit.map((r) => (
            <path
              key={r.game_id}
              d={`M ${sx(r)} ${sy(r) - u * 1.7} L ${sx(r) + u * 1.5} ${sy(r) + u * 1.2} L ${sx(r) - u * 1.5} ${sy(r) + u * 1.2} Z`}
              fill={teamColor(r.team)} opacity={op(r, 0.95)}
            />
          ))}
          {/* objectives — ring markers */}
          {groups.objective.map((r) => (
            <circle
              key={r.game_id}
              cx={sx(r)} cy={sy(r)} r={u * 2.2}
              fill="none" stroke={teamColor(r.team)} strokeWidth={u * 0.5} opacity={op(r, 0.95)}
            />
          ))}
          {/* spawner flags — dashed halo */}
          {marks.filter((r) => r.spawner).map((r) => (
            <circle
              key={`sp-${r.game_id}`}
              cx={sx(r)} cy={sy(r)} r={u * 4}
              fill="none" stroke="hsl(9 64% 52%)" strokeWidth={u * 0.4}
              strokeDasharray={`${u} ${u}`} opacity={op(r, 0.9)}
            />
          ))}
          {/* active crosshair */}
          {active ? (
            <g stroke="hsl(26 88% 52%)" strokeWidth={u * 0.5} fill="none">
              <circle cx={sx(active)} cy={sy(active)} r={u * 4.4} />
              <path d={`M ${sx(active) - u * 6.5} ${sy(active)} h ${u * 2.4} M ${sx(active) + u * 4.1} ${sy(active)} h ${u * 2.4}`} />
              <path d={`M ${sx(active)} ${sy(active) - u * 6.5} v ${u * 2.4} M ${sx(active)} ${sy(active) + u * 4.1} v ${u * 2.4}`} />
            </g>
          ) : null}
        </g>
      </svg>

      {/* tooltip */}
      {hover ? (
        <div
          className="absolute z-10 pointer-events-none border border-border bg-black/90 px-2.5 py-1.5 font-mono text-[10px] leading-relaxed max-w-[240px]"
          style={{ left: Math.min(hover.px + 14, 9999), top: hover.py + 12 }}
        >
          <div className="text-foreground font-semibold truncate">{hover.row.name || hover.row.identifier}</div>
          <div className="text-muted-foreground uppercase tracking-[0.1em]">
            {hover.row.kind} · <span style={{ color: teamColor(hover.row.team) }}>{hover.row.team}</span>
            {hover.row.spawner ? " · spawner" : ""}
          </div>
          <div className="text-muted-foreground">y {fmtNum(hover.row.y, 1)}</div>
          {hover.row.resources
            ? Object.entries(hover.row.resources).map(([ru, q]) => (
              <div key={ru} className="text-foreground/90">
                <span style={{ color: rgbaCss(resourcesById?.[ru]?.color_rgba, 1) }}>■</span>{" "}
                {resourcesById?.[ru]?.name || ru} {fmtQty(q)}
              </div>
            ))
            : null}
        </div>
      ) : null}

      {/* legend */}
      <div className="absolute bottom-1.5 left-2 right-2 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground/80 pointer-events-none">
        {KIND_LABEL.map(([k, l]) => <span key={k}>{l}</span>)}
        <span className="ml-auto flex gap-2">
          {Object.entries(TEAM_COLORS).map(([t, c]) => (
            <span key={t} style={{ color: c }}>■ {t}</span>
          ))}
        </span>
      </div>
    </div>
  );
}
