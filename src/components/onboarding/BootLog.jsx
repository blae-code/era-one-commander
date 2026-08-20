import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Staged terminal log with a diagnostic bar. One line per tick, then reports done.
export default function BootLog({ lines, interval = 220, onDone }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= lines.length) { const t = setTimeout(() => onDone?.(), 380); return () => clearTimeout(t); }
    const t = setTimeout(() => setN((x) => x + 1), interval);
    return () => clearTimeout(t);
  }, [n, lines.length, interval, onDone]);

  const pct = Math.round((n / lines.length) * 100);

  return (
    <div className="space-y-3">
      <div className="font-mono text-[11px] leading-[22px]">
        {lines.slice(0, n).map((l, i) => (
          <motion.div key={l} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }} className="flex gap-3">
            <span className="text-primary/70">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-muted-foreground flex-1 truncate">{l}</span>
            <span className="text-[hsl(var(--chart-3))]">OK</span>
          </motion.div>
        ))}
        {n < lines.length && (
          <div className="flex gap-3 text-accent">
            <span>{String(n + 1).padStart(2, "0")}</span>
            <span className="flex-1 truncate">{lines[n]}</span>
            <span className="animate-pulse">▮</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-secondary/80 border border-border p-[1px]">
          <div className="h-full flex gap-[2px] overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={i} className="flex-1" style={{ background: i / 40 < n / lines.length ? "hsl(var(--primary))" : "hsl(var(--border))" }} />
            ))}
          </div>
        </div>
        <span className="font-mono text-[10px] text-primary w-10 text-right">{pct}%</span>
      </div>
    </div>
  );
}