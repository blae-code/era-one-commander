import React from "react";
import { firingCycle } from "@/lib/combatSim";
import { fmtNum } from "@/lib/gameData";

const KIND_STYLE = {
  shot: { bg: "hsl(26 88% 52%)", label: "shot" },
  gap: { bg: "hsl(14 9% 18%)", label: "burst gap" },
  reload: { bg: "hsl(9 64% 34%)", label: "reload" },
  precharge: { bg: "hsl(40 60% 45%)", label: "precharge" },
};

// Firing-cycle strip: shots, burst gaps, precharge and reload laid on a real time axis,
// with the sustained-vs-peak DPS gap that raw DPS columns hide.
export default function FiringCycle({ weapon, perShot }) {
  if (!weapon) return <div className="schematic-panel p-6 tech-label text-center">Select an armament to see its firing cycle.</div>;
  const c = firingCycle(weapon, perShot || 0);
  const pct = (v) => `${(v / c.cycle) * 100}%`;
  const ticks = Array.from({ length: 5 }, (_, i) => (c.cycle * i) / 4);

  return (
    <div className="schematic-panel plate-texture p-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <div className="tech-label">Firing cycle // {weapon.name}</div>
          <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
            {c.shots} shot{c.shots > 1 ? "s" : ""} per cycle · {fmtNum(c.cycle, 2)}s cycle · {fmtNum(c.downtime * 100, 0)}% downtime
          </div>
        </div>
        <div className="flex gap-4 font-mono text-center">
          <div><div className="text-base text-accent leading-none ember-glow">{fmtNum(c.peak, 1)}</div><div className="text-[9px] tracking-[0.18em] text-muted-foreground mt-1">PEAK DPS</div></div>
          <div><div className="text-base text-primary leading-none">{fmtNum(c.sustained, 1)}</div><div className="text-[9px] tracking-[0.18em] text-muted-foreground mt-1">SUSTAINED</div></div>
        </div>
      </div>

      <div className="relative h-8 border border-border bg-[#0d0b0a] overflow-hidden">
        {c.segments.map((s, i) => (
          <div key={i} title={`${KIND_STYLE[s.kind].label} · ${fmtNum(s.dur, 2)}s`} className="absolute top-0 bottom-0 border-r border-black/50"
            style={{ left: pct(s.start), width: pct(s.dur), background: KIND_STYLE[s.kind].bg, opacity: s.kind === "shot" ? 1 : 0.75 }} />
        ))}
      </div>
      <div className="relative h-4 mt-0.5">
        {ticks.map((t, i) => (
          <span key={i} className="absolute font-mono text-[8px] text-muted-foreground -translate-x-1/2" style={{ left: `${(i / 4) * 100}%` }}>{fmtNum(t, 2)}s</span>
        ))}
      </div>
      <div className="flex gap-3 mt-2 font-mono text-[9px] text-muted-foreground">
        {Object.entries(KIND_STYLE).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5" style={{ background: v.bg }} />{v.label}</span>
        ))}
      </div>
    </div>
  );
}