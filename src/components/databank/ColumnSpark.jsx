import React, { useMemo } from "react";
import { fmtNum } from "@/lib/gameData";

// 12-bucket distribution histogram drawn under a numeric column header.
export default function ColumnSpark({ rows, col, ctx }) {
  const { bars, min, max } = useMemo(() => {
    const vals = rows.map((r) => col.get(r, ctx)).filter((v) => typeof v === "number" && !Number.isNaN(v));
    if (vals.length < 3) return { bars: [], min: 0, max: 0 };
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const n = 12, span = hi - lo || 1;
    const b = new Array(n).fill(0);
    for (const v of vals) b[Math.min(n - 1, Math.floor(((v - lo) / span) * n))] += 1;
    const peak = Math.max(...b) || 1;
    return { bars: b.map((c) => c / peak), min: lo, max: hi };
  }, [rows, col, ctx]);

  if (!bars.length) return <div className="h-3.5" />;
  return (
    <div className="flex items-end justify-end gap-[1px] h-3.5" title={`${col.label}: ${fmtNum(min, col.dec ?? 0)} – ${fmtNum(max, col.dec ?? 0)}`}>
      {bars.map((h, i) => (
        <span key={i} className="w-[3px] bg-primary/45" style={{ height: `${Math.max(8, h * 100)}%` }} />
      ))}
    </div>
  );
}