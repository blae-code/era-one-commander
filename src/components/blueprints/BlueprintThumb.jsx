import React from "react";

const CAT_FILL = {
  weapon: "#ff7a1a",
  engine: "#2f9bff",
  reactor: "#ffd21a",
  shield: "#eef4fa",
  module: "#ff3ea5",
};

// Renders a mini top-down schematic of a blueprint straight from its stored placements.
export default function BlueprintThumb({ placements = [], height = 84 }) {
  if (!placements.length) {
    return (
      <div style={{ height }} className="flex items-center justify-center border border-border bg-secondary/30 tech-label">
        No layout data
      </div>
    );
  }

  const maxX = Math.max(...placements.map((p) => (p.x || 0) + (p.w || 1)));
  const maxY = Math.max(...placements.map((p) => (p.y || 0) + (p.h || 1)));

  return (
    <div style={{ height }} className="border border-border bg-[hsl(30_8%_7%)] overflow-hidden">
      <svg viewBox={`0 0 ${maxX} ${maxY}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
        <defs>
          <pattern id="bpthumb-grid" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M1 0 V1 H0" fill="none" stroke="hsl(30 50% 65% / 0.12)" strokeWidth="0.03" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={maxX} height={maxY} fill="url(#bpthumb-grid)" />
        {placements.map((p, i) => (
          <rect
            key={i}
            x={(p.x || 0) + 0.06}
            y={(p.y || 0) + 0.06}
            width={(p.w || 1) - 0.12}
            height={(p.h || 1) - 0.12}
            fill={CAT_FILL[p.category] || "#8b98a6"}
            fillOpacity="0.55"
            stroke={CAT_FILL[p.category] || "#8b98a6"}
            strokeWidth="0.05"
          />
        ))}
      </svg>
    </div>
  );
}