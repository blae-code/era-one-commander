import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DatabaseZap } from "lucide-react";
import TierBadge from "@/components/shared/TierBadge";
import DatabankHeader from "@/components/database/DatabankHeader";
import GameEntityDetail from "@/components/database/GameEntityDetail";
import { useGameCatalog, fmtNum, countIds } from "@/lib/gameData";

// The Databank browses the real ERA ONE dataset (see /gamedata). Tabs are the game's own catalogs.
const TABS = [
  { key: "Module", label: "Modules", cols: ["Module", "Class", "Tier", "Cost", "HP", "Energy/s", "Armament"] },
  { key: "Unit", label: "Ships", cols: ["Ship", "Class", "Tier", "Cost", "HP", "Speed", "Armament"] },
  { key: "Weapon", label: "Weapons", cols: ["Weapon", "Type", "DPS", "Range", "Hull/hit", "Armor pen", "RoF"] },
  { key: "Turret", label: "Turrets", cols: ["Turret", "Weapons", "DPS", "Rotation", "Volley", "Fixed"] },
  { key: "ResearchNode", label: "Research", cols: ["Research", "Type", "Tier", "Cost", "Time", "Grants"] },
];

const armament = (ids, byId) => countIds(ids || []).map(([id, n]) => `${n > 1 ? n + "× " : ""}${byId[id]?.name || id}`).join(", ") || "—";

export default function Database() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t.key === params.get("t")) || TABS[0];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const selectedId = params.get("id");
  const cat = useGameCatalog();

  const rowsByKind = { Module: cat.modules, Unit: cat.units, Weapon: cat.weapons, Turret: cat.turrets, ResearchNode: cat.research };
  const rows = rowsByKind[tab.key] || [];
  const groupKey = { Module: "module_class", Unit: "unit_class", Weapon: "weapon_type", Turret: null, ResearchNode: "research_type" }[tab.key];
  const groups = useMemo(() => (groupKey ? [...new Set(rows.map((r) => r[groupKey]).filter(Boolean))].sort() : []), [rows, groupKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => filter === "all" || !groupKey || r[groupKey] === filter)
      .filter((r) => !q || [r.name, r.game_id, r.info, r.module_sub_type, r.unit_type, r.research_type].some((s) => s?.toLowerCase().includes(q)))
      .sort((a, b) => (a.tier || 0) - (b.tier || 0) || (a.cost_resources || 0) - (b.cost_resources || 0) || String(a.name).localeCompare(String(b.name)));
  }, [rows, search, filter, groupKey]);

  const kindOf = (id) => {
    for (const [k, list] of Object.entries(rowsByKind)) if (list.some((r) => r.game_id === id)) return k;
    return null;
  };
  const select = (kindHint, id) => {
    const k = kindOf(id) || kindHint;
    setParams({ t: k, id });
  };
  const setTab = (k) => { setFilter("all"); setParams({ t: k }); };
  const selected = selectedId ? cat.byId[selectedId] : null;

  const cell = (r) => {
    switch (tab.key) {
      case "Module": return [r.module_class, <TierBadge tier={r.tier} />, fmtNum(r.cost_resources), fmtNum(r.max_health),
        r.energy_per_second ? `−${fmtNum(r.energy_per_second, 1)}` : r.energy_production ? `+${fmtNum(r.energy_production, 1)}` : "0", armament(r.weapons, cat.byId)];
      case "Unit": return [r.unit_class, <TierBadge tier={r.tier} />, fmtNum(r.cost_resources), fmtNum(r.max_health), fmtNum(r.max_speed, 2),
        armament(r.weapons, cat.byId) === "—" && r.secondary_equip ? `slot: ${cat.byId[r.secondary_equip]?.name || r.secondary_equip}` : armament(r.weapons, cat.byId)];
      case "Weapon": return [r.weapon_type, fmtNum(r.dps, 1), fmtNum(r.range, 1), fmtNum(r.hp_change, 2), fmtNum(r.armor_penetration, 2), fmtNum(r.rate_of_fire, 2)];
      case "Turret": return [armament(r.weapons, cat.byId), fmtNum(r.dps, 1), `${fmtNum(r.horizontal_rotation_speed)}°/s`, `${fmtNum(r.time_between_volleys, 1)}s`, r.is_fixed ? "yes" : "no"];
      case "ResearchNode": return [r.research_type, <TierBadge tier={r.tier} />, fmtNum(r.cost_resources), `${fmtNum(r.construction_time)}s`,
        (r.modifiers || []).map((m) => m.stat).join(", ") || (r.unlocks || []).map((u) => cat.byId[u]?.name || u).join(", ") || "—"];
      default: return [];
    }
  };

  return (
    <div className="p-6 h-full flex flex-col max-w-[1500px] mx-auto w-full">
      <DatabankHeader
        subtitle={`ERA ONE Catalog // ${filtered.length} of ${rows.length} ${tab.label.toLowerCase()} from the installed game files`}
        search={search}
        onSearch={setSearch}
        placeholder={`Search ${tab.label.toLowerCase()} by name or id…`}
        readout={[
          ["MODULES", cat.modules.length],
          ["SHIPS", cat.units.length],
          ["WEAPONS", cat.weapons.length],
          ["TURRETS", cat.turrets.length],
          ["RESEARCH", cat.research.length],
        ]}
      />

      <div className="schematic-panel p-3 mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className="tech-label mr-2">Catalog</span>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                tab.key === t.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}>
              {t.label} <span className="opacity-60">{(rowsByKind[t.key] || []).length}</span>
            </button>
          ))}
        </div>
        {groups.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-border">
            <span className="tech-label mr-2">Filter</span>
            {["all", ...groups].map((g) => (
              <button key={g} onClick={() => setFilter(g)}
                className={`px-2 py-1 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                  filter === g ? "border-primary/70 text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {cat.isEmpty && !cat.isLoading ? (
        <div className="schematic-panel p-8 text-center">
          <DatabaseZap size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-wider">No game data loaded yet</div>
          <p className="tech-label mt-1">Import the extracted ERA ONE dataset from the <Link to="/gamedata" className="text-primary underline">Game Data</Link> page (admin).</p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 min-h-0">
          <div className="schematic-panel overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-secondary/90 backdrop-blur border-b border-primary/30">
                <tr className="text-left">{tab.cols.map((h) => <th key={h} className="tech-label px-3 py-2 font-normal whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cat.isLoading ? (
                  <tr><td colSpan={tab.cols.length} className="tech-label text-center py-12 animate-pulse">Accessing databank...</td></tr>
                ) : filtered.map((r) => (
                  <tr key={r.game_id} onClick={() => select(tab.key, r.game_id)}
                    className={`cursor-pointer transition-colors ${selectedId === r.game_id ? "bg-primary/5" : "hover:bg-secondary/50"}`}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-xs">{r.name}</div>
                      <div className="font-mono text-[9px] text-muted-foreground">{r.game_id}{r.info ? ` · ${r.info}` : ""}</div>
                    </td>
                    {cell(r).map((c, i) => <td key={i} className="px-3 py-2 font-mono text-xs whitespace-nowrap max-w-[260px] truncate">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="schematic-panel p-4 overflow-y-auto bg-gradient-to-b from-primary/5 to-card">
            <GameEntityDetail kind={selected ? kindOf(selected.game_id) : tab.key} record={selected} byId={cat.byId} onSelect={select} />
          </div>
        </div>
      )}
    </div>
  );
}