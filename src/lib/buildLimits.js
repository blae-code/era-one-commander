// Build integrity checks: power budget + hull frame mass tolerance.
// A hull's frame tolerates a module payload of up to 2x its own dry mass.
export const MASS_TOLERANCE_FACTOR = 2;

const draw = (p) => (p.component?.power < 0 ? -p.component.power : 0);
const mass = (p) => p.component?.mass || 0;

// Greedy attribution: keep the cheapest loads inside the budget, flag the
// heaviest ones that push the build past the line.
function offenders(placements, valueOf, budget) {
  const sorted = [...placements].filter((p) => valueOf(p) > 0).sort((a, b) => valueOf(a) - valueOf(b));
  const flagged = [];
  let used = 0;
  for (const p of sorted) {
    if (used + valueOf(p) > budget) flagged.push(p);
    else used += valueOf(p);
  }
  return flagged.reverse();
}

export function checkBuild(hull, placements, stats) {
  if (!hull) return { warnings: [], faultyKeys: [] };
  const warnings = [];

  const powerCap = stats.power_gen || 0;
  if ((stats.power_use || 0) > powerCap) {
    const flagged = offenders(placements, draw, powerCap);
    warnings.push({
      id: "power",
      label: "Power budget exceeded",
      detail: `Draw ${Math.round(stats.power_use)} vs generation ${Math.round(powerCap)}`,
      over: (stats.power_use || 0) - powerCap,
      unit: "PWR",
      valueOf: draw,
      offenders: flagged,
    });
  }

  const massCap = (hull.mass || 0) * MASS_TOLERANCE_FACTOR;
  const payload = placements.reduce((a, p) => a + mass(p), 0);
  if (massCap > 0 && payload > massCap) {
    const flagged = offenders(placements, mass, massCap);
    warnings.push({
      id: "mass",
      label: "Frame mass tolerance exceeded",
      detail: `Payload ${Math.round(payload)} vs tolerance ${Math.round(massCap)}`,
      over: payload - massCap,
      unit: "T",
      valueOf: mass,
      offenders: flagged,
    });
  }

  const faultyKeys = [...new Set(warnings.flatMap((w) => w.offenders.map((p) => p.key)))];
  return { warnings, faultyKeys, massCap, payload };
}