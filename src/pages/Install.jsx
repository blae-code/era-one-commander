import React from "react";
import { MonitorDown } from "lucide-react";
import InstallSteps from "@/components/pwa/InstallSteps";
import WhyDesktop from "@/components/pwa/WhyDesktop";
import DisplayFit from "@/components/pwa/DisplayFit";

// Desktop install briefing — how to pin the terminal to a second monitor and why it matters.
export default function Install() {
  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto w-full">
      <div className="schematic-panel p-3 mb-3 flex items-center gap-3 bg-gradient-to-r from-card to-primary/5">
        <MonitorDown size={30} className="text-primary shrink-0" />
        <div>
          <h1 className="font-display font-bold text-xl tracking-[0.15em] leading-none">DESKTOP INSTALL</h1>
          <p className="tech-label mt-1">Pin the terminal to a spare monitor · portrait or landscape · runs full-screen beside the game</p>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3">
          <InstallSteps />
          <DisplayFit />
        </div>
        <WhyDesktop />
      </div>
    </div>
  );
}