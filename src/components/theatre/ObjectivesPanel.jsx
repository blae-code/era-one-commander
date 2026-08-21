import React from "react";
import RailPanel from "./RailPanel";

const CAT_STYLE = {
  Primary: "border-primary/60 text-primary",
  Secondary: "border-[#2f9bff]/60 text-[#2f9bff]",
  Challenge: "border-accent/60 text-accent",
};

// Scripted objectives for the selected scenario (ScenarioObjective join Objective).
// 6 of 24 scenarios ship none — that state is real, not missing data.
export default function ObjectivesPanel({ rows, objectivesById }) {
  return (
    <RailPanel title="Objectives" meta={rows.length ? `${rows.length}` : null}>
      {rows.length === 0 ? (
        <div className="tech-label py-3 text-center">No scripted objectives</div>
      ) : (
        <ol className="space-y-1.5 max-h-64 overflow-y-auto">
          {rows.map((r, i) => {
            const obj = objectivesById?.[r.objective_id];
            const cat = r.category || obj?.category || null;
            const desc = r.description || obj?.description || "";
            return (
              <li key={r.game_id} className="border-b border-border/30 last:border-0 pb-1.5">
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  <span className="text-muted-foreground tabular-nums w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-foreground/90 truncate">{obj?.name || r.name || r.objective_id}</span>
                  <span
                    className={`ml-auto shrink-0 border px-1 py-[1px] text-[8px] uppercase tracking-[0.12em] ${CAT_STYLE[cat] || "border-border text-muted-foreground"}`}
                  >
                    {cat || "unscripted"}
                  </span>
                </div>
                {desc ? (
                  <p className="font-body text-[11px] text-muted-foreground leading-snug mt-0.5 ml-5 line-clamp-3">{desc}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </RailPanel>
  );
}
