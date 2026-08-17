import React from "react";

const TIER_STYLE = {
  1: "border-slate-300 text-slate-500",
  2: "border-cyan-400 text-cyan-600",
  3: "border-violet-400 text-violet-600",
};

export default function TierBadge({ tier = 1 }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 border font-mono text-[9px] tracking-widest ${TIER_STYLE[tier] || TIER_STYLE[1]}`}>
      MK.{["I", "II", "III", "IV", "V"][tier - 1] || tier}
    </span>
  );
}