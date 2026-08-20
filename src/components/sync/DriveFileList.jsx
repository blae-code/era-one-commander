import React from "react";
import { FileJson, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DriveFileList({ files, busy, onPull }) {
  return (
    <div className="max-h-[420px] overflow-y-auto">
      {files.length === 0 ? (
        <div className="tech-label py-8 text-center">Drive folder empty — push a design to seed it</div>
      ) : (
        files.map((f) => (
          <div key={f.id} className="flex items-center gap-2 px-1 py-1.5 border-b border-border/40">
            <FileJson size={13} className="text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11px] truncate">{f.name.replace(/\.eraone\.json$/, "")}</div>
              <div className="font-mono text-[9px] text-muted-foreground">{new Date(f.modifiedTime).toLocaleString()}</div>
            </div>
            <Button variant="outline" size="sm" disabled={busy} className="rounded-none font-mono text-[10px] shrink-0" onClick={() => onPull([f.id])}>
              <Download size={11} className="mr-1" /> Load
            </Button>
          </div>
        ))
      )}
    </div>
  );
}