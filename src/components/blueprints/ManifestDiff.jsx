import React from "react";
import { CategoryIcon } from "@/components/icons/EraIcons";

function countBy(placements) {
  const map = {};
  (placements || []).forEach((p) => {
    const k = p.name || p.component_id;
    if (!map[k]) map[k] = { name: k, category: p.category, count: 0 };
    map[k].count += 1;
  });
  return map;
}

export default function ManifestDiff({ a, b }) {
  const ca = countBy(a.placements);
  const cb = countBy(b.placements);
  const names = [...new Set([...Object.keys(ca), ...Object.keys(cb)])].sort();

  const rows = names.map((n) => {
    const na = ca[n]?.count || 0;
    const nb = cb[n]?.count || 0;
    return { name: n, category: (cb[n] || ca[n]).category, na, nb, delta: nb - na };
  });
  const changed = rows.filter((r) => r.delta !== 0);
  const unchanged = rows.filter((r) => r.delta === 0);

  return (
    <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
      {changed.length === 0 && (
        <div className="tech-label py-3 opacity-70">No component changes — identical loadouts</div>
      )}
      {changed.map((r) => (
        <div key={r.name} className={`flex items-center gap-2 px-2 py-1.5 border text-[11px] font-mono ${r.delta > 0 ? "border-[#3ddc6a]/40 bg-[#3ddc6a]/5" : "border-[#ff2d55]/40 bg-[#ff2d55]/5"}`}>
          <CategoryIcon category={r.category} size={12} />
          <span className="truncate flex-1">{r.name}</span>
          <span className="text-muted-foreground text-[10px]">{r.na} → {r.nb}</span>
          <span className={`font-bold ${r.delta > 0 ? "text-[#3ddc6a]" : "text-[#ff2d55]"}`}>
            {r.delta > 0 ? `+${r.delta}` : r.delta}
          </span>
        </div>
      ))}
      {unchanged.length > 0 && (
        <div className="pt-1">
          <div className="tech-label opacity-60 mb-1">Unchanged × {unchanged.length}</div>
          {unchanged.map((r) => (
            <div key={r.name} className="flex items-center gap-2 px-2 py-1 text-[10px] font-mono text-muted-foreground">
              <CategoryIcon category={r.category} size={11} />
              <span className="truncate flex-1">{r.name}</span>
              <span>× {r.na}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}