import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { parseGameFile, importEntityRows } from "@/lib/gameFileImport";
import {
  supportsFolderWatch, pickDirectory, loadDirHandle, clearDirHandle, hasPermission, scanDirectory,
} from "@/lib/folderWatch";

const POLL_MS = 15000;

// Watches a local folder and imports any new or modified extraction file automatically,
// then invalidates the app's queries so every page refreshes without a reload.
export default function useFolderWatch(
  /** @type {{ enabled?: boolean, deleteMissing?: boolean, onLog?: (entry: any) => void }} */
  { enabled = true, deleteMissing = false, onLog } = {}
) {
  const qc = useQueryClient();
  const [handle, setHandle] = useState(null);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [watching, setWatching] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [imported, setImported] = useState([]);
  const [error, setError] = useState(null);
  const seen = useRef(new Map());
  const busy = useRef(false);

  const log = useCallback((m) => onLog?.(m), [onLog]);

  useEffect(() => {
    if (!supportsFolderWatch()) return;
    loadDirHandle().then(async (h) => {
      if (!h) return;
      setHandle(h);
      setNeedsPermission(!(await hasPermission(h)));
    }).catch(() => {});
  }, []);

  const scan = useCallback(async (dir) => {
    const target = dir || handle;
    if (!target || busy.current) return;
    busy.current = true;
    setScanning(true);
    setError(null);
    try {
      const files = await scanDirectory(target);
      const changed = files.filter((f) => seen.current.get(f.path) !== f.signature);
      for (const f of changed) {
        const parts = await parseGameFile(f.file);
        for (const p of parts) {
          if (p.error || !p.entity) { log(`skipped ${f.path}: ${p.error || "unrecognised"}`); continue; }
          const s = await importEntityRows(base44, p.entity, p.rows, { deleteMissing, onProgress: log });
          setImported((prev) => [
            { path: f.path, entity: p.entity, summary: `+${s.created} ~${s.updated} −${s.deleted}`, at: Date.now() },
            ...prev,
          ].slice(0, 30));
        }
        seen.current.set(f.path, f.signature);
      }
      if (changed.length) qc.invalidateQueries();
      setLastScan({ at: Date.now(), files: files.length, changed: changed.length });
    } catch (e) {
      const msg = e?.message || String(e);
      setError(msg);
      log(`ERROR scan: ${msg}`);
      if (/permission|not allowed/i.test(msg)) { setNeedsPermission(true); setWatching(false); }
    } finally {
      busy.current = false;
      setScanning(false);
    }
  }, [handle, deleteMissing, log, qc]);

  useEffect(() => {
    if (!watching || !enabled || !handle || needsPermission) return;
    scan();
    const id = setInterval(scan, POLL_MS);
    return () => clearInterval(id);
  }, [watching, enabled, handle, needsPermission, scan]);

  const choose = async () => {
    try {
      const h = await pickDirectory();
      seen.current = new Map();
      setHandle(h);
      setNeedsPermission(false);
      setWatching(true);
      await scan(h);
    } catch (e) {
      if (e?.name !== "AbortError") setError(e?.message || String(e));
    }
  };

  const grant = async () => {
    if (await hasPermission(handle, true)) { setNeedsPermission(false); setWatching(true); }
  };

  const stop = async () => {
    setWatching(false);
    setHandle(null);
    seen.current = new Map();
    await clearDirHandle().catch(() => {});
  };

  return {
    supported: supportsFolderWatch(),
    folderName: handle?.name || null,
    needsPermission, watching, scanning, lastScan, imported, error,
    choose, grant, stop, scanNow: () => scan(), setWatching,
  };
}