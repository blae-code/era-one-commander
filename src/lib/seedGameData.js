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
  { entity: 'GameBlueprint', file: 'GameBlueprint', keyed: true },
  { entity: 'StatModifier', file: 'StatModifier', keyed: false },
  { entity: 'LootEntry', file: 'LootEntry', keyed: false },
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

function changed(existing, incoming) {
  for (const [k, v] of Object.entries(incoming)) {
    if (JSON.stringify(existing[k] ?? null) !== JSON.stringify(v ?? null)) return true;
  }
  return false;
}

export async function seedGameData(base44, { onProgress = () => {}, deleteMissing = false, only = null } = {}) {
  const summary = {};
  for (const { entity, file, keyed } of ERA_ONE_ENTITIES) {
    if (only && !only.includes(entity)) continue;
    const api = base44.entities[entity];
    if (!api) { onProgress(`${entity}: skipped — entity not defined in this app yet`); summary[entity] = { skipped: true }; continue; }
    const rows = await loadRows(file);
    const build = rows[0]?.game_build;
    let created = 0, updated = 0, deleted = 0, unchanged = 0;

    if (keyed) {
      const existing = await api.list('game_id', 5000);
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
    summary[entity] = { build, created, updated, deleted, unchanged };
    onProgress(`${entity}: done — created ${created}, updated ${updated}, unchanged ${unchanged}, deleted ${deleted}`);
  }
  return summary;
}
