import React, { useMemo } from "react";
import { Search } from "lucide-react";
import { fmtNum } from "@/lib/gameData";

// Grouped, searchable design list: player imports first, then the shipped catalog by folder.
const GROUPS = [
  { key: "player", label: "Imported · PlayerDesign", match: (d) => d.source === "player" },
  { key: "fleet", label: "Shipped · Fleet designs", match: (d) => d.source === "shipped" && !d.folder },
  { key: "ai", label: "Shipped · AI stations", match: (d) => d.source === "shipped" && d.folder === "AI" },
  { key: "arena", label: "Shipped · Battle arena", match: (d) => d.source === "shipped" && d.folder === "BattleArenaBlueprints" },
  { key: "other", label: "Shipped · Other", match: (d) => d.source === "shipped" && d.folder && d.folder !== "AI" && d.folder !== "BattleArenaBlueprints" },
];

export default function DesignList({ designs = [], selectedId, onSelect, query = "", onQuery, playerLoading = false, playerError = null }) {
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hit = (d) => !q || d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
    return GROUPS
      .map((g) => ({ ...g, items: designs.filter((d) => g.match(d) && hit(d)) }))
      .filter((g) => g.key === "player" || g.items.length > 0);
  }, [designs, query]);

  return (
    <div className="schematic-panel flex flex-col min-h-0 flex-1">
      <div className="p-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2 border border-input bg-black/30 px-2 h-8">
          <Search size={12} className="text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => onQuery?.(e.target.value)}
            placeholder="Search designs…"
            className="bg-transparent outline-none w-full font-mono text-[11px] placeholder:text-muted-foreground/60"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {groups.map((g) => (
          <div key={g.key}>
            <div className="sticky top-0 z-10 px-2.5 py-1.5 bg-secondary/95 border-y border-border tech-label flex items-center justify-between">
              <span>{g.label}</span>
              <span className="text-foreground/70">{g.items.length}</span>
            </div>
            {g.key === "player" && playerError ? (
              <div className="px-3 py-3 font-mono text-[10px] text-destructive">
                Couldn't load imported designs — {String(playerError?.message || playerError)}
              </div>
            ) : g.key === "player" && playerLoading && !g.items.length ? (
              <div className="px-3 py-3 tech-label animate-pulse">Loading…</div>
            ) : g.key === "player" && !g.items.length ? (
              <div className="px-3 py-3 font-mono text-[10px] text-muted-foreground leading-relaxed">
                No imported designs yet — drop a <span className="text-foreground">.station</span> file below.
              </div>
            ) : (
              g.items.map((d) => {
                const active = d.id === selectedId;
                return (
                  <button
                    key={d.id}
                    onClick={() => onSelect?.(d.id)}
                    className={`w-full text-left px-2.5 py-1.5 flex items-center gap-2 border-l-2 transition-colors ${
                      active
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    }`}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 shrink-0"
                      style={{ background: d.source === "player" ? "#00d1c1" : "#c9d6e3" }}
                    />
                    <span className="font-mono text-[11px] truncate">{d.name}</span>
                    {d.usedByAi && <span className="shrink-0 font-mono text-[8px] tracking-[0.14em] text-[#2f9bff]">AI</span>}
                    {d.unresolved > 0 && <span className="shrink-0 font-mono text-[8px] tracking-[0.14em] text-[#ffb020]">!{d.unresolved}</span>}
                    <span className="ml-auto shrink-0 font-mono text-[9px] text-muted-foreground/70">{fmtNum(d.partCount)}p</span>
                  </button>
                );
              })
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
