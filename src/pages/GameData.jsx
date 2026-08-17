import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { seedGameData, loadIndex, ERA_ONE_ENTITIES } from "@/lib/seedGameData";
import { Button } from "@/components/ui/button";
import { DatabaseZap, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

// Admin page: shows the game build the bundled dataset was extracted from, compares it with what is
// live in the app's entities, and runs the seeder (upsert by game_id).
export default function GameData() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const qc = useQueryClient();
  const [index, setIndex] = useState(null);
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [deleteMissing, setDeleteMissing] = useState(false);
  const [verify, setVerify] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Server-side proof: gameDataStatus embeds the expected counts + game_ids for this build.
  const runVerify = async () => {
    setVerifying(true); setVerify(null);
    try {
      const res = await base44.functions.invoke("gameDataStatus", {});
      setVerify(res?.data ?? res);
    } catch (e) {
      setVerify({ error: e?.message || String(e) });
    } finally { setVerifying(false); }
  };

  useEffect(() => { loadIndex().then(setIndex); }, []);

  const { data: live = {}, refetch, isFetching } = useQuery({
    queryKey: ["gamedata-live-counts"],
    queryFn: async () => {
      const out = {};
      for (const { entity } of ERA_ONE_ENTITIES) {
        try {
          const rows = await base44.entities[entity].list("game_id", 5000);
          out[entity] = { count: rows.length, build: rows[0]?.game_build ?? null, defined: true };
        } catch {
          out[entity] = { count: 0, build: null, defined: false };
        }
      }
      return out;
    },
  });

  const bundledBuild = index?.game?.buildid;
  const status = useMemo(() => {
    if (!index) return null;
    return index.entities.map((e) => {
      const l = live[e.entity] || {};
      const state = !l.defined ? "missing" : l.count === 0 ? "empty" : l.build !== bundledBuild ? "stale" : l.count === e.rows ? "synced" : "partial";
      return { ...e, live: l, state };
    });
  }, [index, live, bundledBuild]);

  const run = async () => {
    setRunning(true); setLog([]);
    try {
      const summary = await seedGameData(base44, { onProgress: (m) => setLog((l) => [...l, m]), deleteMissing });
      setLog((l) => [...l, `complete: ${JSON.stringify(summary)}`]);
      qc.invalidateQueries();
      refetch();
    } catch (e) {
      setLog((l) => [...l, `ERROR: ${e?.message || e}`]);
    } finally { setRunning(false); }
  };

  const STATE_STYLE = {
    synced: "text-emerald-400", partial: "text-amber-400", stale: "text-amber-400", empty: "text-muted-foreground", missing: "text-red-400",
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto w-full">
      <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-xl tracking-[0.15em] uppercase">Game Data</h1>
          <p className="tech-label mt-0.5">
            Bundled dataset // ERA ONE {index?.game?.game_version} · Steam build {bundledBuild} · extracted {index?.game?.generated_utc}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-none font-mono text-xs" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Re-check
          </Button>
          <Button variant="outline" size="sm" className="rounded-none font-mono text-xs" onClick={runVerify} disabled={verifying}>
            <ShieldCheck size={13} /> {verifying ? "Verifying…" : "Verify server-side"}
          </Button>
          <Button size="sm" className="rounded-none font-mono text-xs" onClick={run} disabled={!isAdmin || running}>
            <DatabaseZap size={13} /> {running ? "Importing…" : "Import / update all"}
          </Button>
        </div>
      </div>

      {!isAdmin && (
        <div className="schematic-panel p-3 mb-4 flex items-center gap-2 text-amber-400 text-xs font-mono">
          <AlertTriangle size={14} /> Import requires an admin account. You can still inspect sync status below.
        </div>
      )}

      <div className="schematic-panel overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead className="bg-secondary/90">
            <tr className="text-left">
              {["Entity", "Bundled rows", "Live rows", "Live build", "State"].map((h) => (
                <th key={h} className="tech-label px-3 py-2 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(status || []).map((e) => (
              <tr key={e.entity}>
                <td className="px-3 py-2 font-mono text-xs">{e.entity}<span className="text-muted-foreground"> · {e.source_table}</span></td>
                <td className="px-3 py-2 font-mono text-xs">{e.rows}</td>
                <td className="px-3 py-2 font-mono text-xs">{e.live.defined ? e.live.count : "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">{e.live.build || "—"}</td>
                <td className={`px-3 py-2 font-mono text-xs uppercase ${STATE_STYLE[e.state]}`}>
                  {e.state === "synced" && <CheckCircle2 size={12} className="inline mr-1 -mt-0.5" />}
                  {e.state === "missing" ? "entity not deployed" : e.state}
                </td>
              </tr>
            ))}
            {!status && <tr><td colSpan={5} className="tech-label text-center py-8 animate-pulse">Reading bundled index…</td></tr>}
          </tbody>
        </table>
      </div>

      {verify && (
        <div className={`schematic-panel p-3 mb-4 font-mono text-[11px] ${verify.error ? "text-red-400" : verify.ok ? "text-emerald-400" : "text-amber-400"}`}>
          {verify.error ? `Verify failed: ${verify.error}` : (
            <>
              <div className="mb-1">{verify.ok ? "SERVER VERIFIED — every entity matches build " + verify.game?.buildid : "Server check: not fully synced"}</div>
              {Object.entries(verify.entities || {}).map(([k, v]) => (
                <div key={k} className={v.state === "synced" ? "text-muted-foreground" : ""}>
                  {k}: {v.state} — live {v.live}/{v.expected}{v.live_build ? ` (build ${v.live_build})` : ""}
                  {v.missing?.length ? ` · missing ${v.missing.length}: ${v.missing.slice(0, 6).join(", ")}${v.missing.length > 6 ? "…" : ""}` : ""}
                  {v.extra?.length ? ` · extra ${v.extra.length}: ${v.extra.slice(0, 6).join(", ")}${v.extra.length > 6 ? "…" : ""}` : ""}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <label className="flex items-center gap-2 font-mono text-xs text-muted-foreground mb-4">
        <input type="checkbox" checked={deleteMissing} onChange={(e) => setDeleteMissing(e.target.checked)} disabled={running} />
        Delete records whose game_id no longer exists in the bundled dataset (after a game patch)
      </label>

      <div className="schematic-panel p-3 h-64 overflow-y-auto font-mono text-[11px] leading-relaxed">
        {log.length === 0 ? <span className="text-muted-foreground">Import log — nothing run yet.</span> : log.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      <p className="tech-label mt-4">
        Source: era-one-data pipeline (UnityPy + Odin reader over the installed game). Refresh after a patch: <code>./run.fish</code>, copy
        <code> out/base44/data/*.json</code> into <code>src/data/era-one/</code>, redeploy, then Import here.
      </p>
    </div>
  );
}
