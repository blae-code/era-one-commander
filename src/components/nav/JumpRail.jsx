import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, Radio } from "lucide-react";
import { LogoIcon } from "@/components/icons/EraIcons";
import { DESTINATIONS } from "@/components/nav/destinations";

export default function JumpRail() {
  const { pathname } = useLocation();
  const current = DESTINATIONS.find((d) => pathname.startsWith(d.to));

  return (
    <div className="sticky top-0 z-40 h-11 flex items-stretch border-b border-border bg-[hsl(12_12%_5%)]/95 backdrop-blur">
      <Link
        to="/"
        className="flex items-center gap-2 px-4 border-r border-border text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeft size={14} />
        <LogoIcon size={18} className="text-primary" />
        <span className="font-display font-bold text-xs tracking-[0.2em] uppercase">Deck</span>
      </Link>

      <div className="flex items-center px-4 gap-2">
        <Radio size={12} className="text-primary" />
        <span className="font-display font-bold text-sm uppercase tracking-[0.15em]">
          {current?.label || "Terminal"}
        </span>
        <span className="font-mono text-[9px] text-muted-foreground/70">{current?.code}</span>
      </div>

      <div className="ml-auto flex items-stretch">
        {DESTINATIONS.filter((d) => d.to !== current?.to).map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-1.5 px-3.5 border-l border-border text-muted-foreground hover:text-primary hover:bg-secondary/60 transition-colors"
          >
            <Icon size={13} />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em]">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}