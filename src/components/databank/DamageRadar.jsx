import React, { useMemo, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { fmtNum } from "@/lib/gameData";

// Tactical efficiency radar — a weapon's per-class damage table plotted as a shape,
// so its strong and weak armour classes read at a glance.
const METRICS = [
  { key: "dps_vs_class", label: "DPS", dec: 1 },
  { key: "hp_per_hit_vs_class", label: "Dmg / hit", dec: 1 },
];
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const SHORT = (c) => c.replace(/Unit$/, "").replace(/Module$/, " MOD");

export default function DamageRadar({ row, peers = [] }) {
  const [metric, setMetric] = useState("dps_vs_class");
  const [vsPeers, setVsPeers] = useState(false);
  const m = METRICS.find((x) => x.key === metric);

  const { data, peak, peerPeak } = useMemo(() => {
    const table = row[metric] || {};
    const classes = Object.keys(table).filter((c) => num(table[c]) > 0);
    const pk = Math.max(1, ...classes.map((c) => num(table[c])));
    const pp = {};
    for (const c of classes) pp[c] = Math.max(1, ...peers.map((p) => num(p[metric]?.[c])));
    return {
      peak: pk,
      peerPeak: pp,
      data: classes.map((c) => ({
        cls: SHORT(c),
        raw: num(table[c]),
        value: vsPeers ? (num(table[c]) / pp[c]) * 100 : (num(table[c]) / pk) * 100,
      })),
    };
  }, [row, metric, vsPeers, peers]);

  if (data.length < 3) return null;

  return (
    <div className="schematic-panel plate-texture p-3">
      <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="tech-label">Tactical efficiency // {vsPeers ? "vs best in class" : "vs own peak"}</div>
        <div className="flex gap-1">
          {METRICS.map((x) => (
            <button key={x.key} onClick={() => setMetric(x.key)}
              className={`px-1.5 h-6 border font-mono text-[9px] uppercase tracking-wider ${metric === x.key ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{x.label}</button>
          ))}
          <button onClick={() => setVsPeers(!vsPeers)}
            className={`px-1.5 h-6 border font-mono text-[9px] uppercase tracking-wider ${vsPeers ? "border-accent text-accent" : "border-border text-muted-foreground hover:border-primary/40"}`}>peers</button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.8} />
          <PolarAngleAxis dataKey="cls" tick={{ fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(var(--muted-foreground))" }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8, fontFamily: "IBM Plex Mono", fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickCount={5} />
          <Tooltip
            contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, borderRadius: 0, background: "hsl(12 12% 6%)", border: "1px solid hsl(var(--primary) / 0.5)" }}
            formatter={(v, _n, p) => [`${fmtNum(p.payload.raw, m.dec)} (${fmtNum(v, 0)}%)`, m.label]}
          />
          <Radar dataKey="value" stroke="hsl(var(--accent))" strokeWidth={1.8} fill="hsl(var(--primary))" fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="font-mono text-[10px] text-muted-foreground">
        Peak {m.label.toLowerCase()} {fmtNum(peak, m.dec)} · {vsPeers ? "100% = best armament against that class" : "100% = this weapon's own best class"}
      </div>
    </div>
  );
}