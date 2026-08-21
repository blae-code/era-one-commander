// Databank query language + filtering/sorting.
//   free words         → every word must match one of the kind's search fields (case-insensitive substring)
//   field:value        → enum/text equals or contains (value may be quoted, comma = OR:  class:weapon,utility)
//   field>10 field<=5 field=3 field!=x   → numeric / equality
//   fav:yes            → favourites only ; wip:no → hide work-in-progress
// Field names may be column keys or ALIASES (dps, hp, cost, tier, class, type, range, armor, speed, crew, energy…).
import { ALIASES } from "./catalog";

const TOKEN = /("[^"]*"|\S+)/g;

export function parseQuery(q) {
  const out = { words: [], clauses: [], errors: [] };
  for (const raw of (q || "").match(TOKEN) || []) {
    const t = raw.replace(/^"|"$/g, "");
    const m = t.match(/^([a-zA-Z_]+)(>=|<=|!=|>|<|=|:)(.+)$/);
    if (!m) { out.words.push(t.toLowerCase()); continue; }
    const [, field, op, val] = m;
    out.clauses.push({ field: field.toLowerCase(), op, val: val.replace(/^"|"$/g, "") });
  }
  return out;
}

function resolveKeys(field, columns) {
  const keys = new Set();
  if (columns.some((c) => c.key === field)) keys.add(field);
  for (const k of ALIASES[field] || []) if (columns.some((c) => c.key === k)) keys.add(k);
  return [...keys];
}

// The one way to read a facet value: through the column getter when the facet key has a column
// (computed facets — unit faction fallback, scenario names, mount kind), else the raw field.
// Toolbar counts, applyQuery filtering and the primary-facet picker must all use this, or a
// getter-backed facet mismatches its own filter.
export function facetGetter(kind, key) {
  const col = kind.columns.find((c) => c.key === key);
  return col ? (r, ctx) => String(col.get(r, ctx) ?? "—") : (r) => String(r[key] ?? "—");
}

export function applyQuery(rows, kind, ctx, parsed, opts = {}) {
  const { favorites = new Set(), facetSel = {}, ranges = {}, favOnly = false, hideWip = false } = opts;
  const cols = kind.columns;
  const getter = Object.fromEntries(cols.map((c) => [c.key, c.get]));
  const searchFields = kind.search;
  const errors = [];
  const rowValue = (r, key) => (getter[key] ? getter[key](r, ctx) : r[key]);

  const clauseTests = parsed.clauses.map(({ field, op, val }) => {
    if (field === "fav") return (r) => (val.startsWith("n") ? !favorites.has(r.game_id) : favorites.has(r.game_id));
    if (field === "wip") return (r) => (val.startsWith("n") ? !r.work_in_progress : !!r.work_in_progress);
    const keys = resolveKeys(field, cols);
    if (!keys.length) { errors.push(`unknown field "${field}"`); return () => true; }
    const wants = val.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
    const numWant = Number(val);
    return (r) => keys.some((k) => {
      const v = rowValue(r, k);
      if (op === ":" || op === "=" || op === "!=") {
        const sv = String(v ?? "").toLowerCase();
        const hit = wants.some((w) => (typeof v === "number" ? Number(w) === v : op === ":" ? sv.includes(w) : sv === w));
        return op === "!=" ? !hit : hit;
      }
      if (typeof v !== "number" || Number.isNaN(numWant)) return false;
      return op === ">" ? v > numWant : op === "<" ? v < numWant : op === ">=" ? v >= numWant : v <= numWant;
    });
  });

  const facetGet = {};
  for (const fk of Object.keys(facetSel)) facetGet[fk] = facetGetter(kind, fk);

  const out = rows.filter((r) => {
    if (favOnly && !favorites.has(r.game_id)) return false;
    if (hideWip && r.work_in_progress) return false;
    for (const [fk, sel] of Object.entries(facetSel)) if (sel && sel.size && !sel.has(facetGet[fk](r, ctx))) return false;
    for (const [rk, [lo, hi]] of Object.entries(ranges)) {
      const v = rowValue(r, rk);
      if (typeof v !== "number") { if (lo != null || hi != null) return false; continue; }
      if (lo != null && v < lo) return false;
      if (hi != null && v > hi) return false;
    }
    for (const w of parsed.words) {
      const hay = searchFields.map((f) => String(rowValue(r, f) ?? "").toLowerCase());
      if (!hay.some((h) => h.includes(w))) return false;
    }
    return clauseTests.every((t) => t(r));
  });
  return { rows: out, errors };
}

export function sortRows(rows, kind, ctx, sortKey, dir) {
  if (!sortKey) return rows;
  const col = kind.columns.find((c) => c.key === sortKey);
  if (!col) return rows;
  const mult = dir === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const va = col.get(a, ctx), vb = col.get(b, ctx);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * mult;
    return String(va).localeCompare(String(vb)) * mult;
  });
}

// column max/min over the visible set (for heat shading + mini bars)
export function columnStats(rows, kind, ctx) {
  const stats = {};
  for (const c of kind.columns) {
    if (c.type !== "num" && c.type !== "pct") continue;
    let max = -Infinity, min = Infinity;
    for (const r of rows) { const v = c.get(r, ctx); if (typeof v === "number") { if (v > max) max = v; if (v < min) min = v; } }
    stats[c.key] = { max: max === -Infinity ? 0 : max, min: min === Infinity ? 0 : min };
  }
  return stats;
}

export function toCSV(rows, kind, ctx, keys) {
  const cols = kind.columns.filter((c) => keys.includes(c.key));
  const esc = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.map((c) => c.label).join(","), ...rows.map((r) => cols.map((c) => esc(c.get(r, ctx))).join(","))].join("\n");
}
