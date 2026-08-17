import React from "react";

const base = (props) => ({
  width: props.size || 20,
  height: props.size || 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: props.className,
});

export const WeaponIcon = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
  </svg>
);

export const EngineIcon = (p) => (
  <svg {...base(p)}>
    <path d="M7 4h10l2 7-2 7H7l-2-7 2-7z" />
    <path d="M9 18v3M15 18v3M12 18v4" />
    <path d="M9 8l3 3 3-3" />
  </svg>
);

export const ReactorIcon = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3a9 9 0 0 1 7.8 4.5M21 12a9 9 0 0 1-4.5 7.8M12 21a9 9 0 0 1-7.8-4.5M3 12a9 9 0 0 1 4.5-7.8" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const ShieldIcon = (p) => (
  <svg {...base(p)}>
    <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" />
    <path d="M12 6.5v11" strokeDasharray="2 2" />
  </svg>
);

export const ModuleIcon = (p) => (
  <svg {...base(p)}>
    <rect x="5" y="5" width="14" height="14" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
  </svg>
);

export const HullIcon = (p) => (
  <svg {...base(p)}>
    <path d="M12 2l3 5v7l4 3v3l-7-2-7 2v-3l4-3V7l3-5z" />
    <circle cx="12" cy="10" r="1.5" />
  </svg>
);

export const LogoIcon = (p) => (
  <svg {...base(p)} strokeWidth={1.6}>
    <path d="M12 1.5L21.5 7v10L12 22.5 2.5 17V7L12 1.5z" />
    <path d="M12 6l5 3v6l-5 3-5-3V9l5-3z" strokeDasharray="3 2" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export const CATEGORY_ICONS = {
  weapon: WeaponIcon,
  engine: EngineIcon,
  reactor: ReactorIcon,
  shield: ShieldIcon,
  module: ModuleIcon,
  hull: HullIcon,
};

export const CATEGORY_COLORS = {
  weapon: "text-[#ff7a1a]",
  engine: "text-[#2f9bff]",
  reactor: "text-[#ffd21a]",
  shield: "text-[#eef4fa]",
  module: "text-[#d24bff]",
  hull: "text-[#ff9d33]",
};

export function CategoryIcon({ category, size = 18, className = "" }) {
  const Icon = CATEGORY_ICONS[category] || ModuleIcon;
  const color = CATEGORY_COLORS[category] || "";
  return <Icon size={size} className={`${color} ${className}`} />;
}