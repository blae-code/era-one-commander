import React from "react";
import { Palette } from "lucide-react";
import { rgbaToHex } from "@/components/constants/constantsLib";

const SwatchGrid = ({ title, colors, cols = "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" }) => {
  const entries = Object.entries(colors || {});
  if (!entries.length) return null;
  return (
    <div>
      <div className="tech-label mb-1.5">{title}</div>
      <div className={`grid ${cols} gap-1.5`}>
        {entries.map(([label, rgba]) => {
          const hex = rgbaToHex(rgba);
          return (
            <div key={label} className="flex items-center gap-2 border border-border bg-card px-1.5 py-1 min-w-0">
              <span className="w-5 h-5 shrink-0 border border-border/60" style={{ backgroundColor: hex }} />
              <span className="min-w-0">
                <span className="block font-mono text-[10px] text-foreground truncate">{label}</span>
                <span className="block font-mono text-[9px] text-muted-foreground uppercase">{hex}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// AiColorScheme (1 row): the palette the game uses for its AI logic-graph rendering.
export default function ColorSchemeCard({ row }) {
  if (!row) return null;
  return (
    <div className="schematic-panel p-4">
      <div className="flex items-center gap-2 mb-1">
        <Palette size={16} className="text-primary" />
        <h2 className="font-display font-bold uppercase tracking-[0.15em] text-sm">AI Color Scheme</h2>
      </div>
      <p className="tech-label mb-3">The game's own palette for AI decision graphs — category, GOAP node and logic-gate colors.</p>
      <div className="space-y-4">
        <SwatchGrid title={`Category colors · ${Object.keys(row.category_colors || {}).length}`} colors={row.category_colors} />
        <SwatchGrid title={`GOAP node colors · ${Object.keys(row.goap_colors || {}).length}`} colors={row.goap_colors} cols="grid-cols-2 sm:grid-cols-3" />
        <SwatchGrid title={`Logic gate colors · ${Object.keys(row.logic_colors || {}).length}`} colors={row.logic_colors} cols="grid-cols-2 sm:grid-cols-4" />
      </div>
    </div>
  );
}
