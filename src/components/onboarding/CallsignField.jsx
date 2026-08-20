import React from "react";
import { ChevronRight, RefreshCw } from "lucide-react";
import { sanitizeCallsign } from "@/lib/callsign";

const SUGGESTIONS = ["RUSTHAWK", "EMBERJACK", "SLAGWIND", "IRONVOW", "CINDERKIN", "SCRAPSAINT"];
export const pickSuggestion = () => SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];

// Hull-stencil input: monospaced slot counter, live plate preview, one-tap suggestions.
export default function CallsignField({ value, onChange, onCommit, hint }) {
  const clean = sanitizeCallsign(value).trim();
  const ready = clean.length >= 2;

  return (
    <div className="space-y-2.5">
      <div className={`flex items-stretch border bg-secondary/50 transition-colors ${ready ? "border-primary" : "border-input"}`}>
        <span className="px-3 flex items-center font-mono text-[10px] tracking-[0.2em] text-muted-foreground border-r border-input">CALLSIGN</span>
        <input autoFocus value={value} onChange={(e) => onChange(sanitizeCallsign(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && ready && onCommit()} placeholder={hint} maxLength={14} spellCheck={false}
          className="flex-1 min-w-0 bg-transparent px-3 h-12 font-display font-bold text-lg tracking-[0.22em] outline-none placeholder:text-muted-foreground/30" />
        <span className="px-2 flex items-center font-mono text-[9px] text-muted-foreground border-l border-input">{clean.length}/14</span>
        <button onClick={onCommit} disabled={!ready}
          className="px-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] bg-primary text-primary-foreground transition-colors disabled:opacity-40 disabled:bg-secondary disabled:text-muted-foreground hover:bg-primary/85">
          Seal <ChevronRight size={12} />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="tech-label inline-flex items-center gap-1"><RefreshCw size={10} /> Suggested</span>
        {SUGGESTIONS.slice(0, 4).map((s) => (
          <button key={s} onClick={() => onChange(s)}
            className="px-2 h-6 border border-border font-mono text-[10px] tracking-[0.12em] text-muted-foreground hover:border-primary hover:text-primary">
            {s}
          </button>
        ))}
      </div>

      <div className="border border-border bg-background/60 p-3 flex items-center justify-between gap-3">
        <span className="tech-label">Plate preview</span>
        <span className={`font-display font-bold text-xl tracking-[0.28em] ${ready ? "text-primary ember-glow" : "text-muted-foreground/40"}`}>
          {clean || "— — — —"}
        </span>
      </div>
    </div>
  );
}