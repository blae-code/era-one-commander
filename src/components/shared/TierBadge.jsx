import React from "react";

const TIER_STYLE = {
  1: "border-[#8b98a6] text-[#c9d6e3]",
  2: "border-[#2f9bff] text-[#2f9bff]",
  3: "border-[#ff7a1a] text-[#ff7a1a]",
};

export default function TierBadge({ tier = 1 }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 border font-mono text-[9px] tracking-widest ${TIER_STYLE[tier] || TIER_STYLE[1]}`}>
      MK.{["I", "II", "III", "IV", "V"][tier - 1] || tier}
    </span>
  );
}