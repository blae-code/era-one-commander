import React from "react";
import { fmtNum } from "@/lib/gameData";
import WeaponTargetCharts from "@/components/database/WeaponTargetCharts";

// Granular weapon analysis: per-shot damage, fire cycle, projectile flight, area effect and
// effective damage per target class. Everything here is derived from the extracted Weapon record.
const Section = ({ title, note, children }) => (
  <div>
    <div className="tech-label mb-1.5">{title}{note ? <span className="text-muted-foreground/60"> // {note}</span> : null}</div>
    {children}
  </div>
);

const Rows = ({ rows }) => {
  const shown = rows.filter(([, v]) => v !== null && v !== undefined && v !== "—" && v !== false);
  if (shown.length === 0) return <div className="font-mono text-[10px] text-muted-foreground">no data</div>;
  return (
    <div className="border border-border divide-y divide-border">
      {shown.map(([k, v, hint]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 px-2.5 py-1.5 bg-card">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k}</span>
          <span className="font-mono text-xs font-semibold text-right">
            {v}
            {hint ? <span className="ml-1.5 font-normal text-[10px] text-muted-foreground">{hint}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function WeaponBreakdown({ weapon: r }) {
  const rof = r.rate_of_fire || 0;
  const burst = r.burst_amount > 1 ? r.burst_amount : 1;
  const perShot = (r.hp_change || 0) + (r.shield_change || 0);

  // Fire cycle: a burst of N shots, then (optionally) reload / precharge before the next cycle.
  const burstTime = burst > 1 ? (burst - 1) * (r.burst_interval || 0) : 0;
  const cycleTime =
    (rof > 0 ? 1 / rof : 0) + burstTime + (r.requires_reload ? r.reload_time || 0 : 0) + (r.requires_precharge ? r.precharge_duration || 0 : 0);
  const sustainedHull = cycleTime > 0 ? ((r.hp_change || 0) * burst) / cycleTime : null;
  const flightTime = r.bullet_speed > 0 && r.range > 0 ? r.range / r.bullet_speed : null;

  const classes = r.class_damage_multipliers || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Section title="Damage per shot">
          <Rows rows={[
            ["Hull damage", fmtNum(r.hp_change, 2)],
            ["Shield damage", fmtNum(r.shield_change, 2)],
            ["Electrical damage", r.electrical_change ? fmtNum(r.electrical_change, 2) : null],
            ["Combined / hit", fmtNum(perShot, 2)],
            ["Damage / volley", burst > 1 ? fmtNum((r.hp_change || 0) * burst, 2) : null, `${burst} shots`],
            ["Armor penetration", `${fmtNum((r.armor_penetration || 0) * 100, 0)}%`],
            ["Shield → hull carry-over", r.shield_to_hp_carry_over ? `${fmtNum(r.shield_to_hp_carry_over * 100, 0)}%` : null],
            ["Falloff damage", r.drop_off_hp_change ? fmtNum(r.drop_off_hp_change, 2) : null, "at max range"],
            ["Friendly fire", r.friendly_fire_multiplier ? `×${fmtNum(r.friendly_fire_multiplier, 2)}` : null],
          ]} />
        </Section>

        <Section title="Fire cycle" note="game dps vs. reload-adjusted">
          <Rows rows={[
            ["Rate of fire", rof ? `${fmtNum(rof, 2)} /s` : null, rof ? `${fmtNum(1 / rof, 2)}s between shots` : null],
            ["Burst", burst > 1 ? `${burst} × ${fmtNum(r.burst_interval, 2)}s` : "single shot"],
            ["Burst spread", r.burst_spread ? `${fmtNum(r.burst_spread, 2)}°` : null],
            ["Reload", r.requires_reload ? `${fmtNum(r.reload_time, 2)}s` : "none", r.requires_reload && r.auto_reload ? "auto" : null],
            ["Precharge", r.requires_precharge ? `${fmtNum(r.precharge_duration, 2)}s` : null],
            ["Full cycle", cycleTime ? `${fmtNum(cycleTime, 2)}s` : null],
            ["Peak DPS", fmtNum(r.dps, 1), "game value"],
            ["Sustained hull DPS", sustainedHull ? fmtNum(sustainedHull, 1) : null, "incl. reload"],
            ["Additional DPS", r.additional_dps ? fmtNum(r.additional_dps, 1) : null],
          ]} />
        </Section>

        <Section title="Projectile & flight">
          <Rows rows={[
            ["Implementation", r.implementation],
            ["Range", fmtNum(r.range, 1)],
            ["Projectile speed", r.bullet_speed ? fmtNum(r.bullet_speed, 1) : null, r.implementation === "Raycast" ? "instant hit" : null],
            ["Time to max range", flightTime ? `${fmtNum(flightTime, 2)}s` : null],
            ["Lifetime", r.bullet_lifetime ? `${fmtNum(r.bullet_lifetime, 2)}s` : null],
            ["Homing", r.bullets_follow_target ? "tracks target" : null],
            ["Tracking speed", r.tracking_speed ? fmtNum(r.tracking_speed, 2) : null],
            ["Acceleration", r.acceleration ? fmtNum(r.acceleration, 2) : null],
            ["Top speed", r.max_speed ? fmtNum(r.max_speed, 2) : null],
            ["Fire correction cone", r.fire_correction_cone_angle ? `${fmtNum(r.fire_correction_cone_angle, 1)}°` : null],
          ]} />
        </Section>

        <Section title="Area effect & special">
          <Rows rows={[
            ["Area damage", r.deal_area_damage ? fmtNum(r.area_damage, 2) : null],
            ["Area radius", r.area_radius ? fmtNum(r.area_radius, 2) : null],
            ["Area duration", r.time_area_active ? `${fmtNum(r.time_area_active, 2)}s` : null],
            ["Friendly area damage", r.area_damage_friendly_fire ? "yes" : null],
            ["Splash radius", r.splash_radius ? fmtNum(r.splash_radius, 2) : null],
            ["Explosion radius", r.total_explosion_radius ? `${fmtNum(r.inner_explosion_radius, 1)} → ${fmtNum(r.total_explosion_radius, 1)}` : null],
            ["Status on hit", r.applied_status_on_hit ? `${r.applied_status_on_hit} ${fmtNum(r.status_duration, 1)}s` : null],
            ["Detection range", r.detection_range ? fmtNum(r.detection_range, 1) : null],
            ["Arming time", r.mine_arming_time ? `${fmtNum(r.mine_arming_time, 1)}s` : null],
            ["Max minefield", r.max_minefield_count || null],
            ["Scuttle multiplier", r.scuttle_multiplier ? `×${fmtNum(r.scuttle_multiplier, 2)}` : null],
          ]} />
        </Section>
      </div>

      <WeaponTargetCharts weapon={r} />

      <Section
        title="Effective damage per target class"
        note={classes.length ? "class multiplier applied to per-hit and dps" : "no class modifiers — damage is flat vs all classes"}
      >
        {classes.length > 0 && (
          <div className="border border-border overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-secondary/90">
                <tr className="text-left">
                  {["Target class", "Multiplier", "Hull / hit", "Shield / hit", "Effective DPS"].map((h) => (
                    <th key={h} className="tech-label px-2.5 py-1.5 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...classes]
                  .sort((a, b) => (b.multiplier || 0) - (a.multiplier || 0))
                  .map((m, i) => {
                    const mult = m.multiplier ?? 1;
                    const strong = mult > 1;
                    const weak = mult < 1;
                    return (
                      <tr key={i} className="bg-card">
                        <td className="px-2.5 py-1.5 font-mono text-[11px]">{m.entity_class}</td>
                        <td className={`px-2.5 py-1.5 font-mono text-[11px] font-semibold ${strong ? "text-[#38bdf8]" : weak ? "text-[#ff2d55]" : "text-muted-foreground"}`}>
                          {strong ? "▲ " : weak ? "▼ " : "= "}×{fmtNum(mult, 2)}
                        </td>
                        <td className="px-2.5 py-1.5 font-mono text-[11px]">{fmtNum((r.hp_change || 0) * mult, 2)}</td>
                        <td className="px-2.5 py-1.5 font-mono text-[11px]">{fmtNum((r.shield_change || 0) * mult, 2)}</td>
                        <td className="px-2.5 py-1.5 font-mono text-[11px] font-semibold">{fmtNum((r.dps || 0) * mult, 1)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}