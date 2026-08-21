import React from "react";
import { fmtNum } from "@/lib/gameData";
import { classCounts, classHex, fmtTime } from "./designModel";
import DpsStrip from "./DpsStrip";

const Panel = ({ title, children, className = "" }) => (
  <div className={`schematic-panel p-3 ${className}`}>
    <div className="tech-label mb-2">{title}</div>
    {children}
  </div>
);

const Big = ({ label, value, unit = "", hex = null }) => (
  <div className="min-w-0">
    <div className="font-mono text-lg font-semibold leading-none ember-glow truncate" style={hex ? { color: hex } : undefined}>
      {value}
      {unit && <span className="text-[10px] text-muted-foreground ml-1">{unit}</span>}
    </div>
    <div className="text-[9px] font-mono tracking-[0.2em] text-muted-foreground mt-1 uppercase">{label}</div>
  </div>
);

// Right rail: live roll-up for the selected design. Shipped designs use the row's own roll-ups;
// player designs fill the gaps (mass/energy/classes) from the blueprintStats response.
export default function DesignStats({
  design, byId = {}, rollup = null, rollupLoading = false, rollupError = null,
  selectedClass, onSelectClass, negShare = null,
}) {
  if (!design) return null;
  const s = design.stats;
  const t = rollup?.totals || null;
  const pick = (own, key) => (own ?? (t ? t[key] : null));

  const energyUse = pick(s.energy_use, "energy_use");
  const energyGen = pick(s.energy_production, "energy_production");
  const net = energyUse !== null && energyGen !== null ? Number(energyGen) - Number(energyUse) : null;

  const clsCounts = s.module_classes || (design.parts.length ? classCounts(design.parts, byId) : null);
  const dps = s.dps_vs_class || (t ? t.dps_vs_class : null);

  const warnings = rollup?.warnings || [];
  const energyWarnings = warnings.filter((w) => /^energy deficit/i.test(w));
  const faultWarnings = warnings.filter((w) => !/^energy deficit/i.test(w));

  const research = s.required_research?.length ? s.required_research : (rollup?.required_research || []).map((r) => r.game_id);
  const researchTotals = rollup?.research_totals || null;

  return (
    <div className="space-y-3">
      <Panel title="Identity">
        <div className="font-display font-bold text-lg tracking-[0.08em] leading-tight">{design.name}</div>
        <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em]">
          <span className={`px-1.5 py-0.5 border ${design.source === "player" ? "border-[#00d1c1]/60 text-[#00d1c1]" : "border-border text-muted-foreground"}`}>
            {design.source === "player" ? "player import" : "shipped"}
          </span>
          {design.folder && <span className="px-1.5 py-0.5 border border-border text-muted-foreground">{design.folder}</span>}
          {design.usedByAi && <span className="px-1.5 py-0.5 border border-[#2f9bff]/60 text-[#2f9bff]">AI-flown</span>}
          <span className="px-1.5 py-0.5 border border-border text-muted-foreground">{fmtNum(design.partCount)} parts</span>
        </div>
        {design.unresolved > 0 && (
          <div className="mt-2 font-mono text-[10px] text-[#ffb020]">
            {design.unresolved} part{design.unresolved === 1 ? "" : "s"} unresolved — no matching module in this dataset build; stats under-report.
          </div>
        )}
        {design.sourceFile && (
          <div className="mt-1.5 font-mono text-[9px] text-muted-foreground truncate">{design.sourceFile}</div>
        )}
      </Panel>

      <Panel title="Build cost">
        <div className="grid grid-cols-3 gap-3">
          <Big label="Resources" value={fmtNum(pick(s.cost_resources, "cost_resources"))} unit="RU" />
          <Big label="Crew" value={fmtNum(pick(s.cost_population, "cost_population"))} />
          <Big label="Build time" value={fmtTime(pick(s.construction_time, "construction_time"))} />
        </div>
      </Panel>

      <Panel title="Structure">
        <div className="grid grid-cols-3 gap-3">
          <Big label="Integrity" value={fmtNum(pick(s.max_health, "max_health"))} unit="HP" />
          <Big label="Mass" value={fmtNum(pick(s.mass, "mass"))} unit="t" />
          <Big label="Crew housed" value={fmtNum(pick(s.crew, "cost_population"))} />
        </div>
        {clsCounts && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(clsCounts).map(([cls, n]) => (
              <span key={cls} className="flex items-center gap-1.5 px-1.5 py-0.5 border border-border font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                <span className="inline-block w-2 h-2" style={{ background: classHex(cls) }} />
                {cls} <span className="text-foreground">{fmtNum(n)}</span>
              </span>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Energy grid">
        <div className="grid grid-cols-2 gap-3">
          <Big label="Draw" value={fmtNum(energyUse, 1)} unit="e/s" hex="#ffb020" />
          <Big label="Generation" value={fmtNum(energyGen, 1)} unit="e/s" hex="#38bdf8" />
        </div>
        <div className="mt-2 font-mono text-[10px] text-muted-foreground">
          net {net === null ? "—" : `${net >= 0 ? "+" : ""}${fmtNum(net, 1)} e/s`}
          {net !== null && net < 0 && negShare && <span> · {negShare}</span>}
        </div>
        {energyWarnings.map((w) => (
          <div key={w} className="mt-1 font-mono text-[9px] text-muted-foreground/80">roll-up: {w}</div>
        ))}
      </Panel>

      <Panel title="Firepower · dps_vs_class">
        {dps
          ? <DpsStrip dpsVsClass={dps} selectedClass={selectedClass} onSelectClass={onSelectClass} />
          : <div className="tech-label">No armament on this design</div>}
      </Panel>

      <Panel title="Design checks · blueprintStats">
        {rollupLoading ? (
          <div className="tech-label animate-pulse">Running server roll-up…</div>
        ) : rollupError ? (
          <div className="font-mono text-[10px] text-destructive">Roll-up unavailable — {rollupError}</div>
        ) : faultWarnings.length ? (
          <ul className="space-y-1">
            {faultWarnings.map((w) => (
              <li key={w} className="font-mono text-[10px] text-[#ffb020]">▸ {w}</li>
            ))}
          </ul>
        ) : rollup ? (
          <div className="font-mono text-[10px] text-[#22c55e]">No design faults flagged.</div>
        ) : (
          <div className="tech-label">—</div>
        )}
        {rollup?.unknown?.length > 0 && (
          <div className="mt-1.5 font-mono text-[9px] text-[#ffb020]">
            {rollup.unknown.length} module id{rollup.unknown.length === 1 ? "" : "s"} unknown to the roll-up (dropped from totals).
          </div>
        )}
      </Panel>

      <Panel title="Required research">
        {research.length ? (
          <>
            <ul className="space-y-0.5 max-h-40 overflow-y-auto">
              {research.map((id) => (
                <li key={id} className="font-mono text-[10px] text-muted-foreground flex items-baseline gap-2">
                  <span className="text-foreground truncate">{byId[id]?.name || id}</span>
                  <span className="ml-auto shrink-0 text-[9px] text-muted-foreground/70">{id}</span>
                </li>
              ))}
            </ul>
            {researchTotals && (
              <div className="mt-2 pt-2 border-t border-border font-mono text-[10px] text-muted-foreground">
                unlock cost {fmtNum(researchTotals.cost_resources)} RU · {fmtTime(researchTotals.construction_time)} · {fmtNum(researchTotals.nodes)} nodes
              </div>
            )}
          </>
        ) : (
          <div className="font-mono text-[10px] text-muted-foreground">None — buildable from the start.</div>
        )}
      </Panel>

      <div className="px-1 font-mono text-[9px] tracking-[0.15em] text-muted-foreground text-right">
        dataset: game {design.game_version || "—"} · build {design.game_build || "—"}
      </div>
    </div>
  );
}
