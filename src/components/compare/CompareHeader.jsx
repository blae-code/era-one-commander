import React from "react";
import { ArrowLeftRight } from "lucide-react";

// Command-Deck style banner for the Comparison Engine: identity block, live delta readout, mode switch.
export default function CompareHeader({ mode, onMode, modes, readout, subtitle }) {
  return (
    <div className="schematic-panel p-4 mb-4 flex items-center justify-between gap-4 bg-gradient-to-r from-card to-primary/5">
      <div className="flex items-center gap-4 min-w-0">
        <ArrowLeftRight size={38} className="text-primary shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">COMPARISON ENGINE</h1>
          <p className="tech-label mt-1.5 truncate">{subtitle}</p>
        </div>
      </div>

      <div className="hidden xl:flex gap-6 font-mono text-center">
        {readout.map(([k, v, hex]) => (
          <div key={k}>
            <div className="text-xl font-semibold leading-none" style={{ color: hex || "hsl(var(--primary))" }}>{v}</div>
            <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 shrink-0">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => onMode(m)}
            className={`px-4 py-2 font-display font-semibold text-xs uppercase tracking-wider border transition-colors ${
              mode === m ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}