import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CloudUpload, CloudDownload, RefreshCw, HardDriveDownload } from "lucide-react";
import { toast } from "sonner";
import BlueprintPushList from "@/components/sync/BlueprintPushList";
import DriveFileList from "@/components/sync/DriveFileList";

// Blueprint exchange: pushes designs as .eraone.json files into a shared
// "ERA ONE Blueprints" folder on Google Drive, and pulls them back in.
export default function DriveSync() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  const { data: blueprints = [] } = useQuery({ queryKey: ["blueprints", "all"], queryFn: () => base44.entities.Blueprint.list("-created_date", 200) });
  const { data: drive, isLoading, refetch } = useQuery({ queryKey: ["driveSync"], queryFn: async () => (await base44.functions.invoke("driveSync", { action: "list" })).data });

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const push = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("driveSync", { action: "push", blueprint_ids: selected });
      toast.success(`Pushed ${res.data.count} design(s) to Drive`);
      refetch();
    } catch (e) { toast.error("Push failed", { description: e?.response?.data?.error || e.message }); }
    setBusy(false);
  };

  const pull = async (file_ids = []) => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("driveSync", { action: "pull", file_ids });
      toast.success(`Loaded ${res.data.count} design(s)`, { description: `${res.data.imported.length} new · ${res.data.updated.length} updated` });
      qc.invalidateQueries({ queryKey: ["blueprints"] });
    } catch (e) { toast.error("Pull failed", { description: e?.response?.data?.error || e.message }); }
    setBusy(false);
  };

  const files = drive?.files || [];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="schematic-panel rust-wash p-5 mb-5 flex items-center justify-between flex-wrap gap-4">
        <div className="absolute bottom-0 left-0 right-0 h-[3px] hazard-stripes opacity-70" />
        <div className="flex items-center gap-4">
          <div className="border border-primary/40 p-2 bg-black/40 welded-frame"><HardDriveDownload size={30} className="text-primary" /></div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">BLUEPRINT EXCHANGE</h1>
            <p className="tech-label mt-1.5">Google Drive // folder “ERA ONE Blueprints” · {files.length} file(s) on record</p>
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
          <BlueprintPushList blueprints={blueprints} selected={selected} onToggle={toggle} />
        </div>

        <div className="schematic-panel plate-texture p-3">
          <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
          <div className="tech-label mb-2">Drive folder // shared exchange</div>
          {isLoading ? <div className="tech-label py-8 text-center animate-pulse">Contacting Drive…</div> : <DriveFileList files={files} busy={busy} onPull={pull} />}
        </div>
      </div>

      <p className="tech-label mt-4 opacity-70">Share the Drive folder with your friend to give them the files; loading a design matches on name — same name overwrites, new name registers a new blueprint.</p>
    </div>
  );
}