import React from "react";
import { EyeOff } from "lucide-react";
import { fmtNum } from "@/lib/gameData";

// Command-Deck style banner for Stealth Analysis: identity block, live emission readout, cloak toggle.
export default function StealthHeader({ contact, signature, detectors, cloaked, onCloak, stateLabel }) {
  const readout = [
    ["SIGNATURE", fmtNum(signature, 2), "#ff2d55"],
    ["BASE NOISE", fmtNum(contact?.base_signature_noise || 0, 2), null],
    ["CLOAK", fmtNum(contact?.cloak_strength || 0, 2), "#38bdf8"],
    ["THREATS", String(detectors), "#ff7a1a"],
  ];

  return (
    <div className="schematic-panel p-4 mb-4 flex items-center justify-between gap-4 bg-gradient-to-r from-card to-primary/5">
      <div className="flex items-center gap-4 min-w-0">
        <EyeOff size={38} className="text-primary shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display font-bold text-2xl tracking-[0.15em] leading-none">STEALTH ANALYSIS</h1>
          <p className="tech-label mt-1.5 truncate">
            {contact ? `Contact // ${contact.name} · ${stateLabel}` : "Signature emission, cloak suppression and detection reach"}
          </p>
        </div>
      </div>

      <div className="hidden xl:flex gap-6 font-mono text-center">
        {readout.map(([k, v, hex]) => (
          <div key={k}>
            <div className="text-xl font-semibold leading-none" style={{ color: hex || "hsl(var(--primary))" }}>{v}</div>
            <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onCloak(!cloaked)}
        className={`shrink-0 px-4 py-2 font-display font-semibold text-xs uppercase tracking-wider border transition-colors ${
          cloaked ? "border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10" : "border-border bg-card text-muted-foreground hover:border-primary/40"
        }`}
      >
        {cloaked ? "✔ Suppression on" : "✖ Suppression off"}
      </button>
    </div>
  );
}