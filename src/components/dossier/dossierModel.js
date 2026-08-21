// Derivations over AiPersonality rows for the AI Dossier page.
// Everything here is computed from the row data at runtime — no hardcoded per-personality facts.
import { fmtNum } from "@/lib/gameData";

// Game-phase order used by secondary_stations_limits / min_units_for_command_center_attack / granted_researches.
export const PHASES = ["Start", "Early", "Mid", "Late", "End"];

// House accent hexes (see r2 inventory §3) keyed by personality codename.
export const PERSONA_HEX = {
  AGGRESSIVE: "#ff2d55",
  BALANCED: "#ffb020",
  DEFENSIVE: "#2f9bff",
  PASSIVE: "#22c55e",
  ROGUE: "#d24bff",
};

export const personaHex = (r) =>
  PERSONA_HEX[String((r && r.name) || "").toUpperCase()] || "#ff7a1a";

// Escalation order for the card grid (contract order: Passive → Rogue).
const ESCALATION = ["PASSIVE", "DEFENSIVE", "BALANCED", "AGGRESSIVE", "ROGUE"];
export const sortByEscalation = (rows) =>
  [...rows].sort((a, b) => {
    const ia = ESCALATION.indexOf(String(a.name || "").toUpperCase());
    const ib = ESCALATION.indexOf(String(b.name || "").toUpperCase());
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

export const commitRange = (r) => {
  const v = Array.isArray(r && r.min_max_units_for_attack) ? r.min_max_units_for_attack : [0, 0];
  return [Number(v[0]) || 0, Number(v[1]) || 0];
};

export const plannerOf = (r) => (r && r.planner_options) || {};

// One-line doctrine READ FROM the decisive numbers — rule-based, not lore.
export function deriveDoctrine(r) {
  const [min, max] = commitRange(r);
  const p = plannerOf(r);
  const parts = [];
  if (min === max) parts.push(`commits at exactly ${min} units — constant pressure, never a big push`);
  else if (min >= 12) parts.push(`masses ${min}–${max} units before moving — one heavy hammer blow`);
  else if (max <= 9) parts.push(`raids in packs of ${min}–${max} — small, frequent sorties`);
  else parts.push(`flexible commit anywhere from ${min} to ${max} units`);
  if (p.maxDepth >= 15) parts.push(`plans ${p.maxDepth} steps deep`);
  else if (p.maxDepth <= 9) parts.push(`short ${p.maxDepth}-step planning horizon`);
  else parts.push(`${p.maxDepth}-step planning horizon`);
  if (p.maxNodes) parts.push(`${fmtNum(p.maxNodes)} search nodes`);
  return parts.join(" · ");
}

// ---- compare-mode field split ------------------------------------------------

const META = new Set(["game_id", "name", "asset_name", "game_version", "game_build"]);

// Stable stringify (sorted object keys) so {a,b} === {b,a}.
const stable = (v) =>
  JSON.stringify(v, (_k, x) =>
    x && typeof x === "object" && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b)))
      : x
  );

// Runtime varying-vs-identical split across all rows (never hardcoded).
export function splitFields(rows) {
  if (!rows.length) return { varying: [], identical: [] };
  const keys = Object.keys(rows[0]).filter((k) => !META.has(k));
  const varying = [];
  const identical = [];
  for (const k of keys) {
    const first = stable(rows[0][k]);
    (rows.every((r) => stable(r[k]) === first) ? identical : varying).push(k);
  }
  return { varying, identical };
}

// Compact human rendering of any field value for the compare table.
export function fmtVal(v) {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v)) {
    if (v.length === 0) return "—";
    if (v.length === 2 && v.every((n) => typeof n === "number")) return `${fmtNum(v[0], 3)}–${fmtNum(v[1], 3)}`;
    return v.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(", ");
  }
  if (typeof v === "object") {
    const e = Object.entries(v);
    if (!e.length) return "—";
    return e
      .map(([k, x]) => `${k}: ${typeof x === "object" && x !== null ? JSON.stringify(x) : x}`)
      .join("\n");
  }
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "number") return fmtNum(v, 3);
  return String(v);
}

export const labelize = (field) => String(field).replace(/_/g, " ");

// "toCommandCenter" → "to command center" for time_between_attacks keys.
export const camelWords = (k) => String(k).replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const stampOf = (rows) =>
  rows && rows[0]
    ? `game ${rows[0].game_version || "—"} · build ${rows[0].game_build || "—"}`
    : "no dataset";
