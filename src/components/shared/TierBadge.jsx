import React from "react";

const TIER_STYLE = {
  1: "border-[#7a7166] text-[#b0a79b]",
  2: "border-[#e3c08a]/70 text-[#e3c08a]",
  3: "border-[#f08a45]/70 text-[#f08a45]",
};

export default function TierBadge({ tier = 1 }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 border font-mono text-[9px] tracking-widest ${TIER_STYLE[tier] || TIER_STYLE[1]}`}>
      MK.{["I", "II", "III", "IV", "V"][tier - 1] || tier}
    </span>
  );
}