// Graph model over the shipped ResearchNode table, plus the reverse module→research index
// (Module.required_research) so every node knows exactly which hardware it opens up.
const COL_W = 250, ROW_H = 78, PAD = 28;

export function buildTechTree(research, modules, units) {
  const nodes = research.filter((r) => r.game_id !== "R.S.UNAVAILABLE");
  const byId = new Map(nodes.map((r) => [r.game_id, r]));

  // module/unit unlocks: union of the node's own list and anything requiring it
  const unlocksModules = new Map(), unlocksUnits = new Map();
  const add = (m, k, v) => { if (!m.has(k)) m.set(k, []); if (!m.get(k).includes(v)) m.get(k).push(v); };
  for (const r of nodes) {
    for (const id of r.unlocks_modules || []) add(unlocksModules, r.game_id, id);
    for (const id of r.unlocks_units || []) add(unlocksUnits, r.game_id, id);
  }
  for (const m of modules) for (const rid of m.required_research || []) if (byId.has(rid)) add(unlocksModules, rid, m.game_id);
  for (const u of units) for (const rid of u.required_research || []) if (byId.has(rid)) add(unlocksUnits, rid, u.game_id);

  // edges from required_nodes (prerequisite -> node)
  const parents = new Map(), children = new Map();
  const edges = [];
  for (const r of nodes) {
    for (const p of r.required_nodes || []) {
      if (!byId.has(p)) continue;
      add(parents, r.game_id, p); add(children, p, r.game_id);
      edges.push({ from: p, to: r.game_id });
    }
  }

  // layout: column per tier, rows ordered by parent position then name for short edges
  const tiers = [...new Set(nodes.map((r) => Number(r.tier) || 0))].sort((a, b) => a - b);
  const pos = new Map();
  for (const t of tiers) {
    const col = nodes.filter((r) => (Number(r.tier) || 0) === t)
      .sort((a, b) => {
        const pa = (parents.get(a.game_id) || [])[0], pb = (parents.get(b.game_id) || [])[0];
        return (pos.get(pa)?.y ?? 0) - (pos.get(pb)?.y ?? 0) || a.name.localeCompare(b.name);
      });
    col.forEach((r, i) => pos.set(r.game_id, { x: PAD + tiers.indexOf(t) * COL_W, y: PAD + i * ROW_H }));
  }
  const height = PAD * 2 + Math.max(...tiers.map((t) => nodes.filter((r) => (Number(r.tier) || 0) === t).length)) * ROW_H;

  return { nodes, byId, parents, children, edges, pos, tiers, unlocksModules, unlocksUnits,
    width: PAD * 2 + tiers.length * COL_W, height, COL_W, ROW_H };
}

const walk = (start, map) => {
  const out = new Set(), stack = [start];
  while (stack.length) for (const n of map.get(stack.pop()) || []) if (!out.has(n)) { out.add(n); stack.push(n); }
  return out;
};

/** Everything you must research before `id`, and everything `id` opens downstream. */
export function lineage(tree, id) {
  if (!id) return { ancestors: new Set(), descendants: new Set() };
  return { ancestors: walk(id, tree.parents), descendants: walk(id, tree.children) };
}

/** Total resource / research / time cost of a node plus every prerequisite. */
export function pathCost(tree, id) {
  const ids = [id, ...lineage(tree, id).ancestors];
  return ids.reduce((a, nid) => {
    const r = tree.byId.get(nid) || {};
    return { steps: a.steps + 1, resources: a.resources + (r.cost_resources || 0), research: a.research + (r.cost_research || 0), time: a.time + (r.construction_time || 0) };
  }, { steps: 0, resources: 0, research: 0, time: 0 });
}

export const TYPE_COLOR = {
  Tier: "#ffd21a",
  Technology: "#ff7a1a",
  Upgrade: "#2f9bff",
  Ability: "#d24bff",
};