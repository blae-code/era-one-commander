import React from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { LogoIcon } from "@/components/icons/EraIcons";
import CommandRing from "@/components/nav/CommandRing";
import { useGameCatalog, fmtNum } from "@/lib/gameData";

// Module classes from the real dataset (Module.module_class enum)
const CLASS_HEX = { Command: "#ffd21a", Structural: "#c9d6e3", Weapon: "#ff7a1a", Facility: "#2f9bff", Utility: "#00d1c1" };

export default function Dashboard() {
  const game = useGameCatalog(true); // extended: GameBlueprint feeds the headline count + shipped designs

  const catData = Object.keys(CLASS_HEX).map((c) => ({ cat: c.toUpperCase().slice(0, 5), category: c, count: game.modules.filter((m) => m.module_class === c).length, hex: CLASS_HEX[c] }));
  // Shipped-with-the-game designs, biggest builds first. No DPS here: a class-free scalar invites bad comparisons.
  const shipped = [...game.blueprints].sort((a, b) => (b.part_count || 0) - (a.part_count || 0)).slice(0, 6);

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
            ["BLUEPRINTS", game.blueprints.length],
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

      {game.isLoading ? (
        <div className="schematic-panel p-12 tech-label text-center animate-pulse">Loading game data…</div>
      ) : game.isError ? (
        <div className="schematic-panel p-12 text-center">
          <div className="font-display font-bold uppercase tracking-[0.15em] text-destructive">Couldn't load game data</div>
          <p className="tech-label mt-2">{String(game.error?.message || game.error || "Request failed")}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 h-8 font-mono text-[10px] uppercase tracking-wider border border-primary bg-primary text-primary-foreground hover:opacity-90">
            Retry
          </button>
        </div>
      ) : game.isEmpty ? (
        <div className="schematic-panel p-8 text-center">
          <p className="tech-label">No game data loaded yet — import the dataset from the <Link to="/gamedata" className="text-primary underline">Game Data</Link> page (admin).</p>
        </div>
      ) : (
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

          {/* Shipped designs (GameBlueprint rows from the real dataset) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="tech-label">Shipped Designs</div>
              <Link to="/database?t=GameBlueprint" className="font-mono text-[10px] text-primary hover:underline uppercase tracking-wider">View all →</Link>
            </div>
            {shipped.length === 0 ? (
              <div className="schematic-panel p-8 text-center">
                <p className="tech-label">No blueprint rows in the dataset</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {shipped.map((bp) => (
                  <Link key={bp.game_id} to={`/database?t=GameBlueprint&id=${encodeURIComponent(bp.game_id)}`} className="schematic-panel p-3 block hover:border-primary/60 transition-colors">
                    <div className="font-display font-bold text-sm uppercase tracking-wider truncate" title={bp.name}>{bp.name}</div>
                    <div className="flex gap-4 mt-2 font-mono text-[10px] text-muted-foreground">
                      <span>PARTS <span className="text-primary ember-glow">{fmtNum(bp.part_count)}</span></span>
                      <span>COST <span className="text-primary ember-glow">{fmtNum(bp.cost_resources)}</span> RU</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
