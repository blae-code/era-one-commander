// researchPath — the ordered set of research nodes needed to reach the targets, minus what you have.
// POST { targets: ["R.U.FRS3"], have: ["R.U.E1"] }
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'auth required' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targets: string[] = Array.isArray(body.targets) ? body.targets : body.target ? [body.target] : [];
  const have = new Set<string>(Array.isArray(body.have) ? body.have : []);
  if (targets.length === 0) return Response.json({ error: 'targets[] required' }, { status: 400 });

  const rows = await (base44.asServiceRole.entities as Record<string, any>).ResearchNode.list('game_id', 1000);
  const R: Record<string, any> = Object.fromEntries(rows.map((r: any) => [r.game_id, r]));
  const missing = targets.filter((t) => !R[t]);

  const path: any[] = []; const seen = new Set<string>();
  const visit = (id: string, depth: number) => {
    if (seen.has(id) || have.has(id) || !R[id] || depth > 64) return;
    seen.add(id);
    for (const p of R[id].required_nodes || []) visit(p, depth + 1);
    const r = R[id];
    path.push({ game_id: r.game_id, name: r.name, research_type: r.research_type, tier: r.tier, cost_resources: r.cost_resources,
                cost_energy: r.cost_energy, construction_time: r.construction_time, depth });
  };
  for (const t of targets) visit(t, 0);
  const totals = path.reduce((a, r) => ({
    cost_resources: a.cost_resources + (r.cost_resources || 0), cost_energy: a.cost_energy + (r.cost_energy || 0),
    construction_time: a.construction_time + (r.construction_time || 0), nodes: a.nodes + 1,
  }), { cost_resources: 0, cost_energy: 0, construction_time: 0, nodes: 0 });

  return Response.json({ path, totals, missing });
});
