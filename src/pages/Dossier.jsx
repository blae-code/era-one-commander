import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, DatabaseZap, Fingerprint } from "lucide-react";
import { useGameCatalog, useGameEntityRows } from "@/lib/gameData";
import DossierCard from "@/components/dossier/DossierCard";
import CommitBar from "@/components/dossier/CommitBar";
import DossierFile from "@/components/dossier/DossierFile";
import CompareBoard from "@/components/dossier/CompareBoard";
import { plannerOf, sortByEscalation, splitFields, stampOf } from "@/components/dossier/dossierModel";

// AI DOSSIER — the five opponent personalities (AiPersonality) as intelligence files.
export default function Dossier() {
  const { rows: raw, isLoading, isError, error } = useGameEntityRows("AiPersonality");
  const cat = useGameCatalog();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [compare, setCompare] = useState(false);
  const fileRef = useRef(null);

  const rows = useMemo(() => sortByEscalation(raw), [raw]);
  const selected = rows.find((r) => r.game_id === selectedId) || null;
  const scales = useMemo(
    () => ({
      depthMax: Math.max(1, ...rows.map((r) => plannerOf(r).maxDepth || 0)),
      nodesMax: Math.max(1, ...rows.map((r) => plannerOf(r).maxNodes || 0)),
    }),
    [rows]
  );
  const varyingCount = useMemo(() => splitFields(rows).varying.length, [rows]);
  const stamp = stampOf(rows);

  useEffect(() => {
    if (selected && fileRef.current) fileRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedId, selected]);

  const loadError = isError || cat.isError;
  const loading = isLoading || cat.isLoading;
  const empty = !loadError && !loading && rows.length === 0;
  const readout = [
    ["FILES", rows.length],
    ["PARAMS", rows.length ? Object.keys(rows[0]).length : 0],
    ["DIVERGENT", varyingCount],
  ];

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="schematic-panel rust-wash p-5 mb-5 flex items-center justify-between flex-wrap gap-4">
        <div className="absolute bottom-0 left-0 right-0 h-[3px] hazard-stripes opacity-70" />
        <div className="flex items-center gap-4">
          <div className="border border-primary/40 p-2 bg-black/40 welded-frame"><Fingerprint size={30} className="text-primary" /></div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">AI DOSSIER</h1>
            <p className="tech-label mt-1.5">Opponent personality intelligence files · {stamp}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex gap-6 font-mono text-center">
            {readout.map(([k, v]) => (
              <div key={k}>
                <div className="text-lg font-semibold text-primary leading-none ember-glow">{v}</div>
                <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div>
              </div>
            ))}
          </div>
          <div className="flex">
            {[["FILES", false], ["COMPARE", true]].map(([label, val]) => (
              <button
                key={String(label)}
                onClick={() => setCompare(Boolean(val))}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border ${
                  compare === val ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="schematic-panel p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
          <AlertTriangle size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-[0.15em]">DATALINK FAILURE</div>
          <p className="tech-label mt-1">Couldn&apos;t load the AI dossier tables: {String((error || cat.error)?.message || error || cat.error)}</p>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["game"] })}
            className="mt-4 px-4 h-8 font-mono text-[10px] uppercase tracking-wider border border-primary bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="schematic-panel p-12 tech-label text-center animate-pulse">Decrypting personality files…</div>
      ) : empty ? (
        <div className="schematic-panel p-8 text-center">
          <DatabaseZap size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-wider">No game data loaded yet</div>
          <p className="tech-label mt-1">Import the dataset from the <Link to="/gamedata" className="text-primary underline">Game Data</Link> page.</p>
        </div>
      ) : compare ? (
        <CompareBoard rows={rows} stamp={stamp} />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map((r) => (
              <DossierCard
                key={r.game_id}
                row={r}
                scales={scales}
                selected={r.game_id === selectedId}
                onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
              />
            ))}
          </div>
          <CommitBar rows={rows} selectedId={selectedId} onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))} />
          {selected ? (
            <div ref={fileRef}>
              <DossierFile row={selected} cat={cat} onClose={() => setSelectedId(null)} />
            </div>
          ) : (
            <div className="schematic-panel p-6 text-center tech-label">Select a dossier card or a commit band to open the full intelligence file.</div>
          )}
        </div>
      )}
    </div>
  );
}
