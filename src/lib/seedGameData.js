// Client-side seeder for ERA ONE Commander (Base44, code-first).
// Upserts the extracted game data (era-one-data/out/base44/data/*.json, copied to src/data/era-one/)
// into the app's entities by `game_id`. Long tables (StatModifier, LootEntry) are replaced wholesale.
// Data files are imported lazily so they never land in the main bundle.
//
//   import { seedGameData, ERA_ONE_ENTITIES } from '@/lib/seedGameData';
//   await seedGameData(base44, { onProgress: (m) => console.log(m) });

export const ERA_ONE_ENTITIES = [
  { entity: 'Module', file: 'Module', keyed: true },
  { entity: 'Weapon', file: 'Weapon', keyed: true },
  { entity: 'Turret', file: 'Turret', keyed: true },
  { entity: 'Subsystem', file: 'Subsystem', keyed: true },
  { entity: 'Unit', file: 'Unit', keyed: true },
  { entity: 'ResearchNode', file: 'ResearchNode', keyed: true },
  { entity: 'Resource', file: 'Resource', keyed: true },
  { entity: 'Station', file: 'Station', keyed: true },
  { entity: 'Asteroid', file: 'Asteroid', keyed: true },
  { entity: 'GameBlueprint', file: 'GameBlueprint', keyed: true },
  { entity: 'CombatTemplate', file: 'CombatTemplate', keyed: true },
  { entity: 'FormationModifier', file: 'FormationModifier', keyed: true },
  { entity: 'Faction', file: 'Faction', keyed: true },
  { entity: 'Ability', file: 'Ability', keyed: true },
  { entity: 'BuildCap', file: 'BuildCap', keyed: true },
  { entity: 'GameSetting', file: 'GameSetting', keyed: true },
  { entity: 'StatDefinition', file: 'StatDefinition', keyed: true },
  { entity: 'StatModifier', file: 'StatModifier', keyed: true },
  { entity: 'LootEntry', file: 'LootEntry', keyed: true },
  { entity: 'UnitLevel', file: 'UnitLevel', keyed: true },
  { entity: 'BlueprintPart', file: 'BlueprintPart', keyed: true },
  { entity: 'ResearchEdge', file: 'ResearchEdge', keyed: true },
  { entity: 'ModuleWeapon', file: 'ModuleWeapon', keyed: true },
  { entity: 'UnitWeapon', file: 'UnitWeapon', keyed: true },
  { entity: 'LocalizedString', file: 'LocalizedString', keyed: true },
  { entity: 'Effectiveness', file: 'Effectiveness', keyed: true },
  { entity: 'Scenario', file: 'Scenario', keyed: true },
  { entity: 'ScenarioEntity', file: 'ScenarioEntity', keyed: true },
  { entity: 'ScenarioObjective', file: 'ScenarioObjective', keyed: true },
  { entity: 'Objective', file: 'Objective', keyed: true },
  { entity: 'GameHint', file: 'GameHint', keyed: true },
  { entity: 'GameEvent', file: 'GameEvent', keyed: true },
  { entity: 'Remain', file: 'Remain', keyed: true },
  { entity: 'EnemySpawner', file: 'EnemySpawner', keyed: true },
  { entity: 'EnemyWave', file: 'EnemyWave', keyed: true },
  { entity: 'EnemyUpgrade', file: 'EnemyUpgrade', keyed: true },
  { entity: 'ArenaTurn', file: 'ArenaTurn', keyed: true },
  { entity: 'AiPersonality', file: 'AiPersonality', keyed: true },
  { entity: 'AiFact', file: 'AiFact', keyed: true },
  { entity: 'AiGoal', file: 'AiGoal', keyed: true },
  { entity: 'AiOperation', file: 'AiOperation', keyed: true },
  { entity: 'AiLogicGraph', file: 'AiLogicGraph', keyed: true },
  { entity: 'AiColorScheme', file: 'AiColorScheme', keyed: true },
  { entity: 'MatchOption', file: 'MatchOption', keyed: true },
  { entity: 'ScoreWeight', file: 'ScoreWeight', keyed: true },
  { entity: 'AttachmentRule', file: 'AttachmentRule', keyed: true },
  { entity: 'DatasetBuild', file: 'DatasetBuild', keyed: true },
  { entity: 'BuildChange', file: 'BuildChange', keyed: true },
];

const CHUNK = 100;
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

// Vite: static glob (relative path) so each JSON file becomes its own lazily-loaded chunk
const DATA = import.meta.glob('../data/era-one/*.json');

async function loadJson(file) {
  const key = Object.keys(DATA).find((k) => k.endsWith(`/${file}.json`));
  if (!key) throw new Error(`data file missing: src/data/era-one/${file}.json`);
  const mod = await DATA[key]();
  return mod.default || mod;
}

const loadRows = (file) => loadJson(file);

export async function loadIndex() {
  try { return await loadJson('INDEX'); } catch { return null; }
}

/** Read every record of an entity, paging with skip when the SDK supports it (stops if a page repeats). */
export async function listAll(api, sort = 'game_id', page = 1000) {
  const out = [];
  let skip = 0, lastFirst = null;
  for (let i = 0; i < 100; i++) {
    let rows;
    try { rows = await api.list(sort, page, skip); } catch { rows = await api.list(sort, page); }
    if (!rows || rows.length === 0) break;
    if (rows[0]?.id && rows[0].id === lastFirst) break; // skip unsupported -> same page again
    lastFirst = rows[0]?.id ?? null;
    out.push(...rows);
    if (rows.length < page) break;
    skip += rows.length;
  }
  return out;
}

function changed(existing, incoming) {
  for (const [k, v] of Object.entries(incoming)) {
    if (JSON.stringify(existing[k] ?? null) !== JSON.stringify(v ?? null)) return true;
  }
  return false;
}

/** Upsert rows into one entity (keyed: match on game_id; long tables: replace wholesale). Reusable by any importer. */
export async function upsertEntityRows(base44, entity, rows, { onProgress = () => {}, deleteMissing = false } = {}) {
  const api = base44.entities[entity];
  if (!api) throw new Error(`entity ${entity} is not deployed in this app`);
  const keyed = ERA_ONE_ENTITIES.find((e) => e.entity === entity)?.keyed ?? Boolean(rows[0]?.game_id);
  const build = rows[0]?.game_build;
  let created = 0, updated = 0, deleted = 0, unchanged = 0;
  {
    if (keyed) {
      const existing = await listAll(api, 'game_id');
      const byKey = new Map(existing.map((r) => [r.game_id, r]));
      const toCreate = [], toUpdate = [];
      for (const r of rows) {
        const cur = byKey.get(r.game_id);
        if (!cur) toCreate.push(r);
        else if (changed(cur, r)) toUpdate.push([cur.id, r]);
        else unchanged++;
        byKey.delete(r.game_id);
      }
      for (const c of chunk(toCreate, CHUNK)) { await api.bulkCreate(c); created += c.length; onProgress(`${entity}: created ${created}/${toCreate.length}`); }
      for (const [id, r] of toUpdate) { await api.update(id, r); updated++; if (updated % 25 === 0) onProgress(`${entity}: updated ${updated}/${toUpdate.length}`); }
      if (deleteMissing) for (const stale of byKey.values()) { await api.delete(stale.id); deleted++; }
    } else {
      // replace-all: the backend may page list() results, so drain until empty
      for (let round = 0; round < 50; round++) {
        const existing = await api.list('-created_date', 1000);
        if (existing.length === 0) break;
        for (const e of existing) { await api.delete(e.id); deleted++; }
        onProgress(`${entity}: cleared ${deleted} old rows`);
      }
      for (const c of chunk(rows, CHUNK)) { await api.bulkCreate(c); created += c.length; onProgress(`${entity}: created ${created}/${rows.length}`); }
    }
  }
  onProgress(`${entity}: done — created ${created}, updated ${updated}, unchanged ${unchanged}, deleted ${deleted}`);
  return { build, created, updated, deleted, unchanged };
}

export async function seedGameData(base44, { onProgress = () => {}, deleteMissing = false, only = null } = {}) {
  const summary = {};
  for (const { entity, file } of ERA_ONE_ENTITIES) {
    if (only && !only.includes(entity)) continue;
    if (!base44.entities[entity]) { onProgress(`${entity}: skipped — entity not defined in this app yet`); summary[entity] = { skipped: true }; continue; }
    const rows = await loadRows(file);
    summary[entity] = await upsertEntityRows(base44, entity, rows, { onProgress, deleteMissing });
  }
  return summary;
}
