// Design view-model helpers for The Drydock (/designs).
//
// ERA ONE ships/stations are module GRAPHS (attachment trees), not grids.
// Two on-disk shapes normalize to one view model here:
//   - GameBlueprint.assembly  — nested {index, module_id, name, position[3], rotation[4], connection, children[]}
//   - PlayerDesign.parts      — flat  [{index, guid, module_id, position, rotation, parent, connection}]
// Positions are world-space (verified against the dataset: parent->child spacing ~0.7-1.8 units).

// One palette for module_class, defined once and used by plot, tree, list and stats.
export const MODULE_CLASS_HEX = {
  Command: "#ffd21a",
  Structural: "#c9d6e3",
  Weapon: "#ff7a1a",
  Facility: "#2f9bff",
  Utility: "#00d1c1",
  Unknown: "#8c9aa3",
};
export const classHex = (cls) => MODULE_CLASS_HEX[cls] || MODULE_CLASS_HEX.Unknown;

// The 13 target classes comparative DPS resolves against. Never render a class-free scalar.
export const TARGET_CLASSES = [
  "FighterUnit", "CorvetteUnit", "FrigateUnit", "UtilityUnit", "PlatformUnit", "MineUnit",
  "CommandModule", "StructuralModule", "WeaponModule", "FacilityModule", "UtilityModule",
  "Station", "Wreckage",
];
export const TARGET_CLASS_ABBR = {
  FighterUnit: "FTR", CorvetteUnit: "CRV", FrigateUnit: "FRG", UtilityUnit: "UTL",
  PlatformUnit: "PLT", MineUnit: "MIN", CommandModule: "CMD", StructuralModule: "STR",
  WeaponModule: "WPN", FacilityModule: "FAC", UtilityModule: "UTM", Station: "STN", Wreckage: "WRK",
};

const numOr = (v, fallback) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

// GameBlueprint.assembly (nested) -> flat parts list with parent links + depth.
export function flattenAssembly(assembly) {
  const parts = [];
  const walk = (node, parent, depth) => {
    if (!node || typeof node.index !== "number") return;
    parts.push({
      index: node.index,
      module_id: node.module_id || null,
      name: node.name || null,
      position: Array.isArray(node.position) ? node.position : null,
      parent,
      connection: node.connection ?? null,
      depth,
    });
    for (const c of node.children || []) walk(c, node.index, depth + 1);
  };
  walk(assembly, -1, 0);
  return parts;
}

// PlayerDesign.parts (flat, parent links) -> the same shape, with depth computed.
export function partsFromPlayer(rawParts) {
  const list = (Array.isArray(rawParts) ? rawParts : []).map((p) => ({
    index: numOr(p.index, -1),
    module_id: p.module_id || null,
    name: p.module_name || null,
    guid: p.guid || null,
    position: Array.isArray(p.position) ? p.position : null,
    parent: numOr(p.parent, -1),
    connection: p.connection ?? null,
    depth: 0,
  })).filter((p) => p.index >= 0);
  const byIndex = new Map(list.map((p) => [p.index, p]));
  const depthOf = (p, guard) => {
    if (guard > 128 || p.parent < 0 || !byIndex.has(p.parent) || p.parent === p.index) return 0;
    return 1 + depthOf(byIndex.get(p.parent), guard + 1);
  };
  for (const p of list) p.depth = depthOf(p, 0);
  return list;
}

// Flat parts -> attachment tree ({part, children[], subtree}) built from parent links.
export function buildTree(parts) {
  const byIndex = new Map();
  for (const p of parts) byIndex.set(p.index, { part: p, children: [], subtree: 1 });
  const roots = [];
  for (const p of parts) {
    const node = byIndex.get(p.index);
    const parent = p.parent >= 0 && p.parent !== p.index ? byIndex.get(p.parent) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const size = (n) => { n.subtree = 1 + n.children.reduce((a, c) => a + size(c), 0); return n.subtree; };
  for (const r of roots) size(r);
  return { roots, byIndex };
}

const partIdx = (v, fallback) => (typeof v === "number" ? v : numOr(v?.index, fallback));

// Shipped design (GameBlueprint row) -> view model. Stats come from the row's own roll-ups.
export function fromGameBlueprint(row) {
  const parts = flattenAssembly(row.assembly);
  return {
    id: row.game_id,
    name: row.name || row.game_id,
    source: "shipped",
    folder: row.folder || null,
    partCount: numOr(row.part_count, parts.length),
    parts,
    rootIndex: partIdx(row.root_part, parts[0]?.index ?? null),
    commandIndex: partIdx(row.command_part, null),
    modules: row.modules || null,
    unresolved: 0,
    usedByAi: !!row.used_by_ai,
    stats: {
      cost_resources: row.cost_resources ?? null,
      cost_population: row.cost_population ?? null,
      construction_time: row.construction_time ?? null,
      max_health: row.sum_module_max_health ?? null,
      mass: row.mass_total ?? null,
      crew: row.crew_total ?? null,
      energy_production: row.energy_production ?? null,
      energy_use: row.energy_use ?? null,
      dps_vs_class: row.dps_vs_class || null,
      module_classes: row.module_classes || null,
      required_research: row.required_research || [],
    },
    game_version: row.game_version || null,
    game_build: row.game_build || null,
  };
}

// Imported design (PlayerDesign row) -> view model. Missing figures (mass/energy) are filled
// from the blueprintStats roll-up at render time.
export function fromPlayerDesign(row) {
  const parts = partsFromPlayer(row.parts);
  return {
    id: row.game_id,
    name: row.name || row.game_id,
    source: "player",
    folder: null,
    partCount: numOr(row.part_count, parts.length),
    parts,
    rootIndex: partIdx(row.root_part, parts[0]?.index ?? null),
    commandIndex: partIdx(row.command_part, null),
    modules: row.modules || null,
    unresolved: numOr(row.unresolved_parts, 0),
    usedByAi: false,
    sourceFile: row.source_file || null,
    importedUtc: row.imported_utc || null,
    stats: {
      cost_resources: row.cost_resources ?? null,
      cost_population: row.cost_population ?? null,
      construction_time: row.construction_time ?? null,
      max_health: row.sum_module_max_health ?? null,
      mass: null,
      crew: null,
      energy_production: null,
      energy_use: null,
      dps_vs_class: row.dps_vs_class || null,
      module_classes: null,
      required_research: row.required_research || [],
    },
    game_version: row.game_version || null,
    game_build: row.game_build || null,
  };
}

// Module-class counts derived from the parts themselves (used when a row has no module_classes).
export function classCounts(parts, byId) {
  const out = {};
  for (const p of parts) {
    const cls = (p.module_id && byId[p.module_id]?.module_class) || "Unknown";
    out[cls] = (out[cls] || 0) + 1;
  }
  return out;
}

export const fmtTime = (s) => {
  const n = Number(s);
  if (s === null || s === undefined || !Number.isFinite(n)) return "—";
  const h = Math.floor(n / 3600), m = Math.floor((n % 3600) / 60), sec = Math.round(n % 60);
  return h ? `${h}h ${m}m` : m ? `${m}m ${sec}s` : `${sec}s`;
};
