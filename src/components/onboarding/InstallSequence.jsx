import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ShieldCheck, ChevronRight } from "lucide-react";
import { useCallsign, sanitizeCallsign } from "@/lib/callsign";
import BootLog from "./BootLog";

const LINES = [
  "mounting salvaged dataset — era one 0.12.2",
  "verifying module manifest checksums",
  "spooling reactor telemetry bus",
  "calibrating hull plating diagnostics",
  "linking blueprint registry",
  "arming tactical overlays",
];

// First-run rig installation. Collects a self-chosen callsign held in this browser only —
// no account, no name, no email. Rendered once, then never again on this machine.
export default function InstallSequence() {
  const { installed, setCallsign } = useCallsign();
  const [stage, setStage] = useState("boot");
  const [value, setValue] = useState("");
  const [gone, setGone] = useState(false);
  if (installed || gone) return null;

  const commit = () => {
    const cs = sanitizeCallsign(value).trim();
    if (cs.length < 2) return;
    setStage("sealed");
    setTimeout(() => { setCallsign(cs); setGone(true); }, 1100);
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/97 bp-grid flex items-center justify-center p-6">
        <motion.div initial={{ y: 18, scale: 0.98 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 180, damping: 22 }}
          className="schematic-panel rust-wash w-full max-w-[640px] p-6">
          <div className="hazard-stripes h-1.5 -mx-6 -mt-6 mb-5" />
          <div className="flex items-center gap-3 mb-4">
            <Terminal size={22} className="text-primary" />
            <div>
              <h2 className="font-display font-bold text-lg tracking-[0.18em] leading-none">RIG INSTALLATION</h2>
              <p className="tech-label mt-1">First-run provisioning · terminal 01</p>
            </div>
          </div>

          {stage === "boot" && <BootLog lines={LINES} onDone={() => setStage("callsign")} />}

          {stage === "callsign" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="font-mono text-[11px] text-muted-foreground leading-6">
                <div className="text-[hsl(var(--chart-3))]">all subsystems nominal — {LINES.length}/{LINES.length}</div>
                <div className="mt-2">Stencil a callsign onto the hull. Used only to address you in this terminal.</div>
              </div>
              <div className="flex items-stretch border border-input bg-secondary/60">
                <span className="px-3 flex items-center font-mono text-[10px] tracking-[0.2em] text-muted-foreground border-r border-input">CALLSIGN</span>
                <input autoFocus value={value} onChange={(e) => setValue(sanitizeCallsign(e.target.value))} onKeyDown={(e) => e.key === "Enter" && commit()}
                  placeholder="RUSTHAWK" maxLength={14}
                  className="flex-1 bg-transparent px-3 h-11 font-display font-bold text-lg tracking-[0.22em] outline-none placeholder:text-muted-foreground/40" />
                <button onClick={commit} disabled={sanitizeCallsign(value).trim().length < 2}
                  className="px-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] bg-primary text-primary-foreground disabled:opacity-30 disabled:bg-secondary disabled:text-muted-foreground">
                  Seal <ChevronRight size={12} />
                </button>
              </div>
              <div className="flex items-start gap-2 font-mono text-[10px] text-muted-foreground border border-border p-2.5">
                <ShieldCheck size={13} className="text-[hsl(var(--chart-3))] shrink-0 mt-0.5" />
                <span>Held in this browser only. No name, address or contact data is requested, stored or transmitted.</span>
              </div>
            </motion.div>
          )}

          {stage === "sealed" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[11px] leading-6">
              <div className="text-muted-foreground">stencilling hull plate…</div>
              <div className="font-display font-bold text-2xl tracking-[0.25em] text-primary ember-glow mt-2">{sanitizeCallsign(value).trim()}</div>
              <div className="text-[hsl(var(--chart-3))] mt-2">install complete — terminal online</div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}