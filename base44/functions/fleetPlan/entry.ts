// fleetPlan — cost / capability roll-up for a set of modules and units.
// POST { modules: [{game_id, count}], units: [{game_id, count}] }
// See base44/GAME-DATA-CONTRACT.md §3 for the response shape.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

type Line = { game_id: string; count: number };
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'auth required' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const modReq: Line[] = Array.isArray(body.modules) ? body.modules : [];
  const unitReq: Line[] = Array.isArray(body.units) ? body.units : [];
  if (modReq.length + unitReq.length === 0) return Response.json({ error: 'modules[] and/or units[] required' }, { status: 400 });

  const svc = base44.asServiceRole.entities as Record<string, any>;
  const [modules, units, weapons, research] = await Promise.all([
    svc.Module.list('game_id', 1000), svc.Unit.list('game_id', 1000), svc.Weapon.list('game_id', 1000), svc.ResearchNode.list('game_id', 1000),
  ]);
  const byId = (rows: any[]) => Object.fromEntries(rows.map((r) => [r.game_id, r]));
  const M = byId(modules), U = byId(units), W = byId(weapons), R = byId(research);
  const weaponDps = (ids: string[] = []) => ids.reduce((a, id) => a + num(W[id]?.dps), 0);

  const totals: Record<string, number> = {
    cost_resources: 0, cost_population: 0, construction_time: 0, max_health: 0, mass: 0, energy_production: 0, energy_use: 0,
    energy_net: 0, dps: 0, cargo_capacity: 0, extraction_rate: 0, resource_production: 0, part_count: 0,
  };
  const lines: any[] = [];
  const unknown: string[] = [];
  const researchNeeded = new Set<string>();

  const add = (kind: 'Module' | 'Unit', r: any, count: number) => {
    const c = Math.max(0, Math.floor(num(count) || 1));
    const dps = weaponDps(r.weapons);
    const eUse = num(r.energy_per_second), eProd = num(r.energy_production);
    const line = {
      game_id: r.game_id, name: r.name, kind, count: c, tier: r.tier,
      cost_resources: num(r.cost_resources) * c, cost_population: num(r.cost_population) * c,
      construction_time: num(r.construction_time) * c, max_health: num(r.max_health) * c, mass: num(r.mass) * c,
      energy_production: eProd * c, energy_use: eUse * c, energy_net: (eProd - eUse) * c, dps: dps * c,
      cargo_capacity: num(r.cargo_capacity) * c, extraction_rate: num(r.extraction_rate) * c, resource_production: num(r.resource_production) * c,
    };
    lines.push(line);
    for (const k of Object.keys(totals)) if (k in line) totals[k] += (line as any)[k];
    totals.part_count += c;
    for (const rid of r.required_research || []) researchNeeded.add(rid);
  };
  for (const { game_id, count } of modReq) M[game_id] ? add('Module', M[game_id], count) : unknown.push(game_id);
  for (const { game_id, count } of unitReq) U[game_id] ? add('Unit', U[game_id], count) : unknown.push(game_id);

  // transitive research closure, ordered parents-first
  const ordered: any[] = []; const seen = new Set<string>();
  const visit = (id: string, depth = 0) => {
    if (seen.has(id) || !R[id] || depth > 64) return;
    seen.add(id);
    for (const p of R[id].required_nodes || []) visit(p, depth + 1);
    ordered.push(R[id]);
  };
  for (const id of researchNeeded) visit(id);
  const required_research = ordered.map((r) => ({ game_id: r.game_id, name: r.name, tier: r.tier, cost_resources: r.cost_resources, construction_time: r.construction_time }));

  return Response.json({ totals, lines, required_research, unknown });
});
