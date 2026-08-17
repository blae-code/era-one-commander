import React from "react";
import { BarChart, Bar, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { fmt } from "@/lib/shipStats";

// Per-design contribution to the fleet's firepower and survivability (quantity included).
const METRICS = [
  { key: "dps", label: "DPS", fill: "#ff7a1a" },
  { key: "shield", label: "SHIELD", fill: "#eef4fa" },
  { key: "hp", label: "HULL HP", fill: "#38bdf8" },
];

const axis = { fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(36 10% 65%)" };

export default function FleetContribution({ roster }) {
  const data = roster.map((r) => ({
    name: r.name.length > 14 ? `${r.name.slice(0, 13)}…` : r.name,
    dps: (r.stats?.dps || 0) * r.qty,
    shield: (r.stats?.shield || 0) * r.qty,
    hp: (r.stats?.hp || 0) * r.qty,
  }));

  return (
    <div className="schematic-panel p-3">
      <div className="tech-label mb-2">Contribution by design</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <XAxis dataKey="name" tick={axis} axisLine={{ stroke: "hsl(30 7% 24%)" }} tickLine={false} interval={0} />
          <YAxis tick={axis} axisLine={false} tickLine={false} width={48} />
          <Tooltip
            contentStyle={{ background: "hsl(30 7% 9%)", border: "1px solid hsl(30 7% 24%)", borderRadius: 0, fontFamily: "IBM Plex Mono", fontSize: 11 }}
            formatter={(v, n) => [fmt(v), n]}
          />
          <Legend wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 9, letterSpacing: "0.12em" }} />
          {METRICS.map((m) => (
            <Bar key={m.key} dataKey={m.key} name={m.label} fill={m.fill} fillOpacity={0.85} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}