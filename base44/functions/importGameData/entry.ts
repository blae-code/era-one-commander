// Server-side import for the Era One companion app.
// POST { entity: "Module", records: [...], mode?: "upsert" | "replace", game_build?: "24615926" }
// Upserts by `game_id` (or replaces all rows for `replace`), in chunks, as service role.
// Restrict to admins: this function should only be callable by an authenticated admin user.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const KEYED = new Set(['Module', 'Weapon', 'Turret', 'Subsystem', 'Unit', 'ResearchNode', 'Resource', 'Station', 'GameBlueprint']);
const CHUNK = 100;
const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user || user.role !== 'admin') return Response.json({ error: 'admin only' }, { status: 403 });

  const { entity, records, mode = 'upsert' } = await req.json();
  if (!entity || !Array.isArray(records)) return Response.json({ error: 'entity + records[] required' }, { status: 400 });
  const api = (base44.asServiceRole.entities as Record<string, any>)[entity];
  if (!api) return Response.json({ error: `unknown entity ${entity}` }, { status: 400 });

  let created = 0, updated = 0, deleted = 0;
  if (mode === 'replace' || !KEYED.has(entity)) {
    const existing = await api.list('-created_date', 5000);
    for (const e of existing) { await api.delete(e.id); deleted++; }
    for (const c of chunk(records, CHUNK)) { await api.bulkCreate(c); created += c.length; }
  } else {
    const existing = await api.list('game_id', 5000);
    const byKey = new Map(existing.map((r: any) => [r.game_id, r]));
    const toCreate: any[] = [];
    for (const r of records) {
      const cur = byKey.get(r.game_id);
      if (!cur) toCreate.push(r);
      else { await api.update(cur.id, r); updated++; }
    }
    for (const c of chunk(toCreate, CHUNK)) { await api.bulkCreate(c); created += c.length; }
  }
  return Response.json({ entity, created, updated, deleted });
});
