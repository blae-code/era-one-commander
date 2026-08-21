import React from "react";
import { Link } from "react-router-dom";
import { HullIcon } from "@/components/icons/EraIcons";
import { fmtNum } from "@/lib/gameData";

// Selectable list of PlayerDesign rows (real entity — .station imports land here).
// Selection keys on game_id ('player:<name>'), the stable cross-import identifier.
export default function DesignPushList({ designs, selected, onToggle }) {
  if (designs.length === 0) {
    return (
      <div className="tech-label py-8 text-center">
        No imported designs yet — import a .station file in the{" "}
        <Link to="/designs" className="text-primary underline underline-offset-2">Drydock</Link>
      </div>
    );
  }
  return (
    <div className="max-h-[420px] overflow-y-auto">
      {designs.map((d) => {
        const on = selected.includes(d.game_id);
        return (
          <button key={d.game_id} onClick={() => onToggle(d.game_id)}
            className={`w-full flex items-center gap-2 px-1 py-1.5 border-b border-border/40 text-left ${on ? "bg-primary/10" : ""}`}>
            <span className={`w-3 h-3 border shrink-0 ${on ? "bg-primary border-primary" : "border-border"}`} />
            <HullIcon size={13} className="text-muted-foreground shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-xs truncate">{d.name}</span>
              <span className="block font-mono text-[9px] text-muted-foreground truncate">
                {fmtNum(d.part_count)} parts
                {d.unresolved_parts > 0 ? ` (${fmtNum(d.unresolved_parts)} unresolved)` : ""}
                {d.game_build ? ` · build ${d.game_build}` : ""}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
