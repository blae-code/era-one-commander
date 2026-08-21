import React, { useMemo, useState } from "react";
import { Anchor } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useGameCatalog, useGameEntityRows, fmtNum } from "@/lib/gameData";
import { fromGameBlueprint, fromPlayerDesign, buildTree, classHex } from "@/components/designs/designModel";
import DesignList from "@/components/designs/DesignList";
import DesignPlot from "@/components/designs/DesignPlot";
import AssemblyTree from "@/components/designs/AssemblyTree";
import DesignStats from "@/components/designs/DesignStats";
import StationDropZone from "@/components/designs/StationDropZone";

const Chip = ({ active, children, ...p }) => (
  <button {...p} className={`px-2 h-7 border clip-plate font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${active ? "border-primary bg-primary/20 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>{children}</button>
);

// THE DRYDOCK — read-only viewer for ship/station designs. ERA ONE designs are module GRAPHS
// (attachment trees), rendered here as an outline + a 2D orthographic plot, with the row's own
// roll-ups plus the blueprintStats server roll-up (warnings) in the right rail.
export default function Designs() {
  const cat = useGameCatalog(true);
  const player = useGameEntityRows("PlayerDesign");
  const qc = useQueryClient();

  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("top");
  const [partSel, setPartSel] = useState(null);
  const [partHover, setPartHover] = useState(null);
  const [dpsClass, setDpsClass] = useState("FighterUnit");
  // Designs imported this session — visible immediately, before the PlayerDesign refetch lands.
  const [sessionImports, setSessionImports] = useState([]);

  const designs = useMemo(() => {
    const playerRows = [...player.rows];
    for (const rec of sessionImports) {
      if (rec?.game_id && !playerRows.some((r) => r.game_id === rec.game_id)) playerRows.push(rec);
    }
    return [
      ...playerRows.map(fromPlayerDesign),
      ...cat.blueprints.map(fromGameBlueprint),
    ];
  }, [player.rows, sessionImports, cat.blueprints]);

  const design = designs.find((d) => d.id === selectedId) || designs.find((d) => d.source === "shipped") || designs[0] || null;
  const tree = useMemo(() => (design ? buildTree(design.parts) : null), [design]);
  const activePart = tree && tree.byIndex.has(partSel) ? partSel : null;
  const hoverPart = tree && tree.byIndex.has(partHover) ? partHover : null;

  // Server roll-up: warnings + research totals for shipped rows; fills mass/energy for player rows.
  const rollupQ = useQuery({
    queryKey: ["blueprintStats", design?.id],
    enabled: !!design && (design.source === "shipped" || !!design.modules),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const body = design.source === "shipped" ? { blueprint_id: design.id } : { modules: design.modules };
      const res = await base44.functions.invoke("blueprintStats", body);
      return res?.data ?? res;
    },
  });
  // AxiosError: the function's own message is at err.response.data.error; err.message is useless alone.
  const rollupErr = /** @type {any} */ (rollupQ.error);
  const rollupError = rollupQ.isError ? (rollupErr?.response?.data?.error || rollupErr?.message || "request failed") : null;

  const negShare = useMemo(() => {
    const total = cat.blueprints.length;
    if (!total) return null;
    const neg = cat.blueprints.filter((b) => Number(b.energy_use) > Number(b.energy_production)).length;
    return `${neg}/${total} shipped designs run a net draw`;
  }, [cat.blueprints]);

  const stamp = design || cat.blueprints[0] || null;

  const onSelectDesign = (id) => { setSelectedId(id); setPartSel(null); setPartHover(null); };
  const onImported = (data) => {
    if (data?.record) setSessionImports((prev) => [...prev.filter((r) => r.game_id !== data.record.game_id), data.record]);
    qc.invalidateQueries({ queryKey: ["game", "PlayerDesign"] });
    if (data?.record?.game_id) onSelectDesign(data.record.game_id);
  };

  const selPart = activePart !== null ? tree.byIndex.get(activePart)?.part : null;
  const selMod = selPart?.module_id ? cat.byId[selPart.module_id] : null;

  return (
    <div className="p-4 md:p-6 max-w-[1900px] mx-auto w-full h-full flex flex-col min-h-0">
      <div className="schematic-panel rust-wash p-4 mb-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="border border-primary/40 p-2 bg-black/40 welded-frame shrink-0">
            <Anchor size={24} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none uppercase">The Drydock</h1>
            <p className="tech-label mt-1.5 truncate">Ship & station designs · attachment graphs · module roll-ups · .station import</p>
          </div>
        </div>
        <div className="hidden lg:flex flex-col items-end gap-1 shrink-0">
          <div className="flex gap-5 font-mono text-center">
            {[
              ["SHIPPED", fmtNum(cat.blueprints.length)],
              ["IMPORTED", fmtNum(designs.filter((d) => d.source === "player").length)],
              ["PARTS", design ? fmtNum(design.partCount) : "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-lg font-semibold text-primary ember-glow leading-none">{v}</div>
                <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div>
              </div>
            ))}
          </div>
          <div className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground">
            {stamp ? `game ${stamp.game_version || "—"} · build ${stamp.game_build || "—"}` : "dataset not loaded"}
          </div>
        </div>
      </div>

      {cat.isLoading ? (
        <div className="schematic-panel p-12 tech-label text-center animate-pulse">Opening the drydock…</div>
      ) : cat.isError ? (
        <div className="schematic-panel p-10 text-center">
          <div className="tech-label mb-3">Couldn't load the design catalog — {String(cat.error?.message || cat.error || "request failed")}</div>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["game"] })}
            className="px-3 h-8 border border-primary text-primary font-mono text-[10px] uppercase tracking-[0.15em] hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Retry
          </button>
        </div>
      ) : cat.isEmpty ? (
        <div className="schematic-panel p-10 tech-label text-center">No game data loaded yet — import the dataset from Data Ops.</div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[290px_minmax(0,1fr)_370px] gap-3">
          <div className="flex flex-col gap-3 min-h-0 max-xl:max-h-[420px]">
            <DesignList
              designs={designs}
              selectedId={design?.id}
              onSelect={onSelectDesign}
              query={query}
              onQuery={setQuery}
              playerLoading={player.isLoading}
              playerError={player.isError ? player.error : null}
            />
            <StationDropZone onImported={onImported} />
          </div>

          <div className="flex flex-col gap-3 min-h-0">
            <div className="schematic-panel flex flex-col min-h-[340px] flex-[1.3]">
              <div className="flex items-center gap-1.5 p-2 border-b border-border shrink-0">
                <Chip active={view === "top"} onClick={() => setView("top")}>Top · X/Z</Chip>
                <Chip active={view === "side"} onClick={() => setView("side")}>Side · X/Y</Chip>
                {selPart && (
                  <div className="ml-auto min-w-0 flex items-center gap-2 font-mono text-[10px]">
                    <span className="inline-block w-2 h-2 shrink-0" style={{ background: classHex(selMod?.module_class || "Unknown") }} />
                    <span className="truncate text-foreground">{selPart.name || selMod?.name || selPart.module_id || "unresolved part"}</span>
                    <span className="text-muted-foreground shrink-0">
                      {selPart.module_id || "—"} · #{selPart.index}
                      {selPart.position ? ` · [${selPart.position.map((n) => fmtNum(n, 1)).join(", ")}]` : ""}
                    </span>
                    <button onClick={() => setPartSel(null)} className="text-muted-foreground hover:text-foreground shrink-0">✕</button>
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-0 bg-black/20">
                {design && (
                  <DesignPlot
                    parts={design.parts}
                    byId={cat.byId}
                    view={view}
                    rootIndex={design.rootIndex}
                    commandIndex={design.commandIndex}
                    selected={activePart}
                    hovered={hoverPart}
                    onSelect={(i) => setPartSel((cur) => (cur === i ? null : i))}
                    onHover={setPartHover}
                  />
                )}
              </div>
            </div>

            <div className="schematic-panel flex flex-col flex-1 min-h-[180px]">
              <div className="p-2 border-b border-border tech-label shrink-0">
                Assembly tree · {design ? `${fmtNum(design.partCount)} parts` : "—"}
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {design && tree && (
                  <AssemblyTree
                    key={design.id}
                    roots={tree.roots}
                    byId={cat.byId}
                    totalParts={design.parts.length}
                    rootIndex={design.rootIndex}
                    commandIndex={design.commandIndex}
                    selected={activePart}
                    hovered={hoverPart}
                    onSelect={(i) => setPartSel((cur) => (cur === i ? null : i))}
                    onHover={setPartHover}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto">
            <DesignStats
              design={design}
              byId={cat.byId}
              rollup={rollupQ.data || null}
              rollupLoading={rollupQ.isFetching && !rollupQ.data}
              rollupError={rollupError}
              selectedClass={dpsClass}
              onSelectClass={setDpsClass}
              negShare={negShare}
            />
          </div>
        </div>
      )}
    </div>
  );
}
