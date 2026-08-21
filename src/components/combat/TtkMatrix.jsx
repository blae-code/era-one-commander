import React, { useMemo, useState } from "react";
import { ttkBand, shotsToKill, TTK_RAMP } from "@/lib/combatSim";
import { fmtNum } from "@/lib/gameData";

// Weapon × ship time-to-kill grid. Cells shaded by kill speed within the visible matrix.
// Point values assume armor_model "none" — the same point estimate the deployed engagement
// function ships — and every cell carries the band across the four candidate armour shapes.
export default function TtkMatrix({ weapons, units, selectedWeapon, onSelectWeapon, onSelectUnit, rankClass }) {
  const [hover, setHover] = useState(null);

  const cells = useMemo(() => {
    const map = new Map();
    let min = Infinity, max = 0;
    for (const w of weapons) for (const u of units) {
      const b = ttkBand(w, u);
      if (b === null) continue;
      map.set(`${w.game_id}|${u.game_id}`, b);
      if (b.point < min) min = b.point;
      if (b.point > max) max = b.point;
    }
    return { map, min: Number.isFinite(min) ? min : 0, max };
  }, [weapons, units]);

  const shade = (t) => {
    if (t === undefined) return "transparent";
    const lo = Math.log(cells.min + 0.01), hi = Math.log(cells.max + 0.01);
    return TTK_RAMP(hi > lo ? (Math.log(t + 0.01) - lo) / (hi - lo) : 0);
  };

  return (
    <div className="schematic-panel plate-texture relative h-full overflow-auto">
      <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
      <div className="sticky top-0 z-20 bg-secondary/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-1">
          <div>
            <div className="font-display font-bold text-sm tracking-[0.18em] uppercase">Time-to-kill matrix</div>
            <div className="tech-label mt-0.5">
              {weapons.length} armaments × {units.length} hulls · hull HP ÷ DPS vs each hull's class
              {rankClass ? <> · rows ranked by DPS vs <span className="text-primary">{rankClass}</span></> : null}
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[9px] text-muted-foreground">
            <span>FAST</span>
            <div className="flex">{Array.from({ length: 16 }).map((_, i) => <span key={i} className="w-2.5 h-3" style={{ background: TTK_RAMP(i / 15) }} />)}</div>
            <span>SLOW</span>
            <span className="ml-2 text-foreground">
              {hover
                ? `${hover.w} → ${hover.u} · ${fmtNum(hover.b.point, 1)}s (none) · band ${fmtNum(hover.b.low, 1)}–${fmtNum(hover.b.high, 1)}s · ${hover.s ?? "—"} shots`
                : "hover a cell"}
            </span>
          </div>
        </div>
        <div className="px-3 pb-1.5 font-mono text-[9px] text-[#ffb020]">
          Armour model unextracted — point values assume armor_model: none; bands span 4 candidate shapes.
        </div>
      </div>

      <table className="border-separate border-spacing-0 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-10 bg-secondary tech-label text-left px-2 py-2 border-b border-r border-border min-w-[190px]">Weapon ↓ / Hull →</th>
            {units.map((u) => (
              <th key={u.game_id} onClick={() => onSelectUnit?.(u.game_id)} title={`${u.name} · ${fmtNum(u.max_health)} HP`}
                className="bg-secondary border-b border-border px-1 py-2 cursor-pointer hover:text-primary align-bottom">
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", maxHeight: 118 }}>{u.name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weapons.map((w) => {
            const active = w.game_id === selectedWeapon;
            return (
              <tr key={w.game_id} className={active ? "bg-primary/10" : ""}>
                <td onClick={() => onSelectWeapon?.(w.game_id)}
                  className={`sticky left-0 z-10 px-2 py-1 border-b border-r border-border cursor-pointer whitespace-nowrap ${active ? "bg-[#2b1512] text-foreground" : "bg-card hover:text-primary"}`}>
                  <span className="text-[11px] font-medium">{w.name}</span>
                  <span className="ml-1.5 font-mono text-[9px] text-muted-foreground">{w.weapon_type}</span>
                </td>
                {units.map((u) => {
                  const b = cells.map.get(`${w.game_id}|${u.game_id}`);
                  return (
                    <td key={u.game_id}
                      onMouseEnter={() => b && setHover({ w: w.name, u: u.name, b, s: shotsToKill(w, u) })}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => { onSelectWeapon?.(w.game_id); onSelectUnit?.(u.game_id); }}
                      title={b ? `armor_model none: ${fmtNum(b.point, 1)}s · band ${fmtNum(b.low, 1)}–${fmtNum(b.high, 1)}s across 4 armour shapes` : undefined}
                      className="border-b border-border/50 border-r border-border/30 p-0 cursor-pointer">
                      <div className="w-[46px] h-[24px] flex items-center justify-center font-mono text-[9px]"
                        style={{ background: shade(b?.point), color: b !== undefined && b.point < cells.max * 0.4 ? "#160c0a" : "#e8ded7" }}>
                        {b === undefined ? "·" : b.point < 1 ? b.point.toFixed(2) : fmtNum(b.point, b.point < 10 ? 1 : 0)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
