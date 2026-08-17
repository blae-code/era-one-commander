// unitLoadout — valid equipment fits for a configurable ship and the resulting numbers.
// POST { unit_id: "CMX_FRI3", primary?: "TURT.016", secondary?: "TURT.015", tertiary?: "...", enumerate?: true }
// Returns the fixed armament, the slot options, the chosen (or default) fit with totals, and — with enumerate —
// every combination of primary × secondary options with dps/cost so the UI can rank fits.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const CLASSES = ['FighterUnit','CorvetteUnit','FrigateUnit','UtilityUnit','PlatformUnit','MineUnit','CommandModule','StructuralModule','WeaponModule','FacilityModule','UtilityModule','Station','Wreckage'];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'auth required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!body.unit_id) return Response.json({ error: 'unit_id required' }, { status: 400 });

  const svc = base44.asServiceRole.entities as Record<string, any>;
  const [units, turrets, weapons, subs] = await Promise.all([
    svc.Unit.filter({ game_id: body.unit_id }, 'game_id', 1), svc.Turret.list('game_id', 1000), svc.Weapon.list('game_id', 1000), svc.Subsystem.list('game_id', 100),
  ]);
  const unit = units[0];
  if (!unit) return Response.json({ error: `unknown unit ${body.unit_id}` }, { status: 404 });
  const W: Record<string, any> = Object.fromEntries(weapons.map((w: any) => [w.game_id, w]));
  const EQ: Record<string, any> = Object.fromEntries([...turrets, ...weapons, ...subs].map((e: any) => [e.game_id, e]));

  // an equippable's own contribution: turret -> its weapons; weapon -> itself; subsystem -> stub
  const equipStats = (id: string | null | undefined) => {
    const e = id ? EQ[id] : null;
    if (!e) return null;
    const wids: string[] = Array.isArray(e.weapons) && e.weapons.length ? e.weapons : (W[id!] ? [id!] : []);
    const dps = wids.reduce((a, w) => a + num(W[w]?.dps), 0);
    const dpsVs: Record<string, number> = {};
    for (const c of CLASSES) dpsVs[c] = wids.reduce((a, w) => a + num(W[w]?.dps) * (W[w]?.class_damage_multipliers?.find((m: any) => m.entity_class === c)?.multiplier ?? 1), 0);
    const range = Math.max(0, ...wids.map((w) => num(W[w]?.range)));
    return { game_id: id, name: e.name, kind: W[id!] ? 'Weapon' : (e.weapons_count !== undefined ? 'Turret' : 'Subsystem'),
             weapons: wids, dps, dps_vs_class: dpsVs, range, cost_resources: num(e.cost_resources), construction_time: num(e.construction_time),
             required_research: e.required_research || [] };
  };

  const slots = {
    primary:   { count: num(unit.hardpoints?.primary),   default: unit.primary_equip || null,   options: [...new Set([unit.primary_equip, ...(unit.primary_equip_options || [])].filter(Boolean))] },
    secondary: { count: num(unit.hardpoints?.secondary), default: unit.secondary_equip || null, options: [...new Set([unit.secondary_equip, ...(unit.secondary_equip_options || [])].filter(Boolean))] },
    tertiary:  { count: num(unit.hardpoints?.tertiary),  default: unit.tertiary_equip || null,  options: [...new Set([unit.tertiary_equip].filter(Boolean))] },
  };
  const fixedDps = (unit.weapons || []).reduce((a: number, w: string) => a + num(W[w]?.dps), 0);
  const fixed = { weapons: unit.weapons || [], dps: fixedDps };

  const fit = (choice: Record<string, string | null>) => {
    const lines: any[] = []; const errors: string[] = [];
    let dps = fixedDps, cost = num(unit.cost_resources), time = num(unit.construction_time);
    const dpsVs: Record<string, number> = {}; for (const c of CLASSES) dpsVs[c] = (unit.weapons || []).reduce((a: number, w: string) => a + num(W[w]?.dps) * (W[w]?.class_damage_multipliers?.find((m: any) => m.entity_class === c)?.multiplier ?? 1), 0);
    const research = new Set<string>(unit.required_research || []);
    for (const [slot, def] of Object.entries(slots)) {
      const id = choice[slot] ?? def.default;
      if (!id) continue;
      if (def.options.length && !def.options.includes(id)) errors.push(`${id} is not a valid ${slot} option for ${unit.game_id}`);
      const st = equipStats(id); if (!st) { errors.push(`unknown equipment ${id}`); continue; }
      const n = Math.max(1, def.count);
      lines.push({ slot, count: n, ...st, dps_total: st.dps * n, cost_total: st.cost_resources * n });
      dps += st.dps * n; cost += st.cost_resources * n; time += st.construction_time * n;
      for (const c of CLASSES) dpsVs[c] += st.dps_vs_class[c] * n;
      for (const r of st.required_research) research.add(r);
    }
    return { choice: Object.fromEntries(Object.entries(slots).map(([s, d]) => [s, choice[s] ?? d.default])), lines, errors,
             totals: { dps, dps_vs_class: dpsVs, cost_resources: cost, construction_time: time, max_health: unit.max_health, armor: unit.armor, max_speed: unit.max_speed },
             required_research: [...research] };
  };

  const chosen = fit({ primary: body.primary ?? null, secondary: body.secondary ?? null, tertiary: body.tertiary ?? null });
  const out: any = { unit: { game_id: unit.game_id, name: unit.name, unit_class: unit.unit_class, tier: unit.tier, cost_resources: unit.cost_resources, max_health: unit.max_health, armor: unit.armor, max_speed: unit.max_speed },
                     fixed, slots: Object.fromEntries(Object.entries(slots).map(([k, v]) => [k, { ...v, options: v.options.map(equipStats).filter(Boolean) }])), fit: chosen };
  if (body.enumerate) {
    const P = slots.primary.options.length ? slots.primary.options : [null];
    const S = slots.secondary.options.length ? slots.secondary.options : [null];
    out.fits = [];
    for (const p of P) for (const s of S) { const f = fit({ primary: p, secondary: s, tertiary: null }); out.fits.push({ primary: p, secondary: s, dps: f.totals.dps, cost_resources: f.totals.cost_resources, dps_vs_class: f.totals.dps_vs_class }); }
    out.fits.sort((a: any, b: any) => b.dps - a.dps);
  }
  return Response.json(out);
});
