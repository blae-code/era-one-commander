import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const AXIS = { fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(18 8% 60%)" };
const TIP = { fontFamily: "IBM Plex Mono", fontSize: 10, borderRadius: 0, background: "hsl(14 11% 8%)", border: "1px solid hsl(14 11% 20%)" };

// Cumulative RU that has to be sunk to clear the tree down to each depth level.
export default function ResearchRamp({ research }) {
  const data = useMemo(() => {
    const byDepth = new Map();
    for (const r of research) {
      const d = r.tree_depth ?? 0;
      byDepth.set(d, (byDepth.get(d) || 0) + (r.cost_resources || 0));
    }
    let run = 0;
    return [...byDepth.entries()].sort((a, b) => a[0] - b[0]).map(([d, ru]) => {
      run += ru;
      return { depth: `D${d}`, ru: Math.round(ru), cumulative: Math.round(run) };
    });
  }, [research]);

  return (
    <div className="schematic-panel plate-texture p-3">
      <div className="tech-label mb-2">Investment ramp // cumulative RU by tree depth</div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ left: -6, right: 4, top: 6, bottom: 0 }}>
          <defs>
            <linearGradient id="rampFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0561c" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#e0561c" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(9 55% 50% / 0.10)" />
          <XAxis dataKey="depth" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} width={54} />
          <Tooltip contentStyle={TIP} />
          <Area type="monotone" dataKey="cumulative" name="Cumulative RU" stroke="#e0561c" strokeWidth={2} fill="url(#rampFill)" />
          <Area type="step" dataKey="ru" name="Tier RU" stroke="#ffc44a" strokeWidth={1} fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}