// Theatre board model helpers — pure functions over Scenario / ScenarioEntity rows.
// No JSX; kept .jsx so the file lives outside the tsc include set like its siblings.

// COLOUR BY TEAM (kind is the shape, never the colour).
export const TEAM_COLORS = {
  None: "#8a8f98",
  Rogue: "hsl(9 64% 52%)",
  Team1: "hsl(26 88% 52%)",
  Team2: "#2f9bff",
};
export const teamColor = (team) => TEAM_COLORS[team] || TEAM_COLORS.None;

export const TEAM_ORDER = ["Team1", "Team2", "Rogue", "None"];

// The 13 dps_vs_class target classes (RULE-3: DPS is always vs a NAMED class).
export const TARGET_CLASSES = [
  "FighterUnit", "CorvetteUnit", "FrigateUnit", "UtilityUnit", "PlatformUnit", "MineUnit",
  "CommandModule", "StructuralModule", "WeaponModule", "FacilityModule", "UtilityModule",
  "Station", "Wreckage",
];

// Resource.color_rgba is [r,g,b,a] floats 0..1 with a near-zero game alpha — use rgb, our own alpha.
export const rgbaCss = (c, a = 0.9) => {
  if (!Array.isArray(c) || c.length < 3) return `rgba(160,160,160,${a})`;
  const f = (v) => Math.round(Math.max(0, Math.min(1, Number(v) || 0)) * 255);
  return `rgba(${f(c[0])},${f(c[1])},${f(c[2])},${a})`;
};

// Compact quantity: 60000 -> 60k, 3614000 -> 3.61M
export const fmtQty = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 2)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(v % 1e3 === 0 ? 0 : 1)}k`;
  return String(Math.round(v));
};

export const sumResources = (res) => {
  if (!res) return 0;
  let s = 0;
  for (const v of Object.values(res)) s += Number(v) || 0;
  return s;
};

// Marks for one scenario: filter FIRST (<= ~800 rows), drop the un-renderable "other" kind
// (CameraController, [PhantomRadar] — census: 0/48 have identifiers).
export const marksFor = (rows, scenarioId) =>
  rows.filter((r) => r.scenario_id === scenarioId && r.kind !== "other");

const INTERACTIVE_KINDS = new Set(["asteroid", "module", "station", "unit", "objective"]);
export const isInteractive = (r) => INTERACTIVE_KINDS.has(r.kind);

// ORDER OF BATTLE — aggregate enemy-side (Rogue/Team2) modules+units by identifier,
// joined through the catalog byId for hp/cost/dps_vs_class.
export function orderOfBattle(marks, byId, targetClass) {
  const agg = new Map();
  for (const r of marks) {
    if (r.team !== "Rogue" && r.team !== "Team2") continue;
    if (r.kind !== "module" && r.kind !== "unit") continue;
    const id = r.identifier;
    if (!id) continue;
    let e = agg.get(id);
    if (!e) {
      const cat = byId ? byId[id] : null;
      e = {
        id,
        kind: r.kind,
        team: r.team,
        name: (cat && cat.name) || r.name || id,
        count: 0,
        hp: 0,
        cost: 0,
        dps: 0,
        unitHp: Number(cat && cat.max_health) || 0,
        unitCost: Number(cat && cat.cost_resources) || 0,
        unitDps: Number(cat && cat.dps_vs_class && cat.dps_vs_class[targetClass]) || 0,
      };
      agg.set(id, e);
    }
    e.count += 1;
    e.hp += e.unitHp;
    e.cost += e.unitCost;
    e.dps += e.unitDps;
  }
  return [...agg.values()];
}

// RESOURCE LEDGER — per RU type: total, placement count, discrete tier breakdown.
export function resourceLedger(marks) {
  const perRu = new Map();
  for (const r of marks) {
    if (!r.resources) continue;
    for (const [ru, qRaw] of Object.entries(r.resources)) {
      const q = Number(qRaw) || 0;
      let e = perRu.get(ru);
      if (!e) { e = { ru, total: 0, count: 0, tiers: new Map() }; perRu.set(ru, e); }
      e.total += q;
      e.count += 1;
      e.tiers.set(q, (e.tiers.get(q) || 0) + 1);
    }
  }
  return [...perRu.values()]
    .map((e) => ({ ...e, tiers: [...e.tiers.entries()].sort((a, b) => a[0] - b[0]) }))
    .sort((a, b) => b.total - a.total);
}

// Y histogram for the vertical-slice control.
export function yHistogram(marks, bins = 28) {
  let min = Infinity, max = -Infinity;
  for (const r of marks) {
    const y = Number(r.y) || 0;
    if (y < min) min = y;
    if (y > max) max = y;
  }
  if (!Number.isFinite(min)) { min = 0; max = 0; }
  if (max - min < 1e-6) { min -= 1; max += 1; }
  const counts = new Array(bins).fill(0);
  const span = max - min;
  for (const r of marks) {
    const y = Number(r.y) || 0;
    const i = Math.min(bins - 1, Math.max(0, Math.floor(((y - min) / span) * bins)));
    counts[i] += 1;
  }
  return { min, max, counts, peak: Math.max(1, ...counts) };
}

// Deterministic CSS starfield from a string seed (no assets).
export function starfieldCss(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rnd = () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5; h |= 0;
    return (h >>> 0) / 4294967296;
  };
  const dots = [];
  for (let i = 0; i < 16; i++) {
    const x = Math.round(rnd() * 100), y = Math.round(rnd() * 100);
    const a = (0.18 + rnd() * 0.5).toFixed(2);
    const s = rnd() > 0.82 ? "1.5px 1.5px" : "1px 1px";
    dots.push(`radial-gradient(${s} at ${x}% ${y}%, rgba(255,240,225,${a}), transparent 100%)`);
  }
  return dots.join(",");
}
