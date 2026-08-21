import React from "react";
import { SegBar } from "@/components/databank/Readouts";
import { commitRange, deriveDoctrine, personaHex, plannerOf } from "./dossierModel";

// One intelligence-file card: codename, derived doctrine line, decisive numbers as gauges.
export default function DossierCard({ row, selected = false, onSelect = (_id) => {}, scales = { depthMax: 16, nodesMax: 2500 } }) {
  const [min, max] = commitRange(row);
  const p = plannerOf(row);
  const hex = personaHex(row);
  return (
    <button
      onClick={() => onSelect(row.game_id)}
      className={`schematic-panel p-4 text-left w-full transition-colors hover:bg-primary/5 ${
        selected ? "outline outline-1 outline-primary bg-primary/5" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 shrink-0" style={{ background: hex, boxShadow: `0 0 6px ${hex}88` }} />
          <span className="font-display font-bold uppercase tracking-[0.15em] text-sm truncate">{row.name}</span>
        </div>
        <span className="tech-label shrink-0">{row.game_id}</span>
      </div>
      <p className="mt-2 mb-3 text-[11px] leading-snug text-muted-foreground font-body min-h-[3.5em]">
        {deriveDoctrine(row)}
      </p>
      <div className="space-y-1.5">
        <SegBar label="COMMIT MIN" value={min} max={30} unit="u" color={hex} />
        <SegBar label="COMMIT MAX" value={max} max={30} unit="u" color={hex} />
        <SegBar label="PLAN DEPTH" value={p.maxDepth || 0} max={scales.depthMax || 16} color={hex} />
        <SegBar label="PLAN NODES" value={p.maxNodes || 0} max={scales.nodesMax || 2500} color={hex} />
      </div>
      <div className="tech-label mt-3 text-[9px] flex justify-between">
        <span>Intelligence file</span>
        <span className="text-primary">{selected ? "OPEN" : "OPEN FILE →"}</span>
      </div>
    </button>
  );
}
