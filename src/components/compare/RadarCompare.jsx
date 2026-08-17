import React from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, ResponsiveContainer } from "recharts";

export default function RadarCompare({ a, b, axes }) {
  const data = axes.map(({ key, label, invert }) => {
    const va = a?.[key] || 0;
    const vb = b?.[key] || 0;
    const max = Math.max(va, vb) || 1;
    let na = (va / max) * 100;
    let nb = (vb / max) * 100;
    if (invert) { na = 100 - na + (va === vb ? 0 : 10); nb = 100 - nb + (va === vb ? 0 : 10); }
    return { axis: label, A: Math.round(na), B: Math.round(nb) };
  });

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="hsl(32 9% 26%)" />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono", fill: "hsl(36 12% 62%)" }} />
        <Radar name={a?.name || "A"} dataKey="A" stroke="#d4713f" fill="#d4713f" fillOpacity={0.25} strokeWidth={2} />
        <Radar name={b?.name || "B"} dataKey="B" stroke="#8c9aa3" fill="#8c9aa3" fillOpacity={0.2} strokeWidth={2} />
        <Legend wrapperStyle={{ fontFamily: "Rajdhani", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: "hsl(38 22% 90%)" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}