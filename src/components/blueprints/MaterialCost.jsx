import React, { useMemo } from "react";
import { Boxes } from "lucide-react";
import { CategoryIcon } from "@/components/icons/EraIcons";
import { useGameCatalog, fmtNum } from "@/lib/gameData";

// Sums the build cost of every placed module by resolving placements against the
// real game Module/Weapon/Turret records (by game_id, else by name).
export default function MaterialCost({ placements = [] }) {
  const cat = useGameCatalog();

  const { lines, totals, unresolved } = useMemo(() => {
    const pool = [...cat.modules, ...cat.weapons, ...cat.turrets];
    const byName = new Map(pool.map((r) => [String(r.name || "").toLowerCase(), r]));
    const groups = new Map();
    let unresolved = 0;
    for (const p of placements) {
      const rec = cat.byId[p.component_id] || byName.get(String(p.name || "").toLowerCase()) || null;
      if (!rec) unresolved++;
      const key = rec?.game_id || `raw:${p.name}`;
      const g = groups.get(key) || { key, name: rec?.name || p.name, category: p.category, rec, qty: 0 };
      g.qty++;
      groups.set(key, g);
    }
    const lines = [...groups.values()].map((g) => ({
      ...g,
      ru: (g.rec?.cost_resources || 0) * g.qty,
      crew: (g.rec?.cost_population || 0) * g.qty,
      energy: (g.rec?.cost_energy || 0) * g.qty,
      time: (g.rec?.construction_time || 0) * g.qty,
    })).sort((a, b) => b.ru - a.ru);
    const totals = lines.reduce((t, l) => ({ ru: t.ru + l.ru, crew: t.crew + l.crew, energy: t.energy + l.energy, time: t.time + l.time }), { ru: 0, crew: 0, energy: 0, time: 0 });
    return { lines, totals, unresolved };
  }, [placements, cat.modules, cat.weapons, cat.turrets, cat.byId]);

  const maxRu = Math.max(1, ...lines.map((l) => l.ru));

  return (
    <div className="schematic-panel plate-texture p-3 mt-3">
      <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
      <div className="flex items-center gap-2 mb-2">
        <Boxes size={14} className="text-primary" />
        <div className="tech-label">Material Cost // bill of materials</div>
      </div>

      {/* totals */}
      <div className="grid grid-cols-4 gap-2 mb-2 border-y border-border py-2">
        {[["RU", totals.ru, 0], ["CREW", totals.crew, 0], ["ENERGY", totals.energy, 0], ["BUILD s", totals.time, 1]].map(([k, v, d]) => (
          <div key={k}>
            <div className="font-mono text-sm text-primary ember-glow leading-none">{fmtNum(v, d)}</div>
            <div className="text-[8px] font-mono tracking-[0.18em] text-muted-foreground mt-1">{k}</div>
          </div>
        ))}
      </div>

      {cat.isLoading ? (
        <div className="tech-label py-4 text-center animate-pulse">Costing manifest…</div>
      ) : lines.length === 0 ? (
        <div className="tech-label py-4 text-center">No modules placed</div>
      ) : (
        <div className="space-y-px max-h-64 overflow-y-auto">
          {lines.map((l) => (
            <div key={l.key} className="relative flex items-center gap-2 px-1 py-1 font-mono text-[11px] border-b border-border/40">
              <span className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${(l.ru / maxRu) * 100}%` }} />
              <CategoryIcon category={l.category} size={12} />
              <span className="truncate relative">{l.name}</span>
              <span className="text-muted-foreground relative">×{l.qty}</span>
              <span className="ml-auto relative tabular-nums">{l.rec ? `${fmtNum(l.ru)} RU` : <span className="text-[#ffd21a]">no cost data</span>}</span>
            </div>
          ))}
        </div>
      )}
      {unresolved > 0 && <div className="tech-label mt-2 text-[#ffd21a]">▲ {unresolved} placement(s) not matched in the game dataset</div>}
    </div>
  );
}