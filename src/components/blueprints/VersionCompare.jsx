import React from "react";
import ManifestDiff from "@/components/blueprints/ManifestDiff";

const STAT_ROWS = [
  { key: "mass", label: "Mass", lowerBetter: true },
  { key: "hp", label: "Hull HP" },
  { key: "dps", label: "DPS" },
  { key: "thrust", label: "Thrust" },
  { key: "twr", label: "TWR", decimals: 2 },
  { key: "power_gen", label: "Power Gen" },
  { key: "power_use", label: "Power Use", lowerBetter: true },
  { key: "shield", label: "Shield" },
  { key: "cargo", label: "Cargo" },
];

const fmt = (n, d = 1) => (n == null ? "—" : (Math.round(n * 10 ** d) / 10 ** d).toLocaleString());

export default function VersionCompare({ a, b }) {
  return (
    <div className="border border-primary/40 bg-primary/5 p-4 mt-3">
      <div className="tech-label mb-3">
        Delta Analysis // <span className="text-[#ff7a1a]">v{a.version}</span> vs <span className="text-[#2f9bff]">v{b.version}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="tech-label mb-1.5 opacity-70">Performance Stats</div>
          <table className="w-full font-mono text-[11px]">
            <thead>
              <tr className="text-muted-foreground text-[9px] uppercase tracking-wider">
                <th className="text-left py-1">Stat</th>
                <th className="text-right py-1 text-[#ff7a1a]">v{a.version}</th>
                <th className="text-right py-1 text-[#2f9bff]">v{b.version}</th>
                <th className="text-right py-1">Δ</th>
              </tr>
            </thead>
            <tbody>
              {STAT_ROWS.map(({ key, label, lowerBetter, decimals }) => {
                const va = a.stats?.[key];
                const vb = b.stats?.[key];
                const d = va != null && vb != null ? vb - va : null;
                const better = d != null && d !== 0 && (lowerBetter ? d < 0 : d > 0);
                return (
                  <tr key={key} className="border-t border-border/60">
                    <td className="py-1 text-muted-foreground">{label}</td>
                    <td className="py-1 text-right">{fmt(va, decimals)}</td>
                    <td className="py-1 text-right">{fmt(vb, decimals)}</td>
                    <td className={`py-1 text-right ${d == null || d === 0 ? "text-muted-foreground/50" : better ? "text-[#3ddc6a]" : "text-[#ff2d55]"}`}>
                      {d == null || d === 0 ? "·" : `${d > 0 ? "+" : ""}${fmt(d, decimals)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div>
          <div className="tech-label mb-1.5 opacity-70">Component Manifest Changes</div>
          <ManifestDiff a={a} b={b} />
        </div>
      </div>
    </div>
  );
}