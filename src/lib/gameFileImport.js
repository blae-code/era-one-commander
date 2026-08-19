// Parse + import user-supplied ERA ONE extraction files (drag & drop on /import).
// Files are the extractor's own output: Module.json, Weapon.json, … (arrays of records),
// or a single combined object { Module: [...], Weapon: [...] }.
import { ERA_ONE_ENTITIES, upsertEntityRows } from "@/lib/seedGameData";

export const KEYED = new Set(ERA_ONE_ENTITIES.filter((e) => e.keyed).map((e) => e.entity));
export const ENTITY_NAMES = ERA_ONE_ENTITIES.map((e) => e.entity);




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

/** Upsert rows for one entity.
 *
 * This was a near-verbatim copy of `upsertEntityRows` in seedGameData.js, but with
 * `api.list("game_id", 5000)` instead of the paging `listAll` — so importing any table over 5,000 rows
 * (ScenarioEntity is 6,596) saw only the first 5,000 as "existing" and re-created the remaining 1,596
 * as duplicates on every import. Contract §2 asked for this consolidation; it is now one implementation.
 */
export async function importEntityRows(base44, entity, rows, opts = {}) {
  return await upsertEntityRows(base44, entity, rows, opts);
}