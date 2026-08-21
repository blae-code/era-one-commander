import React from "react";
import { fmtNum } from "@/lib/gameData";
import { TARGET_CLASSES, TARGET_CLASS_ABBR } from "./designModel";

// Per-target-class DPS strip (13 classes). The strip IS the class selector; the readout always
// names the class beside the number. There is deliberately no class-free total.
export default function DpsStrip({ dpsVsClass = null, selectedClass, onSelectClass, defaultClass = "FighterUnit" }) {
  const vals = TARGET_CLASSES.map((c) => Number(dpsVsClass?.[c]) || 0);
  const max = Math.max(...vals, 1);
  const cls = selectedClass || defaultClass;
  const sel = Number(dpsVsClass?.[cls]) || 0;
  const isDefault = !selectedClass || selectedClass === defaultClass;

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-xl font-semibold text-primary ember-glow leading-none">{fmtNum(sel, 1)}</span>
        <span className="tech-label">
          dps vs <span className="text-foreground">{cls}</span>{isDefault ? " (default)" : ""}
        </span>
      </div>
      <div className="mt-2 grid gap-px" style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}>
        {TARGET_CLASSES.map((c, i) => {
          const active = c === cls;
          return (
            <button
              key={c}
              title={`${c}: ${fmtNum(vals[i], 1)} dps`}
              onClick={() => onSelectClass?.(c)}
              className={`group flex flex-col items-center gap-1 pt-1 pb-0.5 border transition-colors ${
                active ? "border-primary bg-primary/15" : "border-transparent hover:border-primary/40"
              }`}
            >
              <span className="h-12 w-full flex items-end px-[3px]">
                <span
                  className="w-full"
                  style={{
                    height: `${Math.max(3, (vals[i] / max) * 100)}%`,
                    background: active ? "hsl(9 64% 50%)" : "hsl(9 30% 34%)",
                  }}
                />
              </span>
              <span className={`font-mono text-[8px] tracking-[0.08em] ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {TARGET_CLASS_ABBR[c]}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
        per-target-class only — the game has no meaningful class-free DPS total
      </div>
    </div>
  );
}
