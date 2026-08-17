import React from "react";
import { Input } from "@/components/ui/input";
import { Search, Database as DatabaseIcon } from "lucide-react";
import { fmtNum } from "@/lib/gameData";

// Command-Deck style banner for the Databank: identity block, catalog readout, search.
export default function DatabankHeader({ readout, search, onSearch, placeholder, subtitle }) {
  return (
    <div className="schematic-panel p-4 mb-4 flex items-center justify-between gap-4 bg-gradient-to-r from-card to-primary/5">
      <div className="flex items-center gap-4 min-w-0">
        <DatabaseIcon size={38} className="text-primary shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">DATABANK</h1>
          <p className="tech-label mt-1.5 truncate">{subtitle}</p>
        </div>
      </div>

      <div className="hidden xl:flex gap-6 font-mono text-center">
        {readout.map(([k, v]) => (
          <div key={k}>
            <div className="text-xl font-semibold text-primary leading-none">{fmtNum(v)}</div>
            <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div>
          </div>
        ))}
      </div>

      <div className="relative w-72 shrink-0">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-8 rounded-none font-mono text-xs bg-background/60"
        />
      </div>
    </div>
  );
}