import React from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, ResponsiveContainer } from "recharts";

// Normalized multi-axis profile for 2-4 entities. axes: [{ key, label, invert?, get? }].
// Each axis normalizes against the max across the SELECTED entities (100 = best of this pool);
// invert marks lower-is-better axes (mass, cost) so outward always reads as better.
export default function RadarCompare({ items, colors, axes }) {
  const data = axes.map((ax) => {
    const vals = items.map((r) => {
      const v = ax.get ? ax.get(r) : r?.[ax.key];
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    });
    const max = Math.max(...vals, 0);
    const row = { axis: ax.label };
    items.forEach((_, i) => {
      let n = max > 0 ? (vals[i] / max) * 100 : ax.invert ? 100 : 0;
      if (ax.invert && max > 0) n = 100 - n;
      row[`v${i}`] = Math.round(n);
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="hsl(30 7% 24%)" />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono", fill: "hsl(36 10% 70%)" }} />
        {items.map((it, i) => (
          <Radar
            key={it.game_id}
            name={it.name}
            dataKey={`v${i}`}
            stroke={colors[i]}
            fill={colors[i]}
            fillOpacity={0.14}
            strokeWidth={2}
            strokeDasharray={i % 2 === 1 ? "5 3" : undefined}
            isAnimationActive={false}
          />
        ))}
        <Legend wrapperStyle={{ fontFamily: "Chakra Petch", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
