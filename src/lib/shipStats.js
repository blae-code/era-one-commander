// Computes aggregate build statistics from a hull + placed components
export function computeStats(hull, placements) {
  const comps = placements.map((p) => p.component).filter(Boolean);
  const sum = (fn) => comps.reduce((a, c) => a + (fn(c) || 0), 0);

  const mass = (hull?.mass || 0) + sum((c) => c.mass);
  const hp = (hull?.hp || 0) + sum((c) => c.hp);
  const power_gen = (hull?.base_power || 0) + sum((c) => (c.power > 0 ? c.power : 0));
  const power_use = sum((c) => (c.power < 0 ? -c.power : 0));
  const dps = sum((c) => c.dps);
  const thrust = sum((c) => c.thrust);
  const shield = sum((c) => c.shield_hp);
  const cargo = sum((c) => c.cargo);
  const twr = mass > 0 ? thrust / mass : 0;

  return { mass, hp, power_gen, power_use, dps, thrust, shield, cargo, twr };
}

export const fmt = (n, d = 0) =>
  n === undefined || n === null
    ? "—"
    : Number(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 });