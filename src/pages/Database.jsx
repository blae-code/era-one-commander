import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { DatabaseZap, Database as DatabaseIcon } from "lucide-react";
import { useGameCatalog, fmtNum } from "@/lib/gameData";
import { KINDS, KIND_KEYS } from "@/components/databank/catalog";
import { parseQuery, applyQuery, sortRows, columnStats, toCSV } from "@/components/databank/query";
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
import CommandPalette from "@/components/databank/CommandPalette";
import ShortcutHelp from "@/components/databank/ShortcutHelp";
import { useDatabankKeys } from "@/components/databank/useDatabankKeys";

// Databank v2 — the granular browser over the real ERA ONE dataset.
// State lives in the URL (shareable) + localStorage (favourites, presets, columns, notes). See components/databank/.
export default function Database() {
  const cat = useGameCatalog(true);
  const db = useDatabank();
  useDatabankKeys(db);
  const kind = db.kind;
  const ctx = cat;
  const allRows = useMemo(() => kind.rows(cat) || [], [kind, cat]);
  const parsed = useMemo(() => parseQuery(db.q), [db.q]);
  const { rows: filtered, errors } = useMemo(
    () => applyQuery(allRows, kind, ctx, parsed, { favorites: db.favorites, facetSel: db.facetSel, ranges: db.ranges, favOnly: db.favOnly, hideWip: db.hideWip }),
    [allRows, kind, ctx, parsed, db.favorites, db.facetSel, db.ranges, db.favOnly, db.hideWip]);
  const sorted = useMemo(() => sortRows(filtered, kind, ctx, db.sortKey, db.sortDir), [filtered, kind, ctx, db.sortKey, db.sortDir]);
  const columns = useMemo(() => kind.columns.filter((c) => db.visibleCols.includes(c.key)), [kind, db.visibleCols]);
  const stats = useMemo(() => columnStats(filtered, kind, ctx), [filtered, kind, ctx]);
  const selected = db.selectedId ? cat.byId[db.selectedId] : null;
  const toKind = (k) => (k === "CombatTemplate" || k === "FormationModifier" ? "Doctrine" : k);
  const selectedKind = selected ? toKind(cat.kindOf(db.selectedId)) || db.kindKey : db.kindKey;
  const compareRows = db.compareIds.map((id) => cat.byId[id]).filter(Boolean).filter((r) => allRows.includes(r));

  const selectId = (id) => {
    if (!id) return;
    const kk = toKind(cat.kindOf(id));
    if (kk && kk !== db.kindKey && KIND_KEYS.includes(kk)) db.setKind(kk);
    db.select(id);
    db.pushRecent(id);
  };
  const exportRows = (fmt) => {
    const blob = fmt === "csv" ? new Blob([toCSV(sorted, kind, ctx, db.visibleCols)], { type: "text/csv" }) : new Blob([JSON.stringify(sorted, null, 1)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `era-one-${kind.label.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.${fmt}`; a.click(); URL.revokeObjectURL(a.href);
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
              <span className="border border-border px-1.5 py-0.5">1–7 views</span>
              <span className="border border-border px-1.5 py-0.5">? keys</span>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex gap-5 font-mono text-center">
          {readout.map(([k, v]) => (<div key={k}><div className="text-lg font-semibold text-primary leading-none">{fmtNum(v)}</div><div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div></div>))}
        </div>
      </div>

      {/* kind tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        {KIND_KEYS.map((k) => { const Icon = KIND_ICON[k]; const n = (KINDS[k].rows(cat) || []).length; return (
          <button key={k} onClick={() => db.setKind(k)}
            className={`inline-flex items-center gap-1.5 px-3 h-8 font-mono text-[10px] uppercase tracking-wider border transition-colors ${db.kindKey === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}>
            <Icon size={12} /> {KINDS[k].label} <span className="opacity-60">{n}</span>
          </button>); })}
      </div>

      {cat.isEmpty && !cat.isLoading ? (
        <div className="schematic-panel p-8 text-center">
          <DatabaseZap size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-wider">No game data loaded yet</div>
          <p className="tech-label mt-1">Import the dataset from the <Link to="/gamedata" className="text-primary underline">Game Data</Link> page (admin).</p>
        </div>
      ) : (
        <>
          <Toolbar db={db} kind={kind} allRows={allRows} filteredRows={filtered} ctx={ctx} errors={errors} onExport={exportRows} onJump={selectId} />
          <ActiveChips db={db} kind={kind} parsed={parsed} />
          {(db.view === "table" || db.view === "cards") && !cat.isLoading && filtered.length > 0 && <StatsStrip rows={filtered} kind={kind} ctx={ctx} db={db} />}
          <div className={`flex-1 min-h-0 grid gap-3 ${compareRows.length ? "grid-cols-1 xl:grid-cols-[1fr_440px]" : "grid-cols-1"}`}>
            <div className="min-h-0">
              {cat.isLoading ? <div className="schematic-panel p-12 tech-label text-center animate-pulse">Accessing databank…</div>
                : db.view === "cards" ? <CardGrid rows={sorted} kind={kind} kindKey={db.kindKey} ctx={ctx} columns={columns} stats={stats} selectedId={db.selectedId} onSelect={selectId} favorites={db.favorites} onFav={db.toggleFavorite} compareIds={db.compareIds} onCompare={db.toggleCompare} />
                : db.view === "heat" ? <HeatmapMatrix rows={sorted} kindKey={db.kindKey} selectedId={db.selectedId} onSelect={selectId} />
                : db.view === "damage" ? <DamageChartView rows={sorted} ctx={ctx} selectedId={db.selectedId} onSelect={selectId} compareIds={db.compareIds} />
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