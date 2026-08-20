// Shared costing: resolves blueprint placements against the real game records
// (Module/Weapon/Turret) and sums their build cost.
import { useMemo } from "react";
import { useGameCatalog } from "@/lib/gameData";

export function useCostResolver() {
  const cat = useGameCatalog();
  const byName = useMemo(() => {
    const pool = [...cat.modules, ...cat.weapons, ...cat.turrets];
    return new Map(pool.map((r) => [String(r.name || "").toLowerCase(), r]));
  }, [cat.modules, cat.weapons, cat.turrets]);
  const resolve = (p) => cat.byId[p.component_id] || byName.get(String(p.name || "").toLowerCase()) || null;
  return { resolve, isLoading: cat.isLoading };
}

const EMPTY = { ru: 0, crew: 0, energy: 0, time: 0 };

/** Group placements into cost lines + totals. `resolve` comes from useCostResolver. */
export function costPlacements(placements = [], resolve, qty = 1) {
  const groups = new Map();
  let unresolved = 0;
  for (const p of placements) {
    const rec = resolve(p);
    if (!rec) unresolved++;
    const key = rec?.game_id || `raw:${p.name}`;
    const g = groups.get(key) || { key, name: rec?.name || p.name, category: p.category, rec, qty: 0 };
    g.qty += qty;
    groups.set(key, g);
  }
  const lines = [...groups.values()]
    .map((g) => ({
      ...g,
      ru: (g.rec?.cost_resources || 0) * g.qty,
      crew: (g.rec?.cost_population || 0) * g.qty,
      energy: (g.rec?.cost_energy || 0) * g.qty,
      time: (g.rec?.construction_time || 0) * g.qty,
    }))
    .sort((a, b) => b.ru - a.ru);
  const totals = lines.reduce(
    (t, l) => ({ ru: t.ru + l.ru, crew: t.crew + l.crew, energy: t.energy + l.energy, time: t.time + l.time }),
    { ...EMPTY }
  );
  return { lines, totals, unresolved };
}

/** Merge cost lines from several blueprints into one aggregated list. */
export function mergeCostLines(sets) {
  const merged = new Map();
  for (const set of sets) {
    for (const l of set.lines) {
      const m = merged.get(l.key);
      if (m) { m.qty += l.qty; m.ru += l.ru; m.crew += l.crew; m.energy += l.energy; m.time += l.time; }
      else merged.set(l.key, { ...l });
    }
  }
  const lines = [...merged.values()].sort((a, b) => b.ru - a.ru);
  const totals = lines.reduce(
    (t, l) => ({ ru: t.ru + l.ru, crew: t.crew + l.crew, energy: t.energy + l.energy, time: t.time + l.time }),
    { ...EMPTY }
  );
  return { lines, totals, unresolved: sets.reduce((n, s) => n + s.unresolved, 0) };
}