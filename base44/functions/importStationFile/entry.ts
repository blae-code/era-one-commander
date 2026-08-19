// importStationFile — decode an ERA ONE .station blueprint (Sirenix Odin binary) uploaded as base64.
// POST { file_base64: "...", name?: "My Ship", create?: false }
// → { name, era_one_version, parts[{index, guid, module_id, module_name, position, rotation, parent, connection}],
//     modules {id: count}, unresolved[], cost, construction_time, required_research, stats (same shape as blueprintStats totals) }
// With create:true the result is also stored as a GameBlueprint (source "player", id "player:<name>").
// Odin binary format: entry-type byte, UTF-16/8-bit strings (flag byte + int32 length), TypeName/TypeID table,
// reference/struct nodes, arrays, dictionaries as {$k,$v} struct pairs, internal $ref back-references.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const E = { NamedRef: 0x1, UnnamedRef: 0x2, NamedStruct: 0x3, UnnamedStruct: 0x4, EndOfNode: 0x5, StartOfArray: 0x6, EndOfArray: 0x7, PrimitiveArray: 0x8,
  NamedInternalRef: 0x9, UnnamedInternalRef: 0xA, NamedExtIdx: 0xB, UnnamedExtIdx: 0xC, NamedExtGuid: 0xD, UnnamedExtGuid: 0xE,
  NamedSByte: 0xF, UnnamedSByte: 0x10, NamedByte: 0x11, UnnamedByte: 0x12, NamedShort: 0x13, UnnamedShort: 0x14, NamedUShort: 0x15, UnnamedUShort: 0x16,
  NamedInt: 0x17, UnnamedInt: 0x18, NamedUInt: 0x19, UnnamedUInt: 0x1A, NamedLong: 0x1B, UnnamedLong: 0x1C, NamedULong: 0x1D, UnnamedULong: 0x1E,
  NamedFloat: 0x1F, UnnamedFloat: 0x20, NamedDouble: 0x21, UnnamedDouble: 0x22, NamedDecimal: 0x23, UnnamedDecimal: 0x24, NamedChar: 0x25, UnnamedChar: 0x26,
  NamedString: 0x27, UnnamedString: 0x28, NamedGuid: 0x29, UnnamedGuid: 0x2A, NamedBool: 0x2B, UnnamedBool: 0x2C, NamedNull: 0x2D, UnnamedNull: 0x2E,
  TypeName: 0x2F, TypeID: 0x30, EndOfStream: 0x31, NamedExtStr: 0x32, UnnamedExtStr: 0x33 };
const NAMED = new Set([1, 3, 9, 0xB, 0xD, 0xF, 0x11, 0x13, 0x15, 0x17, 0x19, 0x1B, 0x1D, 0x1F, 0x21, 0x23, 0x25, 0x27, 0x29, 0x2B, 0x2D, 0x32]);

class Reader {
  p = 0; types = new Map<number, string>(); refs = new Map<number, any>(); dv: DataView;
  constructor(public b: Uint8Array) { this.dv = new DataView(b.buffer, b.byteOffset, b.byteLength); }
  u8() { return this.b[this.p++]; }
  i32() { const v = this.dv.getInt32(this.p, true); this.p += 4; return v; }
  i64() { const v = this.dv.getBigInt64(this.p, true); this.p += 8; return Number(v); }
  f32() { const v = this.dv.getFloat32(this.p, true); this.p += 4; return v; }
  f64() { const v = this.dv.getFloat64(this.p, true); this.p += 8; return v; }
  str() { const flag = this.u8(); const n = this.i32(); let s = '';
    if (flag === 1) { for (let i = 0; i < n; i++) s += String.fromCharCode(this.dv.getUint16(this.p + 2 * i, true)); this.p += 2 * n; }
    else { for (let i = 0; i < n; i++) s += String.fromCharCode(this.b[this.p + i]); this.p += n; }
    return s; }
  type() { const t = this.u8();
    if (t === E.TypeName) { const id = this.i32(); const name = this.str(); this.types.set(id, name); return name; }
    if (t === E.TypeID) return this.types.get(this.i32()) ?? null;
    if (t === E.UnnamedNull) return null;
    throw new Error(`expected type at ${this.p - 1}, got ${t}`); }
  peek() { return this.p < this.b.length ? this.b[this.p] : E.EndOfStream; }
  entry(): [string | null, any] {
    const t = this.u8(); const named = NAMED.has(t); const name = named ? this.str() : null;
    const base = named ? t : t - 1; // Unnamed = Named + 1 for paired entries
    switch (t) {
      case E.NamedRef: case E.UnnamedRef: { const typ = this.type(); const rid = this.i32(); const node = this.body(typ); this.refs.set(rid, node); return [name, node]; }
      case E.NamedStruct: case E.UnnamedStruct: { const typ = this.type(); return [name, this.body(typ)]; }
      case E.StartOfArray: { this.i64(); const items: any[] = []; while (this.peek() !== E.EndOfArray) items.push(this.entry()[1]); this.p++; return [name, items]; }
      case E.PrimitiveArray: { const n = this.i32(), esz = this.i32(); this.p += n * esz; return [name, { $prim: n }]; }
      case E.NamedInternalRef: case E.UnnamedInternalRef: return [name, { $ref: this.i32() }];
      case E.NamedExtIdx: case E.UnnamedExtIdx: return [name, { $ext: this.i32() }];
      case E.NamedExtGuid: case E.UnnamedExtGuid: this.p += 16; return [name, { $extguid: true }];
      case E.NamedExtStr: case E.UnnamedExtStr: return [name, { $extstr: this.str() }];
      case E.NamedSByte: case E.UnnamedSByte: return [name, this.dv.getInt8(this.p++)];
      case E.NamedByte: case E.UnnamedByte: return [name, this.u8()];
      case E.NamedShort: case E.UnnamedShort: { const v = this.dv.getInt16(this.p, true); this.p += 2; return [name, v]; }
      case E.NamedUShort: case E.UnnamedUShort: { const v = this.dv.getUint16(this.p, true); this.p += 2; return [name, v]; }
      case E.NamedInt: case E.UnnamedInt: return [name, this.i32()];
      case E.NamedUInt: case E.UnnamedUInt: { const v = this.dv.getUint32(this.p, true); this.p += 4; return [name, v]; }
      case E.NamedLong: case E.UnnamedLong: return [name, this.i64()];
      case E.NamedULong: case E.UnnamedULong: { const v = this.dv.getBigUint64(this.p, true); this.p += 8; return [name, Number(v)]; }
      case E.NamedFloat: case E.UnnamedFloat: return [name, this.f32()];
      case E.NamedDouble: case E.UnnamedDouble: return [name, this.f64()];
      case E.NamedDecimal: case E.UnnamedDecimal: this.p += 16; return [name, null];
      case E.NamedChar: case E.UnnamedChar: { const v = this.dv.getUint16(this.p, true); this.p += 2; return [name, String.fromCharCode(v)]; }
      case E.NamedString: case E.UnnamedString: return [name, this.str()];
      case E.NamedGuid: case E.UnnamedGuid: this.p += 16; return [name, null];
      case E.NamedBool: case E.UnnamedBool: return [name, this.u8() === 1];
      case E.NamedNull: case E.UnnamedNull: return [name, null];
      default: throw new Error(`unexpected entry ${t} at ${this.p - 1} (base ${base})`);
    }
  }
  body(typ: string | null) {
    const f: Record<string, any> = typ ? { $type: typ } : {}; let i = 0;
    while (this.peek() !== E.EndOfNode && this.peek() !== E.EndOfStream) { const [n, v] = this.entry(); f[n ?? `_${i++}`] = v; }
    if (this.peek() === E.EndOfNode) this.p++;
    // collapse dictionaries {$k,$v} and Fix64
    if (typ && (typ.startsWith('System.Collections.Generic.Dictionary`2') || typ.startsWith('EraOne.Core.SerializableDictionary'))) {
      const arr = Object.values(f).find((v) => Array.isArray(v)) as any[] | undefined; const items: Record<string, any> = {};
      for (const e of arr || []) if (e && typeof e === 'object' && '$k' in e) items[String(e.$k)] = e.$v;
      return { $dict: true, items };
    }
    if (typ && typ.startsWith('EraOne.Core.Libraries.FixMathNET.Fix64') && typeof f.rawValue === 'number') return f.rawValue / 4294967296;
    if (typ && (typ.startsWith('System.Collections.Generic.List`1') || typ.startsWith('System.Collections.Generic.HashSet`1'))) { const arr = Object.values(f).find((v) => Array.isArray(v)); if (arr) return arr; }
    return f;
  }
  resolve(v: any, d = 0): any {
    if (d > 64) return v;
    if (Array.isArray(v)) return v.map((x) => this.resolve(x, d + 1));
    if (v && typeof v === 'object') {
      if ('$ref' in v && Object.keys(v).length === 1) { const t = this.refs.get(v.$ref); return t === undefined ? v : this.resolve(t, d + 1); }
      const o: any = {}; for (const [k, x] of Object.entries(v)) o[k] = this.resolve(x, d + 1); return o;
    }
    return v;
  }
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'auth required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!body.file_base64) return Response.json({ error: 'file_base64 required' }, { status: 400 });
  let bp: any;
  try {
    const bin = Uint8Array.from(atob(String(body.file_base64).replace(/^data:[^,]*,/, '')), (c) => c.charCodeAt(0));
    const r = new Reader(bin); const [, root] = r.entry(); bp = r.resolve(root);
  } catch (e) { return Response.json({ error: `not a valid .station file: ${(e as Error).message}` }, { status: 400 }); }
  if (!bp || !String(bp.$type || '').includes('StationBlueprint')) return Response.json({ error: 'file is not a StationBlueprint' }, { status: 400 });

  const svc = base44.asServiceRole.entities as Record<string, any>;
  const modules = await svc.Module.list('game_id', 1000);
  const byGuid: Record<string, any> = Object.fromEntries(modules.filter((m: any) => m.prefab_guid).map((m: any) => [m.prefab_guid, m]));
  const vec = (v: any) => (v && typeof v === 'object' ? [v._0, v._1, v._2, v._3].filter((x) => x !== undefined) : null);
  const partsRaw: any[] = Array.isArray(bp.parts) ? bp.parts : [];
  const positions = Array.isArray(bp.positions) ? bp.positions : []; const rotations = Array.isArray(bp.rotations) ? bp.rotations : [];
  const links: Record<string, any> = (bp.linkIDs && bp.linkIDs.items) || {};
  const parts = partsRaw.map((p: any, i: number) => {
    const guid = p && typeof p === 'object' ? p.m_AssetGUID : null; const m = guid ? byGuid[guid] : null; const link = links[String(i)];
    return { index: i, guid, module_id: m?.game_id ?? null, module_name: m?.name ?? null, position: vec(positions[i]), rotation: vec(rotations[i]),
             parent: link ? link.m_Item1 : null, connection: link ? link.m_Item2 : null };
  });
  const counts: Record<string, number> = {}; for (const p of parts) if (p.module_id) counts[p.module_id] = (counts[p.module_id] || 0) + 1;
  const unresolved = parts.filter((p) => !p.module_id).map((p) => p.guid);
  const cost = bp.cost && typeof bp.cost === 'object' ? { resources: bp.cost.Resources, population: bp.cost.Population, energy: bp.cost.Energy, research: bp.cost.Research } : null;
  const M: Record<string, any> = Object.fromEntries(modules.map((m: any) => [m.game_id, m]));
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  // Per-target-class DPS only — a class-free sum ranks an anti-mine platform above a cruiser.
  const CLASSES = ['FighterUnit','CorvetteUnit','FrigateUnit','UtilityUnit','PlatformUnit','MineUnit','CommandModule','StructuralModule','WeaponModule','FacilityModule','UtilityModule','Station','Wreckage'];
  const stats = { parts: parts.length, cost_resources: 0, cost_population: 0, construction_time: 0, max_health: 0, mass: 0, energy_production: 0, energy_use: 0,
    dps_vs_class: Object.fromEntries(CLASSES.map((c) => [c, 0])) as Record<string, number> };
  for (const [id, n] of Object.entries(counts)) { const m = M[id]; if (!m) continue;
    stats.cost_resources += num(m.cost_resources) * n; stats.cost_population += num(m.cost_population) * n; stats.construction_time += num(m.construction_time) * n;
    stats.max_health += num(m.max_health) * n; stats.mass += num(m.mass) * n; stats.energy_production += num(m.energy_production) * n; stats.energy_use += num(m.energy_per_second) * n;
    for (const cl of CLASSES) stats.dps_vs_class[cl] += num(m.dps_vs_class?.[cl]) * n; }
  const name = body.name || bp.name || 'Imported blueprint';
  const out: any = { name, era_one_version: bp.eraOneVersion ?? null, root_part: bp.rootPart ?? null, command_part: bp.commandPart ?? null, used_by_ai: bp.usedByAI ?? null,
    parts, modules: counts, unresolved, cost, construction_time: bp.constructionTime ?? null, required_research: Array.isArray(bp.requiredResearch) ? bp.requiredResearch : [], stats };
  if (body.create) {
    // Writes to PlayerDesign, NOT GameBlueprint. GameBlueprint is in importGameData's KEYED set and its
    // expected id list is baked into the generated gameDataStatus, so a `player:` id there is reported as
    // `extra` and reds the health check permanently. User data never enters the generated manifest.
    const rec = { game_id: `player:${name}`, name, source_file: body.source_file || `${name}.station`,
      file_mtime: body.file_mtime ?? null, part_count: parts.length, unresolved_parts: unresolved.length,
      cost_resources: cost?.resources ?? null, cost_population: cost?.population ?? null, construction_time: bp.constructionTime ?? null,
      required_research: out.required_research, modules: counts, sum_module_cost_resources: stats.cost_resources, sum_module_cost_population: stats.cost_population,
      sum_module_max_health: stats.max_health, dps_vs_class: stats.dps_vs_class,
      weapon_modules: Object.keys(counts).filter((id) => M[id]?.module_class === 'Weapon'), parts,
      root_part: bp.rootPart ?? null, command_part: bp.commandPart ?? null, era_one_version: bp.eraOneVersion ?? null,
      game_version: modules[0]?.game_version ?? null, game_build: modules[0]?.game_build ?? null, imported_utc: new Date().toISOString() };
    const existing = await svc.PlayerDesign.filter({ game_id: rec.game_id }, 'game_id', 1);
    out.record = existing[0] ? await svc.PlayerDesign.update(existing[0].id, rec) : await svc.PlayerDesign.create(rec);
  }
  return Response.json(out);
});
