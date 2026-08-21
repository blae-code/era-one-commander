import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CloudUpload, CloudDownload, RefreshCw, HardDriveDownload } from "lucide-react";
import { toast } from "sonner";
import DesignPushList from "@/components/sync/DesignPushList";
import DriveFileList from "@/components/sync/DriveFileList";

const errMsg = (e) => e?.response?.data?.error || e?.message || String(e);

// Design Exchange: pushes PlayerDesign rows (imported .station designs) as .eraone.json files into a
// shared "ERA ONE Designs" folder on Google Drive, and pulls them back in. Matches by game_id;
// pull only overwrites a local design when the Drive copy is strictly newer.
export default function DriveSync() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  const designsQ = useQuery({
    queryKey: ["playerDesigns", "all"],
    queryFn: () => base44.entities.PlayerDesign.list("-created_date", 200),
  });
  const designs = designsQ.data || [];

  const { data: drive, isLoading, isError: driveError, error: driveErr, refetch } = useQuery({
    queryKey: ["driveSync"],
    queryFn: async () => {
      const res = await base44.functions.invoke("driveSync", { action: "list" });
      return res?.data ?? res;
    },
  });

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const push = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("driveSync", { action: "push", design_ids: selected });
      const data = res?.data ?? res;
      toast.success(`Pushed ${data.count} design(s) to Drive`);
      refetch();
    } catch (e) { toast.error("Push failed", { description: errMsg(e) }); }
    setBusy(false);
  };

  const pull = async (file_ids = []) => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("driveSync", { action: "pull", file_ids });
      const data = res?.data ?? res;
      toast.success(`Loaded ${data.count} design(s)`, {
        description: `${data.created?.length ?? 0} new · ${data.updated?.length ?? 0} updated · ${data.skipped?.length ?? 0} skipped (local copy newer or not a design file)`,
      });
      qc.invalidateQueries({ queryKey: ["playerDesigns"] });
    } catch (e) { toast.error("Pull failed", { description: errMsg(e) }); }
    setBusy(false);
  };

  const files = drive?.files || [];
  // Dataset stamp from the rows themselves — never hardcoded.
  const stamped = designs.find((d) => d.game_version || d.game_build);
  const stamp = stamped ? `game ${stamped.game_version || "?"} · build ${stamped.game_build || "?"}` : null;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="schematic-panel rust-wash p-5 mb-5 flex items-center justify-between flex-wrap gap-4">
        <div className="absolute bottom-0 left-0 right-0 h-[3px] hazard-stripes opacity-70" />
        <div className="flex items-center gap-4">
          <div className="border border-primary/40 p-2 bg-black/40 welded-frame"><HardDriveDownload size={30} className="text-primary" /></div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">DESIGN EXCHANGE</h1>
            <p className="tech-label mt-1.5">
              Google Drive // folder “ERA ONE Designs” · {files.length} file(s) on record{stamp ? ` · ${stamp}` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-none font-mono text-xs" disabled={busy || isLoading} onClick={() => refetch()}>
            <RefreshCw size={13} className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="outline" className="rounded-none font-mono text-xs" disabled={busy || !files.length} onClick={() => pull([])}>
            <CloudDownload size={13} className="mr-1.5" /> Pull all
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="schematic-panel plate-texture p-3">
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="tech-label">Local designs // {selected.length} armed</div>
            <Button size="sm" className="rounded-none font-mono text-[10px]" disabled={busy || !selected.length} onClick={push}>
              <CloudUpload size={12} className="mr-1" /> Push to Drive
            </Button>
          </div>
          {designsQ.isLoading ? (
            <div className="tech-label py-8 text-center animate-pulse">Reading design registry…</div>
          ) : designsQ.isError ? (
            <div className="tech-label py-8 text-center">
              <div className="text-destructive mb-2">Couldn't load designs — {errMsg(designsQ.error)}</div>
              <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 border border-border font-mono text-[10px] uppercase tracking-wider hover:border-primary" onClick={() => designsQ.refetch()}>
                <RefreshCw size={11} /> Retry
              </button>
            </div>
          ) : (
            <DesignPushList designs={designs} selected={selected} onToggle={toggle} />
          )}
        </div>

        <div className="schematic-panel plate-texture p-3">
          <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
          <div className="tech-label mb-2">Drive folder // shared exchange</div>
          {isLoading ? (
            <div className="tech-label py-8 text-center animate-pulse">Contacting Drive…</div>
          ) : driveError ? (
            <div className="tech-label py-8 text-center">
              <div className="text-destructive mb-2">Couldn't reach Drive — {errMsg(driveErr)}</div>
              <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 border border-border font-mono text-[10px] uppercase tracking-wider hover:border-primary" onClick={() => refetch()}>
                <RefreshCw size={11} /> Retry
              </button>
            </div>
          ) : (
            <DriveFileList files={files} busy={busy} onPull={pull} />
          )}
        </div>
      </div>

      <p className="tech-label mt-4 opacity-70">
        Share the Drive folder with your friend to give them the files; loading a design matches on its stable id
        (player:&lt;name&gt;) — a newer Drive copy updates the local one, an older or identical copy is skipped.
      </p>
    </div>
  );
}
