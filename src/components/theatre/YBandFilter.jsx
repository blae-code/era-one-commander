import React, { useMemo, useRef, useState } from "react";
import { fmtNum } from "@/lib/gameData";
import { yHistogram } from "./theatreModel";

// Vertical-slice control: histogram of ScenarioEntity.y + a dual-handle range.
// These maps are NOT flat — this control proves it. Marks outside the band fade on the board.
const W = 260, H = 56, HANDLE_W = 7;

export default function YBandFilter({ marks, band, onBand }) {
  const svgRef = useRef(null);
  const [drag, setDrag] = useState(null); // "lo" | "hi"
  const hist = useMemo(() => yHistogram(marks), [marks]);
  const span = hist.max - hist.min || 1;

  const xOf = (y) => ((y - hist.min) / span) * W;
  const yAt = (px) => hist.min + (Math.max(0, Math.min(W, px)) / W) * span;
  const loX = xOf(Math.max(hist.min, band[0]));
  const hiX = xOf(Math.min(hist.max, band[1]));

  const pxFromEvent = (e) => {
    const el = svgRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return ((e.clientX - rect.left) / rect.width) * W;
  };

  const onDown = (which) => (e) => {
    e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
    setDrag(which);
  };
  const onMove = (e) => {
    if (!drag) return;
    const y = yAt(pxFromEvent(e));
    if (drag === "lo") onBand([Math.min(y, band[1]), band[1]]);
    else onBand([band[0], Math.max(y, band[0])]);
  };
  const onUp = () => setDrag(null);

  const nzCount = useMemo(() => marks.filter((r) => Math.abs(Number(r.y) || 0) > 0.001).length, [marks]);
  const inCount = useMemo(
    () => marks.filter((r) => { const y = Number(r.y) || 0; return y >= band[0] && y <= band[1]; }).length,
    [marks, band]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="tech-label">Vertical slice · y-band</span>
        <span className="font-mono text-[9px] text-muted-foreground">
          {nzCount}/{marks.length} off-plane · {inCount} in band
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full border border-border/70 bg-black/50 touch-none"
        style={{ height: H }}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        {hist.counts.map((c, i) => {
          const bw = W / hist.counts.length;
          const bx = i * bw;
          const bh = (c / hist.peak) * (H - 10);
          const mid = hist.min + ((i + 0.5) / hist.counts.length) * span;
          const lit = mid >= band[0] && mid <= band[1];
          return (
            <rect
              key={i}
              x={bx + 0.5} y={H - bh} width={bw - 1} height={bh}
              fill={lit ? "hsl(26 88% 52%)" : "hsl(14 9% 22%)"}
              opacity={lit ? 0.85 : 0.6}
            />
          );
        })}
        {/* selected window */}
        <rect x={loX} y={0} width={Math.max(0, hiX - loX)} height={H} fill="hsl(26 88% 52%)" opacity="0.08" />
        {/* zero-plane tick */}
        {hist.min < 0 && hist.max > 0 ? (
          <line x1={xOf(0)} y1={0} x2={xOf(0)} y2={H} stroke="hsl(0 0% 70%)" strokeDasharray="2 3" strokeWidth="0.8" opacity="0.5" />
        ) : null}
        {/* handles */}
        {[["lo", loX], ["hi", hiX]].map(([which, x]) => (
          <g key={which} onPointerDown={onDown(which)} className="cursor-ew-resize">
            <rect x={Number(x) - HANDLE_W / 2} y={0} width={HANDLE_W} height={H} fill="transparent" />
            <line x1={x} y1={0} x2={x} y2={H} stroke="hsl(9 64% 52%)" strokeWidth="1.6" />
            <rect x={Number(x) - 3} y={H / 2 - 6} width={6} height={12} fill="hsl(9 64% 52%)" />
          </g>
        ))}
      </svg>
      <div className="flex justify-between font-mono text-[9px] text-muted-foreground mt-0.5">
        <span>{fmtNum(band[0], 1)}</span>
        <button
          className="uppercase tracking-[0.12em] hover:text-primary"
          onClick={() => onBand([hist.min, hist.max])}
        >
          reset
        </button>
        <span>{fmtNum(band[1], 1)}</span>
      </div>
    </div>
  );
}
