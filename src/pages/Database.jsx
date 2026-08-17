import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { CategoryIcon } from "@/components/icons/EraIcons";
import TierBadge from "@/components/shared/TierBadge";
import ComponentDetail from "@/components/database/ComponentDetail";
import { fmt } from "@/lib/shipStats";

const CATS = ["all", "weapon", "engine", "reactor", "shield", "module"];

export default function Database() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState(null);

  const { data: components = [], isLoading } = useQuery({
    queryKey: ["components"],
    queryFn: () => base44.entities.Component.list("-created_date", 500),
  });

  const filtered = components.filter((c) => {
    if (cat !== "all" && c.category !== cat) return false;
    const q = search.toLowerCase();
    return !q || [c.name, c.subtype, c.manufacturer].some((s) => s?.toLowerCase().includes(q));
  });

  return (
    <div className="p-6 h-full flex flex-col max-w-[1400px] mx-auto w-full">
      <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-xl tracking-[0.15em] uppercase">Component Databank</h1>
          <p className="tech-label mt-0.5">{filtered.length} catalogued items</p>
        </div>
        <div className="relative w-72">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search databank..." className="pl-8 rounded-none font-mono text-xs" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
              cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 min-h-0">
        {/* Table */}
        <div className="schematic-panel overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-secondary/90 backdrop-blur">
              <tr className="text-left">
                {["Component", "Tier", "Mass", "Power", "HP", "Key Stat"].map((h) => (
                  <th key={h} className="tech-label px-3 py-2 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="tech-label text-center py-12 animate-pulse">Accessing databank...</td></tr>
              ) : filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`cursor-pointer transition-colors ${selected?.id === c.id ? "bg-primary/5" : "hover:bg-secondary/50"}`}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <CategoryIcon category={c.category} size={15} />
                      <div>
                        <div className="font-medium text-xs">{c.name}</div>
                        <div className="font-mono text-[9px] text-muted-foreground">{c.subtype}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2"><TierBadge tier={c.tier} /></td>
                  <td className="px-3 py-2 font-mono text-xs">{fmt(c.mass)}t</td>
                  <td className={`px-3 py-2 font-mono text-xs ${c.power >= 0 ? "text-[#38bdf8]" : "text-[#ffb020]"}`}>
                    {c.power >= 0 ? "+" : "−"}{fmt(Math.abs(c.power))}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{fmt(c.hp)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {c.dps ? `${fmt(c.dps)} DPS` : c.thrust ? `${fmt(c.thrust)} kN` : c.shield_hp ? `${fmt(c.shield_hp)} SP` : c.power > 0 ? `${fmt(c.power)} MW` : c.cargo ? `${fmt(c.cargo)} m³` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail */}
        <div className="schematic-panel p-4 overflow-y-auto">
          <ComponentDetail component={selected} />
        </div>
      </div>
    </div>
  );
}