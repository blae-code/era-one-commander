// Combat inferences derived strictly from shipped ERA ONE values.
// Nothing here invents a formula the game does not expose: per-class damage comes from the
// game's own dps_vs_class / hp_per_hit_vs_class tables, health from max_health, timing from
// rate_of_fire / burst_* / reload_* fields.
const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Class key a unit row counts as in the weapon damage tables (Unit.unit_class is "Frigate", tables use "FrigateUnit"). */
export const unitClassKey = (u) => {
  const c = u.unit_class || "Frigate";
  return /(Unit|Module|Station|Wreckage)$/.test(c) ? c : `${c}Unit`;
};

/** Seconds to strip a target's hull with one instance of a weapon. null when it cannot damage it. */
export function timeToKill(weapon, target) {
  const dps = n(weapon.dps_vs_class?.[unitClassKey(target)]);
  const hp = n(target.max_health);
  if (dps <= 0 || hp <= 0) return null;
  return hp / dps;
}

/** Shots required, using the game's per-class hull damage per hit. */
export function shotsToKill(weapon, target) {
  const per = n(weapon.hp_per_hit_vs_class?.[unitClassKey(target)]);
  const hp = n(target.max_health);
  if (per <= 0 || hp <= 0) return null;
  return Math.ceil(hp / per);
}

/**
 * Firing cycle: the repeating pattern of shots, burst gaps, reload and precharge.
 * Returns segments on a timeline plus sustained/peak dps for the cycle.
 */
export function firingCycle(w, perShot) {
  const rof = n(w.rate_of_fire);
  const shotGap = rof > 0 ? 1 / rof : 0;
  const burst = Math.max(1, n(w.burst_amount) || 1);
  const burstGap = n(w.burst_interval);
  const pre = w.requires_precharge ? n(w.precharge_duration) : 0;
  const reload = w.requires_reload ? n(w.reload_time) : 0;

  const segs = [];
  let t = 0;
  if (pre > 0) { segs.push({ kind: "precharge", start: 0, dur: pre }); t = pre; }
  for (let i = 0; i < burst; i++) {
    segs.push({ kind: "shot", start: t, dur: Math.max(0.02, shotGap || 0.05) });
    t += shotGap || 0.05;
    if (burstGap > 0 && i < burst - 1) { segs.push({ kind: "gap", start: t, dur: burstGap }); t += burstGap; }
  }
  if (reload > 0) { segs.push({ kind: "reload", start: t, dur: reload }); t += reload; }

  const cycle = t || 1;
  const damage = perShot * burst;
  return {
    segments: segs,
    cycle,
    shots: burst,
    sustained: damage / cycle,
    peak: shotGap > 0 ? perShot / shotGap : damage,
    downtime: (pre + reload) / cycle,
  };
}

/**
 * Closing envelope: how long a target needs to cross the weapon's reach, how long
 * a projectile takes to arrive, and how much damage lands before contact.
 */
export function closingEnvelope(weapon, target, dpsOverride) {
  const range = n(weapon.range);
  const speed = n(target.max_speed);
  const flight = n(weapon.bullet_speed) > 0 ? range / n(weapon.bullet_speed) : 0;
  const closing = speed > 0 ? range / speed : null;
  const dps = dpsOverride ?? n(weapon.dps_vs_class?.[unitClassKey(target)]);
  const window = closing === null ? null : Math.max(0, closing - flight);
  return {
    range,
    flight,
    closing,
    window,
    damageBeforeContact: window === null ? null : window * dps,
    hpFraction: window === null || !n(target.max_health) ? null : (window * dps) / n(target.max_health),
    lifetimeReach: n(weapon.bullet_lifetime) * n(weapon.bullet_speed) || null,
  };
}

/** Rank-normalised 0..1 for heat shading. */
export const norm = (v, min, max) => (max > min ? (v - min) / (max - min) : 0);

export const TTK_RAMP = (t01) => {
  // fast kill = ember, slow kill = cold iron
  const stops = [[0, [255, 214, 26]], [0.35, [255, 122, 26]], [0.7, [178, 58, 40]], [1, [58, 46, 42]]];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) if (t01 >= stops[i][0] && t01 <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; }
  const f = b[0] === a[0] ? 0 : (t01 - a[0]) / (b[0] - a[0]);
  const c = a[1].map((x, i) => Math.round(x + (b[1][i] - x) * f));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
};