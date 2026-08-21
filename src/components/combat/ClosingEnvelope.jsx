import React, { useMemo } from "react";
import { closingEnvelope } from "@/lib/combatSim";
import { fmtNum } from "@/lib/gameData";

// Approach envelope: for each hull, how long it needs to cross the weapon's reach,
// how much of that time is projectile flight, and what fraction of its HP burns off first.
export default function ClosingEnvelope({ weapon, units, onSelectUnit }) {
  const rows = useMemo(() => {
    if (!weapon) return [];
    return units
      .map((u) => ({ u, e: closingEnvelope(weapon, u) }))
      .filter((r) => r.e.closing !== null && r.e.closing > 0)
      .sort((a, b) => a.e.closing - b.e.closing)
      .slice(0, 14);
  }, [weapon, units]);

  if (!weapon) return null;
  const maxT = Math.max(...rows.map((r) => r.e.closing), 1);

  return (
    <div className="schematic-panel plate-texture p-3">
      <div className="tech-label mb-0.5">Approach envelope // {weapon.name}</div>
      <div className="font-mono text-[10px] text-muted-foreground mb-2">
        reach {fmtNum(weapon.range, 0)} · projectile {weapon.bullet_speed ? `${fmtNum(weapon.bullet_speed, 0)} u/s · flight ${fmtNum(rows[0]?.e.flight || 0, 2)}s` : "instant"}
      </div>
      {rows.length === 0 ? <div className="tech-label py-6 text-center">No mobile hulls to plot.</div> : (
        <div className="space-y-1">
          {rows.map(({ u, e }) => (
            <button key={u.game_id} onClick={() => onSelectUnit?.(u.game_id)} className="w-full text-left group">
              <div className="flex items-center gap-2">
                <span className="w-[130px] truncate text-[11px] group-hover:text-primary">{u.name}</span>
                <div className="flex-1 h-4 relative border border-border bg-[#0d0b0a]">
                  <div className="absolute inset-y-0 left-0 bg-primary/35" style={{ width: `${(e.closing / maxT) * 100}%` }} />
                  <div className="absolute inset-y-0 left-0 hazard-stripes-ember opacity-70" style={{ width: `${(e.flight / maxT) * 100}%` }} title="projectile flight time" />
                  <div className="absolute inset-y-0 border-l border-accent" style={{ left: `${(e.closing / maxT) * 100}%` }} />
                  <span className="absolute right-1 top-0 font-mono text-[9px] leading-4 text-muted-foreground">
                    {fmtNum(e.closing, 1)}s · {e.hpFraction === null ? "—" : `${fmtNum(Math.min(1, e.hpFraction) * 100, 0)}% HP burned`}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-2">Bar = time to cross the weapon's reach at the hull's top speed; striped head = projectile travel time; readout = share of hull HP lost before contact. Damage resolves through the weapon's DPS vs each hull's own class (armor_model: none).</p>
    </div>
  );
}