import React, { useMemo, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

const AXIS = { fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(18 8% 60%)" };

const CLASS_HEX = { Weapon: "#ff7a1a", Structural: "#2f9bff", Facility: "#ffd21a", Utility: "#d24bff", Command: "#eef4fa" };

// RULE-3: no class-free scalar DPS as a comparative metric. DPS here resolves through
// dps_vs_class[targetClass] and the target class is named in the panel label, axis and tooltip.
const TARGET_CLASSES = [
  "FighterUnit", "CorvetteUnit", "FrigateUnit", "UtilityUnit", "PlatformUnit", "MineUnit",
  "CommandModule", "StructuralModule", "WeaponModule", "FacilityModule", "UtilityModule",
  "Station", "Wreckage",
];

const YIELDS = [
  { key: "dps", label: "DPS" },
  { key: "max_health", label: "HULL HP" },
  { key: "energy_production", label: "ENERGY OUT" },
];

// Value-for-money plot: build cost against the yield stat, split by module class.
export default function ValueScatter({ modules }) {
  const [yKey, setYKey] = useState("dps");
  const [targetClass, setTargetClass] = useState("StructuralModule"); // labeled default — the typical station target
  const yLabel = yKey === "dps" ? `DPS vs ${targetClass}` : YIELDS.find((y) => y.key === yKey).label;

  const groups = useMemo(() => {
    const g = {};
    for (const m of modules) {
      const cost = m.cost_resources || 0;
      const val = yKey === "dps" ? m.dps_vs_class?.[targetClass] || 0 : m[yKey] || 0;
      if (cost <= 0 || val <= 0) continue;
      const cls = m.module_class || "Utility";
      (g[cls] = g[cls] || []).push({ x: cost, y: val, z: m.tier || 1, name: m.name || m.game_id, ratio: (val / cost).toFixed(2) });
    }
    return g;
  }, [modules, yKey, targetClass]);

  return (
    <div className="schematic-panel plate-texture p-3">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="tech-label">Cost efficiency // RU vs {yKey === "dps" ? `dps vs ${targetClass}` : "yield"} (bubble = tier)</div>
        <div className="flex gap-1 items-center flex-wrap">
          {YIELDS.map((y) => (
            <button key={y.key} onClick={() => setYKey(y.key)}
              className={`px-2 h-6 font-mono text-[9px] uppercase tracking-wider border ${yKey === y.key ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>
              {y.label}
            </button>
          ))}
          {yKey === "dps" && (
            <select value={targetClass} onChange={(e) => setTargetClass(e.target.value)} aria-label="DPS target class"
              className="h-6 px-1 rounded-none border border-border bg-card font-mono text-[9px] uppercase tracking-wider text-foreground focus:border-primary outline-none">
              {TARGET_CLASSES.map((c) => (
                <option key={c} value={c}>vs {c}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ left: -6, right: 8, top: 6, bottom: 4 }}>
          <CartesianGrid stroke="hsl(9 55% 50% / 0.10)" />
          <XAxis type="number" dataKey="x" name="RU" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis type="number" dataKey="y" name={yLabel} tick={AXIS} axisLine={false} tickLine={false} width={54}
            label={{ value: yLabel, angle: -90, position: "insideLeft", offset: 16, style: { ...AXIS, textAnchor: "middle", textTransform: "uppercase" } }} />
          <ZAxis type="number" dataKey="z" range={[30, 180]} />
          <Tooltip
            content={({ payload }) => {
              const p = payload?.[0]?.payload;
              if (!p) return null;
              return (
                <div className="border border-border bg-[hsl(14_11%_8%)] px-2 py-1 font-mono text-[10px]">
                  <div className="text-primary">{p.name}</div>
                  <div className="text-muted-foreground">{p.x} RU · {Math.round(p.y * 10) / 10} {yLabel.toLowerCase()} · T{p.z}</div>
                  <div className="text-accent">{p.ratio} {yKey === "dps" ? `dps/RU vs ${targetClass}` : "per RU"}</div>
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
