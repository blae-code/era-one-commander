import React, { useMemo } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

const AXIS = { fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(18 8% 60%)" };
const TIP = { fontFamily: "IBM Plex Mono", fontSize: 10, borderRadius: 0, background: "hsl(14 11% 8%)", border: "1px solid hsl(14 11% 20%)" };

// Average research investment per tech tier: RU + research points, with node count.
export default function TierCostCurve({ research }) {
  const data = useMemo(() => {
    const byTier = new Map();
    for (const r of research) {
      const t = r.tier_number ?? r.tier ?? 0;
      if (!byTier.has(t)) byTier.set(t, { tier: `T${t}`, ru: 0, rp: 0, time: 0, n: 0 });
      const b = byTier.get(t);
      b.ru += r.cost_resources || 0;
      b.rp += r.cost_research || r.required_research_score || 0;
      b.time += r.construction_time || 0;
      b.n += 1;
    }
    return [...byTier.entries()].sort((a, b) => a[0] - b[0]).map(([, b]) => ({
      tier: b.tier, nodes: b.n,
      ru: Math.round(b.ru / b.n), rp: Math.round(b.rp / b.n), time: Math.round(b.time / b.n),
    }));
  }, [research]);

  return (
    <div className="schematic-panel plate-texture p-3">
      <div className="tech-label mb-2">Research cost curve // average per tech tier</div>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ left: -14, right: 4, top: 6, bottom: 0 }}>
          <CartesianGrid stroke="hsl(9 55% 50% / 0.10)" />
          <XAxis dataKey="tier" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis yAxisId="r" orientation="right" tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TIP} cursor={{ fill: "hsl(14 9% 12%)" }} />
          <Legend wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em" }} />
          <Bar yAxisId="l" dataKey="ru" name="RU cost" fill="#e0561c" />
          <Bar yAxisId="l" dataKey="rp" name="Research pts" fill="#8a5a2b" />
          <Line yAxisId="r" type="monotone" dataKey="time" name="Build time (s)" stroke="#ffc44a" strokeWidth={2} dot={{ r: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="font-mono text-[9px] text-muted-foreground mt-1">{data.reduce((a, d) => a + d.nodes, 0)} nodes across {data.length} tiers</div>
    </div>
  );
}