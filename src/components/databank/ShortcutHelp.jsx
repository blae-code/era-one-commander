import React, { useEffect, useState } from "react";
import { Keyboard } from "lucide-react";

const KEYS = [
  ["⌘K / Ctrl K", "Jump to any entity or run a command"],
  ["/", "Focus the query bar"],
  ["↑ ↓", "Move through rows"],
  ["⏎ / Space", "Open the focused / selected entity"],
  ["c", "Add / remove from comparison"],
  ["f", "Toggle favourite"],
  ["g", "Group rows by class"],
  ["1 – 8", "Table · cards · heatmap · plot · damage · parallel · tree · TTK"],
  ["?", "This panel"],
  ["Esc", "Close panel / drawer"],
];

// Press "?" anywhere in the Databank for the key map.
export default function ShortcutHelp() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (e.key === "?") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="schematic-panel plate-texture w-[min(460px,92vw)] p-4" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-3"><Keyboard size={16} className="text-primary" aria-hidden="true" /><div className="font-display font-bold tracking-[0.15em] text-sm">KEY MAP</div></div>
        {KEYS.map(([k, d]) => (
          <div key={k} className="flex items-center gap-3 py-1 border-b border-border/50 last:border-0">
            <span className="font-mono text-[10px] border border-border px-1.5 py-0.5 min-w-[92px] text-center">{k}</span>
            <span className="text-xs text-muted-foreground">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}