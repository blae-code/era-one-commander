import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const FOLDER_NAME = 'ERA ONE Blueprints';
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

const SHARE_FIELDS = ['name', 'description', 'author_name', 'hull_id', 'hull_name', 'ship_class', 'role', 'tags', 'placements', 'stats'];

const fileName = (name) => `${String(name || 'blueprint').replace(/[\\/:*?"<>|]/g, '-')}.eraone.json`;

async function gd(url, accessToken, init = {}) {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${accessToken}`, ...(init.headers || {}) } });
  if (!res.ok) throw new Error(`Drive ${res.status}: ${await res.text()}`);
  return res;
}

async function ensureFolder(accessToken) {
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

async function listFolder(accessToken, folderId) {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const out = await (await gd(`${API}/files?q=${q}&fields=files(id,name,modifiedTime,size)&orderBy=name`, accessToken)).json();
  return out.files || [];
}

async function uploadJson(accessToken, folderId, name, payload, existingId) {
  const boundary = 'era1' + Math.random().toString(36).slice(2);
  const meta = existingId ? { name } : { name, parents: [folderId] };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(payload, null, 2)}\r\n--${boundary}--`;
  const url = existingId ? `${UPLOAD}/${existingId}?uploadType=multipart&fields=id,name` : `${UPLOAD}?uploadType=multipart&fields=id,name`;
  return (await gd(url, accessToken, { method: existingId ? 'PATCH' : 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body })).json();
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action = 'list', blueprint_ids = [], file_ids = [] } = await req.json().catch(() => ({}));
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const folderId = await ensureFolder(accessToken);

    if (action === 'list') {
      const files = await listFolder(accessToken, folderId);
      return Response.json({ folder_id: folderId, files });
    }

    if (action === 'push') {
      const all = await base44.entities.Blueprint.list('-created_date', 200);
      const targets = blueprint_ids.length ? all.filter((b) => blueprint_ids.includes(b.id)) : all;
      if (targets.length > 50) return Response.json({ error: 'Too many blueprints in one push (max 50)' }, { status: 400 });
      const existing = await listFolder(accessToken, folderId);
      const pushed = [];
      for (const bp of targets) {
        const name = fileName(bp.name);
        const payload = { format: 'era-one-blueprint', version: 1, exported_at: new Date().toISOString(), blueprint: Object.fromEntries(SHARE_FIELDS.map((k) => [k, bp[k]])) };
        const hit = existing.find((f) => f.name === name);
        const saved = await uploadJson(accessToken, folderId, name, payload, hit?.id);
        pushed.push(saved.name);
      }
      return Response.json({ pushed, count: pushed.length });
    }

    if (action === 'pull') {
      const files = (await listFolder(accessToken, folderId)).filter((f) => (file_ids.length ? file_ids.includes(f.id) : f.name.endsWith('.eraone.json')));
      if (files.length > 50) return Response.json({ error: 'Too many files in one pull (max 50)' }, { status: 400 });
      const existing = await base44.entities.Blueprint.list('-created_date', 200);
      const imported = [];
      const updated = [];
      for (const f of files) {
        const raw = await (await gd(`${API}/files/${f.id}?alt=media`, accessToken)).text();
        let doc;
        try { doc = JSON.parse(raw); } catch { continue; }
        const bp = doc?.blueprint;
        if (!bp?.name) continue;
        const data = Object.fromEntries(SHARE_FIELDS.map((k) => [k, bp[k]]).filter(([, v]) => v !== undefined));
        const match = existing.find((e) => e.name === bp.name);
        if (match) { await base44.entities.Blueprint.update(match.id, data); updated.push(bp.name); }
        else { await base44.entities.Blueprint.create(data); imported.push(bp.name); }
      }
      return Response.json({ imported, updated, count: imported.length + updated.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}