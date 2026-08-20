import React, { useEffect, useState } from "react";

// Staged terminal log — one line every `interval` ms, then reports done.
export default function BootLog({ lines, interval = 260, onDone }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= lines.length) { const t = setTimeout(() => onDone?.(), 420); return () => clearTimeout(t); }
    const t = setTimeout(() => setN((x) => x + 1), interval);
    return () => clearTimeout(t);
  }, [n, lines.length, interval, onDone]);

  return (
    <div className="font-mono text-[11px] leading-6 space-y-0.5">
      {lines.slice(0, n).map((l, i) => (
        <div key={l} className="flex gap-3">
          <span className="text-primary">{String(i + 1).padStart(2, "0")}</span>
          <span className="text-muted-foreground flex-1">{l}</span>
          <span className="text-[hsl(var(--chart-3))]">OK</span>
        </div>
      ))}
      {n < lines.length && <div className="flex gap-3 text-accent"><span>{String(n + 1).padStart(2, "0")}</span><span className="animate-pulse">{lines[n]}</span></div>}
    </div>
  );
}