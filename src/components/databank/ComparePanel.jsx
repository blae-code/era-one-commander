import React from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, ResponsiveContainer } from "recharts";
import { X, GitCompare } from "lucide-react";
import { Cell, EntityIcon } from "./Cells";
import { fmtNum } from "@/lib/gameData";

const PALETTE = ["#ff7a1a", "#2f9bff", "#00d1c1", "#ffd21a"];

// Side-by-side comparison of up to 4 rows: best value per numeric row highlighted, radar over the kind's axes.
export default function ComparePanel({ rows, kind, kindKey, ctx, columns, onRemove, onClear, onSelect }) {
  if (!rows.length) return null;
  const numCols = columns.filter((c) => (c.type === "num" || c.type === "pct"));
  const otherCols = columns.filter((c) => c.type !== "num" && c.type !== "pct" && c.key !== "name");
  const lowerBetter = new Set(["cost_resources", "cost_population", "construction_time", "mass", "sum_module_cost_resources", "crew_total", "cost_energy"]);
  const hasNominalDps = (kind.radar || []).some(([key]) => key === "dps_total" || key === "dps") || numCols.some((c) => c.key === "dps_total" || c.key === "dps");
  const radarData = (kind.radar || []).map(([key, label, invert]) => {
    const col = kind.columns.find((c) => c.key === key); const vals = rows.map((r) => (col ? col.get(r, ctx) : r[key]) || 0);
    const max = Math.max(...vals) || 1; const d = { axis: key === "dps_total" || key === "dps" ? `${label} (nominal)` : label };
    // invert = lower-is-better (e.g. Cost): plot 100 − normalised value, kept inside the 0–100 scale.
    rows.forEach((r, i) => { let n = (vals[i] / max) * 100; if (invert) n = 100 - n; d[`v${i}`] = Math.round(n); });
    return d;
  });
  return (
    <div className="schematic-panel p-3 flex flex-col gap-3 h-full overflow-auto" role="region" aria-label={`Comparison of ${rows.length} entries`}>
      <div className="flex items-center justify-between">
        <div className="tech-label flex items-center gap-1.5"><GitCompare size={12} aria-hidden="true" /> Compare · {rows.length}/4</div>
        <button onClick={onClear} aria-label="Clear comparison" className="font-mono text-[10px] text-muted-foreground hover:text-primary uppercase focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary">clear</button>
      </div>
      <div className="grid gap-px bg-border border border-border" style={{ gridTemplateColumns: `130px repeat(${rows.length}, minmax(0,1fr))` }}>
        <div className="bg-card p-2" />
        {rows.map((r, i) => (
          <div key={r.game_id} className="bg-card p-2 min-w-0" style={{ borderTop: `2px solid ${PALETTE[i]}` }}>
            <div className="flex items-start gap-1.5">
              <EntityIcon row={r} kindKey={kindKey} size={14} />
              <button onClick={() => onSelect(r.game_id)} className="text-xs font-medium truncate text-left hover:text-primary flex-1">{r.name}</button>
              <button onClick={() => onRemove(r.game_id)} aria-label={`Remove ${r.name} from comparison`} className="text-muted-foreground hover:text-red-400 focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary"><X size={12} aria-hidden="true" /></button>
            </div>
            <div className="font-mono text-[9px] text-muted-foreground truncate">{r.game_id}</div>
          </div>
        ))}
        {numCols.map((c) => {
          const vals = rows.map((r) => c.get(r, ctx));
          const nums = vals.filter((v) => typeof v === "number");
          const best = nums.length > 1 ? (lowerBetter.has(c.key) ? Math.min(...nums) : Math.max(...nums)) : null;
          return (
            <React.Fragment key={c.key}>
              <div className="bg-card px-2 py-1 tech-label self-center">{c.label}</div>
              {rows.map((r, i) => (
                <div key={r.game_id} className={`bg-card px-2 py-1 font-mono text-xs text-right tabular-nums ${vals[i] === best && nums.length > 1 && !nums.every((v) => v === best) ? "text-emerald-400 font-semibold" : ""}`}>
                  {vals[i] == null ? "—" : c.type === "pct" ? `${fmtNum(vals[i] * 100, 0)}%` : fmtNum(vals[i], c.dec ?? 0)}
                </div>
              ))}
            </React.Fragment>
          );
        })}
        {otherCols.slice(0, 6).map((c) => (
          <React.Fragment key={c.key}>
            <div className="bg-card px-2 py-1 tech-label self-center">{c.label}</div>
            {rows.map((r) => <div key={r.game_id} className="bg-card px-2 py-1 text-[11px] text-muted-foreground truncate" title={String(c.get(r, ctx) ?? "")}><Cell col={c} row={r} ctx={ctx} heat={false} /></div>)}
          </React.Fragment>
        ))}
      </div>
      {hasNominalDps && (
        <div className="font-mono text-[9px] text-muted-foreground">DPS rows/axes are the game's all-class nominal aggregate — use the damage/heat/TTK views for per-class counter comparisons.</div>
      )}
      {radarData.length > 2 && (
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={radarData} outerRadius="70%">
            <PolarGrid stroke="hsl(30 7% 24%)" />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono", fill: "hsl(36 10% 70%)" }} />
            {rows.map((r, i) => <Radar key={r.game_id} name={r.name} dataKey={`v${i}`} stroke={PALETTE[i]} fill={PALETTE[i]} fillOpacity={0.18} strokeWidth={2} />)}
            <Legend wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 10 }} />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
