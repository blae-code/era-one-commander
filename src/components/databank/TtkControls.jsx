import React from "react";
import { TTK_RAMP } from "@/lib/combatSim";

const Seg = ({ active = false, onClick = undefined, children, title = undefined }) => (
  <button onClick={onClick} title={title} aria-pressed={!!active}
    className={`px-2 h-7 font-mono text-[10px] uppercase tracking-[0.12em] border transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/50"}`}>
    {children}
  </button>
);

// Industrial control strip: target pool, defence layers counted, metric, hover readout.
export default function TtkControls({ targetSet, setTargetSet, layers, setLayers, metric, setMetric, sortBy, setSortBy, counts, hover }) {
  return (
    <div className="schematic-panel plate-texture p-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
      <div className="flex items-center gap-1.5">
        <span className="tech-label">Targets</span>
        <Seg active={targetSet === "units"} onClick={() => setTargetSet("units")}>Hulls {counts.units}</Seg>
        <Seg active={targetSet === "modules"} onClick={() => setTargetSet("modules")}>Station modules {counts.modules}</Seg>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="tech-label">Profile</span>
        <Seg active title="hull hit points — always counted">Hull</Seg>
        <Seg active={layers.ablative} onClick={() => setLayers({ ...layers, ablative: !layers.ablative })} title="add ablative shield pool">+ Ablative</Seg>
        <Seg active={layers.perimeter} onClick={() => setLayers({ ...layers, perimeter: !layers.perimeter })} title="add perimeter shield pool">+ Perimeter</Seg>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="tech-label">Readout</span>
        <Seg active={metric === "seconds"} onClick={() => setMetric("seconds")}>Seconds</Seg>
        <Seg active={metric === "shots"} onClick={() => setMetric("shots")}>Shots</Seg>
        <Seg active={metric === "dps"} onClick={() => setMetric("dps")}>DPS</Seg>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="tech-label">Order</span>
        <Seg active={sortBy === "hp"} onClick={() => setSortBy("hp")}>Eff. HP</Seg>
        <Seg active={sortBy === "armor"} onClick={() => setSortBy("armor")}>Armor</Seg>
        <Seg active={sortBy === "class"} onClick={() => setSortBy("class")}>Class</Seg>
      </div>

      <div className="flex items-center gap-2 ml-auto font-mono text-[9px] text-muted-foreground">
        <span>{metric === "dps" ? "LOW" : "FAST"}</span>
        <div className="flex" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => <span key={i} className="w-2.5 h-3" style={{ background: TTK_RAMP(i / 15) }} />)}</div>
        <span>{metric === "dps" ? "HIGH" : "SLOW"}</span>
      </div>
      <div className="w-full font-mono text-[10px] text-foreground border-t border-border pt-1.5" aria-live="polite">
        {hover || <span className="text-muted-foreground">hover a cell for the full engagement breakdown</span>}
      </div>
    </div>
  );
}