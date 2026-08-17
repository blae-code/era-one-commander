import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { parseGameFile, importEntityRows } from "@/lib/gameFileImport";
import FileDropZone from "@/components/gamedata/FileDropZone";
import ImportQueue from "@/components/gamedata/ImportQueue";
import { Button } from "@/components/ui/button";
import { DatabaseZap, AlertTriangle, Trash2 } from "lucide-react";

let seq = 0;

export default function ImportData() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const qc = useQueryClient();
  const [items, setItems] = useState([]);
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [deleteMissing, setDeleteMissing] = useState(false);

  const addFiles = async (files) => {
    const parsed = (await Promise.all(files.map(parseGameFile))).flat();
    setItems((prev) => [
      ...prev,
      ...parsed.map((p) => ({ ...p, key: `f${++seq}`, state: p.error ? "error" : "ready" })),
    ]);
  };

  const patch = (key, data) => setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...data } : it)));

  const runAll = async () => {
    setRunning(true);
    setLog([]);
    const queue = items.filter((it) => it.state === "ready" || it.state === "done");
    for (const it of queue) {
      patch(it.key, { state: "running" });
      try {
        const s = await importEntityRows(base44, it.entity, it.rows, {
          deleteMissing,
          onProgress: (m) => setLog((l) => [...l, m]),
        });
        patch(it.key, { state: "done", summary: `+${s.created} ~${s.updated} −${s.deleted}` });
      } catch (e) {
        const msg = e?.message || String(e);
        patch(it.key, { state: "error", error: msg });
        setLog((l) => [...l, `ERROR ${it.entity}: ${msg}`]);
      }
    }
    qc.invalidateQueries();
    setRunning(false);
  };

  const readyCount = items.filter((it) => it.state === "ready").length;

  return (
    <div className="p-6 max-w-[1100px] mx-auto w-full">
      <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-xl tracking-[0.15em] uppercase">Data Import</h1>
          <p className="tech-label mt-0.5">
            Upload extracted ERA ONE files // records are matched and updated by game_id
          </p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <Button variant="outline" size="sm" className="rounded-none font-mono text-xs" onClick={() => { setItems([]); setLog([]); }} disabled={running}>
              <Trash2 size={13} /> Clear
            </Button>
          )}
          <Button size="sm" className="rounded-none font-mono text-xs" onClick={runAll} disabled={!isAdmin || running || items.every((it) => it.state === "error")}>
            <DatabaseZap size={13} /> {running ? "Importing…" : `Import ${readyCount || ""} file${readyCount === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>

      {!isAdmin && (
        <div className="schematic-panel p-3 mb-4 flex items-center gap-2 text-[#ffb020] text-xs font-mono">
          <AlertTriangle size={14} /> Importing requires an admin account.
        </div>
      )}

      <div className="mb-4">
        <FileDropZone onFiles={addFiles} disabled={running} />
      </div>

      <div className="mb-4">
        <ImportQueue items={items} onRemove={(key) => setItems((prev) => prev.filter((it) => it.key !== key))} disabled={running} />
      </div>

      <label className="flex items-center gap-2 font-mono text-xs text-muted-foreground mb-4">
        <input type="checkbox" checked={deleteMissing} onChange={(e) => setDeleteMissing(e.target.checked)} disabled={running} />
        Delete stored records whose game_id is absent from the uploaded file (clean sweep after a patch)
      </label>

      <div className="schematic-panel p-3 h-56 overflow-y-auto font-mono text-[11px] leading-relaxed">
        {log.length === 0
          ? <span className="text-muted-foreground">Import log — nothing run yet.</span>
          : log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}