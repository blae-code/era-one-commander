import React, { useMemo, useState } from "react";
import { Crosshair } from "lucide-react";
import { useGameCatalog, fmtNum } from "@/lib/gameData";
import { unitClassKey } from "@/lib/combatSim";
import TtkMatrix from "@/components/combat/TtkMatrix";
import FiringCycle from "@/components/combat/FiringCycle";
import ClosingEnvelope from "@/components/combat/ClosingEnvelope";

const LIMITS = [12, 20, 40, 999];

// Combat Lab — inferred engagement analytics over the shipped weapon/hull tables.
export default function CombatLab() {
  const cat = useGameCatalog();
  const [limit, setLimit] = useState(20);
  const [type, setType] = useState("all");
  const [wid, setWid] = useState(null);
  const [cls, setCls] = useState("all");

  const types = useMemo(() => [...new Set(cat.weapons.map((w) => w.weapon_type).filter(Boolean))].sort(), [cat.weapons]);
  const classes = useMemo(() => [...new Set(cat.units.map(unitClassKey))].sort(), [cat.units]);

  const weapons = useMemo(() => cat.weapons
    .filter((w) => w.dps_vs_class && Object.values(w.dps_vs_class).some((v) => Number(v) > 0))
    .filter((w) => type === "all" || w.weapon_type === type)
    .sort((a, b) => (b.dps || 0) - (a.dps || 0))
    .slice(0, limit), [cat.weapons, type, limit]);

  const units = useMemo(() => cat.units
    .filter((u) => Number(u.max_health) > 0)
    .filter((u) => cls === "all" || unitClassKey(u) === cls)
    .sort((a, b) => (a.unit_class || "").localeCompare(b.unit_class || "") || (a.max_health || 0) - (b.max_health || 0)), [cat.units, cls]);

  const weapon = weapons.find((w) => w.game_id === wid) || weapons[0] || null;
  const perShot = weapon ? Math.max(...Object.values(weapon.hp_per_hit_vs_class || { a: 0 }).map(Number), Number(weapon.hp_change) || 0) : 0;

  const Chip = ({ active, children, ...p }) => (
    <button {...p} className={`px-2 h-7 border clip-plate font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${active ? "border-primary bg-primary/20 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>{children}</button>
  );

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto w-full h-full flex flex-col min-h-0">
      <div className="schematic-panel p-3 mb-3 flex items-center justify-between gap-4 bg-gradient-to-r from-card to-primary/5">
        <div className="flex items-center gap-3 min-w-0">
          <Crosshair size={30} className="text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl tracking-[0.15em] leading-none">COMBAT LAB</h1>
            <p className="tech-label mt-1 truncate">Inferred engagement analytics · time-to-kill, firing cycles, approach envelopes · shipped values only</p>
          </div>
        </div>
        <div className="hidden lg:flex gap-5 font-mono text-center">
          {[["ARMAMENTS", cat.weapons.length], ["HULLS", cat.units.length], ["PAIRS", weapons.length * units.length]].map(([k, v]) => (
            <div key={k}><div className="text-lg font-semibold text-primary leading-none">{fmtNum(v)}</div><div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div></div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 mb-3">
        <span className="tech-label mr-1">Weapon type</span>
        <Chip active={type === "all"} onClick={() => setType("all")}>all</Chip>
        {types.map((t) => <Chip key={t} active={type === t} onClick={() => setType(t)}>{t}</Chip>)}
        <div className="h-5 w-px bg-border mx-2" />
        <span className="tech-label mr-1">Hull class</span>
        <Chip active={cls === "all"} onClick={() => setCls("all")}>all</Chip>
        {classes.map((c) => <Chip key={c} active={cls === c} onClick={() => setCls(c)}>{c.replace(/Unit$/, "")}</Chip>)}
        <div className="h-5 w-px bg-border mx-2" />
        <span className="tech-label mr-1">Rows</span>
        {LIMITS.map((l) => <Chip key={l} active={limit === l} onClick={() => setLimit(l)}>{l === 999 ? "all" : l}</Chip>)}
      </div>

      {cat.isLoading ? <div className="schematic-panel p-12 tech-label text-center animate-pulse">Running engagement models…</div>
      : cat.isEmpty ? <div className="schematic-panel p-10 tech-label text-center">No game data loaded yet — import the dataset from Data Ops.</div>
      : (
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_430px] gap-3">
          <div className="min-h-0">
            <TtkMatrix weapons={weapons} units={units} selectedWeapon={weapon?.game_id} onSelectWeapon={setWid} />
          </div>
          <div className="space-y-3 overflow-y-auto min-h-0">
            <FiringCycle weapon={weapon} perShot={perShot} />
            <ClosingEnvelope weapon={weapon} units={units} />
          </div>
        </div>
      )}
    </div>
  );
}