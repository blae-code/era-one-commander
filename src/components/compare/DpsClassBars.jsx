import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fmtNum } from "@/lib/gameData";

// DPS is only comparable against a NAMED target class: the game's class-free dps scalar is banned
// as a comparison metric, so everything here resolves through row.dps_vs_class[selectedClass].
export const TARGET_CLASSES = [
  "FighterUnit", "CorvetteUnit", "FrigateUnit", "UtilityUnit", "PlatformUnit", "MineUnit",
  "CommandModule", "StructuralModule", "WeaponModule", "FacilityModule", "UtilityModule",
  "Station", "Wreckage",
];
export const DEFAULT_CLASS = "FrigateUnit";

const shortClass = (c) =>
  c === "Station" || c === "Wreckage" ? c.toUpperCase() : c.replace(/(Unit|Module)$/, "·$1").replace("·Unit", " U").replace("·Module", " M").toUpperCase();

const TOOLTIP_STYLE = {
  fontFamily: "IBM Plex Mono", fontSize: 11, borderRadius: 0,
  background: "hsl(30 7% 10%)", border: "1px solid hsl(30 7% 22%)",
};

export default function DpsClassBars({ items, colors, selectedClass, onSelectClass }) {
  const dps = (r, cls) => Number(r?.dps_vs_class?.[cls]) || 0;
  const selVals = items.map((r) => dps(r, selectedClass));
  const selMax = Math.max(...selVals, 0);

  const chartData = TARGET_CLASSES.map((cls) => {
    const row = { cls: shortClass(cls), full: cls };
    items.forEach((it, i) => { row[`v${i}`] = dps(it, cls); });
    return row;
  });

  return (
    <div className="schematic-panel p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <div className="tech-label">DPS VS TARGET CLASS</div>
        <div className="font-mono text-[10px] text-muted-foreground">values = dps_vs_class[{selectedClass}]</div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {TARGET_CLASSES.map((cls) => (
          <button
            key={cls}
            onClick={() => onSelectClass(cls)}
            className={`px-2 py-1 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
              cls === selectedClass
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
            title={cls}
          >
            {shortClass(cls)}{cls === DEFAULT_CLASS ? " ·DEF" : ""}
          </button>
        ))}
      </div>

      <div className="font-display font-semibold text-sm uppercase tracking-[0.12em] mb-2">
        DPS vs <span className="text-accent">{selectedClass}</span>
      </div>
      <div className="space-y-2 mb-5">
        {items.map((it, i) => (
          <div key={it.game_id} className="grid grid-cols-[minmax(120px,220px)_1fr_auto] items-center gap-3">
            <div className="font-mono text-xs truncate" style={{ color: colors[i] }}>{it.name}</div>
            <div className="h-2.5 bg-secondary/60 border border-border/60">
              <div className="h-full" style={{ width: `${selMax > 0 ? (selVals[i] / selMax) * 100 : 0}%`, background: colors[i] }} />
            </div>
            <div className="font-mono text-sm ember-glow w-16 text-right">{fmtNum(selVals[i], 1)}</div>
          </div>
        ))}
      </div>

      <div className="tech-label mb-1">FULL SPECTRUM // ALL 13 TARGET CLASSES</div>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 34, left: -14 }} barCategoryGap="22%">
              <XAxis
                dataKey="cls" interval={0} angle={-38} textAnchor="end"
                tick={{ fontSize: 8, fontFamily: "IBM Plex Mono", fill: "hsl(36 10% 62%)" }}
                axisLine={{ stroke: "hsl(30 7% 24%)" }} tickLine={false}
              />
              <YAxis tick={{ fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(36 10% 55%)" }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "hsl(30 7% 16% / 0.5)" }} contentStyle={TOOLTIP_STYLE}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.full || ""}
                formatter={(v, name) => {
                  const idx = Number(String(name).slice(1));
                  return [fmtNum(v, 1), items[idx]?.name || name];
                }}
              />
              {items.map((it, i) => (
                <Bar key={it.game_id} dataKey={`v${i}`} fill={colors[i]} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
