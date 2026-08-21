import React, { useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import TierBadge from "@/components/shared/TierBadge";

// Searchable multi-picker over real catalog rows (Unit or Module), 2-4 selections.
// Selected entities render as colored chips (same color coding the charts use).
export default function EntityPicker({ items, selectedIds, onAdd, onRemove, onClear, colors, max = 4, kindLabel = "UNIT" }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const byId = useMemo(() => Object.fromEntries(items.map((r) => [r.game_id, r])), [items]);

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    const pool = items.filter((r) => !selectedIds.includes(r.game_id));
    const hits = !t
      ? pool
      : pool.filter((r) => (r.name || "").toLowerCase().includes(t) || (r.game_id || "").toLowerCase().includes(t));
    return hits.slice(0, 24);
  }, [items, q, selectedIds]);

  const full = selectedIds.length >= max;

  return (
    <div className="schematic-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="tech-label">{kindLabel} SELECTION // {selectedIds.length}/{max}</div>
        {selectedIds.length > 0 && (
          <button
            onClick={onClear}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary"
          >
            clear all
          </button>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedIds.map((id, i) => {
            const r = byId[id];
            return (
              <span
                key={id}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 border bg-black/30 font-mono text-xs"
                style={{ borderColor: colors[i], color: colors[i] }}
              >
                <span className="truncate max-w-[180px]">{r?.name || id}</span>
                {r?.tier != null && <TierBadge tier={r.tier} />}
                <button onClick={() => onRemove(id)} className="hover:text-foreground" aria-label={`remove ${r?.name || id}`}>
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="relative">
        <div className={`flex items-center gap-2 border px-2 ${full ? "border-border/50 opacity-50" : "border-input"} bg-black/30`}>
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={q}
            disabled={full}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={full ? `maximum ${max} selected — remove one first` : `search ${kindLabel.toLowerCase()}s by name or id…`}
            className="w-full bg-transparent py-2 font-mono text-xs outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        {open && !full && (
          <div className="absolute z-30 left-0 right-0 mt-1 max-h-72 overflow-y-auto border border-border bg-popover shadow-xl">
            {matches.length === 0 ? (
              <div className="p-3 tech-label text-center">no match</div>
            ) : (
              matches.map((r) => (
                <button
                  key={r.game_id}
                  onMouseDown={(e) => { e.preventDefault(); onAdd(r.game_id); setQ(""); inputRef.current?.focus(); }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left border-b border-border/50 last:border-b-0 hover:bg-primary/10"
                >
                  <span className="font-mono text-xs truncate">
                    {r.name}
                    {r.work_in_progress && <span className="text-[9px] uppercase text-muted-foreground ml-1.5">[WIP]</span>}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                    {r.unit_class || r.module_class || ""} · {r.game_id}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
