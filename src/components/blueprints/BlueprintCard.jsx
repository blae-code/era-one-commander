import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HullIcon } from "@/components/icons/EraIcons";
import { fmt } from "@/lib/shipStats";
import { Heart } from "lucide-react";
import BlueprintThumb from "@/components/blueprints/BlueprintThumb";

export default function BlueprintCard({ bp, index = 0 }) {
  const s = bp.stats || {};
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link to={`/blueprints/${bp.id}`} className="schematic-panel block p-4 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <HullIcon size={26} className="text-primary shrink-0" />
            <div className="min-w-0">
              <div className="font-display font-bold text-base leading-tight truncate group-hover:text-primary transition-colors">
                {bp.name}
              </div>
              <div className="tech-label">{bp.hull_name} · {bp.ship_class}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <Heart size={11} /> {bp.likes || 0}
          </div>
        </div>
        {bp.role && (
          <span className="inline-block mt-2 px-1.5 py-0.5 border border-accent/40 text-accent font-mono text-[9px] uppercase tracking-widest">
            {bp.role}
          </span>
        )}
        <div className="mt-3">
          <BlueprintThumb placements={bp.placements} />
        </div>
        <div className="grid grid-cols-4 gap-px bg-border mt-3 border border-border">
          {[
            ["DPS", fmt(s.dps)],
            ["HP", fmt(s.hp)],
            ["MASS", fmt(s.mass)],
            ["TWR", fmt(s.twr, 2)],
          ].map(([k, v]) => (
            <div key={k} className="bg-card p-1.5 text-center">
              <div className="font-mono text-[8px] text-muted-foreground tracking-widest">{k}</div>
              <div className="font-mono text-xs font-semibold">{v}</div>
            </div>
          ))}
        </div>
        {bp.author_name && <div className="tech-label mt-2.5">ENG // {bp.author_name}</div>}
      </Link>
    </motion.div>
  );
}