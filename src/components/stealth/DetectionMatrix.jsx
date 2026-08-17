import React from "react";
import { fmtNum } from "@/lib/gameData";
import { detectionFor, VERDICT } from "@/lib/stealth";

// Threat table: for a given contact signature, how far each enemy sensor picks it up.
export default function DetectionMatrix({ detectors, signature }) {
  const rows = detectors
    .map((d) => ({ d, ...detectionFor(d, signature) }))
    .sort((a, b) => b.best - a.best);

  return (
    <div className="schematic-panel p-3">
      <div className="tech-label mb-2">Detection matrix // acquisition distance per emitter-side threat</div>
      <div className="grid grid-cols-[1fr_70px_70px_70px_130px] gap-px bg-border border border-border font-mono text-[10px]">
        {["Detector", "SENSOR", "OPTICAL", "REACH", "STATUS"].map((h, i) => (
          <div key={h} className={`bg-secondary/60 px-2 py-1.5 uppercase tracking-wider text-muted-foreground ${i ? "text-right" : ""}`}>{h}</div>
        ))}
        {rows.map(({ d, sensors, visual, best, channel, verdict }) => {
          const v = VERDICT[verdict];
          return (
            <React.Fragment key={d.game_id}>
              <div className="bg-card px-2 py-1.5 truncate">
                {d.name}
                <span className="ml-1.5 text-muted-foreground">{d.unit_class || d.module_class || ""}</span>
              </div>
              <div className="bg-card px-2 py-1.5 text-right">{fmtNum(sensors, 1)}</div>
              <div className="bg-card px-2 py-1.5 text-right">{fmtNum(visual, 1)}</div>
              <div className="bg-card px-2 py-1.5 text-right font-semibold">
                {fmtNum(best, 1)}
                {best > 0 && <span className="text-muted-foreground ml-1">{channel === "visual" ? "opt" : "sen"}</span>}
              </div>
              <div className={`bg-card px-2 py-1.5 text-right ${v.className}`}>{v.symbol} {v.label}</div>
            </React.Fragment>
          );
        })}
        {rows.length === 0 && <div className="bg-card px-2 py-6 col-span-5 text-center text-muted-foreground">No detectors in the dataset</div>}
      </div>
    </div>
  );
}