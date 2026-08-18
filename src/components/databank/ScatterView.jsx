import React, { useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { CLASS_HEX, rowClass } from "./Cells";
import { fmtNum } from "@/lib/gameData";

// Scatter analysis view: any numeric column on X vs Y, colored by class, click to inspect.
export default function ScatterView({ rows, kind, kindKey, ctx, db, selectedId, onSelect, compareIds }) {
  const numCols = kind.columns.filter((c) => c.type === "num" || c.type === "pct");
  const xCol = numCols.find((c) => c.key === db.plotX) || numCols.find((c) => c.key === "cost_resources") || numCols[0];
  const yCol = numCols.find((c) => c.key === db.plotY) || numCols.find((c) => c.key.startsWith("dps")) || numCols[1] || numCols[0];

  const data = useMemo(() =>
    rows.map((r) => ({ x: xCol?.get(r, ctx), y: yCol?.get(r, ctx), name: r.name, id: r.game_id, cls: rowClass(r, kindKey) }))
      .filter((p) => typeof p.x === "number" && typeof p.y === "number"),
    [rows, xCol, yCol, ctx, kindKey]);
  const classes = useMemo(() => [...new Set(data.map((p) => p.cls))], [data]);

  if (!xCol || !yCol) return <div className="schematic-panel p-8 tech-label text-center">No numeric columns to plot for this kind.</div>;

  const AxisSel = ({ label, val, onChange }) => (
    <label className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      {label}
      <select value={val} onChange={(e) => onChange(e.target.value)}
        className="h-7 bg-background/60 border border-border px-1.5 text-[10px] font-mono outline-none focus:border-primary text-foreground">
        {numCols.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
      </select>
    </label>
  );
  const tick = { fill: "hsl(36 10% 70%)", fontSize: 10, fontFamily: "monospace" };

  return (
    <div className="schematic-panel h-full flex flex-col p-3 min-h-[420px]">
      <div className="flex items-center gap-4 mb-1 flex-wrap">
        <span className="tech-label">Scatter analysis // {data.length} plotted</span>
        <AxisSel label="X" val={xCol.key} onChange={(k) => db.setPlotAxes(k, yCol.key)} />
        <AxisSel label="Y" val={yCol.key} onChange={(k) => db.setPlotAxes(xCol.key, k)} />
        <span className="tech-label ml-auto opacity-60 hidden md:inline">click a point to inspect</span>
      </div>
      <div className="flex items-center gap-3 flex-wrap mb-1">
        {classes.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            <span className="w-2 h-2 rounded-sm" style={{ background: CLASS_HEX[c] || "hsl(30 72% 62%)" }} />{c}
          </span>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 14, left: 6 }}>
            <CartesianGrid stroke="hsl(30 7% 19%)" strokeDasharray="3 3" />
            <XAxis dataKey="x" type="number" name={xCol.label} tick={tick} stroke="hsl(30 7% 19%)"
              label={{ value: xCol.label, position: "insideBottomRight", fill: "hsl(36 10% 70%)", fontSize: 10, dy: 12 }} />
            <YAxis dataKey="y" type="number" name={yCol.label} tick={tick} stroke="hsl(30 7% 19%)"
              label={{ value: yCol.label, angle: -90, position: "insideLeft", fill: "hsl(36 10% 70%)", fontSize: 10 }} />
            <ZAxis range={[46, 47]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ payload }) => payload?.length ? (
              <div className="bg-popover border border-border px-2 py-1.5 font-mono text-[10px]">
                <div className="text-foreground font-bold">{payload[0].payload.name}</div>
                <div className="text-muted-foreground">{xCol.label}: {fmtNum(payload[0].payload.x, xCol.dec ?? 1)} · {yCol.label}: {fmtNum(payload[0].payload.y, yCol.dec ?? 1)}</div>
              </div>) : null} />
            <Scatter data={data} onClick={(p) => p?.id && onSelect(p.id)}>
              {data.map((p) => (
                <Cell key={p.id} fill={CLASS_HEX[p.cls] || "hsl(30 72% 62%)"} fillOpacity={0.8}
                  stroke={p.id === selectedId ? "#ffffff" : compareIds.includes(p.id) ? "#2f9bff" : "none"}
                  strokeWidth={p.id === selectedId ? 2 : 1.5} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}