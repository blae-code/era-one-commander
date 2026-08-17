import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import RadarCompare from "@/components/compare/RadarCompare";
import DeltaTable from "@/components/compare/DeltaTable";

const COMPONENT_AXES = [
  { key: "dps", label: "DPS" },
  { key: "range", label: "RANGE" },
  { key: "hp", label: "HP" },
  { key: "thrust", label: "THRUST" },
  { key: "shield_hp", label: "SHIELD" },
  { key: "mass", label: "MASS", invert: true },
];
const COMPONENT_ROWS = [
  { key: "mass", label: "Mass", unit: "t", lowerBetter: true },
  { key: "power", label: "Power (MW)" },
  { key: "hp", label: "HP" },
  { key: "dps", label: "DPS" },
  { key: "range", label: "Range", unit: "m" },
  { key: "fire_rate", label: "Fire Rate", decimals: 1 },
  { key: "thrust", label: "Thrust", unit: "kN" },
  { key: "shield_hp", label: "Shield HP" },
  { key: "shield_regen", label: "Shield Regen", unit: "/s" },
  { key: "cargo", label: "Cargo", unit: "m³" },
];

const HULL_AXES = [
  { key: "hp", label: "HP" },
  { key: "base_power", label: "POWER" },
  { key: "grid_area", label: "GRID" },
  { key: "crew", label: "CREW" },
  { key: "mass", label: "MASS", invert: true },
];
const HULL_ROWS = [
  { key: "mass", label: "Mass", unit: "t", lowerBetter: true },
  { key: "hp", label: "Hull HP" },
  { key: "base_power", label: "Base Power", unit: "MW" },
  { key: "grid_area", label: "Grid Slots" },
  { key: "crew", label: "Crew" },
];

function Picker({ items, value, onChange, tint }) {
  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className={`rounded-none font-mono text-xs border-2 ${tint}`}>
        <SelectValue placeholder="Select unit..." />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i.id} value={i.id} className="font-mono text-xs">
            {i.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function Compare() {
  const [mode, setMode] = useState("components");
  const [aId, setAId] = useState(null);
  const [bId, setBId] = useState(null);

  const { data: components = [] } = useQuery({ queryKey: ["components"], queryFn: () => base44.entities.Component.list("-created_date", 500) });
  const { data: hullsRaw = [] } = useQuery({ queryKey: ["hulls"], queryFn: () => base44.entities.Hull.list("-created_date", 100) });

  const hulls = hullsRaw.map((h) => ({ ...h, grid_area: (h.grid_width || 0) * (h.grid_height || 0) }));
  const items = mode === "components" ? components : hulls;
  const a = items.find((i) => i.id === aId);
  const b = items.find((i) => i.id === bId);
  const axes = mode === "components" ? COMPONENT_AXES : HULL_AXES;
  const rows = mode === "components" ? COMPONENT_ROWS : HULL_ROWS;

  const switchMode = (m) => { setMode(m); setAId(null); setBId(null); };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-xl tracking-[0.15em] uppercase">Comparison Engine</h1>
          <p className="tech-label mt-0.5">Side-by-side tactical delta analysis</p>
        </div>
        <div className="flex gap-1">
          {["components", "hulls"].map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                mode === m ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <div className="tech-label mb-1.5 text-[#f08a45]">Unit Alpha</div>
          <Picker items={items} value={aId} onChange={setAId} tint="border-[#f08a45]/70" />
        </div>
        <div>
          <div className="tech-label mb-1.5 text-[#a9bcc7]">Unit Bravo</div>
          <Picker items={items} value={bId} onChange={setBId} tint="border-[#a9bcc7]/70" />
        </div>
      </div>

      {a && b ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="schematic-panel p-4">
            <div className="tech-label mb-2">Normalized Profile</div>
            <RadarCompare a={a} b={b} axes={axes} />
          </div>
          <div>
            <div className="tech-label mb-2">Raw Delta Readout</div>
            <DeltaTable a={a} b={b} rows={rows} />
          </div>
        </div>
      ) : (
        <div className="schematic-panel p-16 text-center tech-label">
          Select two units to initiate delta analysis
        </div>
      )}
    </div>
  );
}