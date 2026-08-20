import React, { useMemo, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

const AXIS = { fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(18 8% 60%)" };
const TIP = { fontFamily: "IBM Plex Mono", fontSize: 10, borderRadius: 0, background: "hsl(14 11% 8%)", border: "1px solid hsl(14 11% 20%)" };

const CLASS_HEX = { Weapon: "#ff7a1a", Structural: "#2f9bff", Facility: "#ffd21a", Utility: "#d24bff", Command: "#eef4fa" };
const YIELDS = [
  { key: "dps_total", label: "DPS" },
  { key: "max_health", label: "HULL HP" },
  { key: "energy_production", label: "ENERGY OUT" },
];

// Value-for-money plot: build cost against the yield stat, split by module class.
export default function ValueScatter({ modules }) {
  const [yKey, setYKey] = useState("dps_total");
  const groups = useMemo(() => {
    const g = {};
    for (const m of modules) {
      const cost = m.cost_resources || 0;
      const val = m[yKey] || 0;
      if (cost <= 0 || val <= 0) continue;
      const cls = m.module_class || "Utility";
      (g[cls] = g[cls] || []).push({ x: cost, y: val, z: m.tier || 1, name: m.name || m.game_id, ratio: (val / cost).toFixed(2) });
    }
    return g;
  }, [modules, yKey]);

  return (
    <div className="schematic-panel plate-texture p-3">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="tech-label">Cost efficiency // RU vs yield (bubble = tier)</div>
        <div className="flex gap-1">
          {YIELDS.map((y) => (
            <button key={y.key} onClick={() => setYKey(y.key)}
              className={`px-2 h-6 font-mono text-[9px] uppercase tracking-wider border ${yKey === y.key ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>
              {y.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ left: -6, right: 8, top: 6, bottom: 4 }}>
          <CartesianGrid stroke="hsl(9 55% 50% / 0.10)" />
          <XAxis type="number" dataKey="x" name="RU" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis type="number" dataKey="y" name={YIELDS.find((y) => y.key === yKey).label} tick={AXIS} axisLine={false} tickLine={false} width={54} />
          <ZAxis type="number" dataKey="z" range={[30, 180]} />
          <Tooltip contentStyle={TIP} formatter={(v, n) => [v, n]} labelFormatter={() => ""}
            content={({ payload }) => {
              const p = payload?.[0]?.payload;
              if (!p) return null;
              return (
                <div className="border border-border bg-[hsl(14_11%_8%)] px-2 py-1 font-mono text-[10px]">
                  <div className="text-primary">{p.name}</div>
                  <div className="text-muted-foreground">{p.x} RU · {p.y} yield · T{p.z}</div>
                  <div className="text-accent">{p.ratio} per RU</div>
                </div>
              );
            }} />
          <Legend wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em" }} />
          {Object.entries(groups).map(([cls, pts]) => (
            <Scatter key={cls} name={cls} data={pts} fill={CLASS_HEX[cls] || "#8a5a2b"} fillOpacity={0.75} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}