import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { LogoIcon } from "@/components/icons/EraIcons";
import CommandRing from "@/components/nav/CommandRing";
import BlueprintCard from "@/components/blueprints/BlueprintCard";
import { useGameCatalog } from "@/lib/gameData";

const CAT_HEX = { weapon: "#ff7a1a", engine: "#2f9bff", reactor: "#ffd21a", shield: "#eef4fa", module: "#d24bff" };

export default function Dashboard() {
  const { data: components = [] } = useQuery({ queryKey: ["components"], queryFn: () => base44.entities.Component.list("-created_date", 500) });
  const { data: blueprints = [] } = useQuery({ queryKey: ["blueprints"], queryFn: () => base44.entities.Blueprint.list("-created_date", 6) });
  const game = useGameCatalog();

  // Module classes from the real dataset (falls back to the legacy Component catalog if no game data yet)
  const CLASS_HEX = { Weapon: "#ff7a1a", Structural: "#c9d6e3", Utility: "#00d1c1", Facility: "#2f9bff", Command: "#ffd21a" };
  const catData = game.modules.length
    ? Object.keys(CLASS_HEX).map((c) => ({ cat: c.toUpperCase().slice(0, 5), category: c, count: game.modules.filter((m) => m.module_class === c).length, hex: CLASS_HEX[c] }))
    : ["weapon", "engine", "reactor", "shield", "module"].map((c) => ({ cat: c.toUpperCase().slice(0, 4), category: c, count: components.filter((k) => k.category === c).length, hex: CAT_HEX[c] }));

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="schematic-panel rust-wash p-5 mb-5 flex items-center justify-between">
        <div className="absolute top-0 left-0 right-0 rivet-row opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 h-[3px] hazard-stripes opacity-70" />
        <div className="flex items-center gap-4">
          <div className="border border-primary/40 p-2 bg-black/40 welded-frame">
            <LogoIcon size={36} className="text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">COMMAND DECK</h1>
            <p className="tech-label mt-1.5">ERA ONE Tactical Companion // Fleet Engineering Terminal</p>
          </div>
        </div>
        <div className="hidden md:flex gap-6 font-mono text-center">
          {[
            ["MODULES", game.modules.length],
            ["SHIPS", game.units.length],
            ["WEAPONS", game.weapons.length],
            ["RESEARCH", game.research.length],
            ["BLUEPRINTS", blueprints.length],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-2xl font-semibold text-primary ember-glow">{String(v).padStart(2, "0")}</div>
              <div className="text-[9px] tracking-[0.2em] text-muted-foreground">{k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Radial command ring navigation */}
      <div className="mb-5">
        <CommandRing />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Armory distribution */}
        <div className="schematic-panel p-4">
          <div className="tech-label mb-3">Databank // modules by class</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} barSize={26}>
              <XAxis dataKey="cat" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono", fill: "hsl(36 10% 70%)" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "hsl(30 6% 15%)" }}
                contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, borderRadius: 0, background: "hsl(30 7% 10%)", border: "1px solid hsl(30 7% 22%)", color: "hsl(40 18% 95%)" }}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {catData.map((d) => (
                  <Cell key={d.category} fill={d.hex} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {catData.map((d) => (
              <div key={d.category} className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2" style={{ background: d.hex }} />
                <span className="font-mono text-[10px] text-muted-foreground">{d.category} {d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent blueprints */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="tech-label">Latest Registered Blueprints</div>
            <Link to="/blueprints" className="font-mono text-[10px] text-primary hover:underline uppercase tracking-wider">View all →</Link>
          </div>
          {blueprints.length === 0 ? (
            <div className="schematic-panel p-8 text-center">
              <p className="tech-label">No blueprints registered yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {blueprints.slice(0, 4).map((bp, i) => (
                <BlueprintCard key={bp.id} bp={bp} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}