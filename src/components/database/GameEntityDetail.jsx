import React from "react";
import TierBadge from "@/components/shared/TierBadge";
import StatBar from "@/components/shared/StatBar";
import { fmtNum, countIds, fmtModifier } from "@/lib/gameData";
import WeaponBreakdown from "@/components/database/WeaponBreakdown";

// Detail panel for the real game entities. `onSelect(kind, game_id)` lets ids cross-link
// (module → its weapons, unit → its equipment options, research → children).
const Grid = ({ cells }) => (
  <div className="grid grid-cols-3 gap-px bg-border border border-border">
    {cells.filter(([, v]) => v !== undefined && v !== null && v !== "—").map(([k, v]) => (
      <div key={k} className="bg-card p-2.5 text-center">
        <div className="font-mono text-[9px] text-muted-foreground tracking-widest">{k}</div>
        <div className="font-mono text-sm font-semibold">{v}</div>
      </div>
    ))}
  </div>
);

const IdChips = ({ title, ids, kind, onSelect, byId }) => {
  if (!ids || ids.length === 0) return null;
  return (
    <div>
      <div className="tech-label mb-1">{title}</div>
      <div className="flex flex-wrap gap-1">
        {countIds(ids).map(([id, n]) => (
          <button
            key={id}
            onClick={() => onSelect?.(kind, id)}
            className="px-1.5 py-0.5 border border-border bg-secondary/40 font-mono text-[10px] hover:border-primary/60 hover:text-primary transition-colors"
            title={id}
          >
            {n > 1 ? `${n}× ` : ""}{byId?.[id]?.name || id}
          </button>
        ))}
      </div>
    </div>
  );
};

const Mods = ({ title, mods }) =>
  mods && mods.length > 0 ? (
    <div>
      <div className="tech-label mb-1">{title}</div>
      <div className="flex flex-wrap gap-1">
        {mods.map((m, i) => (
          <span key={i} className="px-1.5 py-0.5 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">{fmtModifier(m)}</span>
        ))}
      </div>
    </div>
  ) : null;

const Header = ({ r, sub }) => (
  <div>
    <div className="flex items-center gap-2 flex-wrap">
      <h2 className="font-display font-bold text-xl leading-tight">{r.name}</h2>
      {r.tier ? <TierBadge tier={r.tier} /> : null}
      <span className="font-mono text-[10px] text-muted-foreground">{r.game_id}</span>
    </div>
    <div className="tech-label mt-0.5">{sub}</div>
    {r.info && <div className="font-mono text-[10px] text-primary mt-1">{r.info}</div>}
  </div>
);

export default function GameEntityDetail({ kind, record: r, byId, onSelect }) {
  if (!r) return <div className="tech-label text-center py-16">Select an entry to inspect</div>;

  if (kind === "Module") {
    return (
      <div className="space-y-4">
        <Header r={r} sub={[r.module_class, r.module_type, r.module_sub_type, r.weapon_category].filter(Boolean).join(" · ")} />
        {r.description && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{r.description}</p>}
        <Grid cells={[
          ["COST RU", fmtNum(r.cost_resources)], ["CREW", fmtNum(r.cost_population)], ["BUILD s", fmtNum(r.construction_time)],
          ["HP", fmtNum(r.max_health)], ["ARMOR", fmtNum(r.armor)], ["MASS", fmtNum(r.mass)],
          ["ENERGY /s", r.energy_per_second ? `−${fmtNum(r.energy_per_second, 1)}` : r.energy_production ? `+${fmtNum(r.energy_production, 1)}` : "0"],
          ["MOUNT", r.mount_size], ["SCORE", fmtNum(r.score)],
        ]} />
        <div className="space-y-3">
          {r.max_health > 0 && <StatBar label="Hit points" value={r.max_health} max={12000} color="bg-[#c9a678]" />}
          {r.cargo_capacity > 0 && <StatBar label="Cargo capacity" value={r.cargo_capacity} max={4000} color="bg-[#a1786b]" />}
          {r.extraction_rate > 0 && <StatBar label="Extraction rate" value={r.extraction_rate} max={20} decimals={1} color="bg-[#8c9aa3]" />}
          {r.resource_production > 0 && <StatBar label="Resource production" value={r.resource_production} max={10} decimals={2} color="bg-[#8c9aa3]" />}
          {r.max_perimeter_shield > 0 && <StatBar label="Perimeter shield" value={r.max_perimeter_shield} max={5000} color="bg-[#6f7d86]" />}
          {r.visual_range > 0 && <StatBar label="Visual range" value={r.visual_range} max={60} color="bg-[#b8963f]" />}
          {r.sensors_range > 0 && <StatBar label="Sensor range" value={r.sensors_range} max={120} color="bg-[#b8963f]" />}
        </div>
        <IdChips title="Armament (all guns on the module)" ids={r.weapons} kind="Weapon" onSelect={onSelect} byId={byId} />
        <IdChips title="Turrets" ids={r.turrets} kind="Turret" onSelect={onSelect} byId={byId} />
        <IdChips title="Requires research" ids={r.required_research} kind="ResearchNode" onSelect={onSelect} byId={byId} />
        <IdChips title="Builds ships" ids={r.constructable_ships} kind="Unit" onSelect={onSelect} byId={byId} />
        {r.spawned_unit && <IdChips title="Spawns" ids={[r.spawned_unit]} kind="Unit" onSelect={onSelect} byId={byId} />}
        <Mods title="Perfect-attachment bonus" mods={r.perfect_attachment_bonus} />
        <Mods title="Power-on modifiers" mods={r.power_on_modifiers} />
        {r.perfect_attachment_requires && <div className="tech-label">Perfect attachment on // {r.perfect_attachment_requires}</div>}
      </div>
    );
  }

  if (kind === "Unit") {
    const equip = [
      ["Primary slot", r.primary_equip, r.primary_equip_options],
      ["Secondary slot", r.secondary_equip, r.secondary_equip_options],
      ["Tertiary slot", r.tertiary_equip, []],
    ];
    return (
      <div className="space-y-4">
        <Header r={r} sub={[r.faction, r.unit_class, r.unit_type].filter(Boolean).join(" · ")} />
        {r.description && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{r.description}</p>}
        <Grid cells={[
          ["COST RU", fmtNum(r.cost_resources)], ["CREW", fmtNum(r.cost_population)], ["BUILD s", fmtNum(r.construction_time)],
          ["HP", fmtNum(r.max_health)], ["ARMOR", fmtNum(r.armor)], ["MASS", fmtNum(r.mass, 1)],
          ["SPEED", fmtNum(r.max_speed, 2)], ["TURN", fmtNum(r.turning_power, 2)], ["SCORE", fmtNum(r.score)],
        ]} />
        <div className="space-y-3">
          {r.max_health > 0 && <StatBar label="Hit points" value={r.max_health} max={6000} color="bg-[#c9a678]" />}
          {r.max_speed > 0 && <StatBar label="Max speed" value={r.max_speed} max={4} decimals={2} color="bg-[#8c9aa3]" />}
          {r.cargo_capacity > 0 && <StatBar label="Cargo capacity" value={r.cargo_capacity} max={2000} color="bg-[#a1786b]" />}
          {r.visual_range > 0 && <StatBar label="Visual range" value={r.visual_range} max={60} color="bg-[#b8963f]" />}
        </div>
        <IdChips title="Fixed armament" ids={r.weapons} kind="Weapon" onSelect={onSelect} byId={byId} />
        {r.hardpoints && Object.keys(r.hardpoints).length > 0 && (
          <div className="tech-label">Hardpoints // {Object.entries(r.hardpoints).map(([k, v]) => `${v} ${k}`).join(", ")}</div>
        )}
        {equip.filter(([, d, o]) => d || (o && o.length)).map(([label, def, opts]) => (
          <div key={label}>
            <IdChips title={`${label} — default`} ids={def ? [def] : []} kind="Turret" onSelect={onSelect} byId={byId} />
            <IdChips title={`${label} — options`} ids={opts} kind="Turret" onSelect={onSelect} byId={byId} />
          </div>
        ))}
        <IdChips title="Requires research" ids={r.required_research} kind="ResearchNode" onSelect={onSelect} byId={byId} />
        {r.levels && r.levels.length > 0 && (
          <div>
            <div className="tech-label mb-1">Veterancy ({r.levels.length} levels)</div>
            <div className="font-mono text-[10px] text-muted-foreground space-y-0.5">
              {r.levels.slice(0, 5).map((lv) => (
                <div key={lv.level}>L{lv.level} @ {lv.experience_required} xp — {lv.stat_upgrades.map(fmtModifier).join(", ")}</div>
              ))}
              {r.levels.length > 5 && <div>… up to L{r.levels.length} @ {r.levels[r.levels.length - 1].experience_required} xp</div>}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (kind === "Weapon") {
    return (
      <div className="space-y-4">
        <Header r={r} sub={[r.weapon_type, r.implementation, r.weapon_category].filter(Boolean).join(" · ")} />
        {r.description && <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>}
        <Grid cells={[
          ["DPS", fmtNum(r.dps, 1)], ["RANGE", fmtNum(r.range, 1)], ["ROF /s", fmtNum(r.rate_of_fire, 2)],
        ]} />
        <div className="space-y-3">
          {r.dps > 0 && <StatBar label="Damage / sec" value={r.dps} max={250} decimals={1} color="bg-[#d4713f]" />}
          {r.range > 0 && <StatBar label="Range" value={r.range} max={120} decimals={0} color="bg-[#c98a52]" />}
          {r.armor_penetration > 0 && <StatBar label="Armor penetration" value={r.armor_penetration * 100} max={100} unit="%" color="bg-[#b3663c]" />}
        </div>
        <WeaponBreakdown weapon={r} />
        <IdChips title="Requires research" ids={r.required_research} kind="ResearchNode" onSelect={onSelect} byId={byId} />
      </div>
    );
  }

  if (kind === "Turret") {
    return (
      <div className="space-y-4">
        <Header r={r} sub={`turret · ${r.weapons_count} weapon${r.weapons_count === 1 ? "" : "s"}`} />
        {r.description && <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>}
        <Grid cells={[
          ["DPS", fmtNum(r.dps, 1)], ["ROT °/s", fmtNum(r.horizontal_rotation_speed)], ["FOV", r.horizontal_fov ? `${r.horizontal_fov[0]}…${r.horizontal_fov[1]}` : "—"],
          ["VOLLEY s", fmtNum(r.time_between_volleys, 1)], ["SHOT s", fmtNum(r.time_between_weapon_shots, 2)], ["FIXED", r.is_fixed ? "yes" : "no"],
        ]} />
        <IdChips title="Weapons" ids={r.weapons} kind="Weapon" onSelect={onSelect} byId={byId} />
        {r.weapons_source && r.weapons_source !== "prefab" && <div className="tech-label">Armament inferred // {r.weapons_source}</div>}
        {r.attack_priority && r.attack_priority.length > 0 && <div className="tech-label">Targets // {r.attack_priority.join(" › ")}</div>}
      </div>
    );
  }

  if (kind === "ResearchNode") {
    return (
      <div className="space-y-4">
        <Header r={r} sub={[r.research_type, r.unit_class_affected && `affects ${r.unit_class_affected}`, r.module_class_affected && `affects ${r.module_class_affected}`].filter(Boolean).join(" · ")} />
        {r.description && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{r.description}</p>}
        <Grid cells={[["COST RU", fmtNum(r.cost_resources)], ["ENERGY", fmtNum(r.cost_energy)], ["TIME s", fmtNum(r.construction_time)], ["SCORE", fmtNum(r.score)]]} />
        <Mods title="Grants" mods={r.modifiers} />
        {r.module_types_affected && r.module_types_affected.length > 0 && <div className="tech-label">Module types // {r.module_types_affected.join(", ")}</div>}
        <IdChips title="Requires" ids={r.required_nodes} kind="ResearchNode" onSelect={onSelect} byId={byId} />
        <IdChips title="Also requires" ids={r.other_requirements} kind="Module" onSelect={onSelect} byId={byId} />
        <IdChips title="Unlocks next" ids={r.child_nodes} kind="ResearchNode" onSelect={onSelect} byId={byId} />
        <IdChips title="Unlocks" ids={r.unlocks} kind="Module" onSelect={onSelect} byId={byId} />
      </div>
    );
  }

  return <pre className="font-mono text-[10px] whitespace-pre-wrap">{JSON.stringify(r, null, 1)}</pre>;
}