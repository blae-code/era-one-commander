// TTK matrix maths. Every input is a shipped game value — no invented mitigation formulas.
// Defence pools: hull (max_health), ablative shield (max_ablative_shield), perimeter shield
// (max_perimeter_shield). Armor is reported alongside, never used as a made-up multiplier.
import { unitClassKey } from "@/lib/combatSim";

const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export const defenceProfile = (t) => ({
  hull: n(t.max_health),
  ablative: n(t.max_ablative_shield),
  perimeter: n(t.max_perimeter_shield),
  armor: n(t.armor),
});

/** Total pool to chew through given which layers are counted. */
export const effectiveHp = (t, layers) => {
  const p = defenceProfile(t);
  return p.hull + (layers.ablative ? p.ablative : 0) + (layers.perimeter ? p.perimeter : 0);
};

export const dpsAgainst = (attacker, target) => n(attacker.dps_vs_class?.[unitClassKey(target)]);
export const perHitAgainst = (attacker, target) => n(attacker.hp_per_hit_vs_class?.[unitClassKey(target)]);

/** seconds | shots | dps for one attacker/target pair. null = cannot engage. */
export function ttkCell(attacker, target, layers, metric) {
  const dps = dpsAgainst(attacker, target);
  if (dps <= 0) return null;
  const hp = effectiveHp(target, layers);
  if (hp <= 0) return null;
  if (metric === "dps") return dps;
  if (metric === "shots") {
    const per = perHitAgainst(attacker, target);
    return per > 0 ? Math.ceil(hp / per) : null;
  }
  return hp / dps;
}

/** Grid of values + extents for shading. */
export function buildMatrix(attackers, targets, layers, metric) {
  const map = new Map();
  let min = Infinity, max = -Infinity;
  for (const a of attackers) for (const t of targets) {
    const v = ttkCell(a, t, layers, metric);
    if (v === null) continue;
    map.set(`${a.game_id}|${t.game_id}`, v);
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { map, min: Number.isFinite(min) ? min : 0, max: Number.isFinite(max) ? max : 0 };
}

/** 0 = best (fast kill / high dps), 1 = worst. Log-scaled: the data spans orders of magnitude. */
export function heat(v, { min, max }, metric) {
  const lo = Math.log(min + 0.01), hi = Math.log(max + 0.01);
  const t = hi > lo ? (Math.log(v + 0.01) - lo) / (hi - lo) : 0;
  return metric === "dps" ? 1 - t : t;
}