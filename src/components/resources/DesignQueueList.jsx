import React, { useMemo, useState } from "react";
import { Minus, Plus, RotateCw } from "lucide-react";
import { fmtNum } from "@/lib/gameData";

const SOURCES = [
  ["all", "ALL"],
  ["shipped", "SHIPPED"],
  ["player", "PLAYER"],
];

// Production-queue picker over real design rows (GameBlueprint + PlayerDesign).
// designs: rows tagged with `_source: "shipped" | "player"`, keyed by game_id.
export default function DesignQueueList({ designs, counts, onBump, loading, playerState }) {
  const [q, setQ] = useState("");
  const [src, setSrc] = useState("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return designs
      .filter((d) => (src === "all" ? true : d._source === src))
      .filter((d) => !needle || String(d.name || "").toLowerCase().includes(needle) || String(d.folder || "").toLowerCase().includes(needle))
      .sort((a, b) => (a._source === b._source ? String(a.name).localeCompare(String(b.name)) : a._source === "shipped" ? -1 : 1));
  }, [designs, q, src]);

  const nShipped = designs.filter((d) => d._source === "shipped").length;
  const nPlayer = designs.filter((d) => d._source === "player").length;

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">
        {SOURCES.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSrc(key)}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
              src === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            {label} <span className="opacity-60">{key === "all" ? designs.length : key === "shipped" ? nShipped : nPlayer}</span>
          </button>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="FILTER DESIGNS…"
        className="w-full mb-2 bg-black/30 border border-border rounded-none px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
      />

      {playerState?.isError && (
        <div className="flex items-center justify-between gap-2 border border-[#ffb020]/40 bg-[#ffb020]/5 px-2 py-1.5 mb-2">
          <span className="tech-label text-[#ffb020]">▲ Couldn&apos;t load player designs</span>
          <button onClick={playerState.onRetry} className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:text-primary">
            <RotateCw size={10} /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="tech-label py-8 text-center animate-pulse">Loading designs…</div>
      ) : filtered.length === 0 ? (
        <div className="tech-label py-8 text-center">
          {src === "player" && nPlayer === 0 && !playerState?.isError
            ? "No player designs imported — drop a .station file on the Game Data page"
            : "No designs match"}
        </div>
      ) : (
        <div className="space-y-px max-h-[560px] overflow-y-auto">
          {filtered.map((d) => {
            const n = counts[d.game_id] || 0;
            return (
              <div key={d.game_id} className={`flex items-center gap-2 px-1 py-1.5 border-b border-border/40 ${n ? "bg-primary/5" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xs truncate">{d.name}</div>
                  <div className="font-mono text-[9px] text-muted-foreground truncate">
                    {d._source === "player" ? "PLAYER" : d.folder || "SHIPPED"} · {fmtNum(d.part_count)} parts · {fmtNum(d.cost_resources)} RU
                    {n ? ` · ×${n} = ${fmtNum((d.cost_resources || 0) * n)} RU` : ""}
                  </div>
                </div>
                <button onClick={() => onBump(d.game_id, -1)} className="border border-border w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50">
                  <Minus size={11} />
                </button>
                <span className="font-mono text-xs w-6 text-center tabular-nums">{n}</span>
                <button onClick={() => onBump(d.game_id, 1)} className="border border-border w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50">
                  <Plus size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
