import React from "react";
import { fmtNum } from "@/lib/gameData";

const FIELDS = [
  { label: "RU", key: "ru", d: 0 },
  { label: "CREW", key: "crew", d: 0 },
  { label: "ENERGY", key: "energy", d: 0 },
  { label: "BUILD s", key: "time", d: 1 },
];

export default function TotalsBar({ totals }) {
  return (
    <div className="grid grid-cols-4 gap-2 border-y border-border py-2">
      {FIELDS.map(({ label, key, d }) => (
        <div key={key}>
          <div className="font-mono text-lg text-primary ember-glow leading-none">{fmtNum(totals[key], d)}</div>
          <div className="text-[8px] font-mono tracking-[0.18em] text-muted-foreground mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}