// scoreEstimate — decompose an entity's score against GameSetting.score_calculation_weights.
// POST { game_ids: ["TUR.002","CMX_FRI3"] } → per entity: the game's own `score`, and each weight × the matching
// observable value (tier, cost_resources, cost_population, construction_time, max_health, armor, dps_total, range…) so
// the UI can show what drives score. The exact combination formula is not in the extracted data — components are
// reported side by side with the actual score, not summed into a claim.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'auth required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.game_ids) ? body.game_ids : body.game_id ? [body.game_id] : [];
  if (!ids.length) return Response.json({ error: 'game_ids[] required' }, { status: 400 });
  const svc = base44.asServiceRole.entities as Record<string, any>;
  const [modules, units, weapons, weights] = await Promise.all([svc.Module.list('game_id', 1000), svc.Unit.list('game_id', 1000), svc.Weapon.list('game_id', 1000), svc.ScoreWeight.list('game_id', 100)]);
  const E: Record<string, any> = Object.fromEntries([...modules, ...units].map((e: any) => [e.game_id, e]));
  const W: Record<string, number> = Object.fromEntries(weights.map((w: any) => [w.game_id, num(w.weight)]));
  const WD = Object.fromEntries(weapons.map((w: any) => [w.game_id, w]));
  const out = ids.map((id) => {
    const e = E[id]; if (!e) return { game_id: id, error: 'unknown' };
    const range = Math.max(0, ...(e.weapons || []).map((w: string) => num(WD[w]?.range)));
    const comps = {
      TierWeight: { value: num(e.tier), weight: W.TierWeight ?? null },
      ResourceCostWeight: { value: num(e.cost_resources), weight: W.ResourceCostWeight ?? null },
      PopulationCostWeight: { value: num(e.cost_population), weight: W.PopulationCostWeight ?? null },
      ConstructionTimeWeight: { value: num(e.construction_time), weight: W.ConstructionTimeWeight ?? null },
      HealthWeight: { value: num(e.max_health), weight: W.HealthWeight ?? null },
      ArmorWeight: { value: num(e.armor), weight: W.ArmorWeight ?? null },
      ArmamentWeight: { value: num(e.dps_total), weight: W.ArmamentWeight ?? null },
      AttackRangeWeight: { value: range, weight: W.AttackRangeWeight ?? null },
      CloakWeight: { value: num(e.cloak_strength), weight: W.CloakWeight ?? null },
      DetectionRangeWeight: { value: Math.max(num(e.visual_range), num(e.sensors_range)), weight: W.DetectionRangeWeight ?? null },
      SensorStrengthWeight: { value: num(e.sensors_strength), weight: W.SensorStrengthWeight ?? null },
      EnergyProductionWeight: { value: num(e.energy_production), weight: W.EnergyProductionWeight ?? null },
    };
    const contributions = Object.fromEntries(Object.entries(comps).map(([k, c]) => [k, c.weight === null ? null : c.value * c.weight]));
    return { game_id: id, name: e.name, kind: e.unit_class ? 'Unit' : 'Module', score: e.score, components: comps, contributions,
             normalization: W.ScoreNormalization ?? null };
  });
  return Response.json({ entities: out, weights: W, note: 'components are weight × observable value; the game\'s combination formula is not extracted — compare with `score`' });
});
