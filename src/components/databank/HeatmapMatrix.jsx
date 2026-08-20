import React, { useMemo, useState } from "react";
import { EntityIcon } from "./Cells";
import { CLASSES } from "./catalog";
import { fmtNum } from "@/lib/gameData";

// Interactive weapon-vs-hull heatmap. Saturated ember ramp on black plating.
// Scale modes decide what "hot" means: absolute across the whole matrix,
// per-row (this weapon's best target) or per-column (best weapon vs that hull).
const METRICS = [
  { key: "dps_vs_class", label: "DPS", dec: 1 },
  { key: "hp_per_hit_vs_class", label: "Dmg / hit", dec: 1 },
];
const SCALES = [
  { key: "global", label: "absolute" },
  { key: "row", label: "per weapon" },
  { key: "col", label: "per hull" },
];
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const short = (c) => c.replace("Unit", "").replace("Module", " mod").replace("Structural", "Struct.").replace("Facility", "Facil.");

// black → deep rust → ember → brass, saturated
const RAMP = [
  [0.0, [24, 20, 18]], [0.25, [110, 32, 18]], [0.5, [186, 58, 18]],
  [0.75, [238, 108, 20]], [1.0, [255, 196, 74]],
];
function ramp(p) {
  const t = Math.max(0, Math.min(1, p));
  for (let i = 1; i < RAMP.length; i++) {
    const [p1, c1] = RAMP[i - 1], [p2, c2] = RAMP[i];
    if (t <= p2) {
      const k = (t - p1) / (p2 - p1 || 1);
      return `rgb(${c1.map((v, j) => Math.round(v + (c2[j] - v) * k)).join(",")})`;
    }
  }
  return `rgb(${RAMP.at(-1)[1].join(",")})`;
}

export default function HeatmapMatrix({ rows, kindKey, selectedId, onSelect }) {
  const [metric, setMetric] = useState("dps_vs_class");
  const [scale, setScale] = useState("global");
  const [sortCls, setSortCls] = useState(null);
  const [hover, setHover] = useState(null);
  const m = METRICS.find((x) => x.key === metric);

  const armed = useMemo(() => rows.filter((r) => r[metric] && Object.values(r[metric]).some((v) => num(v) > 0)), [rows, metric]);
  const cols = useMemo(() => CLASSES.filter((c) => armed.some((r) => num(r[metric][c]) > 0)), [armed, metric]);
  const globalMax = useMemo(() => Math.max(1, ...armed.flatMap((r) => cols.map((c) => num(r[metric][c])))), [armed, cols, metric]);
  const colMax = useMemo(() => Object.fromEntries(cols.map((c) => [c, Math.max(1, ...armed.map((r) => num(r[metric][c])))])), [armed, cols, metric]);
  const sorted = useMemo(() => {
    if (!sortCls) return armed;
    return [...armed].sort((a, b) => num(b[metric][sortCls]) - num(a[metric][sortCls]));
  }, [armed, sortCls, metric]);

  if (!armed.length)
    return <div className="schematic-panel p-8 tech-label text-center">Heatmap needs entries with armament — switch to Weapons, Modules, Ships or Turrets.</div>;

  const norm = (r, c) => {
    const v = num(r[metric][c]);
    if (scale === "row") return v / Math.max(1, ...cols.map((k) => num(r[metric][k])));
    if (scale === "col") return v / colMax[c];
    return v / globalMax;
  };

  return (
    <div className="schematic-panel plate-texture h-full flex flex-col overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60 z-20" />
      {/* controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1">
          {METRICS.map((x) => (
            <button key={x.key} onClick={() => setMetric(x.key)}
              className={`px-2 h-7 border font-mono text-[10px] uppercase tracking-wider ${metric === x.key ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>{x.label}</button>
          ))}
          <div className="h-5 w-px bg-border mx-1" />
          {SCALES.map((s) => (
            <button key={s.key} onClick={() => setScale(s.key)}
              className={`px-2 h-7 border font-mono text-[10px] uppercase tracking-wider ${scale === s.key ? "border-accent text-accent" : "border-border text-muted-foreground hover:border-primary/40"}`}>{s.label}</button>
          ))}
          {sortCls && (
            <button onClick={() => setSortCls(null)} className="px-2 h-7 border border-border font-mono text-[10px] uppercase text-muted-foreground hover:text-primary">clear sort</button>
          )}
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          <span>cold</span>
          <span className="h-3 w-40 border border-border" style={{ background: `linear-gradient(90deg, ${RAMP.map(([p, c]) => `rgb(${c.join(",")}) ${p * 100}%`).join(",")})` }} />
          <span>hot</span>
          <span className="ml-1">{scale === "global" ? `max ${fmtNum(globalMax, 0)}` : scale === "row" ? "row-relative" : "column-relative"}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="text-xs border-separate border-spacing-0 w-full">
          <thead className="sticky top-0 z-10 bg-[hsl(12_12%_6%)]">
            <tr>
              <th className="tech-label px-2 py-2 text-left border-b border-border sticky left-0 bg-[hsl(12_12%_6%)]">Armament</th>
              {cols.map((c) => (
                <th key={c} onClick={() => setSortCls(c === sortCls ? null : c)}
                  className={`tech-label px-1 py-2 border-b border-border text-center whitespace-nowrap cursor-pointer select-none ${sortCls === c ? "text-primary" : "hover:text-foreground"} ${hover?.c === c ? "bg-primary/10" : ""}`}
                  title={`${c} — click to rank`}>{short(c)}</th>
              ))}
              <th className="tech-label px-2 py-2 border-b border-border text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.game_id} onClick={() => onSelect(r.game_id)}
                className={`cursor-pointer ${r.game_id === selectedId ? "outline outline-1 outline-accent" : ""} ${hover?.id === r.game_id ? "bg-primary/5" : ""}`}>
                <td className="px-2 py-1 border-b border-border/50 whitespace-nowrap sticky left-0 bg-[hsl(14_11%_7%)]">
                  <span className="inline-flex items-center gap-1.5"><EntityIcon row={r} kindKey={kindKey} size={13} />{r.name}</span>
                </td>
                {cols.map((c) => {
                  const v = num(r[metric][c]);
                  const p = v ? norm(r, c) : 0;
                  return (
                    <td key={c} onMouseEnter={() => setHover({ id: r.game_id, c })} onMouseLeave={() => setHover(null)}
                      className="px-1 py-1 border-b border-border/40 text-center font-mono text-[10px] tabular-nums"
                      style={{ background: v ? ramp(p) : "transparent", color: p > 0.55 ? "#140d08" : "hsl(var(--foreground))", boxShadow: hover?.id === r.game_id && hover?.c === c ? "inset 0 0 0 1px hsl(var(--accent))" : "none" }}
                      title={`${r.name} vs ${c}: ${fmtNum(v, m.dec)}`}>
                      {v ? fmtNum(v, 0) : ""}
                    </td>
                  );
                })}
                <td className="px-2 py-1 border-b border-border/50 text-right font-mono text-[10px] text-muted-foreground">{fmtNum(r.dps_total ?? r.dps, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}