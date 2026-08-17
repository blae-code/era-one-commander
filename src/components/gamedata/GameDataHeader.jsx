import React from "react";
import { Button } from "@/components/ui/button";
import { DatabaseZap, RefreshCw, ShieldCheck } from "lucide-react";

// Command-Deck style banner for Game Data: build identity, sync readout, pipeline actions.
export default function GameDataHeader({ subtitle, readout, onRefetch, isFetching, onVerify, verifying, onRun, running, canRun }) {
  return (
    <div className="schematic-panel p-4 mb-4 flex items-center justify-between gap-4 bg-gradient-to-r from-card to-primary/5">
      <div className="flex items-center gap-4 min-w-0">
        <DatabaseZap size={38} className="text-primary shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">GAME DATA</h1>
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

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" className="rounded-none font-display uppercase tracking-wider text-xs" onClick={onRefetch} disabled={isFetching}>
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Re-check
        </Button>
        <Button variant="outline" size="sm" className="rounded-none font-display uppercase tracking-wider text-xs" onClick={onVerify} disabled={verifying}>
          <ShieldCheck size={13} /> {verifying ? "Verifying…" : "Verify"}
        </Button>
        <Button size="sm" className="rounded-none font-display uppercase tracking-wider text-xs" onClick={onRun} disabled={!canRun || running}>
          <DatabaseZap size={13} /> {running ? "Importing…" : "Import / update"}
        </Button>
      </div>
    </div>
  );
}