import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, Network } from "lucide-react";
import BlueprintCard from "@/components/blueprints/BlueprintCard";
import ArchetypeBoard from "@/components/blueprints/ArchetypeBoard";

const CLASSES = ["all", "corvette", "frigate", "destroyer", "cruiser", "battleship", "carrier"];

export default function Blueprints() {
  const [search, setSearch] = useState("");
  const [cls, setCls] = useState("all");
  const [view, setView] = useState("grid");

  const { data: blueprints = [], isLoading } = useQuery({
    queryKey: ["blueprints-all"],
    queryFn: () => base44.entities.Blueprint.list("-created_date", 200),
  });

  const filtered = blueprints.filter((bp) => {
    if (cls !== "all" && bp.ship_class !== cls) return false;
    const q = search.toLowerCase();
    return !q || [bp.name, bp.role, bp.author_name, bp.hull_name].some((s) => s?.toLowerCase().includes(q));
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-xl tracking-[0.15em] uppercase">Blueprint Database</h1>
          <p className="tech-label mt-0.5">{filtered.length} registered designs</p>
        </div>
        <div className="relative w-72">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search designation, role, engineer..."
            className="pl-8 rounded-none font-mono text-xs"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-5">
        {CLASSES.map((c) => (
          <button
            key={c}
            onClick={() => setCls(c)}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
              cls === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            {c}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          {[["grid", "Registry", LayoutGrid], ["archetype", "Archetypes", Network]].map(([k, label, Icon]) => (
            <button key={k} onClick={() => setView(k)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                view === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}>
              <Icon size={11} /> {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="tech-label text-center py-16 animate-pulse">Accessing database...</div>
      ) : filtered.length === 0 ? (
        <div className="schematic-panel p-12 text-center tech-label">No blueprints match the current filters</div>
      ) : view === "archetype" ? (
        <ArchetypeBoard blueprints={filtered} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((bp, i) => (
            <BlueprintCard key={bp.id} bp={bp} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}