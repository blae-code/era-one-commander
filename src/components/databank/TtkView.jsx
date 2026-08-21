import React, { useMemo, useState } from "react";
import { fmtNum } from "@/lib/gameData";
import { TTK_RAMP, unitClassKey } from "@/lib/combatSim";
import { buildMatrix, heat, effectiveHp, defenceProfile, dpsAgainst, perHitAgainst, ttkBandCell } from "@/lib/ttkMatrix";
import TtkControls from "./TtkControls";

// Databank view: interactive time-to-kill matrix. Rows are the armaments currently filtered in the
// Databank (weapons/modules), columns are target profiles ordered by their defence pools.
export default function TtkView({ rows, ctx, onSelect, selectedId }) {
  const [targetSet, setTargetSet] = useState("units");
  const [layers, setLayers] = useState({ ablative: true, perimeter: false });
  const [metric, setMetric] = useState("seconds");
  const [sortBy, setSortBy] = useState("hp");
  const [hover, setHover] = useState(null);

  const attackers = useMemo(() => {
    const withDps = (rows || []).filter((r) => r.dps_vs_class && Object.values(r.dps_vs_class).some((v) => Number(v) > 0));
    return (withDps.length ? withDps : ctx.weapons.filter((w) => w.dps_vs_class)).slice(0, 90);
  }, [rows, ctx.weapons]);

  const targets = useMemo(() => {
    const pool = targetSet === "units"
      ? ctx.units.filter((u) => Number(u.max_health) > 0)
      : ctx.modules.filter((m) => Number(m.max_health) > 0 && m.module_class !== "Structural");
    const key = (t) => (sortBy === "armor" ? defenceProfile(t).armor : sortBy === "class" ? 0 : effectiveHp(t, layers));
    const sorted = [...pool].sort((a, b) => (sortBy === "class"
      ? String(a.unit_class || a.module_class).localeCompare(String(b.unit_class || b.module_class)) || effectiveHp(b, layers) - effectiveHp(a, layers)
      : key(b) - key(a)));
    return sorted.slice(0, 44);
  }, [ctx.units, ctx.modules, targetSet, sortBy, layers]);

  const matrix = useMemo(() => buildMatrix(attackers, targets, layers, metric), [attackers, targets, layers, metric]);

  const fmtVal = (v) => (metric === "shots" ? fmtNum(v) : v < 1 ? v.toFixed(2) : fmtNum(v, v < 10 ? 1 : 0));

  const describe = (a, t) => {
    const p = defenceProfile(t);
    const dps = dpsAgainst(a, t), per = perHitAgainst(a, t), hp = effectiveHp(t, layers);
    const band = ttkBandCell(a, t, layers);
    const bandTxt = band && Number.isFinite(band.low) && Number.isFinite(band.high) && band.high > band.low
      ? ` · armour band ${fmtNum(band.low, 1)}–${fmtNum(band.high, 1)}s (4 shapes)` : "";
    return `${a.name} → ${t.name} · pool ${fmtNum(hp)} (hull ${fmtNum(p.hull)}${layers.ablative ? ` + abl ${fmtNum(p.ablative)}` : ""}${layers.perimeter ? ` + per ${fmtNum(p.perimeter)}` : ""}) · armor ${fmtNum(p.armor)} · ${fmtNum(dps, 1)} dps vs ${unitClassKey(t)}${per > 0 ? ` · ${fmtNum(per, 1)}/hit` : ""} · ttk ${fmtNum(dps > 0 ? hp / dps : 0, 1)}s${bandTxt}`;
  };

  if (!attackers.length || !targets.length)
    return <div className="schematic-panel p-10 tech-label text-center">No armament or target data in the current filter.</div>;

  return (
    <div className="h-full flex flex-col min-h-0 gap-2" role="region" aria-label="Time-to-kill matrix">
      <TtkControls targetSet={targetSet} setTargetSet={setTargetSet} layers={layers} setLayers={setLayers}
        metric={metric} setMetric={setMetric} sortBy={sortBy} setSortBy={setSortBy}
        counts={{ units: ctx.units.length, modules: ctx.modules.length }} hover={hover} />

      <div className="tech-label" role="note">
        Armour model unextracted — cells show the armour-model-"none" point value; hover a cell for the band (low–high across 4 candidate armour shapes).
      </div>

      <div className="schematic-panel plate-texture relative flex-1 min-h-0 overflow-auto">
        <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60 z-30" aria-hidden="true" />
        <table className="border-separate border-spacing-0 text-xs" aria-label={`${attackers.length} armaments against ${targets.length} target profiles`}>
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 bg-secondary tech-label text-left px-2 py-2 border-b border-r border-border min-w-[200px]">
                Armament ↓ / Profile →
              </th>
              {targets.map((t) => {
                const p = defenceProfile(t);
                return (
                  <th key={t.game_id} onClick={() => onSelect?.(t.game_id)} title={`${t.name} · ${fmtNum(effectiveHp(t, layers))} pool · armor ${fmtNum(p.armor)}`}
                    role="button" tabIndex={0} aria-label={`Inspect target ${t.name}`}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(t.game_id); } }}
                    className="sticky top-0 z-10 bg-secondary border-b border-r border-border/40 px-1 py-2 cursor-pointer hover:text-primary align-bottom focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary focus-visible:-outline-offset-1">
                    <div className="font-mono text-[9px] uppercase tracking-[0.1em] whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", maxHeight: 130 }}>
                      {t.name}
                    </div>
                    <div className="mt-1 mx-auto w-[46px] h-[3px] bg-border" title="shield share of pool">
                      <div className="h-full bg-[hsl(var(--chart-2))]" style={{ width: `${Math.min(100, ((p.ablative + p.perimeter) / Math.max(1, p.hull + p.ablative + p.perimeter)) * 100)}%` }} />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {attackers.map((a) => {
              const active = a.game_id === selectedId;
              return (
                <tr key={a.game_id} className={active ? "bg-primary/10" : ""}>
                  <td onClick={() => onSelect?.(a.game_id)}
                    role="button" tabIndex={0} aria-label={`Inspect armament ${a.name}`}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(a.game_id); } }}
                    className={`sticky left-0 z-10 px-2 py-1 border-b border-r border-border cursor-pointer whitespace-nowrap focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary focus-visible:-outline-offset-1 ${active ? "bg-[#2b1512]" : "bg-card hover:text-primary"}`}>
                    <span className="text-[11px] font-medium">{a.name}</span>
                    <span className="ml-1.5 font-mono text-[9px] text-muted-foreground">{a.weapon_type || a.module_sub_type || a.weapon_category}</span>
                  </td>
                  {targets.map((t) => {
                    const v = matrix.map.get(`${a.game_id}|${t.game_id}`);
                    const h = v === undefined ? null : heat(v, matrix, metric);
                    return (
                      <td key={t.game_id} className="border-b border-border/40 border-r border-border/20 p-0 cursor-pointer"
                        onMouseEnter={() => v !== undefined && setHover(describe(a, t))} onMouseLeave={() => setHover(null)}
                        onClick={() => onSelect?.(a.game_id)}>
                        <div className="w-[48px] h-[24px] flex items-center justify-center font-mono text-[9px]"
                          style={{ background: h === null ? "transparent" : TTK_RAMP(h), color: h !== null && h < 0.45 ? "#160c0a" : "#e8ded7" }}>
                          {v === undefined ? "·" : fmtVal(v)}
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

      <div className="tech-label">
        {attackers.length} armaments × {targets.length} profiles · pools from hull/shield values, per-class damage from the game's own {unitClassKey(targets[0])} tables · click a row or column header to open its record
      </div>
    </div>
  );
}