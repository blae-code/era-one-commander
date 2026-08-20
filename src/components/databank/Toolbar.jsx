import React, { useMemo, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { X, Columns3, LayoutGrid, Table2, Grid3x3, Rows3, Star, Download, Bookmark, SlidersHorizontal, HelpCircle, Filter, Layers, Link2, ScatterChart, BarChart3, GitBranch, GitFork, Crosshair } from "lucide-react";
import { toast } from "sonner";
import { ClassDot } from "./Cells";
import SearchSuggest from "./SearchSuggest";
import { fmtNum } from "@/lib/gameData";

const Btn = ({ active, children, ...p }) => (
  <button {...p} className={`inline-flex items-center gap-1 px-2 h-7 border font-mono text-[10px] uppercase tracking-wider transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"} ${p.className || ""}`}>{children}</button>
);

export default function Toolbar({ db, kind, allRows, filteredRows, ctx, errors, onExport, onJump }) {
  const copyLink = () => { navigator.clipboard.writeText(window.location.href); toast.success("Share link copied", { description: "Query, filters, sort and view included" }); };

  const facetValues = useMemo(() => {
    const out = {};
    for (const [key] of kind.facets) {
      const c = new Map();
      for (const r of allRows) { const v = String(r[key] ?? "—"); c.set(v, (c.get(v) || 0) + 1); }
      out[key] = [...c.entries()].sort((a, b) => b[1] - a[1]);
    }
    return out;
  }, [allRows, kind]);
  const rangeBounds = useMemo(() => {
    const out = {};
    for (const key of kind.ranges) {
      const col = kind.columns.find((c) => c.key === key); if (!col) continue;
      const vals = allRows.map((r) => col.get(r, ctx)).filter((v) => typeof v === "number");
      if (vals.length) out[key] = { min: Math.min(...vals), max: Math.max(...vals), col };
    }
    return out;
  }, [allRows, kind, ctx]);
  const activeFilters = Object.values(db.facetSel).filter((s) => s.size).length + Object.keys(db.ranges).length + (db.favOnly ? 1 : 0);
  const [presetName, setPresetName] = useState("");

  return (
    <div className="flex flex-col gap-2 mb-3">
      <div className="flex items-center gap-2 flex-wrap">
        <SearchSuggest db={db} kind={kind} kindKey={db.kindKey} allRows={allRows} ctx={ctx} errors={errors} onJump={onJump} />
        <Popover>
          <PopoverTrigger asChild><Btn title="query syntax"><HelpCircle size={12} /></Btn></PopoverTrigger>
          <PopoverContent className="w-96 text-[11px] font-mono leading-relaxed" align="end">
            <div className="tech-label mb-1">Query language</div>
            <div><b>words</b> — match name / id / info / description (all words must match)</div>
            <div><b>field:value</b> — contains; comma = OR → <code>class:weapon,utility</code></div>
            <div><b>field&gt;10 field&lt;=5 field=3 field!=x</b> — numeric / exact</div>
            <div><b>fav:yes</b> favourites · <b>wip:yes</b> show unfinished</div>
            <div className="mt-1 text-muted-foreground">fields: {kind.columns.map((c) => c.key).slice(0, 18).join(", ")}…</div>
            <div className="text-muted-foreground">aliases: dps hp cost tier class type range armor speed crew energy pen rof time depth</div>
            <div className="mt-1 text-muted-foreground">keys: <b>/</b> search · <b>↑↓</b> move · <b>c</b> compare · <b>f</b> favourite · <b>Esc</b></div>
            {errors.length ? <div className="mt-1 text-amber-400">{errors.join("; ")}</div> : null}
          </PopoverContent>
        </Popover>
        <div className="h-5 w-px bg-border mx-1" />
        <Btn active={db.view === "table"} onClick={() => db.setView("table")} title="table"><Table2 size={12} /></Btn>
        <Btn active={db.view === "cards"} onClick={() => db.setView("cards")} title="cards"><LayoutGrid size={12} /></Btn>
        <Btn active={db.view === "heat"} onClick={() => db.setView("heat")} title="dps vs class heatmap"><Grid3x3 size={12} /></Btn>
        <Btn active={db.view === "plot"} onClick={() => db.setView("plot")} title="scatter plot — any stat vs any stat"><ScatterChart size={12} /></Btn>
        <Btn active={db.view === "damage"} onClick={() => db.setView("damage")} title="damage charts — weapons vs a specific armour class"><BarChart3 size={12} /></Btn>
        <Btn active={db.view === "para"} onClick={() => db.setView("para")} title="parallel coordinates — every numeric column at once"><GitBranch size={12} /></Btn>
        <Btn active={db.view === "tree"} onClick={() => db.setView("tree")} title="tech tree — research milestones and the modules they unlock"><GitFork size={12} /></Btn>
        <Btn active={db.view === "ttk"} onClick={() => db.setView("ttk")} title="time-to-kill matrix — damage output vs armor & shield profiles"><Crosshair size={12} /></Btn>
        {kind.groupBy && <Btn active={db.grouped} onClick={() => db.setGrouped(!db.grouped)} title="group rows by class"><Layers size={12} /></Btn>}
        <div className="h-5 w-px bg-border mx-1" />
        <Popover>
          <PopoverTrigger asChild><Btn title="columns"><Columns3 size={12} /> cols</Btn></PopoverTrigger>
          <PopoverContent className="w-64 max-h-80 overflow-auto" align="end">
            <div className="flex items-center justify-between mb-2"><div className="tech-label">Columns</div><button onClick={db.resetCols} className="font-mono text-[10px] text-muted-foreground hover:text-primary">reset</button></div>
            {kind.columns.map((c) => (
              <label key={c.key} className="flex items-center gap-2 py-0.5 text-xs cursor-pointer">
                <Checkbox checked={db.visibleCols.includes(c.key)} onCheckedChange={(v) => db.setVisibleCols(v ? [...db.visibleCols, c.key] : db.visibleCols.filter((k) => k !== c.key))} />
                <span>{c.label}</span><span className="ml-auto font-mono text-[9px] text-muted-foreground">{c.key}</span>
              </label>
            ))}
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild><Btn title="density"><Rows3 size={12} /></Btn></PopoverTrigger>
          <PopoverContent className="w-40" align="end">
            {["compact", "normal", "comfortable"].map((d) => <button key={d} onClick={() => db.setDensity(d)} className={`block w-full text-left px-2 py-1 font-mono text-[10px] uppercase ${db.density === d ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>{d}</button>)}
          </PopoverContent>
        </Popover>
        <Btn active={db.favOnly} onClick={() => db.setFavOnly(!db.favOnly)} title="favourites only"><Star size={12} fill={db.favOnly ? "currentColor" : "none"} /> {db.favorites.size}</Btn>
        <Popover>
          <PopoverTrigger asChild><Btn title="presets"><Bookmark size={12} /> presets</Btn></PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="tech-label mb-2">Saved views</div>
            {db.presets.filter((p) => p.kind === db.kindKey).map((p) => (
              <div key={p.name + p.ts} className="flex items-center gap-2 py-0.5 text-xs"><button onClick={() => db.loadPreset(p)} className="flex-1 text-left hover:text-primary truncate">{p.name}</button><button onClick={() => db.deletePreset(p)} className="text-muted-foreground hover:text-red-400"><X size={11} /></button></div>
            ))}
            {!db.presets.some((p) => p.kind === db.kindKey) && <div className="text-[11px] text-muted-foreground mb-1">none yet for {kind.label}</div>}
            <div className="flex gap-1 mt-2"><input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="name this view" className="flex-1 h-7 px-2 bg-background/60 border border-border font-mono text-[11px] outline-none focus:border-primary" /><Btn onClick={() => { if (presetName.trim()) { db.savePreset(presetName.trim()); setPresetName(""); } }}>save</Btn></div>
            <div className="text-[10px] text-muted-foreground mt-2">A preset stores query, filters, sort, view and columns. The URL is also shareable as-is.</div>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild><Btn title="export filtered rows"><Download size={12} /></Btn></PopoverTrigger>
          <PopoverContent className="w-44" align="end">
            <button onClick={() => onExport("csv")} className="block w-full text-left px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground hover:text-primary">CSV (visible cols)</button>
            <button onClick={() => onExport("json")} className="block w-full text-left px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground hover:text-primary">JSON (full rows)</button>
          </PopoverContent>
        </Popover>
        <Btn onClick={copyLink} title="copy shareable link — sends your friend this exact view"><Link2 size={12} /></Btn>
        {(activeFilters > 0 || db.q) && <Btn onClick={db.clearAll} title="clear query, filters, ranges"><X size={12} /> clear{activeFilters ? ` ${activeFilters}` : ""}</Btn>}
      </div>

      {/* facets + ranges */}
      <div className="flex items-start gap-2 flex-wrap">
        <span className="tech-label mt-1.5 inline-flex items-center gap-1"><Filter size={10} /> filter</span>
        {kind.facets.map(([key, label]) => {
          const vals = facetValues[key] || []; if (vals.length < 2) return null;
          const sel = db.facetSel[key] || new Set();
          return (
            <Popover key={key}>
              <PopoverTrigger asChild><Btn active={sel.size > 0}>{label}{sel.size ? ` · ${sel.size}` : ""}</Btn></PopoverTrigger>
              <PopoverContent className="w-64 max-h-80 overflow-auto" align="start">
                <div className="flex items-center justify-between mb-1"><div className="tech-label">{label}</div>{sel.size ? <button onClick={() => db.clearFacet(key)} className="font-mono text-[10px] text-muted-foreground hover:text-primary">clear</button> : null}</div>
                {vals.map(([v, n]) => (
                  <label key={v} className="flex items-center gap-2 py-0.5 text-xs cursor-pointer">
                    <Checkbox checked={sel.has(v)} onCheckedChange={() => db.toggleFacet(key, v)} />
                    <span className="truncate"><ClassDot value={v} />{v}</span><span className="ml-auto font-mono text-[9px] text-muted-foreground">{n}</span>
                  </label>
                ))}
              </PopoverContent>
            </Popover>
          );
        })}
        {kind.ranges.length > 0 && (
          <Popover>
            <PopoverTrigger asChild><Btn active={Object.keys(db.ranges).length > 0}><SlidersHorizontal size={12} /> ranges{Object.keys(db.ranges).length ? ` · ${Object.keys(db.ranges).length}` : ""}</Btn></PopoverTrigger>
            <PopoverContent className="w-80 max-h-96 overflow-auto" align="start">
              <div className="tech-label mb-2">Numeric ranges</div>
              {kind.ranges.map((key) => {
                const b = rangeBounds[key]; if (!b) return null;
                const cur = db.ranges[key] || [null, null]; const lo = cur[0] ?? b.min, hi = cur[1] ?? b.max;
                const step = (b.max - b.min) / 100 || 1;
                return (
                  <div key={key} className="mb-3">
                    <div className="flex justify-between text-[10px] font-mono mb-1"><span className="text-muted-foreground">{b.col.label}</span><span>{fmtNum(lo, b.col.dec)} – {fmtNum(hi, b.col.dec)}{cur[0] != null || cur[1] != null ? <button onClick={() => db.setRange(key, null, null)} className="ml-2 text-muted-foreground hover:text-primary">×</button> : null}</span></div>
                    <Slider min={b.min} max={b.max} step={step} value={[lo, hi]} onValueChange={([a, c]) => db.setRange(key, a <= b.min ? null : a, c >= b.max ? null : c)} />
                  </div>
                );
              })}
            </PopoverContent>
          </Popover>
        )}
        <span className="tech-label mt-1.5 ml-auto">{filteredRows.length} / {allRows.length}</span>
      </div>
    </div>
  );
}