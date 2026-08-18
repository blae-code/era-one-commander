import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { EntityIcon } from "./Cells";
import { ALIASES } from "./catalog";

// Search box with live suggestions: entity names (jump), field names, enum values.
export default function SearchSuggest({ db, kind, kindKey, allRows, ctx, errors, onJump }) {
  const [draft, setDraft] = useState(db.q);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => setDraft(db.q), [db.q]);
  useEffect(() => { const t = setTimeout(() => { if (draft !== db.q) db.setQuery(draft); }, 180); return () => clearTimeout(t); }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onKey = (e) => { if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) { e.preventDefault(); inputRef.current?.focus(); } };
    const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    window.addEventListener("keydown", onKey); window.addEventListener("mousedown", onClick);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onClick); };
  }, []);

  const enumValues = useMemo(() => {
    const out = {};
    for (const c of kind.columns) {
      if (c.type !== "enum") continue;
      const s = new Set();
      for (const r of allRows) { const v = c.get(r, ctx); if (v != null && v !== "") String(v).split("|").forEach((p) => p && s.add(p)); }
      out[c.key] = [...s].sort();
    }
    return out;
  }, [kind, allRows, ctx]);

  const replaceLast = (txt) => {
    const parts = draft.split(/\s+/); parts[parts.length - 1] = txt;
    const next = parts.join(" ");
    setDraft(next); db.setQuery(next.trimEnd() === next ? next : next); setHi(0); inputRef.current?.focus();
  };

  const sugg = useMemo(() => {
    const tokens = draft.split(/\s+/);
    const last = tokens[tokens.length - 1] || "";
    if (!last) return [];
    const items = [];
    const m = last.match(/^([a-zA-Z_]+)(:|=|!=|>=|<=|>|<)(.*)$/);
    if (m) {
      const [, field, op, partial] = m;
      const keys = [field.toLowerCase(), ...(ALIASES[field.toLowerCase()] || [])];
      const seen = new Set();
      for (const k of keys) for (const v of enumValues[k] || []) {
        if (seen.has(v) || !v.toLowerCase().includes(partial.toLowerCase())) continue;
        seen.add(v);
        items.push({ kind: "value", label: `${field}${op}${v}`, hint: "apply", run: () => replaceLast(`${field}${op}${v} `) });
      }
    } else {
      const lf = last.toLowerCase();
      const fieldNames = [...new Set([...Object.keys(ALIASES), ...kind.columns.map((c) => c.key)])];
      for (const f of fieldNames) if (f.startsWith(lf) && f !== lf) items.push({ kind: "field", label: `${f}:`, hint: "field", run: () => replaceLast(`${f}:`) });
      if (lf.length >= 2) {
        for (const r of allRows) {
          if (!(r.name || "").toLowerCase().includes(lf)) continue;
          items.push({ kind: "row", label: r.name, row: r, hint: r.game_id, run: () => { setOpen(false); onJump(r.game_id); } });
          if (items.length > 14) break;
        }
      }
    }
    return items.slice(0, 9);
  }, [draft, enumValues, kind, allRows]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" && sugg.length) { e.preventDefault(); setOpen(true); setHi((h) => Math.min(sugg.length - 1, h + 1)); }
    else if (e.key === "ArrowUp" && open) { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === "Enter") { if (open && sugg[hi]) { e.preventDefault(); sugg[hi].run(); } else { db.setQuery(draft); setOpen(false); } }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  };

  return (
    <div ref={boxRef} className="relative flex-1 min-w-[280px]">
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input ref={inputRef} value={draft}
        onChange={(e) => { setDraft(e.target.value); setOpen(true); setHi(0); }}
        onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
        placeholder={`Search ${kind.label.toLowerCase()} — words, field:value, dps>50 … ( / to focus )`}
        className={`w-full h-8 pl-8 pr-8 bg-background/60 border font-mono text-xs outline-none focus:border-primary ${errors.length ? "border-amber-500/70" : "border-border"}`} />
      {draft && <button onClick={() => { setDraft(""); db.setQuery(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={12} /></button>}
      {open && sugg.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 border border-border bg-popover shadow-lg max-h-72 overflow-auto">
          {sugg.map((s, i) => (
            <button key={s.label + i} onMouseDown={(e) => { e.preventDefault(); s.run(); }} onMouseEnter={() => setHi(i)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left font-mono text-[11px] ${i === hi ? "bg-primary/15 text-foreground" : "text-muted-foreground"}`}>
              {s.kind === "row" ? <EntityIcon row={s.row} kindKey={kindKey} size={13} /> : <ArrowRight size={11} className="text-primary shrink-0" />}
              <span className="truncate">{s.label}</span>
              <span className="ml-auto text-[9px] uppercase tracking-wider opacity-60 shrink-0">{s.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}