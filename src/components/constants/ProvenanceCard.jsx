import React from "react";
import { Fingerprint } from "lucide-react";
import { fmtNum } from "@/lib/gameData";

// DatasetBuild (1 row): "what data am I looking at" — the page's header act.
// previous_build / changes are dead in the current dataset (no second build yet) and are not shown.
export default function ProvenanceCard({ row }) {
  if (!row) return null;
  const counts = Object.entries(row.row_counts || {}).sort((a, b) => b[1] - a[1]);
  const total = counts.reduce((s, [, n]) => s + (Number(n) || 0), 0);
  const date = String(row.generated_utc || "").slice(0, 10);
  return (
    <div className="schematic-panel p-4 bg-gradient-to-r from-card to-primary/5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Fingerprint size={26} className="text-primary shrink-0" />
          <div className="min-w-0">
            <div className="font-display font-bold text-lg tracking-[0.15em] uppercase leading-none">
              Dataset {row.game_version || "—"} <span className="text-primary">·</span> build {row.buildid || "—"}
            </div>
            <p className="tech-label mt-1.5">
              Generated {row.generated_utc || "—"} · Unity {row.unity_version || "—"}
            </p>
          </div>
        </div>
        <div className="font-mono text-[10px] text-muted-foreground text-right">
          <div>
            catalog <span className="text-foreground" title={row.catalog_hash || ""}>{String(row.catalog_hash || "—").slice(0, 12)}</span>
          </div>
          <div className="mt-1">
            <span className="text-primary font-semibold">{fmtNum(total)}</span> rows · {counts.length} tables{date ? ` · ${date}` : ""}
          </div>
        </div>
      </div>
      {counts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-1 font-mono text-[10px]">
          {counts.map(([table, n]) => (
            <div key={table} className="flex items-baseline justify-between gap-2 min-w-0">
              <span className="text-muted-foreground truncate">{table}</span>
              <span className="text-foreground ember-glow shrink-0">{fmtNum(n)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
