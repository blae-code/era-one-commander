import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useCallsign, sanitizeCallsign } from "@/lib/callsign";
import BootLog from "./BootLog";
import CallsignField, { pickSuggestion } from "./CallsignField";

const LINES = [
  "mounting salvaged dataset — era one 0.12.2",
  "verifying module manifest checksums",
  "spooling reactor telemetry bus",
  "calibrating hull plating diagnostics",
  "linking blueprint registry",
  "arming tactical overlays",
];

const STEPS = [["boot", "Diagnostics"], ["callsign", "Identity"], ["sealed", "Seal"]];

// First-run rig installation. Collects a self-chosen callsign held in this browser only —
// no account, no name, no email. Rendered once, then never again on this machine.
export default function InstallSequence() {
  const { installed, setCallsign } = useCallsign();
  const [stage, setStage] = useState("boot");
  const [value, setValue] = useState("");
  const [gone, setGone] = useState(false);
  const hint = useMemo(pickSuggestion, []);
  if (installed || gone) return null;

  const commit = () => {
    const cs = sanitizeCallsign(value).trim();
    if (cs.length < 2) return;
    setStage("sealed");
    setTimeout(() => { setCallsign(cs); setGone(true); }, 1400);
  };

  const stageIdx = STEPS.findIndex(([s]) => s === stage);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/[0.97] bp-grid flex items-center justify-center p-6">
        <motion.div initial={{ y: 22, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 170, damping: 20 }}
          className="schematic-panel rust-wash w-full max-w-[620px] clip-plate">
          <div className="hazard-stripes h-1.5" />
          <div className="p-6 space-y-5">
            {/* header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-primary/60 flex items-center justify-center bg-primary/10">
                  <Terminal size={18} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg tracking-[0.2em] leading-none">RIG INSTALLATION</h2>
                  <p className="tech-label mt-1.5">First-run provisioning · terminal 01</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                {STEPS.map(([s, label], i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <span className={`font-mono text-[9px] uppercase tracking-[0.14em] ${i === stageIdx ? "text-primary" : i < stageIdx ? "text-muted-foreground" : "text-muted-foreground/40"}`}>{label}</span>
                    {i < STEPS.length - 1 && <span className={`w-4 h-[1px] ${i < stageIdx ? "bg-primary" : "bg-border"}`} />}
                  </div>
                ))}
              </div>
            </div>
            <div className="rivet-row opacity-40" />

            {stage === "boot" && <BootLog lines={LINES} onDone={() => setStage("callsign")} />}

            {stage === "callsign" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="font-mono text-[11px] leading-6">
                  <div className="text-[hsl(var(--chart-3))] flex items-center gap-1.5"><CheckCircle2 size={12} /> all subsystems nominal — {LINES.length}/{LINES.length}</div>
                  <div className="mt-1.5 text-muted-foreground">Stencil a callsign onto the hull. Used only to address you inside this terminal.</div>
                </div>
                <CallsignField value={value} onChange={setValue} onCommit={commit} hint={hint} />
                <div className="flex items-start gap-2 font-mono text-[10px] text-muted-foreground border border-border bg-background/40 p-2.5">
                  <ShieldCheck size={13} className="text-[hsl(var(--chart-3))] shrink-0 mt-0.5" />
                  <span>Held in this browser only. No name, address or contact data is requested, stored or transmitted.</span>
                </div>
              </motion.div>
            )}

            {stage === "sealed" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[11px] leading-6 py-2">
                <div className="text-muted-foreground">stencilling hull plate…</div>
                <motion.div initial={{ letterSpacing: "0.5em", opacity: 0.2 }} animate={{ letterSpacing: "0.25em", opacity: 1 }} transition={{ duration: 0.7 }}
                  className="font-display font-bold text-3xl text-primary ember-glow mt-3">
                  {sanitizeCallsign(value).trim()}
                </motion.div>
                <div className="text-[hsl(var(--chart-3))] mt-3 flex items-center gap-1.5"><CheckCircle2 size={12} /> install complete — terminal online</div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}