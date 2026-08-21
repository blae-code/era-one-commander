import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, Radio } from "lucide-react";
import { LogoIcon } from "@/components/icons/EraIcons";
import { SECTORS } from "@/components/nav/sectors";

// One entry per route — sectors can point several tools at the same page (e.g. Foundry's two
// blueprint tools both route to /blueprints), so dedupe by destination, keeping the first.
const seenRoutes = new Set();
const TOOLS = SECTORS.flatMap((s) => s.tools).filter((t) => !seenRoutes.has(t.to) && seenRoutes.add(t.to));

const FOCUS_RING = "focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-primary";

export default function JumpRail() {
  const { pathname } = useLocation();
  const current = TOOLS.find((t) => pathname.startsWith(t.to));

  return (
    <nav
      aria-label="Tool jump rail"
      className="sticky top-0 z-40 h-11 flex items-stretch border-b border-border bg-[hsl(12_12%_5%)]/95 backdrop-blur"
    >
      <Link
        to="/"
        aria-label="Back to the command ring"
        className={`flex items-center gap-2 px-4 border-r border-border text-muted-foreground hover:text-primary transition-colors shrink-0 ${FOCUS_RING}`}
      >
        <ChevronLeft size={14} />
        <LogoIcon size={18} className="text-primary" />
        <span className="font-display font-bold text-xs tracking-[0.2em] uppercase">Ring</span>
      </Link>

      <div className="flex items-center px-4 gap-2 shrink-0">
        <Radio size={12} className="text-primary" />
        <span className="font-display font-bold text-sm uppercase tracking-[0.15em] whitespace-nowrap">
          {current?.label || "Terminal"}
        </span>
        <span className="font-mono text-[9px] text-muted-foreground/70">{current?.code}</span>
      </div>

      {/* 11 links overflow narrow viewports — let the rail scroll sideways instead of clipping */}
      <div className="ml-auto flex items-stretch overflow-x-auto">
        {TOOLS.filter((t) => t.to !== current?.to).map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            aria-label={`Jump to ${label}`}
            className={`flex items-center gap-1.5 px-3.5 border-l border-border text-muted-foreground hover:text-primary hover:bg-secondary/60 transition-colors shrink-0 ${FOCUS_RING}`}
          >
            <Icon size={13} />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] whitespace-nowrap">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
