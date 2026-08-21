import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, DatabaseZap } from "lucide-react";
import { useGameCatalog } from "@/lib/gameData";
import CompareHeader from "@/components/compare/CompareHeader";
import EntityPicker from "@/components/compare/EntityPicker";
import DeltaTable from "@/components/compare/DeltaTable";
import RadarCompare from "@/components/compare/RadarCompare";
import DpsClassBars, { TARGET_CLASSES, DEFAULT_CLASS } from "@/components/compare/DpsClassBars";
import EngagementPanel from "@/components/compare/EngagementPanel";

const ENTITY_COLORS = ["#ff7a1a", "#2f9bff", "#ffd21a", "#d24bff"];
const MAX_SELECT = 4;

// Delta-table metric sets. lowerBetter flips best-value highlighting; the contract defines
// energy_per_second as CONSUMPTION (+N means −N/s), so it is lower-better like cost and mass.
const UNIT_ROWS = [
  { key: "tier", label: "Tier", neutral: true },
  { key: "cost_resources", label: "Cost", unit: " RU", lowerBetter: true },
  { key: "cost_population", label: "Crew", lowerBetter: true },
  { key: "construction_time", label: "Build time", unit: " s", lowerBetter: true },
  { key: "max_health", label: "Hull HP" },
  { key: "armor", label: "Armor" },
  { key: "health_regen", label: "HP regen", unit: "/s", dec: 2 },
  { key: "max_speed", label: "Max speed", dec: 2 },
  { key: "turning_power", label: "Turning", dec: 1 },
  { key: "mass", label: "Mass", unit: " t", lowerBetter: true },
  { key: "energy_per_second", label: "Energy draw", unit: "/s", dec: 1, lowerBetter: true },
  { key: "energy_production", label: "Energy output", unit: "/s", dec: 1 },
  { key: "cargo_capacity", label: "Cargo" },
  { key: "visual_range", label: "Visual range", dec: 1 },
  { key: "sensors_range", label: "Sensor range", dec: 1 },
];
const MODULE_ROWS = [
  { key: "tier", label: "Tier", neutral: true },
  { key: "cost_resources", label: "Cost", unit: " RU", lowerBetter: true },
  { key: "cost_population", label: "Crew", lowerBetter: true },
  { key: "construction_time", label: "Build time", unit: " s", lowerBetter: true },
  { key: "max_health", label: "Hull HP" },
  { key: "armor", label: "Armor" },
  { key: "mass", label: "Mass", unit: " t", lowerBetter: true },
  { key: "energy_per_second", label: "Energy draw", unit: "/s", dec: 1, lowerBetter: true },
  { key: "energy_production", label: "Energy output", unit: "/s", dec: 1 },
  { key: "cargo_capacity", label: "Cargo" },
  { key: "extraction_rate", label: "Extraction", dec: 2 },
  { key: "resource_production", label: "Production", dec: 2 },
  { key: "visual_range", label: "Visual range", dec: 1 },
  { key: "sensors_range", label: "Sensor range", dec: 1 },
];

// Radar axes; the DPS axis resolves through dps_vs_class with the target class NAMED on the axis.
const unitAxes = (cls) => [
  { key: "max_health", label: "HULL" },
  { key: "armor", label: "ARMOR" },
  { key: "max_speed", label: "SPEED" },
  { key: "turning_power", label: "TURN" },
  { key: "dps_cls", label: `DPS·${cls}`, get: (r) => r?.dps_vs_class?.[cls] },
  { key: "cost_resources", label: "COST", invert: true },
  { key: "mass", label: "MASS", invert: true },
];
const moduleAxes = (cls) => [
  { key: "max_health", label: "HULL" },
  { key: "armor", label: "ARMOR" },
  { key: "dps_cls", label: `DPS·${cls}`, get: (r) => r?.dps_vs_class?.[cls] },
  { key: "energy_production", label: "PWR OUT" },
  { key: "cargo_capacity", label: "CARGO" },
  { key: "cost_resources", label: "COST", invert: true },
  { key: "mass", label: "MASS", invert: true },
];

export default function Compare() {
  const cat = useGameCatalog();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();

  // Shareable URL state: ?kind=Unit|Module & ids=a,b,c & vs=<TargetClass>
  const kind = params.get("kind") === "Module" ? "Module" : "Unit";
  const ids = useMemo(
    () => (params.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX_SELECT),
    [params],
  );
  const vsClass = TARGET_CLASSES.includes(params.get("vs")) ? params.get("vs") : DEFAULT_CLASS;

  const setState = (next) => {
    const p = /** @type {Record<string, string>} */ ({});
    const k = next.kind ?? kind;
    const i = next.ids ?? ids;
    const v = next.vs ?? vsClass;
    if (k !== "Unit") p.kind = k;
    if (i.length) p.ids = i.join(",");
    if (v !== DEFAULT_CLASS) p.vs = v;
    setParams(p, { replace: true });
  };

  const pool = useMemo(() => {
    const rows = kind === "Unit" ? cat.units : cat.modules;
    return [...rows].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [kind, cat.units, cat.modules]);
  const poolById = useMemo(() => Object.fromEntries(pool.map((r) => [r.game_id, r])), [pool]);

  const items = ids.map((id) => poolById[id]).filter(Boolean);
  const stampRow = items[0] || pool[0];
  const stamp = stampRow ? `game ${stampRow.game_version} · build ${stampRow.game_build}` : null;

  const rows = kind === "Unit" ? UNIT_ROWS : MODULE_ROWS;
  const axes = kind === "Unit" ? unitAxes(vsClass) : moduleAxes(vsClass);

  const addId = (id) => { if (!ids.includes(id) && ids.length < MAX_SELECT) setState({ ids: [...ids, id] }); };
  const removeId = (id) => setState({ ids: ids.filter((x) => x !== id) });
  const switchKind = (k) => setState({ kind: k, ids: [] });

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <CompareHeader
        mode={kind === "Unit" ? "units" : "modules"}
        onMode={(m) => switchKind(m === "modules" ? "Module" : "Unit")}
        modes={["units", "modules"]}
        subtitle={
          items.length >= 2
            ? `Delta // ${items.map((r) => r.name).join(" vs ")}`
            : "Side-by-side delta analysis over the real catalog"
        }
        readout={[
          ["POOL", pool.length, null],
          ["SELECTED", `${items.length}/${MAX_SELECT}`, "#ff7a1a"],
          ["VS CLASS", vsClass.replace(/(Unit|Module)$/, ""), "#2f9bff"],
        ]}
      />
      {stamp && <div className="tech-label mb-4 -mt-2 text-right">DATASET // {stamp}</div>}

      {cat.isError ? (
        <div className="schematic-panel p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
          <AlertTriangle size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-[0.15em]">DATALINK FAILURE</div>
          <p className="tech-label mt-1">Couldn't load the catalog: {String(cat.error?.message || cat.error)}</p>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["game"] })}
            className="mt-4 px-4 h-8 font-mono text-[10px] uppercase tracking-wider border border-primary bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : cat.isLoading ? (
        <div className="schematic-panel p-12 tech-label text-center animate-pulse">loading catalog…</div>
      ) : cat.isEmpty ? (
        <div className="schematic-panel p-8 text-center">
          <DatabaseZap size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-wider">No game data loaded yet</div>
          <p className="tech-label mt-1">
            Import the dataset from the <Link to="/data" className="text-primary underline">Data Ops</Link> console first.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <EntityPicker
              items={pool}
              selectedIds={ids.filter((id) => poolById[id])}
              onAdd={addId}
              onRemove={removeId}
              onClear={() => setState({ ids: [] })}
              colors={ENTITY_COLORS}
              max={MAX_SELECT}
              kindLabel={kind.toUpperCase()}
            />
          </div>

          {items.length < 2 ? (
            <div className="schematic-panel p-16 text-center tech-label">
              Select 2–{MAX_SELECT} {kind === "Unit" ? "units" : "modules"} to initiate delta analysis
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="tech-label mb-2">DELTA TABLE // ▲ = BEST VALUE</div>
                <DeltaTable items={items} colors={ENTITY_COLORS} rows={rows} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="schematic-panel p-4">
                  <div className="tech-label mb-2">
                    NORMALIZED PROFILE // 100 = BEST OF SELECTION · DPS AXIS VS {vsClass.toUpperCase()}
                  </div>
                  <RadarCompare items={items} colors={ENTITY_COLORS} axes={axes} />
                </div>
                <DpsClassBars
                  items={items}
                  colors={ENTITY_COLORS}
                  selectedClass={vsClass}
                  onSelectClass={(cls) => setState({ vs: cls })}
                />
              </div>

              {kind === "Unit" && items.length >= 2 && (
                <EngagementPanel units={items} colors={ENTITY_COLORS} stamp={stamp} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
