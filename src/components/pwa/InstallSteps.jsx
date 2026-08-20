import React, { useState } from "react";
import { Download, CheckCircle2, Chrome, Apple } from "lucide-react";
import { toast } from "sonner";
import { useInstallPrompt } from "@/lib/pwa";

const GUIDES = {
  chrome: {
    label: "Chrome / Edge · Windows, Linux",
    icon: Chrome,
    steps: [
      "Press Install below — or click the ⊕ / monitor icon in the address bar.",
      "Confirm Install in the browser dialog. A desktop and Start-menu shortcut is created.",
      "Drag the new window onto your second monitor, then press F11 (or the Fullscreen button) to drop the title bar.",
      "Right-click the taskbar icon → Pin, so the terminal is one click away next session.",
    ],
  },
  mac: {
    label: "Safari / Chrome · macOS",
    icon: Apple,
    steps: [
      "Safari: File → Add to Dock. Chrome: ⋮ → Cast, Save and Share → Install.",
      "Launch it from the Dock — it opens as its own app window.",
      "Move the window to the second display, then ⌃⌘F for fullscreen.",
      "Mission Control → assign the window to that display's desktop so it always reopens there.",
    ],
  },
};

export default function InstallSteps() {
  const { canInstall, installed, install } = useInstallPrompt();
  const [tab, setTab] = useState("chrome");
  const g = GUIDES[tab];

  return (
    <div className="schematic-panel p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2"><Download size={15} className="text-primary" /><span className="font-display font-bold text-sm tracking-[0.16em]">INSTALL TO DESKTOP</span></div>
        {installed ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--chart-3))]"><CheckCircle2 size={12} /> installed</span>
        ) : (
          <button onClick={async () => { const ok = await install(); if (!ok && !canInstall) toast.info("Use your browser's install control", { description: "Chrome/Edge: the ⊕ icon in the address bar. Safari: File → Add to Dock." }); }}
            className="inline-flex items-center gap-1.5 px-3 h-8 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-[0.18em] hover:bg-primary/85">
            <Download size={12} /> install now
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-3">
        {Object.entries(GUIDES).map(([k, v]) => { const Icon = v.icon; return (
          <button key={k} onClick={() => setTab(k)}
            className={`inline-flex items-center gap-1.5 px-2.5 h-7 border font-mono text-[10px] uppercase tracking-wider ${tab === k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>
            <Icon size={11} /> {k === "chrome" ? "Windows" : "macOS"}
          </button>); })}
      </div>
      <div className="tech-label mb-2">{g.label}</div>
      <ol className="space-y-2">
        {g.steps.map((s, i) => (
          <li key={s} className="flex gap-3 text-[13px] leading-5">
            <span className="font-mono text-[11px] text-primary shrink-0 w-5 h-5 border border-primary/50 flex items-center justify-center">{i + 1}</span>
            <span className="text-muted-foreground">{s}</span>
          </li>
        ))}
      </ol>
      {!canInstall && !installed && (
        <p className="tech-label mt-3 leading-4">No install prompt yet? It appears once the published app is opened over HTTPS — inside the builder preview use the browser control listed above.</p>
      )}
    </div>
  );
}