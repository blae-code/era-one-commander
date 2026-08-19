// blueprintStats — totals for an arbitrary set of module parts (a design in progress or an imported .station).
// POST { modules: {"TUR.002": 4, "BSM.001": 10} }  or  { parts: [{module_id, count?}] }  or  { blueprint_id: "shipped:Defender" }
// → cost/crew/build time/hp/mass/energy/dps/dps_vs_class/cargo/capacity bonuses, per-class counts, weapons list,
//   transitive research closure, attachment warnings (hardpoint-requiring turrets vs hardpoints present, command module count).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const CLASSES = ['FighterUnit','CorvetteUnit','FrigateUnit','UtilityUnit','PlatformUnit','MineUnit','CommandModule','StructuralModule','WeaponModule','FacilityModule','UtilityModule','Station','Wreckage'];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'auth required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const svc = base44.asServiceRole.entities as Record<string, any>;
  const [modules, research] = await Promise.all([svc.Module.list('game_id', 1000), svc.ResearchNode.list('game_id', 1000)]);
  const M: Record<string, any> = Object.fromEntries(modules.map((m: any) => [m.game_id, m]));
  const R: Record<string, any> = Object.fromEntries(research.map((r: any) => [r.game_id, r]));

  let counts: Record<string, number> = {};
  if (body.blueprint_id) {
    const bp = (await svc.GameBlueprint.filter({ game_id: body.blueprint_id }, 'game_id', 1))[0];
    if (!bp) return Response.json({ error: `unknown blueprint ${body.blueprint_id}` }, { status: 404 });
    counts = { ...(bp.modules || {}) };
  } else if (body.modules && typeof body.modules === 'object' && !Array.isArray(body.modules)) counts = { ...body.modules };
  else for (const p of body.parts || []) counts[p.module_id] = (counts[p.module_id] || 0) + Math.max(1, num(p.count) || 1);
  if (!Object.keys(counts).length) return Response.json({ error: 'modules{}, parts[] or blueprint_id required' }, { status: 400 });

  // NOTE: no class-free `dps` total. Summing Module.dps_total made `shipped:Anti Missile Platform`
  // read 716.8 DPS at 6,900 RU and out-rank a Cruiser, when its real dps_vs_class is 71.7 against every
  // class except MineUnit. Comparative DPS resolves through dps_vs_class against a NAMED class only.
  const t: Record<string, number> = { parts: 0, cost_resources: 0, cost_population: 0, construction_time: 0, max_health: 0, mass: 0, energy_production: 0, energy_use: 0, energy_net: 0,
    cargo_capacity: 0, resource_capacity_bonus: 0, energy_capacity_bonus: 0, population_capacity_bonus: 0, research_capacity_bonus: 0, extraction_rate: 0, resource_production: 0 };
  const dpsVs: Record<string, number> = Object.fromEntries(CLASSES.map((c) => [c, 0]));
  const lines: any[] = []; const unknown: string[] = []; const byClass: Record<string, number> = {}; const byType: Record<string, number> = {}; const weapons: string[] = [];
  const research_needed = new Set<string>(); let hardpointsProvided = 0, hardpointsRequired = 0, commandModules = 0;
  for (const [id, n] of Object.entries(counts)) {
    const m = M[id]; const c = Math.max(0, Math.floor(num(n)));
    if (!m) { unknown.push(id); continue; }
    const l = { game_id: id, name: m.name, module_class: m.module_class, module_type: m.module_type, count: c, cost_resources: num(m.cost_resources) * c, cost_population: num(m.cost_population) * c,
      construction_time: num(m.construction_time) * c, max_health: num(m.max_health) * c, mass: num(m.mass) * c, energy_production: num(m.energy_production) * c, energy_use: num(m.energy_per_second) * c,
      cargo_capacity: num(m.cargo_capacity) * c, extraction_rate: num(m.extraction_rate) * c, resource_production: num(m.resource_production) * c };
    lines.push(l);
    for (const k of Object.keys(t)) if (k in l) t[k] += (l as any)[k];
    t.parts += c; t.resource_capacity_bonus += num(m.resource_capacity_bonus) * c; t.energy_capacity_bonus += num(m.energy_capacity_bonus) * c;
    t.population_capacity_bonus += num(m.population_capacity_bonus) * c; t.research_capacity_bonus += num(m.research_capacity_bonus) * c;
    for (const cl of CLASSES) dpsVs[cl] += num(m.dps_vs_class?.[cl]) * c;
    byClass[m.module_class] = (byClass[m.module_class] || 0) + c; byType[m.module_type] = (byType[m.module_type] || 0) + c;
    for (let i = 0; i < c; i++) weapons.push(...(m.weapons || []));
    for (const r of m.required_research || []) research_needed.add(r);
    if (m.module_type === 'WeaponHardpoint' || m.module_type === 'HardpointHeavy') hardpointsProvided += c;
    if (m.perfect_attachment_requires === 'WeaponHardpoint' || m.perfect_attachment_requires === 'HardpointHeavy') hardpointsRequired += c;
    if (m.is_command) commandModules += c;
  }
  t.energy_net = t.energy_production - t.energy_use;
  const ordered: any[] = []; const seen = new Set<string>();
  const visit = (id: string, d = 0) => { if (seen.has(id) || !R[id] || d > 64) return; seen.add(id); for (const p of R[id].required_nodes || []) visit(p, d + 1); ordered.push(R[id]); };
  for (const id of research_needed) visit(id);
  const warnings: string[] = [];
  if (commandModules === 0) warnings.push('no command module (is_command) in the design');
  if (commandModules > 1) warnings.push(`${commandModules} command modules`);
  if (hardpointsRequired > hardpointsProvided) warnings.push(`${hardpointsRequired} turrets want a hardpoint for their perfect-attachment bonus but only ${hardpointsProvided} hardpoint modules are present`);
  if (t.energy_net < 0) warnings.push(`energy deficit ${t.energy_net.toFixed(1)}/s`);
  return Response.json({ totals: { ...t, dps_vs_class: dpsVs }, by_class: byClass, by_type: byType, weapons: weapons.sort(), lines, unknown, warnings,
    required_research: ordered.map((r) => ({ game_id: r.game_id, name: r.name, tier: r.tier, cost_resources: r.cost_resources, construction_time: r.construction_time })),
    research_totals: ordered.reduce((a, r) => ({ cost_resources: a.cost_resources + num(r.cost_resources), construction_time: a.construction_time + num(r.construction_time), nodes: a.nodes + 1 }), { cost_resources: 0, construction_time: 0, nodes: 0 }) });
});
