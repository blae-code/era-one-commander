import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PenTool } from "lucide-react";
import { fmtNum } from "@/lib/gameData";
import { SegBar } from "@/components/databank/Readouts";

// Detail branch for GameBlueprint rows (shipped/AI/player ship & station designs).
// Replaces the raw-JSON fallback these rows used to fall through to.
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
const short = (c) => String(c).replace("Unit", "").replace("Module", " mod");

export default function BlueprintDetail({ r, byId, onSelect }) {
  const dpsVs = useMemo(
    () => Object.entries(r.dps_vs_class || {}).filter(([, v]) => Number(v) > 0),
    [r],
  );
  const [clsSel, setClsSel] = useState(null);
  const bestCls = dpsVs.reduce((b, e) => (Number(e[1]) > Number(b?.[1] ?? 0) ? e : b), null)?.[0] || null;
  const cls = clsSel || bestCls;
  const maxDps = Math.max(0, ...dpsVs.map(([, v]) => Number(v)));
  const energyNet = (Number(r.energy_production) || 0) - (Number(r.energy_use) || 0);
  const modules = r.modules && typeof r.modules === "object" && !Array.isArray(r.modules) ? Object.entries(r.modules) : [];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-display font-bold text-xl leading-tight">{r.name}</h2>
          <span className="font-mono text-[10px] text-muted-foreground">{r.game_id}</span>
        </div>
        <div className="tech-label mt-0.5">{[r.source, r.folder, r.used_by_ai ? "used by AI" : null].filter(Boolean).join(" · ")}</div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border border border-border">
        {[
          ["COST RU", fmtNum(num(r.sum_module_cost_resources) ?? num(r.cost_resources))],
          ["CREW", fmtNum(num(r.crew_total) ?? num(r.cost_population))],
          ["BUILD s", fmtNum(num(r.construction_time))],
          ["PARTS", fmtNum(num(r.part_count))],
          ["HP", fmtNum(num(r.sum_module_max_health))],
          ["MASS", fmtNum(num(r.mass_total), 1)],
          ["ENERGY /s", `${energyNet >= 0 ? "+" : "−"}${fmtNum(Math.abs(energyNet), 1)}`],
          ["CARGO", fmtNum(num(r.cargo_capacity))],
          ["DEPTH", fmtNum(num(r.assembly_depth))],
        ].filter(([, v]) => v !== "—").map(([k, v]) => (
          <div key={k} className="bg-card p-2.5 text-center">
            <div className="font-mono text-[9px] text-muted-foreground tracking-widest">{k}</div>
            <div className="font-mono text-sm font-semibold">{v}</div>
          </div>
        ))}
      </div>
      {r.dps_total != null && (
        <div className="tech-label">Aggregate DPS // {fmtNum(r.dps_total, 1)} <span className="text-muted-foreground/70">(all-class nominal — compare via the per-class strip below)</span></div>
      )}

      {dpsVs.length > 0 && (
        <div role="group" aria-label="DPS by target class">
          <div className="tech-label mb-1">DPS vs target class</div>
          <div className="flex flex-wrap gap-1 mb-2">
            {dpsVs.map(([c]) => (
              <button key={c} onClick={() => setClsSel(c)} aria-pressed={cls === c}
                className={`px-1.5 h-6 border font-mono text-[9px] uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary ${cls === c ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                {short(c)}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            {dpsVs.map(([c, v]) => (
              <SegBar key={c} label={short(c)} value={Number(v)} max={maxDps} dec={1}
                color={c === cls ? "hsl(var(--primary))" : "hsl(30 10% 40%)"} />
            ))}
          </div>
          {cls && <div className="font-mono text-[10px] text-primary mt-1">vs {cls}: {fmtNum(Number(r.dps_vs_class?.[cls]), 1)} dps</div>}
        </div>
      )}

      {Array.isArray(r.module_classes) && r.module_classes.length > 0 && (
        <div>
          <div className="tech-label mb-1">Module classes</div>
          <div className="flex flex-wrap gap-1">
            {r.module_classes.map((c) => <span key={c} className="px-1.5 py-0.5 border border-border bg-secondary/40 font-mono text-[10px] uppercase tracking-wider">{c}</span>)}
          </div>
        </div>
      )}

      {modules.length > 0 && (
        <div>
          <div className="tech-label mb-1">Module composition ({modules.length} types)</div>
          <div className="flex flex-wrap gap-1">
            {modules.map(([id, n]) => (
              <button key={id} onClick={() => onSelect?.("Module", id)} title={id}
                className="px-1.5 py-0.5 border border-border bg-secondary/40 font-mono text-[10px] hover:border-primary/60 hover:text-primary transition-colors">
                {n > 1 ? `${n}× ` : ""}{byId?.[id]?.name || id}
              </button>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(r.weapon_modules) && r.weapon_modules.length > 0 && (
        <div>
          <div className="tech-label mb-1">Weapon modules</div>
          <div className="flex flex-wrap gap-1">
            {[...new Set(r.weapon_modules)].map((id) => (
              <button key={id} onClick={() => onSelect?.("Module", id)} title={id}
                className="px-1.5 py-0.5 border border-border bg-secondary/40 font-mono text-[10px] hover:border-primary/60 hover:text-primary transition-colors">
                {byId?.[id]?.name || id}
              </button>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(r.required_research) && r.required_research.length > 0 && (
        <div>
          <div className="tech-label mb-1">Requires research</div>
          <div className="flex flex-wrap gap-1">
            {r.required_research.map((id) => (
              <button key={id} onClick={() => onSelect?.("ResearchNode", id)} title={id}
                className="px-1.5 py-0.5 border border-border bg-secondary/40 font-mono text-[10px] hover:border-primary/60 hover:text-primary transition-colors">
                {byId?.[id]?.name || id}
              </button>
            ))}
          </div>
        </div>
      )}

      <Link to={`/designs?id=${encodeURIComponent(r.game_id)}`}
        className="inline-flex items-center gap-1.5 px-3 h-8 border border-primary text-primary font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-primary hover:text-primary-foreground transition-colors">
        <PenTool size={12} aria-hidden="true" /> Open in Drydock
      </Link>
    </div>
  );
}
