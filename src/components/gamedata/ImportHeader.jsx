import React from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, DatabaseZap, Trash2 } from "lucide-react";

// Command-Deck style banner for Data Import: identity block, queue readout, import actions.
export default function ImportHeader({ readout, onClear, onRun, running, canRun, canClear, canImport, readyCount }) {
  return (
    <div className="schematic-panel p-4 mb-4 flex items-center justify-between gap-4 bg-gradient-to-r from-card to-primary/5">
      <div className="flex items-center gap-4 min-w-0">
        <UploadCloud size={38} className="text-primary shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">DATA IMPORT</h1>
          <p className="tech-label mt-1.5 truncate">Upload extracted ERA ONE files // records matched and updated by game_id</p>
        </div>
      </div>

      <div className="hidden xl:flex gap-6 font-mono text-center">
        {readout.map(([k, v, hex]) => (
          <div key={k}>
            <div className="text-xl font-semibold leading-none" style={{ color: hex || "hsl(var(--primary))" }}>{v}</div>
            <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" className="rounded-none font-display uppercase tracking-wider text-xs" onClick={onClear} disabled={!canClear || running}>
          <Trash2 size={13} /> Clear
        </Button>
        <Button size="sm" className="rounded-none font-display uppercase tracking-wider text-xs" onClick={onRun} disabled={!canRun || running || !canImport}>
          <DatabaseZap size={13} /> {running ? "Importing…" : `Import ${readyCount || ""} file${readyCount === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  );
}