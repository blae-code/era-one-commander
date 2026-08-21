import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { seedGameData, loadIndex } from "@/lib/seedGameData";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import GameDataHeader from "@/components/gamedata/GameDataHeader";

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

  // Live counts + per-entity state come ONLY from the server verify (gameDataStatus pages past 5000
  // rows and knows the expected ids) — a client-side list() count would cap and contradict it.
  const bundledBuild = index?.game?.buildid;
  const verified = verify && !verify.error ? verify.entities || null : null;
  const status = useMemo(() => {
    if (!index) return null;
    return index.entities.map((e) => {
      const v = verified?.[e.entity];
      return { ...e, v, state: v ? v.state : "unknown" };
    });
  }, [index, verified]);

  const run = async () => {
    setRunning(true); setLog([]);
    try {
      const summary = await seedGameData(base44, { onProgress: (m) => setLog((l) => [...l, m]), deleteMissing });
      setLog((l) => [...l, `complete: ${JSON.stringify(summary)}`]);
      qc.invalidateQueries();
      runVerify();
    } catch (e) {
      setLog((l) => [...l, `ERROR: ${e?.message || e}`]);
    } finally { setRunning(false); }
  };

  const STATE_STYLE = {
    synced: "text-emerald-400", partial: "text-amber-400", stale: "text-amber-400", empty: "text-muted-foreground", missing_entity: "text-red-400", unknown: "text-muted-foreground",
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto w-full">
      <GameDataHeader
        subtitle={`Bundled dataset // ERA ONE ${index?.game?.game_version || "—"} · build ${bundledBuild || "—"} · extracted ${index?.game?.generated_utc || "—"}`}
        readout={[
          ["TABLES", (status || []).length],
          ["SYNCED", verified ? (status || []).filter((e) => e.state === "synced").length : "—", "#22c55e"],
          ["PENDING", verified ? (status || []).filter((e) => e.state !== "synced").length : "—", "#ffb020"],
          ["BUNDLED ROWS", (status || []).reduce((s, e) => s + (e.rows || 0), 0)],
        ]}
        onRefetch={runVerify}
        isFetching={verifying}
        onVerify={runVerify}
        verifying={verifying}
        onRun={run}
        running={running}
        canRun={isAdmin}
      />

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
                <td className="px-3 py-2 font-mono text-xs">{e.v ? (e.state === "missing_entity" ? "—" : e.v.live) : "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">{e.v?.live_build || "—"}</td>
                <td className={`px-3 py-2 font-mono text-xs uppercase ${STATE_STYLE[e.state]}`}>
                  {e.state === "synced" && <CheckCircle2 size={12} className="inline mr-1 -mt-0.5" />}
                  {e.state === "missing_entity" ? "entity not deployed" : e.state === "unknown" ? "—" : e.state}
                </td>
              </tr>
            ))}
            {!status && <tr><td colSpan={5} className="tech-label text-center py-8 animate-pulse">Reading bundled index…</td></tr>}
          </tbody>
        </table>
        {status && !verified && (
          <div className="tech-label px-3 py-2 border-t border-border text-muted-foreground">
            Live counts unknown — run Verify for server-side live counts (pages past the 5000-row client cap).
          </div>
        )}
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