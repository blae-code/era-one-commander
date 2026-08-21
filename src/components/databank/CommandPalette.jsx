import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, CornerDownLeft, History, Table2, LayoutGrid, Grid3x3, ScatterChart, BarChart3, Star, Layers, X, Link2, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { KINDS, KIND_KEYS } from "./catalog";
import { EntityIcon, KIND_ICON } from "./Cells";

// ⌘K / Ctrl+K jump-to-anything: every entity across every kind, plus view & filter commands.
export default function CommandPalette({ cat, db, onJump, recents }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { if (open) { setQ(""); setI(0); setTimeout(() => inputRef.current?.focus(), 20); } }, [open]);

  // Extra kinds worth ⌘K jumps: distinctively-named, human-scale tables. The big synthetic tables
  // (ScenarioEntity, StatModifier, LocalizedString, Effectiveness…) would only add noise — their
  // rows are reached through their kind's own facets. Extras index once their rows are loaded
  // (Scenario/Objective are always on; the rest load on first visit to their kind).
  const PALETTE_EXTRAS = ["Scenario", "Objective", "ScenarioObjective", "GameHint", "GameEvent", "Remain", "EnemyWave", "AiPersonality", "AiLogicGraph", "AiFact", "AiGoal", "AiOperation", "ScoreWeight", "Station", "Asteroid", "Resource", "Faction", "Ability", "AttachmentRule"];
  const entities = useMemo(() => {
    const kinds = [
      ["Module", cat.modules], ["Unit", cat.units], ["Weapon", cat.weapons], ["Turret", cat.turrets], ["Subsystem", cat.subsystems], ["ResearchNode", cat.research], ["GameBlueprint", cat.blueprints],
      ...PALETTE_EXTRAS.map((k) => [k, cat.extra?.[k]]),
    ];
    const out = [];
    for (const [k, rows] of kinds) for (const r of rows || []) out.push({ type: "entity", id: r.game_id, row: r, kindKey: k, label: r.name || r.game_id, sub: `${k} · ${r.game_id}` });
    return out;
  }, [cat]); // eslint-disable-line react-hooks/exhaustive-deps

  const commands = useMemo(() => {
    const views = [["table", "Table view", Table2], ["cards", "Card view", LayoutGrid], ["heat", "Heatmap view", Grid3x3], ["plot", "Scatter plot view", ScatterChart], ["damage", "Damage charts view", BarChart3], ["para", "Parallel coordinates view", GitBranch]];
    const cmds = [
      ...KIND_KEYS.map((k) => ({ type: "cmd", id: `kind:${k}`, label: `Go to ${KINDS[k].label}`, sub: "dataset", Icon: KIND_ICON[k] || Table2, run: () => db.setKind(k) })),
      ...views.map(([v, label, Icon]) => ({ type: "cmd", id: `view:${v}`, label, sub: "view", Icon, run: () => db.setView(v) })),
      { type: "cmd", id: "fav", label: db.favOnly ? "Show all rows" : "Show favourites only", sub: "filter", Icon: Star, run: () => db.setFavOnly(!db.favOnly) },
      { type: "cmd", id: "grp", label: db.grouped ? "Ungroup rows" : "Group rows by class", sub: "view", Icon: Layers, run: () => db.setGrouped(!db.grouped) },
      { type: "cmd", id: "clear", label: "Clear query, filters and ranges", sub: "filter", Icon: X, run: db.clearAll },
      { type: "cmd", id: "copy", label: "Copy shareable link to this view", sub: "share", Icon: Link2, run: () => { navigator.clipboard.writeText(window.location.href); toast.success("Share link copied"); } },
    ];
    return cmds;
  }, [db]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) {
      const rec = recents.map((id) => entities.find((e) => e.id === id)).filter(Boolean).slice(0, 6).map((e) => ({ ...e, recent: true }));
      return [...rec, ...commands.slice(0, 12)];
    }
    const score = (text) => { const t = text.toLowerCase(); const idx = t.indexOf(s); return idx < 0 ? -1 : idx === 0 ? 0 : 1 + idx / 100; };
    /** @type {[number, any][]} */
    const hit = [];
    for (const e of entities) { const sc = Math.min(...[score(e.label), score(e.id)].map((x) => (x < 0 ? 999 : x))); if (sc < 999) hit.push([sc, e]); }
    for (const c of commands) { const sc = score(c.label); if (sc >= 0) hit.push([sc - 0.5, c]); }
    return hit.sort((a, b) => a[0] - b[0]).slice(0, 40).map(([, e]) => e);
  }, [q, entities, commands, recents]);

  useEffect(() => { setI(0); }, [q]);
  useEffect(() => {
    const el = listRef.current?.children?.[i];
    el?.scrollIntoView({ block: "nearest" });
  }, [i]);

  const activate = (item) => {
    if (!item) return;
    if (item.type === "entity") onJump(item.id); else item.run();
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="schematic-panel plate-texture w-[min(680px,92vw)] max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-3 h-11 border-b border-border">
          <Search size={14} className="text-primary" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setI((n) => Math.min(results.length - 1, n + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setI((n) => Math.max(0, n - 1)); }
              if (e.key === "Enter") { e.preventDefault(); activate(results[i]); }
            }}
            placeholder="Jump to any entity, or run a command…"
            className="flex-1 bg-transparent outline-none font-mono text-sm placeholder:text-muted-foreground/60" />
          <span className="font-mono text-[9px] text-muted-foreground border border-border px-1.5 py-0.5">ESC</span>
        </div>
        <div ref={listRef} className="overflow-auto py-1">
          {results.length === 0 && <div className="tech-label text-center py-8">Nothing matches “{q}”</div>}
          {results.map((item, n) => {
            const Icon = item.type === "cmd" ? item.Icon : null;
            return (
              <button key={`${item.type}:${item.id}`} onMouseEnter={() => setI(n)} onClick={() => activate(item)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left ${n === i ? "bg-primary/15" : "hover:bg-secondary/50"}`}>
                {item.type === "entity" ? <EntityIcon row={item.row} kindKey={item.kindKey} size={14} /> : <Icon size={14} className="text-muted-foreground shrink-0" />}
                <span className="min-w-0 flex-1">
                  <span className="block text-xs truncate">{item.label}</span>
                  <span className="block font-mono text-[9px] text-muted-foreground truncate">{item.sub}</span>
                </span>
                {item.recent && <History size={11} className="text-muted-foreground/70 shrink-0" />}
                {n === i && <CornerDownLeft size={11} className="text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
        <div className="border-t border-border px-3 py-1.5 font-mono text-[9px] text-muted-foreground flex gap-3">
          <span>↑↓ move</span><span>⏎ open</span><span>⌘K toggle</span><span className="ml-auto">{results.length} results</span>
        </div>
      </div>
    </div>
  );
}