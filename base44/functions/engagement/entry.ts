// engagement — attacker vs defender numbers with the modifier stack applied.
// POST { attacker: {kind:"Unit"|"Module", game_id, primary?, secondary?, stance?, style?, formation?, level?},
//        defender: {kind, game_id, stance?, formation?, level?} }
// Applies: class damage multipliers (attacker weapons vs defender class), stance/style/formation/veterancy
// StatModifiers (WeaponDamage, WeaponRate, AttackRange on the attacker; MaxHealth, Armor, HealthRegenerationRate on
// the defender). Armor is REPORTED, not applied — the game's armor formula is not in the extracted data.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
type Mod = { stat: string; operation: string; value: number; abs?: boolean };

/** Sum modifiers per stat: Add/Subtract fractions accumulate, Multiply multiplies, Set overrides. Returns factor (and absolute delta) per stat. */
function stack(mods: Mod[]) {
  const out: Record<string, { add: number; mul: number; set: number | null; abs_add: number; sources: string[] }> = {};
  for (const m of mods) {
    const o = (out[m.stat] ||= { add: 0, mul: 1, set: null, abs_add: 0, sources: [] });
    const v = num(m.value);
    if (m.operation === 'Add') { if (m.abs) o.abs_add += v; else o.add += v; }
    else if (m.operation === 'Subtract') { if (m.abs) o.abs_add -= v; else o.add -= v; }
    else if (m.operation === 'Multiply') o.mul *= v;
    else if (m.operation === 'Divide') o.mul /= v || 1;
    else if (m.operation === 'Set') o.set = v;
    o.sources.push((m as any).source || '');
  }
  return out;
}
/** Resolve a stat's stack against a base value. `Set` is an ABSOLUTE override, never a multiplier —
 *  returning it as a factor multiplied the base instead of replacing it (latent: the only Set ops in the
 *  data today are Power/TurningPower/MaxSpeed/MaxTurningSpeed on FM.FRIGATE_SLOWDOWN, none of which this
 *  function reads, so no shipped number moves). `abs` Add/Subtract is a flat post-add. */
const resolve = (st: ReturnType<typeof stack>, stat: string, base: number) => {
  const s = st[stat];
  if (!s) return { value: base, factor: 1, overridden: false };
  const overridden = s.set !== null && s.set !== undefined;
  const value = (overridden ? (s.set as number) : base * (1 + s.add) * s.mul) + s.abs_add;
  return { value, factor: base ? value / base : 1, overridden };
};
/** Multiplicative-only view, for stats applied to a per-weapon quantity rather than a stored base. */
const factor = (st: ReturnType<typeof stack>, stat: string) => {
  const s = st[stat];
  if (!s) return 1;
  if (s.set !== null && s.set !== undefined) return s.set; // an override of a rate IS the rate
  return (1 + s.add) * s.mul;
};

/** Candidate armour models. The game's real damage-vs-armour formula is a method body Cpp2IL never gave
 *  us, so we do not pretend to know it: the point estimate stays `none` (identical to shipped behaviour)
 *  and every response also carries the BAND across these shapes so a consumer can see how much the answer
 *  depends on the unknown. SCALE is a free parameter, not an extracted constant. */
const LEVEL_STATS = ['MaxHealth', 'Armor', 'HealthRegenerationRate', 'WeaponDamage'];
const LEVEL_STEP = 0.11;
const GAME_BUILD = '24615926';
const GAME_VERSION = '0.12.2';

const ARMOR_SCALE = 100;
const ARMOR_MODELS: Record<string, (dmg: number, armorEff: number) => number> = {
  none: (d) => d,
  subtractive: (d, a) => Math.max(d - a, d * 0.1),
  diminishing: (d, a) => d * (ARMOR_SCALE / (ARMOR_SCALE + Math.max(0, a))),
  proportional: (d, a) => d * (1 - Math.min(Math.max(0, a) / ARMOR_SCALE, 0.9)),
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'auth required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const A = body.attacker || {}, D = body.defender || {};
  if (!A.game_id || !D.game_id) return Response.json({ error: 'attacker.game_id and defender.game_id required' }, { status: 400 });

  const svc = base44.asServiceRole.entities as Record<string, any>;
  const [units, modules, weapons, turrets, combat, formations] = await Promise.all([
    svc.Unit.list('game_id', 1000), svc.Module.list('game_id', 1000), svc.Weapon.list('game_id', 1000), svc.Turret.list('game_id', 1000),
    svc.CombatTemplate.list('game_id', 100), svc.FormationModifier.list('game_id', 100),
  ]);
  const byId = (rows: any[]) => Object.fromEntries(rows.map((r) => [r.game_id, r]));
  const U = byId(units), M = byId(modules), W = byId(weapons), T = byId(turrets), CT = byId(combat), FM = byId(formations);
  const entity = (x: any) => U[x.game_id] || M[x.game_id];
  const a = entity(A), d = entity(D);
  if (!a) return Response.json({ error: `unknown attacker ${A.game_id}` }, { status: 404 });
  if (!d) return Response.json({ error: `unknown defender ${D.game_id}` }, { status: 404 });

  const classOf = (e: any) => U[e.game_id] ? `${e.unit_class}Unit` : `${e.module_class}Module`;
  const modsFor = (e: any, x: any): Mod[] => {
    const out: Mod[] = [];
    const tag = (arr: any[], src: string) => (arr || []).map((m: any) => ({ ...m, source: src }));
    const st = x.stance ? CT[`AT.STANCE_${String(x.stance).toUpperCase()}`] : null; if (st) out.push(...tag(st.modifiers, st.name));
    const sy = x.style ? CT[`AT.STYLE_${String(x.style).toUpperCase()}`] : null; if (sy) out.push(...tag(sy.modifiers, sy.name));
    const fm = x.formation ? FM[String(x.formation).startsWith('FM.') ? x.formation : `FM.${String(x.formation).toUpperCase()}_FORMATION`] : null;
    if (fm) { out.push(...tag(fm.modifiers, fm.name)); const base = FM['FM.FORMATION']; if (base && fm.game_id !== 'FM.FORMATION') out.push(...tag(base.modifiers, base.name)); }
    // Veterancy: all 1,080 UnitLevel rows (27 units x 10 levels x 4 stats) encode ONE constant —
    // Add 0.11, abs:false, on MaxHealth/Armor/HealthRegenerationRate/WeaponDamage. Listing them cost
    // ~265 KB per call to learn a number we can state. Verified 2026-08-19; the verify harness asserts it.
    if (x.level && U[e.game_id]) {
      const lv = Math.max(0, Math.min(10, Math.floor(num(x.level))));
      for (let i = 1; i <= lv; i++)
        for (const stat of LEVEL_STATS) out.push({ stat, operation: 'Add', value: LEVEL_STEP, abs: false, source: `level ${i}` } as any);
    }
    return out;
  };

  // attacker weapons: fixed + chosen/default equipment (turret -> weapons)
  const wids: string[] = [...(a.weapons || [])];
  if (U[a.game_id]) {
    for (const [slot, key] of [['primary', 'primary_equip'], ['secondary', 'secondary_equip'], ['tertiary', 'tertiary_equip']] as const) {
      const id = A[slot] ?? a[key]; if (!id) continue;
      const n = Math.max(1, num(a.hardpoints?.[slot]));
      const eq = T[id] || W[id]; if (!eq) continue;
      const list = T[id] ? (eq.weapons || []) : [id];
      for (let i = 0; i < n; i++) wids.push(...list);
    }
  }
  const dcls = classOf(d);
  const aMods = stack(modsFor(a, A)), dMods = stack(modsFor(d, D));
  const fDmg = factor(aMods, 'WeaponDamage'), fRate = factor(aMods, 'WeaponRate'), fRange = factor(aMods, 'AttackRange');
  const perWeapon = wids.map((id) => {
    const w = W[id]; if (!w) return null;
    const mult = w.class_damage_multipliers?.find((m: any) => m.entity_class === dcls)?.multiplier ?? 1;
    const dps = num(w.dps) * mult * fDmg * fRate;
    return { game_id: id, name: w.name, base_dps: num(w.dps), class_multiplier: mult, dps, range: num(w.range) * fRange, armor_penetration: num(w.armor_penetration), hp_per_hit: num(w.hp_change) * mult * fDmg };
  }).filter(Boolean) as any[];
  const dps = perWeapon.reduce((s, w) => s + w.dps, 0);
  const alpha = perWeapon.reduce((s, w) => s + w.hp_per_hit, 0);
  const rHp = resolve(dMods, 'MaxHealth', num(d.max_health));
  const rArmor = resolve(dMods, 'Armor', num(d.armor));
  const rRegen = resolve(dMods, 'HealthRegenerationRate', num(d.health_regen));
  const hp = rHp.value, armor = rArmor.value, regen = rRegen.value;
  const net = dps - regen;
  const ttk = net > 0 ? hp / net : null;
  const maxRange = Math.max(0, ...perWeapon.map((w) => w.range));

  // --- the honesty payload: what this answer depends on that we do not know ---
  const underModel = (name: string) => {
    const f = ARMOR_MODELS[name];
    const per = perWeapon.map((w) => ({ id: w.game_id, dps: f(w.dps, armor * (1 - num(w.armor_penetration))) }));
    const total = per.reduce((s, w) => s + w.dps, 0);
    const n = total - regen;
    return { model: name, dps: total, net_dps: n, time_to_kill_s: n > 0 ? hp / n : null, order: per.map((w) => w.id) };
  };
  const runs = Object.keys(ARMOR_MODELS).map(underModel);
  const ttks = runs.map((r) => r.time_to_kill_s).filter((v): v is number => typeof v === 'number');
  const orders = new Set(runs.map((r) => r.order.join('>')));
  const band = ttks.length
    ? { low: Math.min(...ttks), high: Math.max(...ttks), model_spread_ratio: Math.min(...ttks) > 0 ? Math.max(...ttks) / Math.min(...ttks) : null }
    : { low: null, high: null, model_spread_ratio: null };

  return Response.json({
    attacker: { game_id: a.game_id, name: a.name, kind: U[a.game_id] ? 'Unit' : 'Module', entity_class: classOf(a), weapons: wids, level: A.level ?? null, stance: A.stance ?? null, style: A.style ?? null, formation: A.formation ?? null,
                factors: { weapon_damage: fDmg, weapon_rate: fRate, attack_range: fRange } },
    defender: { game_id: d.game_id, name: d.name, kind: U[d.game_id] ? 'Unit' : 'Module', entity_class: dcls, max_health: hp, armor, health_regen: regen, level: D.level ?? null,
                factors: { max_health: rHp.factor, armor: rArmor.factor, health_regen: rRegen.factor } },
    per_weapon: perWeapon,
    result: { dps, alpha, net_dps: net, time_to_kill_s: ttk, shots_to_kill: alpha > 0 ? Math.ceil(hp / alpha) : null, max_range: maxRange,
              armor_model: 'none', ttk_band: band, ranking_stable: orders.size === 1, by_armor_model: runs },
    capabilities: {
      armor: 'reported, not applied. The point estimate uses armor_model "none"; ttk_band spans the four candidate shapes in by_armor_model. None is verified against the game.',
      dps: 'per-target-class only — class_multiplier is resolved against the defender\'s entity_class. Never compare a class-free scalar.',
      unmodelled: ['projectile travel time', 'attack_priority / switch_target_interval', 'evade and disengage behaviour', 'accuracy and leading'],
      veterancy: `levels are a flat +${LEVEL_STEP} per level on ${LEVEL_STATS.join(', ')} (constant across all 27 units)`,
    },
    game_version: GAME_VERSION, game_build: GAME_BUILD,
    modifiers_applied: { attacker: aMods, defender: dMods },
  });
});
