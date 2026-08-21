import React from "react";
import { Boxes, AlertTriangle } from "lucide-react";
import { fmtCap } from "@/components/constants/constantsLib";
import { fmtNum } from "@/lib/gameData";

const CapTable = ({ title, sp, mp }) => {
  const classes = [...new Set([...Object.keys(sp || {}), ...Object.keys(mp || {})])];
  return (
    <div className="min-w-0">
      <div className="tech-label mb-1.5">{title}</div>
      <table className="w-full font-mono text-[11px]">
        <thead>
          <tr className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground border-b border-border">
            <th className="text-left py-1 font-normal">Class</th>
            <th className="text-right py-1 font-normal opacity-60" title="enabled_singleplayer is false — these values never bind">SP†</th>
            <th className="text-right py-1 font-normal">MP</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => (
            <tr key={c} className="border-b border-border/40 last:border-0">
              <td className="py-1 text-muted-foreground">{c}</td>
              <td className="py-1 text-right opacity-50">{fmtCap(sp?.[c])}</td>
              <td className="py-1 text-right ember-glow">{fmtCap(mp?.[c])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// BuildCap (1 row): per-class unit/module caps, single- vs multiplayer.
export default function BuildCapCard({ row }) {
  if (!row) return null;
  return (
    <div className="schematic-panel p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-40" />
      <div className="flex items-center gap-2 mb-1">
        <Boxes size={16} className="text-primary" />
        <h2 className="font-display font-bold uppercase tracking-[0.15em] text-sm">Build Caps</h2>
      </div>
      <p className="tech-label mb-3 flex items-center gap-1.5">
        <AlertTriangle size={11} className="text-primary shrink-0" />
        <span>†&nbsp;enabled_singleplayer is <span className="text-foreground">false</span> — caps bind only in multiplayer.</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <CapTable title="Unit caps / class" sp={row.unit_class_cap_singleplayer} mp={row.unit_class_cap_multiplayer} />
        <CapTable title="Module caps / class" sp={row.module_class_cap_singleplayer} mp={row.module_class_cap_multiplayer} />
      </div>
      <div className="mt-3 pt-2 border-t border-border font-mono text-[10px] text-muted-foreground flex flex-wrap gap-x-5 gap-y-1">
        <span>Global units <span className="text-foreground ember-glow">{fmtNum(row.global_unit_cap_multiplayer)}</span></span>
        <span>Global modules <span className="text-foreground ember-glow">{fmtNum(row.global_module_cap_multiplayer)}</span></span>
        <span className="opacity-60">SP globals {fmtNum(row.global_unit_cap_singleplayer)} / {fmtNum(row.global_module_cap_singleplayer)} (inert†)</span>
      </div>
    </div>
  );
}
