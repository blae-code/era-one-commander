// researchImpact — what a research node (or a chain of them) actually changes, resolved to concrete units/modules.
// POST { targets: ["R.U.FRS3"], have?: [...], cumulative?: true }
// Returns per node: modifiers, the concrete unit/module game_ids affected (class/type filters resolved), unlocks;
// and, with cumulative, the summed stat change per affected entity along the prerequisite chain.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'auth required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const targets: string[] = Array.isArray(body.targets) ? body.targets : body.target ? [body.target] : [];
  if (!targets.length) return Response.json({ error: 'targets[] required' }, { status: 400 });
  const have = new Set<string>(Array.isArray(body.have) ? body.have : []);
  const cumulative = body.cumulative !== false;

  const svc = base44.asServiceRole.entities as Record<string, any>;
  const [research, units, modules, weapons, turrets] = await Promise.all([
    svc.ResearchNode.list('game_id', 1000), svc.Unit.list('game_id', 1000), svc.Module.list('game_id', 1000), svc.Weapon.list('game_id', 1000), svc.Turret.list('game_id', 1000),
  ]);
  const R: Record<string, any> = Object.fromEntries(research.map((r: any) => [r.game_id, r]));
  const flags = (s: string | null | undefined) => new Set(String(s || '').split('|').filter(Boolean));

  const affected = (r: any) => {
    const uc = flags(r.unit_class_affected), ut = flags(r.units_affected), mc = flags(r.module_class_affected);
    const mt = new Set<string>(r.module_types_affected || []); const mst = r.module_sub_type_affected;
    const us = units.filter((u: any) => (uc.size && uc.has(u.unit_class)) || (ut.size && ut.has(u.unit_type))).map((u: any) => u.game_id);
    const ms = modules.filter((m: any) => (mc.size && mc.has(m.module_class)) || (mt.size && mt.has(m.module_type)) || (mst && m.module_sub_type === mst) || (r.modules_affected || []).includes(m.game_id)).map((m: any) => m.game_id);
    return { units: us, modules: ms };
  };

  const path: any[] = []; const seen = new Set<string>();
  const visit = (id: string, depth: number) => {
    if (seen.has(id) || have.has(id) || !R[id] || depth > 64) return;
    seen.add(id);
    for (const p of R[id].required_nodes || []) visit(p, depth + 1);
    const r = R[id]; const aff = affected(r);
    path.push({ game_id: r.game_id, name: r.name, research_type: r.research_type, tier: r.tier, depth,
                cost_resources: r.cost_resources, cost_energy: r.cost_energy, construction_time: r.construction_time,
                implementation_mode: r.implementation_mode, unit_class_affected: r.unit_class_affected, module_class_affected: r.module_class_affected,
                module_types_affected: r.module_types_affected, modifiers: r.modifiers || [], affected_units: aff.units, affected_modules: aff.modules,
                unlocks_modules: r.unlocks_modules || [], unlocks_units: r.unlocks_units || [], unlocks_weapons: r.unlocks_weapons || [], unlocks_turrets: r.unlocks_turrets || [] });
  };
  for (const t of targets) visit(t, 0);

  const totals = path.reduce((a, r) => ({ cost_resources: a.cost_resources + num(r.cost_resources), cost_energy: a.cost_energy + num(r.cost_energy), construction_time: a.construction_time + num(r.construction_time), nodes: a.nodes + 1 }),
                             { cost_resources: 0, cost_energy: 0, construction_time: 0, nodes: 0 });
  // cumulative stat change per entity: sum of Add/Subtract fractions per stat (Multiply/Set listed separately)
  const cumul: Record<string, Record<string, number>> = {};
  if (cumulative) for (const r of path) for (const m of r.modifiers) for (const id of [...r.affected_units, ...r.affected_modules]) {
    const e = (cumul[id] ||= {}); const sign = m.operation === 'Subtract' ? -1 : m.operation === 'Add' ? 1 : 0;
    if (sign) e[m.stat] = (e[m.stat] || 0) + sign * num(m.value); else e[`${m.stat}:${m.operation}`] = num(m.value);
  }
  const unlocked = { modules: [...new Set(path.flatMap((r) => r.unlocks_modules))], units: [...new Set(path.flatMap((r) => r.unlocks_units))], weapons: [...new Set(path.flatMap((r) => r.unlocks_weapons))], turrets: [...new Set(path.flatMap((r) => r.unlocks_turrets))] };
  return Response.json({ path, totals, cumulative_by_entity: cumul, unlocked, missing: targets.filter((t) => !R[t]) });
});
