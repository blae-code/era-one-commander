import React from "react";
import { Boxes, Ship, Crosshair, RadarIcon, FlaskConical, Shapes, Compass, Shield, Zap, Factory, Cog, Wrench, Radio, Package, Flame, Anchor, Move3d, Star, Sparkles, Bomb, Target } from "lucide-react";
import { fmtNum } from "@/lib/gameData";

// ---- icons: kind + class/type aware -------------------------------------------------------
const CLASS_ICON = {
  Weapon: Crosshair, Structural: Boxes, Utility: Wrench, Facility: Factory, Command: Star,
  Fighter: Sparkles, Corvette: Ship, Frigate: Anchor, Platform: Radio, Mine: Bomb,
  Upgrade: Zap, Technology: FlaskConical, Tier: Shield, Ability: Sparkles, Stance: Target, Style: Move3d, Orientation: Compass, Formation: Shapes, Neutral: Cog,
};
const TYPE_ICON = { Armor: Shield, Plate: Shield, Power: Zap, Fusion: Flame, Engine: Move3d, Storage: Package, Sensor: Radio, Weapon: Crosshair, Extender: Boxes, Rotator: Cog };
export const KIND_ICON = { Module: Boxes, Unit: Ship, Weapon: Crosshair, Turret: RadarIcon, ResearchNode: FlaskConical, Doctrine: Compass, GameBlueprint: Shapes };
export const CLASS_HEX = {
  Weapon: "#ff7a1a", Structural: "#c9d6e3", Utility: "#00d1c1", Facility: "#2f9bff", Command: "#ffd21a",
  Fighter: "#00d1c1", Corvette: "#2f9bff", Frigate: "#ff7a1a", Platform: "#c9d6e3", Mine: "#ff4d4d",
  Upgrade: "#00d1c1", Technology: "#2f9bff", Tier: "#ffd21a", Ability: "#c98aff", Stance: "#ff7a1a", Style: "#2f9bff", Orientation: "#c9d6e3", Formation: "#00d1c1", Neutral: "#8c9aa3",
  Standard: "#c9d6e3", Missile: "#ff7a1a", EMP: "#2f9bff", SelfDestruct: "#ff4d4d", LongRangeTorpedo: "#ffd21a", NuclearBomb: "#ff4d4d", SubWeapon: "#8c9aa3", Radiation: "#8cff5a",
  shipped: "#c9d6e3", player: "#00d1c1", CMX: "#2f9bff", PIR: "#ff4d4d",
};
export const rowClass = (r, kindKey) => r.module_class || r.unit_class || r.weapon_type?.split("|")[0] || r.research_type || r.doctrine_kind || r.source || kindKey;

export function EntityIcon({ row, kindKey, size = 16 }) {
  const cls = rowClass(row, kindKey);
  const Icon = TYPE_ICON[row.module_type] || CLASS_ICON[cls] || KIND_ICON[kindKey] || Boxes;
  return <Icon size={size} style={{ color: CLASS_HEX[cls] || "hsl(var(--primary))" }} className="shrink-0" />;
}

export function ClassDot({ value }) {
  return <span className="inline-block w-2 h-2 rounded-sm mr-1.5 align-middle" style={{ background: CLASS_HEX[value] || "hsl(var(--muted-foreground))" }} />;
}

// ---- cell renderer -------------------------------------------------------------------------
export function Cell({ col, row, ctx, stats, heat = true }) {
  const v = col.get(row, ctx);
  if (v === null || v === undefined || v === "") return <span className="text-muted-foreground/50">—</span>;
  if (col.type === "num" || col.type === "pct") {
    const s = stats?.[col.key]; const max = s?.max || 0;
    const pct = col.type === "pct" ? Math.max(0, Math.min(1, v)) : max > 0 ? Math.max(0, v) / max : 0;
    const txt = col.type === "pct" ? `${fmtNum(v * 100, 0)}%` : (col.signed && v > 0 ? "+" : "") + fmtNum(v, col.dec ?? 0);
    const neg = col.signed && v < 0;
    return (
      <span className="relative block font-mono text-xs tabular-nums text-right pr-1">
        {heat && col.heat !== false && (col.type === "pct" || max > 0) && (
          <span className="absolute inset-y-0.5 right-0 rounded-sm pointer-events-none" style={{ width: `${Math.round(pct * 100)}%`, background: neg ? "hsl(0 70% 50% / .18)" : "hsl(var(--primary) / .18)" }} />
        )}
        <span className={`relative ${neg ? "text-red-400" : col.signed && v > 0 ? "text-emerald-400" : ""}`}>{txt}{col.unit ? <span className="text-muted-foreground ml-0.5 text-[9px]">{col.unit}</span> : null}</span>
      </span>
    );
  }
  if (col.type === "bool") return <span className={`font-mono text-[10px] ${v ? "text-emerald-400" : "text-muted-foreground/60"}`}>{v ? "YES" : "no"}</span>;
  if (col.type === "enum") return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider">
      {String(v).split("|").map((p) => <span key={p} className="px-1.5 py-0.5 border border-border bg-secondary/40 whitespace-nowrap"><ClassDot value={p} />{p}</span>)}
    </span>
  );
  if (col.type === "list") return <span className="text-xs text-muted-foreground truncate block" title={String(v)}>{String(v)}</span>;
  return <span className="text-xs truncate block" title={String(v)}>{String(v)}</span>;
}

export function TierPips({ tier }) {
  if (!tier) return null;
  return <span className="inline-flex gap-0.5 align-middle" title={`Tier ${tier}`}>{[1, 2, 3].map((i) => <span key={i} className={`w-1.5 h-3 ${i <= tier ? "bg-primary" : "bg-secondary"}`} />)}</span>;
}
