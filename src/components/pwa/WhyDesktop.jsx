import React from "react";
import { MonitorPlay, Keyboard, WifiOff, Rows3, Gauge } from "lucide-react";

const REASONS = [
  { icon: MonitorPlay, title: "Lives on the second monitor", body: "Installed, it opens in its own window with no tabs, address bar or bookmarks — park it full-screen on the spare panel and keep the game on the primary display." },
  { icon: Rows3, title: "Fits portrait or landscape", body: "The layout reflows off window size: a rotated portrait panel stacks the readouts into one tall column, a landscape panel spreads them into the wide multi-column grid." },
  { icon: Keyboard, title: "Keyboard-first, alt-tab free", body: "⌘K / Ctrl-K jumps to any record, 1–8 switch Databank views. A standalone window keeps browser shortcuts from stealing those keys." },
  { icon: WifiOff, title: "Opens instantly, survives drops", body: "The app shell is cached locally, so the terminal boots without waiting on the network and keeps its last state on a flaky link." },
  { icon: Gauge, title: "Runs cold next to the game", body: "One lightweight window instead of a full browser session — less memory and GPU contention while ERA ONE has the foreground." },
];

export default function WhyDesktop() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      {REASONS.map(({ icon: Icon, title, body }) => (
        <div key={title} className="schematic-panel p-4 flex gap-3">
          <div className="w-9 h-9 shrink-0 border border-primary/50 bg-primary/10 flex items-center justify-center"><Icon size={16} className="text-primary" /></div>
          <div className="min-w-0">
            <div className="font-display font-bold text-sm tracking-[0.12em] uppercase">{title}</div>
            <p className="text-[13px] leading-5 text-muted-foreground mt-1">{body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}