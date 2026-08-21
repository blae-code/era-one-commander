import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, DatabaseZap, Database as DatabaseIcon, Filter } from "lucide-react";
import { useGameCatalog, useGameEntityRows, fmtNum } from "@/lib/gameData";
import { KINDS, KIND_KEYS, KIND_GROUPS, KIND_ENTITY, EXTRA_ENTITIES, ALWAYS_ON_ENTITIES, SYNTH_NAME } from "@/components/databank/catalog";
import { parseQuery, applyQuery, sortRows, columnStats, toCSV, facetGetter } from "@/components/databank/query";
import { useDatabank } from "@/components/databank/useDatabank";
import { KIND_ICON } from "@/components/databank/Cells";
import Toolbar from "@/components/databank/Toolbar";
import DataTable from "@/components/databank/DataTable";
import { CardGrid } from "@/components/databank/Views";
import HeatmapMatrix from "@/components/databank/HeatmapMatrix";
import ComparePanel from "@/components/databank/ComparePanel";
import ActiveChips from "@/components/databank/ActiveChips";
import StatsStrip from "@/components/databank/StatsStrip";
import ScatterView from "@/components/databank/ScatterView";
import DamageChartView from "@/components/databank/DamageChartView";
import DetailDrawer from "@/components/databank/DetailDrawer";
import ParallelView from "@/components/databank/ParallelView";
import TreeView from "@/components/databank/TreeView";
import TtkView from "@/components/databank/TtkView";
import CommandPalette from "@/components/databank/CommandPalette";
import ShortcutHelp from "@/components/databank/ShortcutHelp";
import { useDatabankKeys } from "@/components/databank/useDatabankKeys";

const EMPTY = []; // stable identity for not-yet-loaded entity rows (keeps the cat memo warm)

// Databank v2 — the granular browser over the real ERA ONE dataset.
// State lives in the URL (shareable) + localStorage (favourites, presets, columns, notes). See components/databank/.
export default function Database() {
  const qc = useQueryClient();
  const base = useGameCatalog(true);
  const db = useDatabank();
  useDatabankKeys(db);
  const kind = db.kind;

  // Entities the catalog does not load (cat.extra). EXTRA_ENTITIES is a module-level constant, so
  // this loop calls the same hooks in the same order on every render. Each query is enabled only
  // for the active kind (plus the tiny always-on cross-link tables), so switching into the Databank
  // never fires 30+ eager requests; react-query keeps previously-loaded rows cached.
  const activeEntity = KIND_ENTITY[db.kindKey] || null;
  const extraRaw = {};
  const extraQ = {};
  for (const name of EXTRA_ENTITIES) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q = useGameEntityRows(name, ALWAYS_ON_ENTITIES.includes(name) || name === activeEntity);
    extraRaw[name] = q.rows.length ? q.rows : EMPTY;
    extraQ[name] = q;
  }

  const cat = useMemo(() => {
    const byId = { ...base.byId };
    const extraKind = {}; // game_id -> entity name, for kindOf over the extras
    const extra = {};
    for (const name of EXTRA_ENTITIES) {
      const synth = SYNTH_NAME[name];
      const rows = synth ? extraRaw[name].map((r) => (r.name ? r : { ...r, name: synth(r, base.byId) })) : extraRaw[name];
      extra[name] = rows;
      for (const r of rows) {
        if (byId[r.game_id] === undefined) byId[r.game_id] = r;
        if (extraKind[r.game_id] === undefined) extraKind[r.game_id] = name;
      }
    }
    return { ...base, extra, byId, kindOf: (id) => base.kindOf(id) || extraKind[id] || null };
  }, [base, ...EXTRA_ENTITIES.map((n) => extraRaw[n])]); // eslint-disable-line react-hooks/exhaustive-deps

  const ctx = cat;
  const allRows = useMemo(() => kind.rows(cat) || [], [kind, cat]);
  const parsed = useMemo(() => parseQuery(db.q), [db.q]);
  const { rows: filtered, errors } = useMemo(
    () => applyQuery(allRows, kind, ctx, parsed, { favorites: db.favorites, facetSel: db.facetSel, ranges: db.ranges, favOnly: db.favOnly, hideWip: db.hideWip }),
    [allRows, kind, ctx, parsed, db.favorites, db.facetSel, db.ranges, db.favOnly, db.hideWip]);
  const sorted = useMemo(() => sortRows(filtered, kind, ctx, db.sortKey, db.sortDir), [filtered, kind, ctx, db.sortKey, db.sortDir]);
  const columns = useMemo(() => kind.columns.filter((c) => db.visibleCols.includes(c.key)), [kind, db.visibleCols]);
  const stats = useMemo(() => columnStats(filtered, kind, ctx), [filtered, kind, ctx]);
  const wipCount = useMemo(() => allRows.reduce((n, r) => n + (r.work_in_progress ? 1 : 0), 0), [allRows]);
  const selected = db.selectedId ? cat.byId[db.selectedId] : null;
  const toKind = (k) => (k === "CombatTemplate" || k === "FormationModifier" ? "Doctrine" : k);
  const selectedKind = selected ? toKind(cat.kindOf(db.selectedId)) || db.kindKey : db.kindKey;
  const compareRows = db.compareIds.map((id) => cat.byId[id]).filter(Boolean).filter((r) => allRows.includes(r));

  // Loading / error for the ACTIVE kind: the core catalog plus, for extra-sourced kinds, that
  // kind's own entity query (rule: isError -> couldn't load + retry; isEmpty -> import hint).
  const activeQ = activeEntity ? extraQ[activeEntity] : null;
  const kindLoading = cat.isLoading || (activeQ ? activeQ.isLoading : false);
  const kindError = cat.isError || (activeQ ? activeQ.isError : false);
  const kindErrorMsg = cat.error || (activeQ && activeQ.error) || null;
  const kindEmpty = activeEntity ? !kindLoading && !kindError && allRows.length === 0 : cat.isEmpty && !cat.isLoading;

  // Kinds that are unusable un-filtered (6.6k map entities, 2.4k strings, 2.6k parts): until their
  // primary facet has a selection, show a picker instead of the view.
  const primaryKey = kind.primaryFacet || null;
  const needsPrimary = primaryKey && !(db.facetSel[primaryKey]?.size) && allRows.length > 0;
  const primaryValues = useMemo(() => {
    if (!primaryKey) return [];
    const get = facetGetter(kind, primaryKey);
    const m = new Map();
    for (const r of allRows) { const v = get(r, ctx); m.set(v, (m.get(v) || 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [primaryKey, kind, allRows, ctx]);
  const primaryLabel = primaryKey ? (kind.facets.find(([k]) => k === primaryKey)?.[1] || primaryKey) : null;

  const selectId = (id) => {
    if (!id) return;
    const kk = toKind(cat.kindOf(id));
    if (kk && kk !== db.kindKey && KIND_KEYS.includes(kk)) db.jumpTo(kk, id); else db.select(id);
    db.pushRecent(id);
  };

  // ↑↓ / c / f work in every view. DataTable registers its own handler for the table view, so this
  // container-level registration covers cards/heat/plot/damage/para/tree/ttk only (no double-fire).
  useEffect(() => {
    if (db.view === "table") return;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      const i = sorted.findIndex((r) => r.game_id === db.selectedId);
      if (e.key === "ArrowDown") { e.preventDefault(); const r = sorted[Math.min(sorted.length - 1, i + 1)]; if (r) selectId(r.game_id); }
      if (e.key === "ArrowUp") { e.preventDefault(); const r = sorted[Math.max(0, i - 1)]; if (r) selectId(r.game_id); }
      if (e.key === "c" && db.selectedId) db.toggleCompare(db.selectedId);
      if (e.key === "f" && db.selectedId) db.toggleFavorite(db.selectedId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const exportRows = (fmt) => {
    const blob = fmt === "csv" ? new Blob([toCSV(sorted, kind, ctx, db.visibleCols)], { type: "text/csv" }) : new Blob([JSON.stringify(sorted, null, 1)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `era-one-${kind.label.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.${fmt}`; a.click(); URL.revokeObjectURL(a.href);
  };

  const readout = [["MODULES", cat.modules.length], ["SHIPS", cat.units.length], ["WEAPONS", cat.weapons.length], ["TURRETS", cat.turrets.length], ["RESEARCH", cat.research.length], ["BLUEPRINTS", cat.blueprints.length]];

  return (
    <div className="p-4 md:p-6 h-full flex flex-col max-w-[1800px] mx-auto w-full min-h-0">
      {/* header */}
      <div className="schematic-panel p-3 mb-3 flex items-center justify-between gap-4 bg-gradient-to-r from-card to-primary/5">
        <div className="flex items-center gap-3 min-w-0">
          <DatabaseIcon size={30} className="text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl tracking-[0.15em] leading-none">DATABANK</h1>
            <p className="tech-label mt-1 truncate">Every value from the installed game · build {cat.modules[0]?.game_build || "—"} · shareable URL state</p>
            <div className="flex gap-1.5 mt-1.5 font-mono text-[9px] text-muted-foreground">
              <span className="border border-border px-1.5 py-0.5">⌘K jump</span>
              <span className="border border-border px-1.5 py-0.5">1–8 views</span>
              <span className="border border-border px-1.5 py-0.5">? keys</span>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex gap-5 font-mono text-center">
          {readout.map(([k, v]) => (<div key={k}><div className="text-lg font-semibold text-primary leading-none">{fmtNum(v)}</div><div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div></div>))}
        </div>
      </div>

      {/* kind selector — one chip row per dataset group */}
      <div className="mb-3 space-y-1">
        {KIND_GROUPS.map(([group, keys]) => (
          <div key={group} className="flex flex-wrap items-center gap-1">
            <span className="tech-label w-[76px] shrink-0">{group}</span>
            {keys.map((k) => {
              const Icon = KIND_ICON[k] || DatabaseIcon;
              const n = (KINDS[k].rows(cat) || []).length;
              return (
                <button key={k} onClick={() => db.setKind(k)}
                  className={`inline-flex items-center gap-1 px-2 h-7 font-mono text-[10px] uppercase tracking-wider border transition-colors ${db.kindKey === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}>
                  <Icon size={11} /> {KINDS[k].label} {n > 0 && <span className="opacity-60">{n}</span>}
                </button>);
            })}
          </div>
        ))}
      </div>

      {kindError ? (
        <div className="schematic-panel p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
          <AlertTriangle size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-[0.15em]">DATALINK FAILURE</div>
          <p className="tech-label mt-1">Couldn't load the databank: {String(kindErrorMsg?.message || kindErrorMsg)}</p>
          <button onClick={() => qc.invalidateQueries({ queryKey: ["game"] })}
            className="mt-4 px-4 h-8 font-mono text-[10px] uppercase tracking-wider border border-primary bg-primary text-primary-foreground hover:bg-primary/80 transition-colors">
            Retry
          </button>
        </div>
      ) : kindEmpty ? (
        <div className="schematic-panel p-8 text-center">
          <DatabaseZap size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-wider">No game data loaded yet</div>
          <p className="tech-label mt-1">Import the dataset from the <Link to="/gamedata" className="text-primary underline">Game Data</Link> page (admin).</p>
        </div>
      ) : (
        <>
          {kind.desc && <p className="tech-label mb-2">{kind.desc}</p>}
          <Toolbar db={db} kind={kind} allRows={allRows} filteredRows={filtered} ctx={ctx} errors={errors} onExport={exportRows} onJump={selectId} />
          <ActiveChips db={db} kind={kind} parsed={parsed} wipCount={wipCount} />
          {(db.view === "table" || db.view === "cards") && !kindLoading && !needsPrimary && filtered.length > 0 && <StatsStrip rows={filtered} kind={kind} ctx={ctx} db={db} />}
          <div className={`flex-1 min-h-0 grid gap-3 ${compareRows.length ? "grid-cols-1 xl:grid-cols-[1fr_440px]" : "grid-cols-1"}`}>
            <div className="min-h-0">
              {kindLoading ? <div className="schematic-panel p-12 tech-label text-center animate-pulse">Accessing databank…</div>
                : needsPrimary ? (
                  <div className="schematic-panel p-6 overflow-auto h-full">
                    <div className="flex items-center gap-2 mb-1"><Filter size={14} className="text-primary" /><span className="font-display font-bold uppercase tracking-[0.15em]">Select a {primaryLabel}</span></div>
                    <p className="tech-label mb-4">{fmtNum(allRows.length)} {kind.label.toLowerCase()} — too many to browse un-filtered. Pick one to begin (add more from the filter bar above).</p>
                    <div className="flex flex-wrap gap-1.5">
                      {primaryValues.map(([v, n]) => (
                        <button key={v} onClick={() => db.toggleFacet(primaryKey, v)}
                          className="inline-flex items-center gap-1.5 px-2.5 h-8 border border-border bg-card font-mono text-[11px] text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors">
                          <span className="truncate max-w-[260px]">{v}</span><span className="text-[9px] opacity-60">{fmtNum(n)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
                : db.view === "cards" ? <CardGrid rows={sorted} kind={kind} kindKey={db.kindKey} ctx={ctx} columns={columns} stats={stats} selectedId={db.selectedId} onSelect={selectId} favorites={db.favorites} onFav={db.toggleFavorite} compareIds={db.compareIds} onCompare={db.toggleCompare} />
                : db.view === "heat" ? <HeatmapMatrix rows={sorted} kindKey={db.kindKey} selectedId={db.selectedId} onSelect={selectId} />
                : db.view === "damage" ? <DamageChartView rows={sorted} ctx={ctx} selectedId={db.selectedId} onSelect={selectId} compareIds={db.compareIds} />
                : db.view === "ttk" ? <TtkView rows={sorted} ctx={ctx} selectedId={db.selectedId} onSelect={selectId} />
                : db.view === "tree" ? <TreeView ctx={ctx} rows={sorted} onSelectId={selectId} />
                : db.view === "para" ? <ParallelView rows={sorted} kind={kind} kindKey={db.kindKey} ctx={ctx} columns={columns} selectedId={db.selectedId} onSelect={selectId} compareIds={db.compareIds} />
                : db.view === "plot" ? <ScatterView rows={sorted} kind={kind} kindKey={db.kindKey} ctx={ctx} db={db} selectedId={db.selectedId} onSelect={selectId} compareIds={db.compareIds} />
                : <DataTable rows={sorted} kind={kind} kindKey={db.kindKey} ctx={ctx} columns={columns} stats={stats} sortKey={db.sortKey} sortDir={db.sortDir} onSort={db.setSort} selectedId={db.selectedId} onSelect={selectId} favorites={db.favorites} onFav={db.toggleFavorite} compareIds={db.compareIds} onCompare={db.toggleCompare} density={db.density} notes={db.notes} grouped={db.grouped} groupBy={kind.groupBy} />}
            </div>
            {compareRows.length > 0 && <div className="min-h-0"><ComparePanel rows={compareRows} kind={kind} kindKey={db.kindKey} ctx={ctx} columns={kind.columns.filter((c) => db.visibleCols.includes(c.key) || c.type === "num")} onRemove={db.toggleCompare} onClear={db.clearCompare} onSelect={selectId} /></div>}
          </div>
        </>
      )}

      <DetailDrawer row={selected} kindKey={selectedKind} ctx={ctx} peers={allRows} open={!!selected} onClose={() => db.select(null)} onSelectId={selectId}
        favorites={db.favorites} onFav={db.toggleFavorite} compareIds={db.compareIds} onCompare={db.toggleCompare} note={db.notes[db.selectedId]} onNote={db.setNote} />

      <CommandPalette cat={cat} db={db} onJump={selectId} recents={db.recents} />
      <ShortcutHelp />
    </div>
  );
}
