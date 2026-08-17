// Parse + import user-supplied ERA ONE extraction files (drag & drop on /import).
// Files are the extractor's own output: Module.json, Weapon.json, … (arrays of records),
// or a single combined object { Module: [...], Weapon: [...] }.
import { ERA_ONE_ENTITIES } from "@/lib/seedGameData";

export const KEYED = new Set(ERA_ONE_ENTITIES.filter((e) => e.keyed).map((e) => e.entity));
export const ENTITY_NAMES = ERA_ONE_ENTITIES.map((e) => e.entity);

const CHUNK = 100;
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

const matchEntity = (raw) => {
  const s = String(raw || "").replace(/\.json$/i, "").replace(/[^a-z]/gi, "").toLowerCase();
  return ENTITY_NAMES.find((n) => n.toLowerCase() === s) || null;
};

/** Read one dropped file → [{ entity, rows, fileName, error }] (a combined file yields several). */
export async function parseGameFile(file) {
  let json;
  try {
    json = JSON.parse(await file.text());
  } catch {
    return [{ fileName: file.name, entity: null, rows: [], error: "Not valid JSON" }];
  }

  if (Array.isArray(json)) {
    const entity = matchEntity(file.name);
    return [{
      fileName: file.name,
      entity,
      rows: json,
      error: entity ? null : `Unrecognised name — rename the file to one of: ${ENTITY_NAMES.join(", ")}`,
    }];
  }

  if (json && typeof json === "object") {
    const parts = Object.entries(json)
      .filter(([k, v]) => Array.isArray(v) && matchEntity(k))
      .map(([k, v]) => ({ fileName: `${file.name} › ${k}`, entity: matchEntity(k), rows: v, error: null }));
    if (parts.length) return parts;
    if (json.entities || json.game) return [{ fileName: file.name, entity: null, rows: [], error: "Index/manifest file — no records to import" }];
  }

  return [{ fileName: file.name, entity: null, rows: [], error: "No record array found in this file" }];
}

/** Upsert rows for one entity. Keyed entities match on game_id; long tables are replaced wholesale. */
export async function importEntityRows(base44, entity, rows, { onProgress = () => {}, deleteMissing = false } = {}) {
  const api = base44.entities[entity];
  if (!api) throw new Error(`entity ${entity} is not deployed in this app`);
  let created = 0, updated = 0, deleted = 0, unchanged = 0;

  if (KEYED.has(entity)) {
    const existing = await api.list("game_id", 5000);
    const byKey = new Map(existing.map((r) => [r.game_id, r]));
    const toCreate = [], toUpdate = [];
    for (const r of rows) {
      const cur = byKey.get(r.game_id);
      if (!cur) toCreate.push(r);
      else if (Object.entries(r).some(([k, v]) => JSON.stringify(cur[k] ?? null) !== JSON.stringify(v ?? null))) toUpdate.push([cur.id, r]);
      else unchanged++;
      byKey.delete(r.game_id);
    }
    for (const c of chunk(toCreate, CHUNK)) { await api.bulkCreate(c); created += c.length; onProgress(`${entity}: created ${created}/${toCreate.length}`); }
    for (const [id, r] of toUpdate) { await api.update(id, r); updated++; if (updated % 25 === 0) onProgress(`${entity}: updated ${updated}/${toUpdate.length}`); }
    if (deleteMissing) for (const stale of byKey.values()) { await api.delete(stale.id); deleted++; }
  } else {
    for (let round = 0; round < 50; round++) {
      const existing = await api.list("-created_date", 1000);
      if (existing.length === 0) break;
      for (const e of existing) { await api.delete(e.id); deleted++; }
      onProgress(`${entity}: cleared ${deleted} old rows`);
    }
    for (const c of chunk(rows, CHUNK)) { await api.bulkCreate(c); created += c.length; onProgress(`${entity}: created ${created}/${rows.length}`); }
  }

  onProgress(`${entity}: done — created ${created}, updated ${updated}, unchanged ${unchanged}, deleted ${deleted}`);
  return { created, updated, deleted, unchanged, build: rows[0]?.game_build ?? null };
}