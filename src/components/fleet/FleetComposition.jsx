import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { fmt } from "@/lib/shipStats";

// Fleet composition: how the hulls (and their firepower) split across classes and roles.
const HEX = ["#ff7a1a", "#2f9bff", "#ffd21a", "#d24bff", "#38bdf8", "#ff2d55", "#eef4fa"];

function group(roster, key) {
  const map = new Map();
  for (const r of roster) {
    const label = r[key] || "Unclassified";
    const cur = map.get(label) || { label, hulls: 0, dps: 0, shield: 0 };
    cur.hulls += r.qty;
    cur.dps += (r.stats?.dps || 0) * r.qty;
    cur.shield += (r.stats?.shield || 0) * r.qty;
    map.set(label, cur);
  }
  return [...map.values()].sort((a, b) => b.hulls - a.hulls);
}

function Breakdown({ title, rows, hulls }) {
  return (
    <div className="schematic-panel p-3">
      <div className="tech-label mb-2">{title}</div>
      <div className="flex items-center gap-3">
        <ResponsiveContainer width={130} height={130}>
          <PieChart>
            <Pie data={rows} dataKey="hulls" nameKey="label" innerRadius={34} outerRadius={60} stroke="hsl(30 7% 9%)" strokeWidth={2} isAnimationActive={false}>
              {rows.map((r, i) => <Cell key={r.label} fill={HEX[i % HEX.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: "hsl(30 7% 9%)", border: "1px solid hsl(30 7% 24%)", borderRadius: 0, fontFamily: "IBM Plex Mono", fontSize: 11 }}
              formatter={(v, n) => [`${v} hulls`, n]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 border border-border divide-y divide-border min-w-0">
          {rows.map((r, i) => (
            <div key={r.label} className="bg-card px-2.5 py-1.5 flex items-baseline justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                <span className="inline-block w-2 h-2 mr-2 align-middle" style={{ background: HEX[i % HEX.length] }} />
                {r.label}
              </span>
              <span className="font-mono text-xs font-semibold whitespace-nowrap">
                {r.hulls}
                <span className="font-normal text-[10px] text-muted-foreground ml-1">
                  {hulls ? `${Math.round((r.hulls / hulls) * 100)}%` : ""} · {fmt(r.dps)} dps · {fmt(r.shield)} shd
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FleetComposition({ roster, hulls }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Breakdown title="Composition by class" rows={group(roster, "ship_class")} hulls={hulls} />
      <Breakdown title="Composition by role" rows={group(roster, "role")} hulls={hulls} />
    </div>
  );
}