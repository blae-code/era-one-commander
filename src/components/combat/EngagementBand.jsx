import React from "react";
import { ttkBand, unitClassKey, UNMODELLED, ARMOR_SCALE } from "@/lib/combatSim";
import { fmtNum } from "@/lib/gameData";

// Engagement band for one weapon × hull pair — the RULE-2 detail behind a matrix cell.
// Client-side replica of the deployed engagement function's armour-shape sweep: the point
// estimate is armor_model "none"; the band spans the four candidate shapes. Click a matrix
// cell or column header to retarget it.
export default function EngagementBand({ weapon, unit, stamp }) {
  if (!weapon || !unit) {
    return <div className="schematic-panel p-6 tech-label text-center">Select a matrix cell to inspect an engagement.</div>;
  }
  const b = ttkBand(weapon, unit);
  const cls = unitClassKey(unit);
  if (!b) {
    return (
      <div className="schematic-panel p-6 tech-label text-center">
        {weapon.name} cannot damage {unit.name} — no DPS vs {cls}.
      </div>
    );
  }
  return (
    <div className="schematic-panel plate-texture p-3">
      <div className="tech-label mb-0.5">Engagement band // {weapon.name} → {unit.name}</div>
      <div className="font-mono text-[10px] text-muted-foreground mb-2">
        DPS vs {cls} · {fmtNum(unit.max_health)} HP · armor {fmtNum(b.armor)}
        {b.armor_penetration ? ` · pen ${fmtNum(b.armor_penetration * 100, 0)}%` : ""}
      </div>

      <div className="flex items-end gap-5 mb-2 font-mono">
        <div>
          <div className="text-xl text-primary ember-glow leading-none">{fmtNum(b.point, 1)}s</div>
          <div className="text-[9px] tracking-[0.18em] text-muted-foreground mt-1">TTK · ARMOR_MODEL: NONE</div>
        </div>
        <div>
          <div className="text-base text-accent leading-none">{fmtNum(b.low, 1)}–{fmtNum(b.high, 1)}s</div>
          <div className="text-[9px] tracking-[0.18em] text-muted-foreground mt-1">BAND · 4 SHAPES{b.spread ? ` · ×${fmtNum(b.spread, 2)}` : ""}</div>
        </div>
      </div>

      <div className="relative h-3 border border-border bg-[#0d0b0a] mb-2" title="band across the four armour shapes; marker = armor_model none">
        <div className="absolute inset-y-0 bg-accent/30" style={{ left: `${(b.low / b.high) * 100}%`, right: 0 }} />
        <div className="absolute inset-y-0 border-l-2 border-primary" style={{ left: `${Math.min(99.5, (b.point / b.high) * 100)}%` }} />
      </div>

      <table className="w-full font-mono text-[10px]">
        <tbody>
          {b.by_model.map((m) => (
            <tr key={m.model} className="border-b border-border/40">
              <td className="py-0.5 uppercase tracking-[0.12em] text-muted-foreground">{m.model}</td>
              <td className="py-0.5 text-right">{fmtNum(m.dps, 1)} dps</td>
              <td className="py-0.5 text-right w-16">{m.time_to_kill_s === null ? "—" : `${fmtNum(m.time_to_kill_s, 1)}s`}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <details className="mt-2">
        <summary className="tech-label cursor-pointer">Unmodelled effects</summary>
        <ul className="mt-1 font-mono text-[10px] text-muted-foreground list-disc pl-4">
          {UNMODELLED.map((s) => <li key={s}>{s}</li>)}
          <li>health regeneration during the engagement</li>
        </ul>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Armour shapes mirror the deployed engagement function; ARMOR_SCALE={ARMOR_SCALE} is a free parameter, not an extracted game constant.
        </p>
      </details>

      {stamp && <div className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground mt-2">game {stamp.game_version} · build {stamp.game_build}</div>}
    </div>
  );
}
