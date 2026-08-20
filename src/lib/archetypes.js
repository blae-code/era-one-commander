// Tactical archetype clustering for saved blueprints.
// Each design is scored against role profiles built from its own telemetry
// (damage / durability / mobility / support share). Highest score wins; the
// margin over the runner-up becomes the confidence readout.

export const ARCHETYPES = {
  sniper: { label: "Sniper", code: "AR-01", color: "hsl(200 80% 55%)", blurb: "Heavy damage, thin hull — kills at reach, dies up close." },
  brawler: { label: "Brawler", code: "AR-02", color: "hsl(9 70% 52%)", blurb: "Guns and plating together — designed to trade hits and win." },
  skirmisher: { label: "Skirmisher", code: "AR-03", color: "hsl(45 85% 55%)", blurb: "Fast, lightly armed — harass, pick off stragglers, disengage." },
  bulwark: { label: "Bulwark", code: "AR-04", color: "hsl(265 55% 62%)", blurb: "Mass of hull and shield with modest guns — soaks pressure." },
  support: { label: "Support", code: "AR-05", color: "hsl(150 60% 45%)", blurb: "Shield and utility heavy — keeps the rest of the flight alive." },
  logistics: { label: "Logistics", code: "AR-06", color: "hsl(30 55% 55%)", blurb: "Hauling and cargo capacity over combat capability." },
  generalist: { label: "Generalist", code: "AR-07", color: "hsl(20 8% 55%)", blurb: "No stat dominates — a flexible, unspecialised hull." },
};

export const ARCHETYPE_KEYS = Object.keys(ARCHETYPES);

const share = (placements, cats) => {
  if (!placements?.length) return 0;
  return placements.filter((p) => cats.includes(p.category)).length / placements.length;
};

// Normalised feature vector, each roughly 0–1 against the sampled fleet.
export function features(bp, norms) {
  const s = bp.stats || {};
  const mass = s.mass || 1;
  const n = (v, key) => (norms[key] ? Math.min(1, (v || 0) / norms[key]) : 0);
  return {
    firepower: n((s.dps || 0) / mass, "dpsPerMass"),
    durability: n(((s.hp || 0) + (s.shield || 0)) / mass, "ehpPerMass"),
    mobility: n(s.twr || 0, "twr"),
    weaponShare: share(bp.placements, ["weapon"]),
    supportShare: share(bp.placements, ["shield", "module"]),
    cargoShare: n((s.cargo || 0) / mass, "cargoPerMass"),
    bulk: n(mass, "mass"),
  };
}

// Fleet-relative scale so clustering adapts to whatever the operator has saved.
export function buildNorms(list) {
  const p95 = (vals) => { const v = vals.filter((x) => x > 0).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length * 0.9)] || v[v.length - 1] : 0; };
  const st = list.map((b) => b.stats || {});
  return {
    dpsPerMass: p95(st.map((s) => (s.dps || 0) / (s.mass || 1))),
    ehpPerMass: p95(st.map((s) => ((s.hp || 0) + (s.shield || 0)) / (s.mass || 1))),
    twr: p95(st.map((s) => s.twr || 0)),
    cargoPerMass: p95(st.map((s) => (s.cargo || 0) / (s.mass || 1))),
    mass: p95(st.map((s) => s.mass || 0)),
  };
}

const PROFILES = {
  sniper: (f) => f.firepower * 2.0 + f.weaponShare * 1.2 - f.durability * 1.1 - f.mobility * 0.4,
  brawler: (f) => f.firepower * 1.5 + f.durability * 1.5 + f.weaponShare * 0.8 - f.mobility * 0.3,
  skirmisher: (f) => f.mobility * 2.0 + f.firepower * 0.7 - f.bulk * 1.0 - f.durability * 0.5,
  bulwark: (f) => f.durability * 2.2 + f.bulk * 0.8 - f.firepower * 1.2,
  support: (f) => f.supportShare * 2.2 - f.weaponShare * 1.0 - f.firepower * 0.8,
  logistics: (f) => f.cargoShare * 2.6 - f.firepower * 1.0 - f.weaponShare * 0.8,
  generalist: () => 0.55,
};

const DRIVERS = {
  firepower: "damage density", durability: "effective HP per tonne", mobility: "thrust-to-weight",
  weaponShare: "weapon mounts", supportShare: "shield & utility mounts", cargoShare: "cargo capacity", bulk: "hull mass",
};

export function classify(bp, norms) {
  const f = features(bp, norms);
  const scored = ARCHETYPE_KEYS.map((k) => ({ key: k, score: PROFILES[k](f) })).sort((a, b) => b.score - a.score);
  const [best, second] = scored;
  const confidence = Math.max(0.1, Math.min(1, (best.score - second.score) / 0.9));
  const drivers = Object.entries(f).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => ({ label: DRIVERS[k], value: v }));
  return { archetype: best.key, secondary: second.key, confidence, features: f, drivers };
}

export function clusterBlueprints(list) {
  const norms = buildNorms(list);
  const tagged = list.map((bp) => ({ bp, ...classify(bp, norms) }));
  const groups = ARCHETYPE_KEYS.map((key) => ({
    key,
    ...ARCHETYPES[key],
    items: tagged.filter((t) => t.archetype === key).sort((a, b) => b.confidence - a.confidence),
  }));
  return { groups, tagged, norms };
}