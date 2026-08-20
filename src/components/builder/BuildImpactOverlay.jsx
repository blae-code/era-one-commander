import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { GripHorizontal, X, Crosshair } from "lucide-react";
import { computeStats, fmt } from "@/lib/shipStats";

// Draggable performance overlay: floats above the build grid and re-computes live as
// modules are placed. When a component is armed in the palette it also shows the
// projected delta of adding it to the current hull.
const METRICS = [
  { key: "dps", label: "DPS", dec: 1 },
  { key: "hp", label: "HULL", dec: 0 },
  { key: "shield", label: "SHIELD", dec: 0 },
  { key: "twr", label: "TWR", dec: 2 },
];

export default function BuildImpactOverlay({ hull, placements, selectedComponent, onClose }) {
  const [open, setOpen] = useState(true);
  const stats = useMemo(() => computeStats(hull, placements), [hull, placements]);
  const projected = useMemo(() => {
    if (!selectedComponent) return null;
    return computeStats(hull, [...placements, { component: selectedComponent, x: 0, y: 0, w: 1, h: 1 }]);
  }, [hull, placements, selectedComponent]);

  const weaponData = useMemo(
    () =>
      placements
        .filter((p) => (p.component?.dps || 0) > 0)
        .map((p) => ({ name: p.component.name, dps: p.component.dps, hex: "#e0561c" }))
        .concat(selectedComponent?.dps > 0 ? [{ name: `+ ${selectedComponent.name}`, dps: selectedComponent.dps, hex: "#ffc44a" }] : [])
        .sort((a, b) => b.dps - a.dps)
        .slice(0, 8),
    [placements, selectedComponent]
  );

  if (!open) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="absolute top-4 right-4 z-30 w-[330px] schematic-panel plate-texture shadow-2xl"
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-70" />
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border cursor-grab active:cursor-grabbing bg-black/40">
        <GripHorizontal size={13} className="text-muted-foreground" />
        <Crosshair size={12} className="text-primary" />
        <span className="tech-label">Performance Impact // live</span>
        <button onClick={() => { setOpen(false); onClose?.(); }} className="ml-auto text-muted-foreground hover:text-primary"><X size={13} /></button>
      </div>

      <div className="grid grid-cols-4 gap-1 px-2 py-2 border-b border-border">
        {METRICS.map((m) => {
          const cur = stats[m.key] || 0;
          const nxt = projected ? projected[m.key] || 0 : cur;
          const d = nxt - cur;
          return (
            <div key={m.key}>
              <div className="font-mono text-[13px] text-primary ember-glow leading-none">{fmt(cur, m.dec)}</div>
              <div className="text-[8px] font-mono tracking-[0.16em] text-muted-foreground mt-1">{m.label}</div>
              {Math.abs(d) > 0.001 && (
                <div className={`font-mono text-[9px] mt-0.5 ${d > 0 ? "text-[#38d16b]" : "text-[#ff4d4d]"}`}>
                  {d > 0 ? "▲ +" : "▼ "}{fmt(d, m.dec)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-2 pt-2">
        <div className="tech-label mb-1">Armament contribution{selectedComponent?.dps > 0 ? " · projected in amber" : ""}</div>
        {weaponData.length === 0 ? (
          <div className="tech-label py-6 text-center">No armament mounted</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(90, weaponData.length * 22)}>
            <BarChart data={weaponData} layout="vertical" margin={{ left: 4, right: 12, top: 2, bottom: 2 }} barSize={12}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 8, fontFamily: "IBM Plex Mono", fill: "hsl(18 8% 60%)" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "hsl(14 9% 12%)" }} contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 10, borderRadius: 0, background: "hsl(14 11% 8%)", border: "1px solid hsl(14 11% 20%)" }} />
              <Bar dataKey="dps">{weaponData.map((d, i) => <Cell key={i} fill={d.hex} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-between px-2 py-1.5 mt-1 border-t border-border font-mono text-[9px] text-muted-foreground">
        <span>POWER {fmt(stats.power_gen)} / {fmt(stats.power_use)}</span>
        <span className={stats.power_use > stats.power_gen ? "text-[#ff4d4d]" : "text-[#38d16b]"}>
          {stats.power_use > stats.power_gen ? "✖ OVERDRAW" : "✔ NOMINAL"}
        </span>
      </div>
    </motion.div>
  );
}