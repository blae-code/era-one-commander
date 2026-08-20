import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LogoIcon } from "@/components/icons/EraIcons";
import { DESTINATIONS } from "@/components/nav/destinations";

const R = 190;

export default function NodeCluster() {
  return (
    <div className="relative h-[420px] w-full overflow-hidden schematic-panel">
      {/* scanner rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {[120, 200, 280, 360].map((s) => (
          <div
            key={s}
            className="absolute rounded-full border border-primary/15"
            style={{ width: s, height: s, left: -s / 2, top: -s / 2 }}
          />
        ))}
        <motion.div
          className="absolute rounded-full border-t-2 border-primary/40 rounded-full"
          style={{ width: 360, height: 360, left: -180, top: -180 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* core */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <LogoIcon size={40} className="text-primary" />
        <div className="tech-label mt-2 text-primary/80">Command Deck</div>
      </div>

      {/* nodes */}
      {DESTINATIONS.map(({ to, label, code, icon: Icon, desc, angle }, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * R;
        const y = Math.sin(rad) * (R * 0.52);
        return (
          <motion.div
            key={to}
            className="absolute left-1/2 top-1/2"
            style={{ x, y }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 * i, duration: 0.35 }}
          >
            <Link
              to={to}
              className="group block -translate-x-1/2 -translate-y-1/2 w-[180px] border border-border bg-card/95 clip-plate p-3 hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-primary" />
                <span className="font-display font-bold text-sm uppercase tracking-wider group-hover:text-primary transition-colors">
                  {label}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{desc}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-[9px] text-muted-foreground/70">{code}</span>
                <span className="h-[3px] w-10 hazard-stripes opacity-0 group-hover:opacity-80 transition-opacity" />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}