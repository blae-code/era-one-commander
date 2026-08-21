import React from "react";
import { fmtModifier } from "@/lib/gameData";

// Detail branch for Doctrine rows (CombatTemplate stances/styles/orientations + FormationModifier
// formations). Replaces the raw-JSON fallback these rows used to fall through to.
const KIND_BLURB = {
  Stance: "How aggressively units seek and hold engagements.",
  Style: "The flight pattern units use while attacking.",
  Orientation: "Which facing units present to the target.",
  Neutral: "The baseline attack template — no doctrine modifiers applied.",
  Formation: "Fleet formation — bonuses applied while units hold this shape.",
};

export default function DoctrineDetail({ r, statLabels }) {
  const kind = r.kind || (String(r.game_id).startsWith("FM.") ? "Formation" : "Doctrine");
  const mods = r.modifiers || [];
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-display font-bold text-xl leading-tight">{r.name}</h2>
          <span className="px-1.5 py-0.5 border border-border bg-secondary/40 font-mono text-[10px] uppercase tracking-wider">{kind}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{r.game_id}</span>
        </div>
        {KIND_BLURB[kind] && <div className="tech-label mt-0.5">{KIND_BLURB[kind]}</div>}
      </div>

      <div>
        <div className="tech-label mb-1">Stat modifiers ({mods.length})</div>
        {mods.length ? (
          <div className="flex flex-wrap gap-1">
            {mods.map((m, i) => (
              <span key={i} className="px-1.5 py-0.5 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">{fmtModifier(m, statLabels)}</span>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">Carries no numeric modifiers — selecting it changes nothing measurable.</div>
        )}
      </div>

      {Number(r.evade_actions) > 0 && (
        <div className="tech-label">Evade actions // {r.evade_actions}</div>
      )}
    </div>
  );
}
