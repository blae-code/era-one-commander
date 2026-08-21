// Pure aggregation for the production queue: real GameBlueprint / PlayerDesign rows × build counts.
// Design-level roll-ups (cost_resources / cost_population / construction_time) drive the totals;
// the per-module bill of materials merges each design's `modules {game_id: count}` dict and joins
// name/tier/class through the catalog byId map.

export const RESOURCE_IDS = ["RU.MET", "RU.CRB", "RU.SIL", "RU.URA", "RU.WRE"];

/**
 * items: [{ design, count }] where design is a GameBlueprint or PlayerDesign row.
 * byId:  useGameCatalog().byId (game_id -> record).
 */
export function aggregateQueue(items, byId) {
  const totals = { ru: 0, crew: 0, energy: 0, time: 0 };
  let seqTime = 0;
  let criticalTime = 0;
  const moduleQty = new Map();

  for (const { design, count } of items) {
    const n = Math.max(0, Math.floor(Number(count) || 0));
    if (!n || !design) continue;
    totals.ru += (design.cost_resources || 0) * n;
    totals.crew += (design.cost_population || 0) * n;
    totals.energy += (design.cost_energy || 0) * n;
    const t = design.construction_time || 0;
    seqTime += t * n;
    criticalTime = Math.max(criticalTime, t);
    for (const [id, c] of Object.entries(design.modules || {})) {
      moduleQty.set(id, (moduleQty.get(id) || 0) + (Number(c) || 0) * n);
    }
  }
  totals.time = seqTime;

  const lines = [...moduleQty.entries()]
    .map(([id, qty]) => {
      const rec = byId[id] || null;
      return {
        key: id,
        name: rec?.name || id,
        rec,
        qty,
        tier: rec?.tier,
        category: rec?.module_class === "Weapon" ? "weapon" : "module",
        ru: (rec?.cost_resources || 0) * qty,
        crew: (rec?.cost_population || 0) * qty,
        energy: (rec?.cost_energy || 0) * qty,
        time: (rec?.construction_time || 0) * qty,
      };
    })
    .sort((a, b) => b.ru - a.ru);

  const unknown = lines.filter((l) => !l.rec).map((l) => l.key);

  return { totals, seqTime, criticalTime, lines, unknown, moduleQty };
}
