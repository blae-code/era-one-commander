import React from "react";
import { Button } from "@/components/ui/button";
import { FolderSearch, RefreshCw, Radio, Square, ShieldAlert, X } from "lucide-react";

const time = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

// Control surface for the local folder monitor (see useFolderWatch).
export default function FolderWatchPanel({ w, disabled }) {
  if (!w.supported) {
    return (
      <div className="schematic-panel p-3 font-mono text-xs text-[#ffb020] flex items-center gap-2">
        <ShieldAlert size={14} /> Folder monitoring needs a Chromium browser (Chrome / Edge). Use drag & drop below instead.
      </div>
    );
  }

  return (
    <div className="schematic-panel p-3 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="tech-label flex items-center gap-1.5">
            Local folder monitor
            {w.watching && !w.needsPermission && (
              <span className="inline-flex items-center gap-1 text-[#38bdf8]">
                <Radio size={10} className={w.scanning ? "animate-pulse" : ""} /> live
              </span>
            )}
          </div>
          <div className="font-mono text-sm mt-0.5">
            {w.folderName ? <span className="text-primary">/{w.folderName}</span> : <span className="text-muted-foreground">No folder selected</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {w.needsPermission && (
            <Button size="sm" className="rounded-none font-mono text-xs" onClick={w.grant}>
              Re-grant access
            </Button>
          )}
          {w.folderName && !w.needsPermission && (
            <>
              <Button variant="outline" size="sm" className="rounded-none font-mono text-xs" onClick={w.scanNow} disabled={disabled || w.scanning}>
                <RefreshCw size={13} className={w.scanning ? "animate-spin" : ""} /> Scan now
              </Button>
              <Button variant="outline" size="sm" className="rounded-none font-mono text-xs" onClick={() => w.setWatching(!w.watching)} disabled={disabled}>
                {w.watching ? <><Square size={12} /> Pause</> : <><Radio size={13} /> Resume</>}
              </Button>
              <Button variant="ghost" size="sm" className="rounded-none font-mono text-xs" onClick={w.stop} disabled={disabled}>
                <X size={13} /> Detach
              </Button>
            </>
          )}
          <Button size="sm" className="rounded-none font-mono text-xs" onClick={w.choose} disabled={disabled}>
            <FolderSearch size={13} /> {w.folderName ? "Change folder" : "Select folder"}
          </Button>
        </div>
      </div>

      <div className="font-mono text-[10px] text-muted-foreground">
        {w.error
          ? <span className="text-[#ff2d55]">⚠ {w.error}</span>
          : w.lastScan
            ? `Last sweep ${time(w.lastScan.at)} — ${w.lastScan.files} file${w.lastScan.files === 1 ? "" : "s"} seen, ${w.lastScan.changed} imported · re-scans every 15s`
            : "Point this at your extraction output folder — new and modified files import themselves."}
      </div>

      {w.imported.length > 0 && (
        <div className="border border-border divide-y divide-border max-h-40 overflow-y-auto">
          {w.imported.map((r, i) => (
            <div key={`${r.path}-${r.at}-${i}`} className="bg-card px-2.5 py-1.5 flex items-center justify-between gap-3 font-mono text-[10px]">
              <span className="truncate">{r.path} <span className="text-muted-foreground">→ {r.entity}</span></span>
              <span className="shrink-0 text-[#38bdf8]">{r.summary} <span className="text-muted-foreground">{time(r.at)}</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}