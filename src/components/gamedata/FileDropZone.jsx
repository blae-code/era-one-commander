import React, { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

export default function FileDropZone({ onFiles, disabled }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);

  const take = (list) => {
    const files = Array.from(list || []).filter((f) => /\.json$/i.test(f.name));
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) take(e.dataTransfer.files); }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`schematic-panel p-10 text-center cursor-pointer transition-colors ${
        over ? "border-primary bg-primary/10" : "hover:bg-secondary/40"
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <UploadCloud size={30} className={`mx-auto mb-3 ${over ? "text-primary" : "text-muted-foreground"}`} />
      <div className="font-display font-semibold text-sm uppercase tracking-[0.15em]">
        Drop extracted data files here
      </div>
      <div className="tech-label mt-1.5">
        .json — Module · Weapon · Turret · Unit · ResearchNode · … or one combined file · click to browse
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        multiple
        className="hidden"
        onChange={(e) => { take(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}