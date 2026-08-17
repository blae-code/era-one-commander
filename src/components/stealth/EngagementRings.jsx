import React from "react";
import { fmtNum } from "@/lib/gameData";
import { detectionFor, signatureFor } from "@/lib/stealth";

// "Who sees whom first" — concentric range rings for the contact and one chosen threat.
export default function EngagementRings({ contact, threat, state, cloaked }) {
  const theirDetect = detectionFor(threat, signatureFor(contact, state, cloaked)).best;
  const ourDetect = detectionFor(contact, signatureFor(threat, state, false)).best;

  const rings = [
    { label: "They detect us", value: theirDetect, hex: "#ff2d55" },
    { label: "We detect them", value: ourDetect, hex: "#38bdf8" },
    { label: "Our sensor range", value: contact?.sensors_range || 0, hex: "#2f9bff", dashed: true },
    { label: "Their sensor range", value: threat?.sensors_range || 0, hex: "#ff7a1a", dashed: true },
  ].filter((r) => r.value > 0);

  const max = Math.max(1, ...rings.map((r) => r.value));
  const R = 96;
  const advantage = ourDetect - theirDetect;

  return (
    <div className="schematic-panel p-3">
      <div className="tech-label mb-2">Engagement rings // {threat?.name || "—"}</div>
      <div className="flex items-center gap-4 flex-wrap">
        <svg width={2 * R + 8} height={2 * R + 8} viewBox={`0 0 ${2 * R + 8} ${2 * R + 8}`} className="shrink-0">
          <g transform={`translate(${R + 4} ${R + 4})`}>
            {[0.25, 0.5, 0.75, 1].map((f) => (
              <circle key={f} r={R * f} fill="none" stroke="hsl(30 7% 19%)" strokeWidth="1" />
            ))}
            {rings.map((r) => (
              <circle
                key={r.label}
                r={(r.value / max) * R}
                fill={r.hex}
                fillOpacity={0.06}
                stroke={r.hex}
                strokeWidth="1.5"
                strokeDasharray={r.dashed ? "3 3" : undefined}
              />
            ))}
            <circle r="3" fill="hsl(var(--primary))" />
          </g>
        </svg>
        <div className="flex-1 min-w-[200px] space-y-1.5">
          {rings.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-3 font-mono text-[10px]">
              <span className="text-muted-foreground uppercase tracking-wider">
                <span className="inline-block w-2 h-2 mr-2 align-middle" style={{ background: r.hex }} />
                {r.label}
              </span>
              <span className="text-xs font-semibold">{fmtNum(r.value, 1)}</span>
            </div>
          ))}
          <div className={`mt-2 font-mono text-[11px] font-semibold ${advantage > 0 ? "text-[#38bdf8]" : advantage < 0 ? "text-[#ff2d55]" : "text-[#ffb020]"}`}>
            {advantage > 0 ? `✔ First-contact advantage +${fmtNum(advantage, 1)}` : advantage < 0 ? `✖ They see us first by ${fmtNum(-advantage, 1)}` : "▲ Mutual detection — even footing"}
          </div>
        </div>
      </div>
    </div>
  );
}