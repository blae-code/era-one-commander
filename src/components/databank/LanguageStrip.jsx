import React, { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Languages } from "lucide-react";
import { useGameEntityRows } from "@/lib/gameData";

// Compact localisation strip: the record's display name in all 9 shipped languages.
// LocalizedString keys are dotted paths ('<Namespace>.<game_id>.Name', e.g. 'Module.TUR.002.Name'),
// so we match on the '.<game_id>.Name' suffix rather than guessing the namespace.
// Rows are fetched lazily — `enabled` is only true while the drawer is open on a localised kind.
const LANGS = [
  ["text_en", "EN"], ["text_fr", "FR"], ["text_de", "DE"], ["text_it", "IT"], ["text_es", "ES"],
  ["text_pt", "PT"], ["text_ru", "RU"], ["text_zh", "ZH"], ["text_zh_tw", "ZH-TW"],
];

export default function LanguageStrip({ gameId, enabled }) {
  const qc = useQueryClient();
  const { rows, isLoading, isError, error } = useGameEntityRows("LocalizedString", enabled);
  const loc = useMemo(
    () => (gameId ? rows.find((r) => typeof r.key === "string" && r.key.endsWith(`.${gameId}.Name`)) : null),
    [rows, gameId],
  );

  if (!enabled) return null;
  if (isLoading) return <div className="tech-label mb-3 animate-pulse">Loading localisation table…</div>;
  if (isError)
    return (
      <div className="tech-label mb-3 text-red-400">
        Couldn't load translations: {String(error?.message || error)}{" "}
        <button onClick={() => qc.invalidateQueries({ queryKey: ["game", "LocalizedString"] })} className="underline hover:text-primary">retry</button>
      </div>
    );
  if (!loc) return null;

  return (
    <div className="schematic-panel p-2.5 mb-4" role="group" aria-label="Designation in all 9 languages">
      <div className="tech-label mb-1.5 flex items-center gap-1.5"><Languages size={11} aria-hidden="true" /> Designation // {loc.key}</div>
      <div className="flex flex-wrap gap-1">
        {LANGS.map(([field, tag]) => {
          const missing = !loc[field];
          return (
            <span key={field} className="inline-flex items-center border border-border/70 bg-secondary/30"
              title={missing ? `${tag}: no translation — English fallback` : tag}>
              <span className="px-1 py-0.5 font-mono text-[8px] tracking-widest text-muted-foreground border-r border-border/70 bg-black/30">{tag}</span>
              <span className={`px-1.5 py-0.5 text-[10px] ${missing ? "text-muted-foreground/50 italic" : "text-foreground"}`}>
                {loc[field] || loc.text_en}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
