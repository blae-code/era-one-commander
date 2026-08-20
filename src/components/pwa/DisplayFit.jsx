import React from "react";
import { Monitor, Maximize2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useDisplayInfo, toggleFullscreen } from "@/lib/pwa";

const Row = ({ ok, label, value }) => (
  <div className="flex items-center gap-2 py-1 border-b border-border/60 last:border-0">
    {ok ? <CheckCircle2 size={12} className="text-[hsl(var(--chart-3))]" /> : <AlertTriangle size={12} className="text-accent" />}
    <span className="tech-label flex-1">{label}</span>
    <span className="font-mono text-[11px]">{value}</span>
  </div>
);

// Live readout of the display this terminal is running on, plus the fullscreen toggle.
export default function DisplayFit() {
  const d = useDisplayInfo();
  const layout = d.w >= 1500 ? "Wide — full multi-column layout" : d.w >= 1100 ? "Standard — stacked side panels" : d.portrait ? "Portrait — single tall column" : "Narrow — compact columns";

  return (
    <div className="schematic-panel p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2"><Monitor size={15} className="text-primary" /><span className="font-display font-bold text-sm tracking-[0.16em]">THIS DISPLAY</span></div>
        <button onClick={toggleFullscreen} className="inline-flex items-center gap-1.5 px-2.5 h-7 border border-border font-mono text-[10px] uppercase tracking-[0.16em] hover:border-primary hover:text-primary">
          <Maximize2 size={11} /> {d.fullscreen ? "exit" : "fullscreen"}
        </button>
      </div>
      <Row ok label="Viewport" value={`${d.w} × ${d.h}`} />
      <Row ok label="Screen" value={`${d.screenW} × ${d.screenH}`} />
      <Row ok label="Orientation" value={d.portrait ? "Portrait" : "Landscape"} />
      <Row ok={d.standalone} label="Installed window" value={d.standalone ? "Standalone" : "Browser tab"} />
      <Row ok={d.fullscreen} label="Fullscreen" value={d.fullscreen ? "Active" : "Off"} />
      <div className="mt-3 border border-border bg-background/50 p-2.5 font-mono text-[11px] leading-5">
        <span className="text-primary">layout mode </span>{layout}
      </div>
      <p className="tech-label mt-2 leading-4">
        Every screen reflows off viewport width, so a portrait 1080 × 1920 panel stacks the panels vertically while a landscape 2560 × 1440 panel opens the wide multi-column grid. No setting to change — rotate the monitor and it re-fits.
      </p>
    </div>
  );
}