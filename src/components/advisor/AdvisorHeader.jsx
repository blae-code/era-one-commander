import React from "react";
import { BrainCircuit } from "lucide-react";

export default function AdvisorHeader({ agents, active, onSelect }) {
  const current = agents.find((a) => a.name === active);
  return (
    <div className="schematic-panel p-4 mb-4 bg-gradient-to-r from-card to-primary/5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <BrainCircuit size={38} className="text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">ADVISORY</h1>
            <p className="tech-label mt-1.5 truncate">{current?.tagline}</p>
          </div>
        </div>
        <div className="hidden xl:block font-mono text-center">
          <div className="text-xl font-semibold leading-none text-[#22c55e]">{agents.length}</div>
          <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">UNITS ONLINE</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
        {agents.map((a) => {
          const Icon = a.icon;
          const isActive = a.name === active;
          return (
            <button
              key={a.name}
              onClick={() => onSelect(a.name)}
              className={`flex items-center gap-2.5 px-3 py-2.5 border-2 text-left transition-colors ${
                isActive ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-input"
              }`}
            >
              <Icon size={17} className="shrink-0" />
              <span className="font-display font-semibold text-sm uppercase tracking-wide flex-1">{a.label}</span>
              <span className="font-mono text-[9px] opacity-50">{a.code}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}