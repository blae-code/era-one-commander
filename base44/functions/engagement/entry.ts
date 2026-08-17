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
const factor = (st: ReturnType<typeof stack>, stat: string) => st[stat] ? (st[stat].set ?? ((1 + st[stat].add) * st[stat].mul)) : 1;
const absAdd = (st: ReturnType<typeof stack>, stat: string) => st[stat]?.abs_add ?? 0;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'auth required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const A = body.attacker || {}, D = body.defender || {};
  if (!A.game_id || !D.game_id) return Response.json({ error: 'attacker.game_id and defender.game_id required' }, { status: 400 });

  const svc = base44.asServiceRole.entities as Record<string, any>;
  const [units, modules, weapons, turrets, combat, formations, levels] = await Promise.all([
    svc.Unit.list('game_id', 1000), svc.Module.list('game_id', 1000), svc.Weapon.list('game_id', 1000), svc.Turret.list('game_id', 1000),
    svc.CombatTemplate.list('game_id', 100), svc.FormationModifier.list('game_id', 100), svc.UnitLevel.list('game_id', 5000),
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
    if (x.level && U[e.game_id]) for (const lv of levels.filter((l: any) => l.unit_id === e.game_id && l.level <= x.level)) out.push({ stat: lv.stat, operation: lv.operation, value: lv.value, abs: lv.abs, source: `level ${lv.level}` } as any);
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
  const hp = num(d.max_health) * factor(dMods, 'MaxHealth') + absAdd(dMods, 'MaxHealth');
  const armor = num(d.armor) * factor(dMods, 'Armor') + absAdd(dMods, 'Armor');
  const regen = num(d.health_regen) * factor(dMods, 'HealthRegenerationRate');
  const net = dps - regen;
  const ttk = net > 0 ? hp / net : null;
  const maxRange = Math.max(0, ...perWeapon.map((w) => w.range));

  return Response.json({
    attacker: { game_id: a.game_id, name: a.name, kind: U[a.game_id] ? 'Unit' : 'Module', entity_class: classOf(a), weapons: wids, level: A.level ?? null, stance: A.stance ?? null, style: A.style ?? null, formation: A.formation ?? null,
                factors: { weapon_damage: fDmg, weapon_rate: fRate, attack_range: fRange } },
    defender: { game_id: d.game_id, name: d.name, kind: U[d.game_id] ? 'Unit' : 'Module', entity_class: dcls, max_health: hp, armor, health_regen: regen, level: D.level ?? null,
                factors: { max_health: factor(dMods, 'MaxHealth'), armor: factor(dMods, 'Armor'), health_regen: factor(dMods, 'HealthRegenerationRate') } },
    per_weapon: perWeapon,
    result: { dps, alpha, net_dps: net, time_to_kill_s: ttk, shots_to_kill: alpha > 0 ? Math.ceil(hp / alpha) : null, max_range: maxRange,
              armor_model: 'not_applied — armor and armor_penetration are reported; the game formula is not in the extracted data' },
    modifiers_applied: { attacker: aMods, defender: dMods },
  });
});
