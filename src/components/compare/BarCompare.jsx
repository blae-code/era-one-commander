import React from "react";
import { BarChart, Bar, XAxis, YAxis, Cell, LabelList, ResponsiveContainer } from "recharts";
import { fmt } from "@/lib/shipStats";

// One mini bar chart per metric — each metric keeps its own scale so mass (t), power (MW)
// and dps stay readable side by side instead of being flattened onto one axis.
const A_COLOR = "#ff7a1a";
const B_COLOR = "#2f9bff";

export default function BarCompare({ a, b, metrics }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {metrics.map(({ key, label, unit = "", decimals = 0, lowerBetter }) => {
        const va = a?.[key] || 0;
        const vb = b?.[key] || 0;
        const data = [
          { name: "ALPHA", value: va, fill: A_COLOR },
          { name: "BRAVO", value: vb, fill: B_COLOR },
        ];
        const diff = va - vb;
        const winner = diff === 0 ? null : (lowerBetter ? va < vb : va > vb) ? "ALPHA" : "BRAVO";

        return (
          <div key={key} className="schematic-panel p-3">
            <div className="flex items-baseline justify-between mb-1">
              <span className="tech-label">{label}</span>
              {unit && <span className="font-mono text-[9px] text-muted-foreground">{unit}</span>}
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={data} margin={{ top: 14, right: 4, bottom: 0, left: -18 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(36 10% 70%)" }} axisLine={{ stroke: "hsl(30 7% 24%)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(36 10% 55%)" }} axisLine={false} tickLine={false} width={38} />
                <Bar dataKey="value" barSize={34} isAnimationActive={false}>
                  {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(v) => fmt(v, decimals)}
                    style={{ fontSize: 10, fontFamily: "IBM Plex Mono", fill: "hsl(40 18% 95%)" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="font-mono text-[10px] mt-1.5 text-center">
              {winner ? (
                <span className={winner === "ALPHA" ? "text-[#ff7a1a]" : "text-[#2f9bff]"}>
                  ▲ {winner} by {fmt(Math.abs(diff), decimals)}{unit}
                  {lowerBetter && <span className="text-muted-foreground"> (lower is better)</span>}
                </span>
              ) : (
                <span className="text-muted-foreground">= identical</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}