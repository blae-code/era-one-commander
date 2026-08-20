import React, { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Star, GitCompare, Link as LinkIcon } from "lucide-react";
import GameEntityDetail from "@/components/database/GameEntityDetail";
import { EntityIcon, TierPips, CLASS_HEX, rowClass } from "./Cells";
import { CLASSES } from "./catalog";
import { fmtNum, fmtModifier } from "@/lib/gameData";
import { SegBar as Bar } from "./Readouts";
import VitalsStrip from "./VitalsStrip";

const Chips = ({ ids, byId, onSelect, empty = "—" }) => (
  <div className="flex flex-wrap gap-1">
    {(ids || []).length ? ids.map((id, i) => (
      <button key={id + i} onClick={() => onSelect(id)} className="px-1.5 py-0.5 border border-border bg-secondary/40 font-mono text-[10px] hover:border-primary/60 hover:text-primary">{byId[id]?.name || id}</button>
    )) : <span className="text-[11px] text-muted-foreground">{empty}</span>}
  </div>
);

const KV = ({ items }) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
    {items.filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length)).map(([k, v]) => (
      <div key={k} className="flex justify-between gap-2 border-b border-border/50 py-0.5"><span className="text-muted-foreground truncate">{k}</span><span className="font-mono text-right truncate">{Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "yes" : "no") : typeof v === "number" ? fmtNum(v, 2) : String(v)}</span></div>
    ))}
  </div>
);

function JsonTree({ value, depth = 0 }) {
  const [open, setOpen] = useState(depth < 1);
  if (value === null || typeof value !== "object") return <span className={typeof value === "number" ? "text-emerald-400" : typeof value === "string" ? "text-[#c9d6e3]" : "text-[#ffd21a]"}>{JSON.stringify(value)}</span>;
  const entries = Array.isArray(value) ? value.map((v, i) => [i, v]) : Object.entries(value);
  if (!entries.length) return <span className="text-muted-foreground">{Array.isArray(value) ? "[]" : "{}"}</span>;
  return (
    <span>
      <button onClick={() => setOpen(!open)} className="text-muted-foreground hover:text-primary font-mono">{open ? "▾" : "▸"} {Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`}</button>
      {open && <div className="pl-3 border-l border-border/50 ml-1">{entries.map(([k, v]) => <div key={k} className="font-mono text-[10px] leading-relaxed"><span className="text-primary/80">{k}</span>: <JsonTree value={v} depth={depth + 1} /></div>)}</div>}
    </span>
  );
}

export default function DetailDrawer({ row, kindKey, ctx, peers = [], open, onClose, onSelectId, favorites, onFav, compareIds, onCompare, note, onNote }) {
  const byId = ctx.byId;
  const cls = row ? rowClass(row, kindKey) : null;
  const dpsVs = row?.dps_vs_class || {};
  const maxDps = Math.max(0, ...Object.values(dpsVs));
  const doctrineRows = useMemo(() => {
    if (!row) return [];
    const stances = String(row.enabled_stances || "").split("|").filter(Boolean);
    const styles = String(row.enabled_styles || "").split("|").filter(Boolean);
    return [...(ctx.combatTemplates || []).filter((c) => (c.kind === "Stance" && stances.includes(c.name.replace("Stance ", ""))) || (c.kind === "Style" && styles.includes(c.name.replace("Style ", ""))))];
  }, [row, ctx.combatTemplates]);
  const copy = (txt) => navigator.clipboard?.writeText(txt);
  const isUnitOrModule = row && (row.unit_class || row.module_class);
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[560px] sm:max-w-[560px] p-0 flex flex-col overflow-hidden">
        {row && (
          <>
            <SheetHeader className="p-4 pb-2 border-b border-border" style={{ borderTop: `3px solid ${CLASS_HEX[cls] || "hsl(var(--primary))"}` }}>
              <div className="flex items-start gap-3">
                <EntityIcon row={row} kindKey={kindKey} size={28} />
                <div className="min-w-0 flex-1">
                  <SheetTitle className="font-display font-bold text-xl leading-tight flex items-center gap-2 flex-wrap">{row.name} <TierPips tier={row.tier} /></SheetTitle>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{row.game_id}{row.info ? ` · ${row.info}` : ""} · {[row.module_class, row.module_type, row.unit_class, row.unit_type, row.weapon_type, row.research_type, row.doctrine_kind].filter(Boolean).join(" · ")}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onFav(row.game_id)} title="favourite" className={`p-1.5 border border-border ${favorites.has(row.game_id) ? "text-[#ffd21a]" : "text-muted-foreground"}`}><Star size={13} fill={favorites.has(row.game_id) ? "currentColor" : "none"} /></button>
                  <button onClick={() => onCompare(row.game_id)} title="add to compare" className={`p-1.5 border border-border ${compareIds.includes(row.game_id) ? "text-[#2f9bff]" : "text-muted-foreground"}`}><GitCompare size={13} /></button>
                  <button onClick={() => copy(window.location.href)} title="copy link" className="p-1.5 border border-border text-muted-foreground hover:text-primary"><LinkIcon size={13} /></button>
                </div>
              </div>
            </SheetHeader>
            <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-4 mt-2 rounded-none justify-start bg-transparent border-b border-border h-8 gap-2 p-0">
                {["overview", "combat", "doctrine", "economy", "research", "notes", "raw"].map((t) => <TabsTrigger key={t} value={t} className="rounded-none font-mono text-[10px] uppercase tracking-wider data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-8 px-2">{t}</TabsTrigger>)}
              </TabsList>
              <div className="flex-1 overflow-y-auto p-4">
                <TabsContent value="overview" className="m-0"><VitalsStrip row={row} peers={peers} /><GameEntityDetail kind={kindKey === "Doctrine" || kindKey === "GameBlueprint" ? "Other" : kindKey} record={row} byId={byId} onSelect={(k, id) => onSelectId(id)} /></TabsContent>
                <TabsContent value="combat" className="m-0 space-y-4">
                  {maxDps > 0 ? (<div className="space-y-1"><div className="tech-label mb-1">DPS vs target class</div>{CLASSES.map((c) => <Bar key={c} label={c} value={dpsVs[c] || 0} max={maxDps} color={CLASS_HEX[c.replace("Unit", "").replace("Module", "")] || "hsl(var(--primary))"} />)}</div>) : <div className="tech-label">No armament</div>}
                  {row.weapons?.length ? (<div><div className="tech-label mb-1">Armament</div><Chips ids={[...new Set(row.weapons)]} byId={byId} onSelect={onSelectId} /></div>) : null}
                  {row.class_damage_multipliers?.length ? (<div><div className="tech-label mb-1">Class multipliers</div><KV items={row.class_damage_multipliers.map((m) => [m.entity_class, `×${m.multiplier}`])} /></div>) : null}
                  {isUnitOrModule && <KV items={[["HP", row.max_health], ["Armor", row.armor], ["HP regen", row.health_regen], ["Ablative shield", row.max_ablative_shield], ["Perimeter shield", row.max_perimeter_shield], ["Attack range", row.link_range], ["Reactivity", row.attack_reactivity], ["Attack cooldown", row.attack_cooldown], ["Aim required", row.aim_required], ["Predictive aim", row.predictive_aim], ["Structural dmg ×", row.structural_damage_multiplier]]} />}
                  {row.dps !== undefined && !isUnitOrModule && <KV items={[["DPS", row.dps], ["Range", row.range], ["Hull / hit", row.hp_change], ["Shield / hit", row.shield_change], ["Armor pen", row.armor_penetration], ["Rate of fire", row.rate_of_fire], ["Burst", row.burst_amount], ["Burst interval", row.burst_interval], ["Reload", row.requires_reload ? row.reload_time : null], ["Projectile speed", row.bullet_speed], ["Lifetime", row.bullet_lifetime], ["Tracking", row.tracking_speed], ["AoE radius", row.deal_area_damage ? row.area_radius : null], ["Status on hit", row.applied_status_on_hit], ["Type", row.weapon_type], ["Implementation", row.implementation]]} />}
                </TabsContent>
                <TabsContent value="doctrine" className="m-0 space-y-4">
                  {isUnitOrModule ? (<>
                    <KV items={[["Default stance", row.default_stance], ["Stances", row.enabled_stances], ["Default style", row.default_style], ["Styles", row.enabled_styles], ["Default orientation", row.default_orientation], ["Orientations", row.enabled_orientations], ["Evade on attack", row.evade_on_attack_probability], ["Evade actions", row.evade_actions], ["Switch target every", row.switch_target_interval], ["Attack priority", row.attack_priority], ["Flyby disengage", row.flyby_disengage_distance], ["Banking", row.banking_amount], ["Backflip", row.backflip_probability], ["Oversteer", row.oversteer_enabled], ["Stay horizontal", row.stay_horizontal]]} />
                    {row.disengage_multiplier_by_class && Object.keys(row.disengage_multiplier_by_class).length ? (<div><div className="tech-label mb-1">Disengage distance ×</div><KV items={Object.entries(row.disengage_multiplier_by_class)} /></div>) : null}
                    {doctrineRows.length ? (<div><div className="tech-label mb-1">Stance / style effects</div>{doctrineRows.map((d) => <div key={d.game_id} className="text-[11px] mb-1"><span className="font-medium">{d.name}:</span> <span className="text-muted-foreground">{(d.modifiers || []).map((m) => fmtModifier(m, ctx.statLabels)).join(", ") || "no stat change"}</span></div>)}</div>) : null}
                    {row.levels?.length ? (<div><div className="tech-label mb-1">Veterancy</div>{row.levels.map((l) => <div key={l.level} className="text-[10px] font-mono text-muted-foreground">L{l.level} @{l.experience_required}xp — {l.stat_upgrades.map((m) => fmtModifier(m, ctx.statLabels)).join(", ")}</div>)}</div>) : null}
                  </>) : row.modifiers ? (<div><div className="tech-label mb-1">Effects</div>{(row.modifiers || []).map((m, i) => <div key={i} className="text-[11px]">{fmtModifier(m, ctx.statLabels)}</div>)}</div>) : <div className="tech-label">Not applicable</div>}
                </TabsContent>
                <TabsContent value="economy" className="m-0 space-y-3">
                  <KV items={[["Cost (RU)", row.cost_resources ?? row.sum_module_cost_resources], ["Crew", row.cost_population ?? row.crew_total], ["Energy cost", row.cost_energy], ["Build time (s)", row.construction_time], ["Energy production", row.energy_production], ["Energy use /s", row.energy_per_second ?? row.energy_use], ["Cargo", row.cargo_capacity], ["Extraction rate", row.extraction_rate], ["Refining rate", row.refining_rate], ["Resource production", row.resource_production], ["Resource cap. bonus", row.resource_capacity_bonus], ["Energy cap. bonus", row.energy_capacity_bonus], ["Crew cap. bonus", row.population_capacity_bonus], ["Research cap. bonus", row.research_capacity_bonus], ["Repair cost ×", row.repair_cost_multiplier], ["Recycle ratio", row.recycle_cost_ratio], ["Mass", row.mass ?? row.mass_total], ["Score", row.score]]} />
                  {row.modules && typeof row.modules === "object" && !Array.isArray(row.modules) ? (<div><div className="tech-label mb-1">Module composition</div><KV items={Object.entries(row.modules).map(([id, n]) => [byId[id]?.name || id, n])} /></div>) : null}
                </TabsContent>
                <TabsContent value="research" className="m-0 space-y-3">
                  <div><div className="tech-label mb-1">Requires research</div><Chips ids={row.required_research || row.required_nodes || []} byId={byId} onSelect={onSelectId} empty="none" /></div>
                  {row.child_nodes ? (<div><div className="tech-label mb-1">Leads to</div><Chips ids={row.child_nodes} byId={byId} onSelect={onSelectId} empty="—" /></div>) : null}
                  {(row.unlocks_modules || row.unlocks_units || row.unlocks_weapons || row.unlocks) ? (<div><div className="tech-label mb-1">Unlocks</div><Chips ids={[...(row.unlocks_modules || []), ...(row.unlocks_units || []), ...(row.unlocks_weapons || []), ...(row.unlocks_turrets || []), ...(row.unlocks || [])]} byId={byId} onSelect={onSelectId} empty="—" /></div>) : null}
                  {row.modifiers?.length ? (<div><div className="tech-label mb-1">Grants</div>{row.modifiers.map((m, i) => <div key={i} className="text-[11px]">{fmtModifier(m, ctx.statLabels)}</div>)}</div>) : null}
                  {isUnitOrModule ? (<div><div className="tech-label mb-1">Unlocked by</div><Chips ids={(ctx.research || []).filter((r) => (r.unlocks_modules || []).includes(row.game_id) || (r.unlocks_units || []).includes(row.game_id)).map((r) => r.game_id)} byId={byId} onSelect={onSelectId} empty="—" /></div>) : null}
                </TabsContent>
                <TabsContent value="notes" className="m-0">
                  <div className="tech-label mb-1">Your notes (stored in this browser)</div>
                  <textarea value={note || ""} onChange={(e) => onNote(row.game_id, e.target.value)} rows={8} placeholder="Tactics, builds, reminders…" className="w-full bg-background/60 border border-border p-2 text-xs font-mono outline-none focus:border-primary" />
                </TabsContent>
                <TabsContent value="raw" className="m-0">
                  <div className="flex items-center justify-between mb-2"><div className="tech-label">Every field (curated + full game record)</div><button onClick={() => copy(JSON.stringify(row, null, 2))} className="font-mono text-[10px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"><Copy size={11} /> copy JSON</button></div>
                  <JsonTree value={row} />
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}