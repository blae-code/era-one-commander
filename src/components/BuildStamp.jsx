import React from "react";
import { useGameEntityRows } from "@/lib/gameData";

// One-line dataset provenance stamp for the Layout footer, e.g.
// "DATASET 0.12.2 · BUILD 24615926 · 2026-08-19" — values from DatasetBuild (1 row),
// never hardcoded. Renders nothing while loading, on error, or when no row exists.
export default function BuildStamp() {
  const { rows, isLoading, isError } = useGameEntityRows("DatasetBuild");
  const b = rows[0];
  if (isLoading || isError || !b || (!b.game_version && !b.buildid)) return null;
  const date = String(b.generated_utc || "").slice(0, 10);
  return (
    <span
      className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap"
      title={`catalog ${b.catalog_hash || "—"} · Unity ${b.unity_version || "—"}`}
    >
      DATASET {b.game_version || "—"} · BUILD {b.buildid || "—"}{date ? ` · ${date}` : ""}
    </span>
  );
}
