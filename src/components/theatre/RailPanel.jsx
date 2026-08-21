import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

// Collapsible right-rail panel shell for the Theatre board.
export default function RailPanel({ title, meta = null, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="schematic-panel">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-primary/5 transition-colors"
      >
        <span className="flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.18em]">
          {open ? <ChevronDown size={12} className="text-primary" /> : <ChevronRight size={12} className="text-primary" />}
          {title}
        </span>
        {meta ? <span className="tech-label normal-case tracking-[0.1em]">{meta}</span> : null}
      </button>
      {open ? <div className="border-t border-border/60 px-3 py-2">{children}</div> : null}
    </div>
  );
}
