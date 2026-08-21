import React, { useMemo, useState } from "react";
import { Map as MapIcon, ChevronLeft, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGameEntityRows, useGameCatalog, fmtNum } from "@/lib/gameData";
import { marksFor, fmtQty } from "@/components/theatre/theatreModel";
import ScenarioCard from "@/components/theatre/ScenarioCard";
import TheatreBoard from "@/components/theatre/TheatreBoard";
import YBandFilter from "@/components/theatre/YBandFilter";
import OrderOfBattle from "@/components/theatre/OrderOfBattle";
import ResourceLedger from "@/components/theatre/ResourceLedger";
import ObjectivesPanel from "@/components/theatre/ObjectivesPanel";
import RailPanel from "@/components/theatre/RailPanel";

// THEATRE — the pre-match map board. Card grid of the playable maps; selecting one opens a
// top-down x/z plot of every placement with team-coloured marks, an order-of-battle rail,
// the resource ledger, scripted objectives and a vertical-slice (y-band) filter.
export default function Theatre() {
  const qc = useQueryClient();
  const scenarios = useGameEntityRows("Scenario");
  const [sel, setSel] = useState(null);
  const [boardOpened, setBoardOpened] = useState(false); // sticky: ScenarioEntity is 6,596 rows — load once, on first board open
  const [showTest, setShowTest] = useState(false);
  const [targetClass, setTargetClass] = useState("FrigateUnit");
  const [bandState, setBandState] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [hoverRow, setHoverRow] = useState(null);

  const entities = useGameEntityRows("ScenarioEntity", boardOpened);
  const scenObjectives = useGameEntityRows("ScenarioObjective", boardOpened);
  const objectives = useGameEntityRows("Objective", boardOpened);
  const resources = useGameEntityRows("Resource", boardOpened);
  const cat = useGameCatalog();

  const scenario = useMemo(
    () => scenarios.rows.find((s) => s.game_id === sel) || null,
    [scenarios.rows, sel]
  );
  const marks = useMemo(
    () => (sel ? marksFor(entities.rows, sel) : []),
    [entities.rows, sel]
  );
  const yExt = useMemo(() => {
    let min = Infinity, max = -Infinity;
    for (const r of marks) {
      const y = Number(r.y) || 0;
      if (y < min) min = y;
      if (y > max) max = y;
    }
    if (!Number.isFinite(min)) { min = 0; max = 0; }
    return [min, max];
  }, [marks]);
  const band = bandState || yExt;

  const resourcesById = useMemo(() => {
    const m = {};
    for (const r of resources.rows) m[r.game_id] = r;
    return m;
  }, [resources.rows]);
  const objectivesById = useMemo(() => {
    const m = {};
    for (const r of objectives.rows) m[r.game_id] = r;
    return m;
  }, [objectives.rows]);
  const soRows = useMemo(
    () => scenObjectives.rows.filter((r) => r.scenario_id === sel),
    [scenObjectives.rows, sel]
  );

  const shown = useMemo(() => {
    const list = scenarios.rows.filter((s) => (showTest ? true : s.playable));
    return [...list].sort((a, b) => Number(b.playable) - Number(a.playable) || (a.name || "").localeCompare(b.name || ""));
  }, [scenarios.rows, showTest]);
  const playableCount = useMemo(() => scenarios.rows.filter((s) => s.playable).length, [scenarios.rows]);
  const stamp = scenario || scenarios.rows[0] || null;

  const open = (id) => { setSel(id); setBoardOpened(true); setBandState(null); setPinned(null); setHoverRow(null); };
  const close = () => { setSel(null); setPinned(null); setHoverRow(null); };
  const retry = () => qc.invalidateQueries({ queryKey: ["game"] });

  const boardLoading = entities.isLoading || scenObjectives.isLoading || objectives.isLoading || resources.isLoading;
  const boardError = entities.isError || scenObjectives.isError || objectives.isError || resources.isError;
  const activeId = (hoverRow || pinned) ? (hoverRow || pinned).identifier : null;

  const CouldntLoad = ({ what }) => (
    <div className="schematic-panel p-10 text-center">
      <div className="tech-label text-destructive mb-3">Couldn&apos;t load {what}</div>
      <button onClick={retry} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary text-primary font-mono text-[10px] uppercase tracking-[0.14em] hover:bg-primary hover:text-primary-foreground transition-colors">
        <RefreshCw size={11} /> Retry
      </button>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto w-full">
      {/* ————— header ————— */}
      <div className="schematic-panel rust-wash p-4 mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {scenario ? (
            <button onClick={close} className="shrink-0 border border-border p-2 bg-black/40 welded-frame hover:border-primary text-muted-foreground hover:text-primary transition-colors" title="Back to theatre index">
              <ChevronLeft size={22} />
            </button>
          ) : (
            <div className="border border-primary/40 p-2 bg-black/40 welded-frame shrink-0"><MapIcon size={22} className="text-primary" /></div>
          )}
          <div className="min-w-0">
            <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none uppercase truncate">
              {scenario ? scenario.name : "Theatre"}
            </h1>
            <p className="tech-label mt-1.5 truncate">
              {scenario
                ? `${scenario.game_id} · pre-match board · ${fmtNum(marks.length)} placements plotted`
                : "Pre-match map boards · every placement on every shipped map"}
            </p>
          </div>
        </div>
        <div className="hidden lg:flex flex-col items-end gap-1 shrink-0">
          <div className="flex gap-5 font-mono text-center">
            {(scenario
              ? [
                ["TOTAL RU", fmtQty(scenario.resources_sum)],
                ["ENEMY HP", fmtQty(scenario.enemy_hp_total)],
                ["ENEMY DPS · ALL-CLASS NOMINAL", fmtNum(scenario.enemy_dps_total, 0)],
              ]
              : [
                ["MAPS", fmtNum(playableCount)],
                ["PLACEMENTS", fmtQty(scenarios.rows.reduce((s, r) => s + (Number(r.entity_count) || 0), 0))],
                ["TOTAL RU", fmtQty(scenarios.rows.filter((s) => s.playable).reduce((s, r) => s + (Number(r.resources_sum) || 0), 0))],
              ]
            ).map(([k, v]) => (
              <div key={k}><div className="text-lg font-semibold text-primary ember-glow leading-none">{v}</div><div className="text-[8px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div></div>
            ))}
          </div>
          {stamp ? (
            <div className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground">game {stamp.game_version} · build {stamp.game_build}</div>
          ) : null}
        </div>
      </div>

      {/* ————— index: card grid ————— */}
      {!scenario ? (
        scenarios.isLoading ? (
          <div className="schematic-panel p-12 tech-label text-center animate-pulse">Loading theatre index…</div>
        ) : scenarios.isError ? (
          <CouldntLoad what="the scenario table" />
        ) : scenarios.rows.length === 0 ? (
          <div className="schematic-panel p-12 tech-label text-center">No game data loaded yet — import the dataset from Ops › Data Operations</div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="tech-label">{fmtNum(shown.length)} maps</span>
              <button
                onClick={() => setShowTest((v) => !v)}
                className={`ml-auto px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${showTest ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                show test maps
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {shown.map((s) => <ScenarioCard key={s.game_id} scenario={s} onSelect={open} />)}
            </div>
          </>
        )
      ) : boardError ? (
        <CouldntLoad what="the map placement tables" />
      ) : boardLoading ? (
        <div className="schematic-panel p-12 tech-label text-center animate-pulse">Plotting {fmtNum(scenario.entity_count)} placements…</div>
      ) : (
        /* ————— the board ————— */
        <div className="flex flex-col xl:flex-row gap-3 items-stretch">
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {scenario.description_statistics ? (
              <div className="schematic-panel p-3 flex flex-wrap gap-x-6 gap-y-1">
                {scenario.description_statistics.split("\n").map((line) => {
                  const t = line.trim();
                  if (!t) return null;
                  const ci = t.indexOf(":");
                  return (
                    <span key={t} className="font-mono text-[10px] tracking-[0.08em]">
                      <span className="uppercase text-muted-foreground">{ci > 0 ? t.slice(0, ci) : t}</span>
                      {ci > 0 ? <span className="text-foreground/90"> {t.slice(ci + 1).trim()}</span> : null}
                    </span>
                  );
                })}
              </div>
            ) : null}
            <div className="schematic-panel p-1.5 h-[62vh] min-h-[420px]">
              <TheatreBoard
                scenario={scenario}
                marks={marks}
                band={band}
                resourcesById={resourcesById}
                pinned={pinned}
                onHover={setHoverRow}
                onPin={setPinned}
              />
            </div>
          </div>

          {/* ————— right rail ————— */}
          <div className="w-full xl:w-[350px] shrink-0 flex flex-col gap-3">
            <RailPanel title="Vertical slice" meta="not flat" defaultOpen>
              <YBandFilter marks={marks} band={band} onBand={setBandState} />
            </RailPanel>
            <OrderOfBattle
              marks={marks}
              byId={cat.byId}
              targetClass={targetClass}
              onTargetClass={setTargetClass}
              activeId={activeId}
            />
            <ResourceLedger marks={marks} resourcesById={resourcesById} />
            <ObjectivesPanel rows={soRows} objectivesById={objectivesById} />
          </div>
        </div>
      )}
    </div>
  );
}
