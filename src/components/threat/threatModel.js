// Threat Clock model — pure derivation over EnemySpawner/EnemyWave/EnemyUpgrade + Unit/ResearchNode.
// All times are SECONDS on the spawner clock: t=0 is first detection (only_spawn_when_enemy_detected)
// PLUS the spawner's initial_delay — not match start. The caller owns that caption.

// The 13 target classes every Unit.dps_vs_class row carries (union verified over the shipped dataset).
export const TARGET_CLASSES = [
  "FighterUnit", "CorvetteUnit", "FrigateUnit", "UtilityUnit", "PlatformUnit", "MineUnit",
  "CommandModule", "StructuralModule", "WeaponModule", "FacilityModule", "UtilityModule",
  "Station", "Wreckage",
];

// RULE-3: this option uses Unit.dps_total, which is grandfathered ONLY under the explicit
// label "all-class nominal". Never render its numbers without that label.
export const NOMINAL = "__nominal__";
export const NOMINAL_LABEL = "all-class nominal";

export const targetLabel = (cls) => (cls === NOMINAL ? NOMINAL_LABEL : `vs ${cls}`);

// Segment colors keyed by Unit.unit_class (6 classes in the shipped data + unresolved grey).
export const CLASS_COLOR = {
  Fighter: "#00d1c1",
  Corvette: "#2f9bff",
  Frigate: "#ff7a1a",
  Platform: "#c9d6e3",
  Mine: "#ff4d4d",
  Utility: "#ffd21a",
  Unresolved: "#5b6570",
};

// difficulty_deltas carry ONLY VeryEasy and Insane in the extracted dataset —
// Easy/Normal/Hard exist in the game but have no extracted deltas, so they render disabled.
export const DIFFICULTIES = [
  { key: "base", label: "Baseline", available: true },
  { key: "VeryEasy", label: "VeryEasy", available: true },
  { key: "Easy", label: "Easy", available: false },
  { key: "Normal", label: "Normal", available: false },
  { key: "Hard", label: "Hard", available: false },
  { key: "Insane", label: "Insane", available: true },
];

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export const fmtClock = (sec) => {
  const s = Math.max(0, Math.round(num(sec)));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** DPS of one unit against the selected target class (or all-class nominal). */
const unitDps = (unit, targetClass) => {
  if (!unit) return 0;
  if (targetClass === NOMINAL) return num(unit.dps_total);
  return num(unit.dps_vs_class?.[targetClass]);
};

/**
 * Build the full clock for one spawner.
 * @returns {{ waves, upgrades, maxDps, cumPoints, cumMax, tEnd, deltaWaveCount }}
 */
export function buildThreatClock({ waves = [], upgrades = [], spawnerId, unitsById = {}, researchById = {}, targetClass = "FrigateUnit", difficulty = "base" }) {
  const mine = waves.filter((w) => w.spawner_id === spawnerId);
  let deltaWaveCount = 0;

  const built = mine.map((w) => {
    const deltas = difficulty !== "base" ? w.difficulty_deltas?.[difficulty] || null : null;
    if (deltas && Object.keys(deltas).length) deltaWaveCount += 1;

    const segments = Object.entries(w.units || {}).map(([slot, s]) => {
      const unit = s?.unit_id ? unitsById[s.unit_id] : null;
      const baseCount = num(s?.count);
      const delta = deltas ? num(deltas[slot]) : 0;
      const count = Math.max(0, baseCount + delta);
      const randomExtra = num(s?.random_extra);
      const dpsPer = unitDps(unit, targetClass);
      return {
        slot,
        unitId: s?.unit_id || null,
        name: unit?.name || s?.unit_id || "unresolved unit",
        unitClass: unit?.unit_class || "Unresolved",
        unresolved: !unit, // 1 slot in the shipped data has unit_id null — keep it visible, excluded from DPS/HP
        baseCount,
        delta,
        count,
        randomExtra,
        dpsPer,
        dps: unit ? count * dpsPer : 0,
        hp: unit ? count * num(unit.max_health) : 0,
      };
    }).sort((a, b) => b.dps - a.dps);

    const isAlt = w.replaces_wave !== null && w.replaces_wave !== undefined;
    // Alternates carry probability 100 but fire at alternative_probability (40/30/20).
    const effProb = isAlt ? num(w.alternative_probability) : num(w.probability);
    const t0 = num(w.time_to_spawn);
    const t1 = t0 + num(w.random_time_to_spawn);

    return {
      id: w.game_id,
      index: w.index,
      name: w.name,
      t0,
      t1,
      jitter: num(w.random_time_to_spawn),
      isAlt,
      replacesWave: isAlt ? w.replaces_wave : null,
      effProb,
      ghost: effProb < 100, // alternates AND the low-probability mine waves render ghosted
      segments,
      dps: segments.reduce((a, s) => a + s.dps, 0),
      hp: segments.reduce((a, s) => a + s.hp, 0),
      unitCount: segments.reduce((a, s) => a + s.count, 0),
      extraMax: segments.reduce((a, s) => a + s.randomExtra, 0),
      hasUnresolved: segments.some((s) => s.unresolved),
      formations: w.possible_formations || [],
      stance: w.formation_stance || null,
      stations: num(w.stations_to_spawn),
      deltaApplied: !!(deltas && Object.keys(deltas).length),
    };
  }).sort((a, b) => a.t0 - b.t0 || (a.isAlt ? 1 : 0) - (b.isAlt ? 1 : 0));

  const ups = upgrades
    .filter((u) => u.spawner_id === spawnerId)
    .map((u) => ({
      id: u.game_id,
      t: num(u.time_to_upgrade),
      research: (u.research_ids || []).map((rid) => researchById[rid]?.name || rid),
    }))
    .sort((a, b) => a.t - b.t);

  // Cumulative threat = running sum of guaranteed (100%) wave DPS at each spawn instant.
  // Ghosted waves (probabilistic mines + the 3 alternates) are EXCLUDED — noted in the legend.
  let acc = 0;
  const cumPoints = [{ t: 0, v: 0 }];
  for (const w of built) {
    if (w.ghost) continue;
    acc += w.dps;
    cumPoints.push({ t: w.t0, v: acc });
  }

  const tEnd = Math.max(
    ...built.map((w) => w.t1),
    ...ups.map((u) => u.t),
    600,
  );
  cumPoints.push({ t: tEnd, v: acc });

  return {
    waves: built,
    upgrades: ups,
    maxDps: Math.max(1, ...built.map((w) => w.dps)),
    cumPoints,
    cumMax: Math.max(1, acc),
    tEnd,
    deltaWaveCount,
  };
}
