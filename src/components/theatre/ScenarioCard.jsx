import React, { useMemo } from "react";
import { Radar, Skull } from "lucide-react";
import { fmtNum } from "@/lib/gameData";
import { fmtQty, starfieldCss } from "./theatreModel";

// One playable-map card in the Theatre index grid. Starfield background is pure CSS.
export default function ScenarioCard({ scenario: s, onSelect }) {
  const stars = useMemo(() => starfieldCss(s.game_id || s.name || "map"), [s.game_id, s.name]);
  return (
    <button
      onClick={() => onSelect(s.game_id)}
      className="schematic-panel clip-plate text-left p-0 overflow-hidden group hover:border-primary/60 transition-colors"
    >
      <div
        className="relative p-4"
        style={{ backgroundImage: `${stars}, radial-gradient(120% 90% at 30% 0%, hsl(14 30% 9%) 0%, hsl(12 12% 4%) 70%)` }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display font-bold text-lg tracking-[0.12em] uppercase leading-tight truncate group-hover:text-primary transition-colors">
              {s.name}
            </div>
            <div className="tech-label mt-1 truncate">
              {s.game_id}
              {s.short_name && s.short_name !== s.name ? ` · ${s.short_name}` : ""}
              {s.playable ? "" : " · TEST MAP"}
            </div>
          </div>
          {s.has_spawner ? (
            <span className="shrink-0 flex items-center gap-1 border border-primary/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-primary/90 bg-black/40">
              <Radar size={10} /> spawner
            </span>
          ) : null}
        </div>

        <div className="mt-3 font-mono text-[10px] text-muted-foreground tracking-[0.1em]">
          FIELD {fmtNum(s.size_x)} × {fmtNum(s.size_z)} · {fmtNum(s.entity_count)} placements
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <div className="font-mono text-base text-foreground ember-glow leading-none">{fmtQty(s.resources_sum)}</div>
            <div className="text-[8px] font-mono uppercase tracking-[0.18em] text-muted-foreground mt-1">Total RU</div>
          </div>
          <div>
            <div className="font-mono text-base text-primary ember-glow leading-none">{fmtQty(s.enemy_hp_total)}</div>
            <div className="text-[8px] font-mono uppercase tracking-[0.18em] text-muted-foreground mt-1">Enemy HP</div>
          </div>
          <div>
            <div className="font-mono text-base text-primary ember-glow leading-none flex items-center gap-1">
              <Skull size={11} className="opacity-60" />
              {fmtNum(s.enemy_dps_total, 0)}
            </div>
            {/* RULE-3 grandfathered scalar — must carry this exact label */}
            <div className="text-[8px] font-mono uppercase tracking-[0.18em] text-muted-foreground mt-1">
              Enemy DPS · all-class nominal
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">
          <span>AST {fmtNum(s.asteroid_count)}</span>
          <span>WRK {fmtNum(s.wreck_count)}</span>
          <span>MOD {fmtNum(s.module_count)}</span>
          <span>OBJ {fmtNum(s.objective_count)}</span>
        </div>
        <div className="hazard-stripes h-[3px] absolute bottom-0 left-0 right-0 opacity-40" />
      </div>
    </button>
  );
}
