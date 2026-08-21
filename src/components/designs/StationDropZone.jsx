import React, { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { fmtNum } from "@/lib/gameData";

// Drop zone for ERA ONE .station files (Documents/My Games/Era One/Blueprints/).
// Reads the file as base64, decodes it server-side via importStationFile and persists the
// result to PlayerDesign (create:true). The parsed design is handed back through onImported.
export default function StationDropZone({ onImported }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [last, setLast] = useState(null);

  const readBase64 = (file) => new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(",")[1] || "");
    fr.onerror = () => reject(new Error("could not read the file"));
    fr.readAsDataURL(file);
  });

  const handleFile = async (file) => {
    if (!file || busy) return;
    setBusy(true); setError(null); setLast(null);
    try {
      const file_base64 = await readBase64(file);
      const res = await base44.functions.invoke("importStationFile", {
        file_base64,
        name: file.name.replace(/\.station$/i, ""),
        create: true,
        source_file: file.name,
        file_mtime: file.lastModified ? new Date(file.lastModified).toISOString() : undefined,
      });
      const data = res?.data ?? res;
      setLast(data);
      onImported?.(data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shrink-0">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" && !busy) inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault(); setDrag(false);
          const files = Array.from(e.dataTransfer.files || []);
          handleFile(files.find((f) => /\.station$/i.test(f.name)) || files[0]);
        }}
        className={`schematic-panel p-3 cursor-pointer transition-colors border-dashed ${
          drag ? "border-accent bg-accent/10" : "hover:border-primary/50"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {busy
            ? <Loader2 size={18} className="text-accent animate-spin shrink-0" />
            : <FileUp size={18} className={`shrink-0 ${drag ? "text-accent" : "text-primary"}`} />}
          <div className="min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-[0.12em]">
              {busy ? "Decoding .station file…" : "Import a .station file"}
            </div>
            <div className="tech-label mt-0.5 normal-case tracking-[0.08em]">
              drag & drop or click — saved to PlayerDesign
            </div>
          </div>
        </div>
        {error && <div className="mt-2 font-mono text-[10px] text-destructive break-words">{error}</div>}
        {last && !error && (
          <div className="mt-2 font-mono text-[10px] text-[#22c55e]">
            Decoded “{last.name}” · {fmtNum(last.parts?.length ?? last.stats?.parts)} parts
            {last.record?.game_id ? <> · saved as <span className="text-foreground">{last.record.game_id}</span></> : null}
            {last.unresolved?.length > 0 && (
              <span className="text-[#ffb020]"> · {last.unresolved.length} unresolved part{last.unresolved.length === 1 ? "" : "s"}</span>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".station"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
      />
    </div>
  );
}
