// economyModel — resource-economy roll-up for a set of modules/units against a resource type.
// POST { modules: [{game_id,count}], units: [{game_id,count}], resource_id?: "RU.MET" }
// Model (stated, not hidden): extraction RU/s = Σ entity.extraction_rate × count × Resource.extraction_rate;
// refining RU/s = Σ entity.refining_rate × count × Resource.refining_rate; production RU/s = Σ resource_production × count;
// storage = Σ cargo_capacity × count (+ resource_capacity_bonus); energy = Σ production − Σ use.
// Wreck salvage: GameSetting.harvestable_remains_yield / constructable_remains_yield ranges are returned as-is.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'auth required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const svc = base44.asServiceRole.entities as Record<string, any>;
  const [modules, units, resources, settings] = await Promise.all([svc.Module.list('game_id', 1000), svc.Unit.list('game_id', 1000), svc.Resource.list('game_id', 50), svc.GameSetting.list('game_id', 5)]);
  const M = Object.fromEntries(modules.map((m: any) => [m.game_id, m])), U = Object.fromEntries(units.map((u: any) => [u.game_id, u]));
  const R = Object.fromEntries(resources.map((r: any) => [r.game_id, r]));
  const res = R[body.resource_id || 'RU.MET'] || R['RU.MET'] || { extraction_rate: 1, refining_rate: 1 };
  const gs = settings[0] || {};
  const lines: any[] = []; const unknown: string[] = [];
  const t = { extraction_rate_units: 0, extraction_ru_per_s: 0, refining_rate_units: 0, refining_ru_per_s: 0, production_ru_per_s: 0, cargo_capacity: 0, resource_capacity_bonus: 0,
              energy_production: 0, energy_use: 0, energy_net: 0, crew: 0, cost_resources: 0, count: 0 };
  const add = (e: any, kind: string, count: number) => {
    const c = Math.max(0, Math.floor(num(count) || 1));
    const l = { game_id: e.game_id, name: e.name, kind, count: c,
      extraction_rate: num(e.extraction_rate) * c, extraction_ru_per_s: num(e.extraction_rate) * c * num(res.extraction_rate),
      refining_rate: num(e.refining_rate) * c, refining_ru_per_s: num(e.refining_rate) * c * num(res.refining_rate),
      production_ru_per_s: num(e.resource_production) * c, cargo_capacity: num(e.cargo_capacity) * c, resource_capacity_bonus: num(e.resource_capacity_bonus) * c,
      energy_production: num(e.energy_production) * c, energy_use: num(e.energy_per_second) * c, crew: num(e.cost_population) * c, cost_resources: num(e.cost_resources) * c };
    lines.push(l);
    t.extraction_rate_units += l.extraction_rate; t.extraction_ru_per_s += l.extraction_ru_per_s; t.refining_rate_units += l.refining_rate; t.refining_ru_per_s += l.refining_ru_per_s;
    t.production_ru_per_s += l.production_ru_per_s; t.cargo_capacity += l.cargo_capacity; t.resource_capacity_bonus += l.resource_capacity_bonus;
    t.energy_production += l.energy_production; t.energy_use += l.energy_use; t.crew += l.crew; t.cost_resources += l.cost_resources; t.count += c;
  };
  for (const { game_id, count } of body.modules || []) M[game_id] ? add(M[game_id], 'Module', count) : unknown.push(game_id);
  for (const { game_id, count } of body.units || []) U[game_id] ? add(U[game_id], 'Unit', count) : unknown.push(game_id);
  t.energy_net = t.energy_production - t.energy_use;
  const gross = t.extraction_ru_per_s + t.production_ru_per_s;
  return Response.json({ resource: { game_id: res.game_id, name: res.name, extraction_rate: res.extraction_rate, refining_rate: res.refining_rate },
    totals: { ...t, gross_ru_per_s: gross, ru_per_minute: gross * 60, minutes_to_fill_storage: gross > 0 && t.cargo_capacity > 0 ? (t.cargo_capacity / gross) / 60 : null,
              payback_minutes: gross > 0 ? (t.cost_resources / gross) / 60 : null },
    lines, unknown,
    settings: { harvestable_remains_yield: gs.harvestable_remains_yield ?? null, constructable_remains_yield: gs.constructable_remains_yield ?? null,
                default_wreck_resource: gs.default_wreck_resource ?? null, collector_per_drop_points: gs.collector_per_drop_points ?? null, resources_amount: gs.resources_amount ?? null },
    model: 'extraction = Σ extraction_rate×count×Resource.extraction_rate; refining likewise; production = Σ resource_production; energy = production − use. Rates are the game\'s per-entity values; the in-game tick/collector cycle is not modelled.' });
});
