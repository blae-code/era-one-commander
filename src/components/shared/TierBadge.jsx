import React from "react";

const TIER_STYLE = {
  1: "border-[#6b6156] text-[#9a9186]",
  2: "border-[#c9a678]/70 text-[#c9a678]",
  3: "border-[#d4713f]/70 text-[#d4713f]",
};

export default function TierBadge({ tier = 1 }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 border font-mono text-[9px] tracking-widest ${TIER_STYLE[tier] || TIER_STYLE[1]}`}>
      MK.{["I", "II", "III", "IV", "V"][tier - 1] || tier}
    </span>
  );
}