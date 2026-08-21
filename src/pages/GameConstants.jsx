import React from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, DatabaseZap, Settings2 } from "lucide-react";
import { useGameEntityRows } from "@/lib/gameData";
import ProvenanceCard from "@/components/constants/ProvenanceCard";
import BuildCapCard from "@/components/constants/BuildCapCard";
import ColorSchemeCard from "@/components/constants/ColorSchemeCard";
import SettingsTable from "@/components/constants/SettingsTable";

// Game Constants — the transposed key/value view of the four single-row entities
// (DatasetBuild · GameSetting · BuildCap · AiColorScheme). These are settings tables,
// not Databank kinds: one row each, no list/compare semantics.
export default function GameConstants() {
  const qc = useQueryClient();
  const dataset = useGameEntityRows("DatasetBuild");
  const settings = useGameEntityRows("GameSetting");
  const caps = useGameEntityRows("BuildCap");
  const colors = useGameEntityRows("AiColorScheme");

  const all = [dataset, settings, caps, colors];
  const isLoading = all.some((q) => q.isLoading);
  const isError = all.some((q) => q.isError);
  const error = all.find((q) => q.isError)?.error ?? null;
  // isEmpty = everything loaded without error and genuinely zero rows anywhere.
  const isEmpty = !isLoading && !isError && all.every((q) => q.rows.length === 0);

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto w-full space-y-3">
      <div className="schematic-panel p-3 flex items-center justify-between gap-4 bg-gradient-to-r from-card to-primary/5">
        <div className="flex items-center gap-3 min-w-0">
          <Settings2 size={30} className="text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl tracking-[0.15em] leading-none uppercase">Game Constants</h1>
            <p className="tech-label mt-1 truncate">
              Every global tunable the game ships, transposed · GameSetting · BuildCap · AiColorScheme · DatasetBuild
            </p>
          </div>
        </div>
      </div>

      {isError ? (
        <div className="schematic-panel p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
          <AlertTriangle size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-[0.15em]">DATALINK FAILURE</div>
          <p className="tech-label mt-1">Couldn't load the constants: {String(error?.message || error)}</p>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["game"] })}
            className="mt-4 px-4 h-8 font-mono text-[10px] uppercase tracking-wider border border-primary bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="schematic-panel p-12 tech-label text-center animate-pulse">Accessing engine constants…</div>
      ) : isEmpty ? (
        <div className="schematic-panel p-8 text-center">
          <DatabaseZap size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-wider">No game data loaded yet</div>
          <p className="tech-label mt-1">
            Import the dataset from the <Link to="/gamedata" className="text-primary underline">Game Data</Link> page (admin).
          </p>
        </div>
      ) : (
        <>
          <ProvenanceCard row={dataset.rows[0]} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
            <BuildCapCard row={caps.rows[0]} />
            <ColorSchemeCard row={colors.rows[0]} />
          </div>
          <SettingsTable row={settings.rows[0]} />
        </>
      )}
    </div>
  );
}
