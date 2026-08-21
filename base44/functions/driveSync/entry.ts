import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Design Exchange: shares PlayerDesign rows (real, hand-authored entity where .station imports land)
// as JSON files in a Google Drive folder. Matches by game_id ('player:<name>'), NEVER by name and
// NEVER against GameBlueprint or any generated entity — user data must not enter the generated
// manifest or gameDataStatus goes red (see base44/entities/PlayerDesign.jsonc header).
const FOLDER_NAME = 'ERA ONE Designs';
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

// Base44 platform fields that must not travel: they are instance-local and not stable across apps/imports.
const INTERNAL_FIELDS = new Set(['id', '_id', 'created_date', 'updated_date', 'created_by', 'created_by_id', 'app_id', 'is_sample']);
const shareRow = (row: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(row).filter(([k]) => !INTERNAL_FIELDS.has(k)));

const fileName = (name: unknown) => `${String(name || 'design').replace(/[\\/:*?"<>|]/g, '-')}.eraone.json`;

// Timestamp for freshness comparison: prefer imported_utc (set on every import), fall back to file_mtime.
const rowTime = (r: Record<string, unknown> | null | undefined): number | null => {
  const t = Date.parse(String(r?.imported_utc || r?.file_mtime || ''));
  return Number.isFinite(t) ? t : null;
};

async function gd(url: string, accessToken: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${accessToken}`, ...(init.headers || {}) } });
  if (!res.ok) throw new Error(`Drive ${res.status}: ${await res.text()}`);
  return res;
}

async function ensureFolder(accessToken: string) {
  const q = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`);
  const found = await (await gd(`${API}/files?q=${q}&fields=files(id,name)`, accessToken)).json();
  if (found.files?.length) return found.files[0].id;
  const created = await (await gd(`${API}/files?fields=id`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  })).json();
  return created.id;
}

async function listFolder(accessToken: string, folderId: string) {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const out = await (await gd(`${API}/files?q=${q}&fields=files(id,name,modifiedTime,size)&orderBy=name`, accessToken)).json();
  return out.files || [];
}

async function uploadJson(accessToken: string, folderId: string, name: string, payload: unknown, existingId?: string) {
  const boundary = 'era1' + Math.random().toString(36).slice(2);
  const meta = existingId ? { name } : { name, parents: [folderId] };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(payload, null, 2)}\r\n--${boundary}--`;
  const url = existingId ? `${UPLOAD}/${existingId}?uploadType=multipart&fields=id,name` : `${UPLOAD}?uploadType=multipart&fields=id,name`;
  return (await gd(url, accessToken, { method: existingId ? 'PATCH' : 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body })).json();
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action = 'list', design_ids = [], file_ids = [] } = await req.json().catch(() => ({}));
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const folderId = await ensureFolder(accessToken);
    // PlayerDesign rows are written via asServiceRole by importStationFile; read/write them the same way.
    const designs = (base44.asServiceRole.entities as Record<string, any>).PlayerDesign;

    if (action === 'list') {
      const files = await listFolder(accessToken, folderId);
      return Response.json({ folder_id: folderId, folder_name: FOLDER_NAME, files });
    }

    if (action === 'push') {
      const all = await designs.list('-created_date', 200);
      const wanted = Array.isArray(design_ids) ? design_ids : [];
      const targets = wanted.length ? all.filter((d: any) => wanted.includes(d.game_id)) : all;
      if (targets.length > 50) return Response.json({ error: 'Too many designs in one push (max 50)' }, { status: 400 });
      const existing = await listFolder(accessToken, folderId);
      const pushed: string[] = [];
      for (const row of targets) {
        if (!row.game_id) continue;
        const name = fileName(row.name || row.game_id);
        const payload = { format: 'era-one-design', version: 2, exported_at: new Date().toISOString(), design: shareRow(row) };
        const hit = existing.find((f: any) => f.name === name);
        const saved = await uploadJson(accessToken, folderId, name, payload, hit?.id);
        pushed.push(saved.name);
      }
      return Response.json({ pushed, count: pushed.length });
    }

    if (action === 'pull') {
      const wanted = Array.isArray(file_ids) ? file_ids : [];
      const files = (await listFolder(accessToken, folderId)).filter((f: any) => (wanted.length ? wanted.includes(f.id) : f.name.endsWith('.eraone.json')));
      if (files.length > 50) return Response.json({ error: 'Too many files in one pull (max 50)' }, { status: 400 });
      const created: string[] = [];
      const updated: string[] = [];
      const skipped: string[] = [];
      for (const f of files) {
        const raw = await (await gd(`${API}/files/${f.id}?alt=media`, accessToken)).text();
        let doc: any;
        try { doc = JSON.parse(raw); } catch { skipped.push(f.name); continue; }
        const design = doc?.design;
        // Only PlayerDesign payloads travel; anything else (including legacy v1 'blueprint' files) is skipped.
        if (!design || typeof design !== 'object' || !design.game_id || !design.name || !String(design.game_id).startsWith('player:')) {
          skipped.push(f.name);
          continue;
        }
        const data = shareRow(design);
        const match = (await designs.filter({ game_id: design.game_id }, 'game_id', 1))[0];
        if (!match) {
          await designs.create(data);
          created.push(design.name);
          continue;
        }
        // No silent overwrite: only replace the local row when the Drive copy is strictly newer
        // (by imported_utc, falling back to file_mtime). Untimestamped remote copies never overwrite.
        const remoteT = rowTime(design);
        const localT = rowTime(match);
        if (remoteT !== null && (localT === null || remoteT > localT)) {
          await designs.update(match.id, data);
          updated.push(design.name);
        } else {
          skipped.push(design.name);
        }
      }
      return Response.json({ created, updated, skipped, count: created.length + updated.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
