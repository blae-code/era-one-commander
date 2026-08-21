import React, { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { fmtNum } from "@/lib/gameData";

// Damage charts — how each weapon performs against a specific armour class.
// Reads the game's own per-class tables (dps_vs_class / hp_per_hit_vs_class),
// so nothing here is modelled or invented.
const METRICS = [
  { key: "dps_vs_class", label: "DPS", dec: 1 },
  { key: "hp_per_hit_vs_class", label: "Dmg / hit", dec: 1 },
];
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const CLASS_HEX = {
  FighterUnit: "#ff7a1a", CorvetteUnit: "#ffd21a", FrigateUnit: "#2f9bff", UtilityUnit: "#00d1c1",
  PlatformUnit: "#d24bff", MineUnit: "#8cff5a", CommandModule: "#ff5a5a", StructuralModule: "#c9d6e3",
  WeaponModule: "#ff9d33", FacilityModule: "#5ad2ff", UtilityModule: "#b9a06a", Station: "#eef4fa", Wreckage: "#8a7f72",
};

export default function DamageChartView({ rows, ctx, selectedId, onSelect, compareIds = [] }) {
  const [metric, setMetric] = useState("dps_vs_class");
  const m = METRICS.find((x) => x.key === metric);
  const [cls, setCls] = useState(null);
  const [limit, setLimit] = useState(18);

  const classes = useMemo(() => {
    const seen = new Set();
    for (const r of rows) for (const k of Object.keys(r[metric] || {})) if (num(r[metric][k]) > 0) seen.add(k);
    return Object.keys(CLASS_HEX).filter((k) => seen.has(k));
  }, [rows, metric]);
  const activeCls = cls && classes.includes(cls) ? cls : classes[0];

  const data = useMemo(() => {
    if (!activeCls) return [];
    return rows
      .map((r) => ({ id: r.game_id, name: r.name || r.game_id, value: num(r[metric]?.[activeCls]), base: num(r.dps), pen: num(r.armor_penetration), range: num(r.range) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }, [rows, metric, activeCls, limit]);

  const hex = CLASS_HEX[activeCls] || "hsl(var(--primary))";

  if (!classes.length)
    return <div className="schematic-panel p-10 text-center tech-label">No per-class damage tables on these records — switch to Weapons or Turrets.</div>;

  return (
    <div className="schematic-panel plate-texture p-4 h-full overflow-auto" role="region" aria-label={`Damage profile chart versus ${activeCls}`}>
      <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" aria-hidden="true" />
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div>
          <div className="font-display font-bold text-sm tracking-[0.18em] uppercase">Damage profile // {activeCls}</div>
          <div className="tech-label mt-0.5">Top {data.length} of {rows.length} armaments · game-computed per-class values</div>
        </div>
        <div className="flex items-center gap-1">
          {METRICS.map((x) => (
            <button key={x.key} onClick={() => setMetric(x.key)} aria-pressed={metric === x.key}
              className={`px-2 h-7 border font-mono text-[10px] uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary ${metric === x.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}>{x.label}</button>
          ))}
          <div className="h-5 w-px bg-border mx-1" aria-hidden="true" />
          {[12, 18, 30, 60].map((n) => (
            <button key={n} onClick={() => setLimit(n)} aria-pressed={limit === n} aria-label={`Show top ${n}`}
              className={`px-2 h-7 border font-mono text-[10px] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary ${limit === n ? "border-accent text-accent" : "border-border text-muted-foreground hover:border-primary/40"}`}>{n}</button>
          ))}
        </div>
      </div>

      {/* armour class selector */}
      <div className="flex flex-wrap gap-1 mb-4">
        {classes.map((c) => (
          <button key={c} onClick={() => setCls(c)} aria-pressed={activeCls === c} aria-label={`Target class ${c}`}
            className={`inline-flex items-center gap-1.5 px-2 h-7 border clip-plate font-mono text-[10px] uppercase tracking-[0.12em] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary ${activeCls === c ? "border-primary bg-primary/20 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>
            <span className="w-2 h-2" aria-hidden="true" style={{ background: CLASS_HEX[c] }} />{c.replace(/(Unit|Module)$/, "")}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={Math.max(240, data.length * 26)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }} barSize={14}>
          <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <XAxis type="number" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono", fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
            label={{ value: `${m.label} vs ${activeCls}`, position: "insideBottomRight", fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "IBM Plex Mono", dy: 8 }} />
          <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 10, fontFamily: "IBM Plex Mono", fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
            contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, borderRadius: 0, background: "hsl(12 12% 6%)", border: "1px solid hsl(var(--primary) / 0.5)" }}
            formatter={(v, _n, p) => [`${fmtNum(v, m.dec)} · pen ${fmtNum(p.payload.pen * 100, 0)}% · rng ${fmtNum(p.payload.range, 0)}`, m.label]}
          />
          <Bar dataKey="value" onClick={(d) => onSelect?.(d.id)} className="cursor-pointer">
            {data.map((d) => (
              <Cell key={d.id} fill={hex}
                fillOpacity={selectedId === d.id || compareIds.includes(d.id) ? 1 : 0.62}
                stroke={selectedId === d.id ? "hsl(var(--accent))" : compareIds.includes(d.id) ? "hsl(var(--primary))" : "transparent"} strokeWidth={1.5} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-muted-foreground mt-2">Click a bar to open its record. Values come straight from the game's per-class damage tables for the selected armour class.</p>
    </div>
  );
}