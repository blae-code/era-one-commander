import React, { useMemo, useState } from "react";
import { fmtNum } from "@/lib/gameData";
import { SegBar } from "./Readouts";

// Weapon vs target-hull calculator. Mirrors the engagement backend maths:
// class damage multiplier is resolved against the target's entity class, and
// armour is reported across the four candidate models (the game's real armour
// formula is not in the extracted data), giving a TTK band rather than a lie.
const ARMOR_SCALE = 100;
const MODELS = {
  none: (d) => d,
  subtractive: (d, a) => Math.max(d - a, d * 0.1),
  diminishing: (d, a) => d * (ARMOR_SCALE / (ARMOR_SCALE + Math.max(0, a))),
  proportional: (d, a) => d * (1 - Math.min(Math.max(0, a) / ARMOR_SCALE, 0.9)),
};
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const classOf = (t) => (t.unit_class ? `${t.unit_class}Unit` : `${t.module_class}Module`);

export default function EngagementCalc({ weapon, ctx }) {
  const targets = useMemo(
    () => [...(ctx.units || []), ...(ctx.modules || [])].filter((t) => num(t.max_health) > 0).sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [ctx.units, ctx.modules]);
  const [targetId, setTargetId] = useState("");
  const [model, setModel] = useState("none");
  const target = targets.find((t) => t.game_id === targetId) || targets[0];

  const calc = useMemo(() => {
    if (!target) return null;
    const cls = classOf(target);
    const mult = weapon.class_damage_multipliers?.find((m) => m.entity_class === cls)?.multiplier
      ?? (weapon.dps_vs_class?.[cls] && num(weapon.dps) ? weapon.dps_vs_class[cls] / num(weapon.dps) : 1);
    const hp = num(target.max_health);
    const armor = num(target.armor);
    const regen = num(target.health_regen);
    const shield = num(target.max_ablative_shield) + num(target.max_perimeter_shield);
    const armorEff = armor * (1 - num(weapon.armor_penetration));
    const rawDps = num(weapon.dps) * mult;
    const runs = Object.entries(MODELS).map(([name, f]) => {
      const dps = f(rawDps, armorEff);
      const net = dps - regen;
      return { name, dps, net, ttk: net > 0 ? (hp + shield) / net : null };
    });
    const active = runs.find((r) => r.name === model);
    const ttks = runs.map((r) => r.ttk).filter((v) => typeof v === "number");
    const perHit = num(weapon.hp_change) * mult;
    return {
      cls, mult, hp, armor, regen, shield, armorEff, rawDps, runs, active, perHit,
      shots: perHit > 0 ? Math.ceil((hp + shield) / perHit) : null,
      band: ttks.length ? { low: Math.min(...ttks), high: Math.max(...ttks) } : null,
      inRange: num(weapon.range),
    };
  }, [weapon, target, model]);

  if (!targets.length) return <div className="tech-label">No target hulls in the dataset</div>;
  if (!calc) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className="tech-label">Target hull</span>
          <select value={target.game_id} onChange={(e) => setTargetId(e.target.value)}
            className="mt-1 w-full bg-background/70 border border-border px-2 h-8 font-mono text-[11px] outline-none focus:border-primary">
            {targets.map((t) => <option key={t.game_id} value={t.game_id}>{t.name} · {classOf(t)}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="tech-label">Armour model</span>
          <select value={model} onChange={(e) => setModel(e.target.value)}
            className="mt-1 w-full bg-background/70 border border-border px-2 h-8 font-mono text-[11px] outline-none focus:border-primary">
            {Object.keys(MODELS).map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>

      <div className="schematic-panel plate-texture p-3">
        <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
        <div className="tech-label mb-2">Firing solution // {weapon.name} → {target.name}</div>
        <div className="grid grid-cols-3 gap-2 mb-3 font-mono text-center">
          {[["EFF. DPS", fmtNum(calc.active?.dps || 0, 1)], ["NET DPS", fmtNum(calc.active?.net || 0, 1)], ["TIME TO KILL", calc.active?.ttk ? `${fmtNum(calc.active.ttk, 1)}s` : "∞"]].map(([k, v]) => (
            <div key={k} className="border border-border bg-black/40 py-2">
              <div className="text-lg text-primary ember-glow leading-none">{v}</div>
              <div className="text-[9px] tracking-[0.18em] text-muted-foreground mt-1">{k}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <SegBar label="Class mult" value={calc.mult} max={Math.max(2, calc.mult)} dec={2} unit="×" color="#ff7a1a" />
          <SegBar label="Target HP" value={calc.hp} max={calc.hp + calc.shield || 1} color="#8cff5a" />
          <SegBar label="Target shield" value={calc.shield} max={calc.hp + calc.shield || 1} color="#2f9bff" />
          <SegBar label="Armour (eff.)" value={calc.armorEff} max={Math.max(calc.armor, 1)} dec={1} color="#c9d6e3" />
          <SegBar label="HP regen" value={calc.regen} max={Math.max(calc.active?.dps || 1, calc.regen)} dec={1} color="#ffd21a" danger />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3 font-mono text-[10px] text-muted-foreground">
          <div>Damage/hit <span className="text-foreground">{fmtNum(calc.perHit, 1)}</span></div>
          <div>Hits to kill <span className="text-foreground">{calc.shots ?? "—"}</span></div>
          <div>Range <span className="text-foreground">{fmtNum(calc.inRange, 0)}</span></div>
        </div>
      </div>

      <div>
        <div className="tech-label mb-1">TTK across candidate armour models</div>
        <div className="space-y-1">
          {calc.runs.map((r) => (
            <div key={r.name} className={`flex items-center gap-2 font-mono text-[11px] ${r.name === model ? "text-primary" : "text-muted-foreground"}`}>
              <span className="w-24">{r.name}</span>
              <span className="flex-1 h-1.5 bg-secondary"><span className="block h-full bg-current" style={{ width: `${calc.band?.high ? Math.min(100, ((r.ttk || calc.band.high) / calc.band.high) * 100) : 0}%` }} /></span>
              <span className="w-16 text-right">{r.ttk ? `${fmtNum(r.ttk, 1)}s` : "∞"}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
          Armour is reported, not verified — the game's damage-vs-armour formula is not present in the extracted data,
          so the band above shows how much the answer depends on that unknown. Class multiplier is resolved against {calc.cls}.
        </p>
      </div>
    </div>
  );
}