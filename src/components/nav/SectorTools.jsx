import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export default function SectorTools({ sector }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-[3px] w-8 hazard-stripes" />
        <span className="font-display font-bold text-sm uppercase tracking-[0.2em] text-primary">{sector.label}</span>
        <span className="font-mono text-[9px] text-muted-foreground/70">{sector.code}</span>
      </div>
      {sector.tools.map(({ to, label, code, icon: Icon, desc }, i) => (
        <motion.div
          key={code}
          initial={{ opacity: 0, x: 22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.09 * i, type: "spring", stiffness: 110, damping: 24, mass: 1.9 }}
        >
          <Link
            to={to}
            className="group flex items-center gap-3 border border-border bg-card/95 clip-plate p-3 hover:border-primary transition-colors"
          >
            <Icon size={17} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-[13px] uppercase tracking-wider group-hover:text-primary transition-colors">
                {label}
              </div>
              <div className="text-[11px] text-muted-foreground leading-snug truncate">{desc}</div>
            </div>
            <span className="font-mono text-[9px] text-muted-foreground/60">{code}</span>
            <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}