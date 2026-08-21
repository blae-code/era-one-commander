import React, { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGameEntityRows, fmtNum } from "@/lib/gameData";
import { CLASSES } from "./catalog";

// Effectiveness intent map for one weapon: separates what the game AUTHORED from what it defaulted.
// Of the 845 Effectiveness rows only 84 are explicit; ~24 of those are a uniform ×0.1 that flags an
// anti-missile ROLE, not a counter relationship. Rendering all three the same reads as a wall of 1.0,
// so each class of entry gets its own visual weight (see the census / GAME-DATA-CONTRACT).
const short = (c) => c.replace("Unit", "").replace("Module", " mod");
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const intentOf = (r) => {
  if (!r.explicit) return "default";
  if (num(r.multiplier) === 0.1) return "role";
  if (num(r.multiplier) !== 1) return "counter";
  return "default";
};

const STYLE = {
  counter: "border-primary bg-primary/25 text-foreground font-semibold",
  role: "border-dashed border-accent text-accent",
  default: "border-border/40 text-muted-foreground/50",
};

export default function EffectivenessIntent({ weaponId, enabled }) {
  const qc = useQueryClient();
  const { rows, isLoading, isError, error } = useGameEntityRows("Effectiveness", enabled);
  const mine = useMemo(() => {
    const byClass = new Map(rows.filter((r) => r.weapon_id === weaponId).map((r) => [r.target_class, r]));
    return CLASSES.map((c) => byClass.get(c)).filter(Boolean);
  }, [rows, weaponId]);

  if (!enabled) return null;
  if (isLoading) return <div className="tech-label animate-pulse">Loading effectiveness table…</div>;
  if (isError)
    return (
      <div className="tech-label text-red-400">
        Couldn't load the effectiveness table: {String(error?.message || error)}{" "}
        <button onClick={() => qc.invalidateQueries({ queryKey: ["game", "Effectiveness"] })} className="underline hover:text-primary">retry</button>
      </div>
    );
  if (!mine.length) return null;

  return (
    <div role="group" aria-label="Effectiveness intent by target class">
      <div className="tech-label mb-1">Effectiveness intent // authored vs engine default</div>
      <div className="flex flex-wrap gap-1">
        {mine.map((r) => {
          const it = intentOf(r);
          const m = num(r.multiplier);
          return (
            <span key={r.target_class}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 border font-mono text-[10px] uppercase tracking-wider ${STYLE[it]}`}
              title={it === "counter" ? `${r.target_class}: authored counter ×${m}` : it === "role" ? `${r.target_class}: ×0.1 anti-missile role flag — not a counter` : `${r.target_class}: no rule defined — engine default ×1.0`}>
              {short(r.target_class)}
              <span className="tabular-nums">{it === "counter" ? `${m > 1 ? "▲" : "▼"}×${fmtNum(m, 2)}` : it === "role" ? "role ×0.1" : "×1.0"}</span>
            </span>
          );
        })}
      </div>
      <div className="mt-1.5 space-y-0.5 font-mono text-[9px] text-muted-foreground">
        <div><span className="inline-block w-2 h-2 mr-1.5 border border-primary bg-primary/40 align-middle" aria-hidden="true" />authored counter — the game defines a real multiplier for this class</div>
        <div><span className="inline-block w-2 h-2 mr-1.5 border border-dashed border-accent align-middle" aria-hidden="true" />role flag — the uniform ×0.1 marks an anti-missile role, not a counter</div>
        <div><span className="inline-block w-2 h-2 mr-1.5 border border-border/50 align-middle" aria-hidden="true" />no rule — engine default ×1.0 (761 of 845 rows)</div>
      </div>
    </div>
  );
}
