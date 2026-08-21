import React from "react";
import { ArrowRight, FlaskConical } from "lucide-react";
import TierBadge from "@/components/shared/TierBadge";
import { fmtNum } from "@/lib/gameData";

// Required-research chain from fleetPlan.required_research[] — the transitive closure,
// already ordered parents-first by the backend. Answers "what do I need to research
// to field this force". Cost/time totals are summed client-side (fleetPlan carries
// no research_totals block, unlike blueprintStats).
export default function FleetResearch({ research = [] }) {
  const totalRU = research.reduce((a, n) => a + (n.cost_resources || 0), 0);
  const totalTime = research.reduce((a, n) => a + (n.construction_time || 0), 0);
  return (
    <div className="schematic-panel p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="tech-label flex items-center gap-2">
          <FlaskConical size={12} className="text-primary" /> Required research · prerequisite order
        </div>
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          {research.length} nodes · <span className="text-primary ember-glow">{fmtNum(totalRU)}</span> RU · {fmtNum(totalTime)} s
        </div>
      </div>
      {research.length === 0 ? (
        <div className="tech-label py-4 text-center">No research required — this force is field-ready from the start.</div>
      ) : (
        <div className="flex flex-wrap items-stretch gap-2">
          {research.map((n, i) => (
            <React.Fragment key={n.game_id}>
              {i > 0 && (
                <div className="self-center text-muted-foreground shrink-0">
                  <ArrowRight size={12} />
                </div>
              )}
              <div className="border border-border bg-card px-2.5 py-1.5 flex items-center gap-2">
                <span className="font-mono text-[9px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <TierBadge tier={n.tier || 1} />
                <div>
                  <div className="font-display text-xs leading-tight">{n.name || n.game_id}</div>
                  <div className="font-mono text-[9px] text-muted-foreground">{fmtNum(n.cost_resources)} RU · {fmtNum(n.construction_time)} s</div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
