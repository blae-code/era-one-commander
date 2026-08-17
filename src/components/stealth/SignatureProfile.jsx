import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fmtNum } from "@/lib/gameData";
import { signatureProfile } from "@/lib/stealth";

const HEX = { silent: "#38bdf8", cruise: "#ffd21a", engaged: "#ff7a1a", full: "#ff2d55" };
const axis = { fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(36 10% 65%)" };

// Emission by behaviour state — how loud the contact is when drifting, burning, or shooting.
export default function SignatureProfile({ record, cloaked }) {
  const profile = signatureProfile(record, cloaked);
  const data = profile.map((p) => ({ name: p.label.toUpperCase(), key: p.key, signature: p.signature, raw: p.raw }));

  return (
    <div className="schematic-panel p-3">
      <div className="tech-label mb-2">Signature profile // emission by behaviour</div>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data} barSize={30} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={axis} axisLine={false} tickLine={false} width={44} />
          <Tooltip
            cursor={{ fill: "hsl(30 6% 15%)" }}
            contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, borderRadius: 0, background: "hsl(30 7% 10%)", border: "1px solid hsl(30 7% 22%)" }}
            formatter={(v, n) => [fmtNum(v, 2), n === "signature" ? "signature" : "uncloaked"]}
          />
          <Bar dataKey="signature" radius={[2, 2, 0, 0]}>
            {data.map((d) => <Cell key={d.key} fill={HEX[d.key]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="border border-border divide-y divide-border mt-2">
        {profile.map((p) => (
          <div key={p.key} className="bg-card px-2.5 py-1.5 flex items-baseline justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="inline-block w-2 h-2 mr-2 align-middle" style={{ background: HEX[p.key] }} />
              {p.label} <span className="normal-case tracking-normal">— {p.hint}</span>
            </span>
            <span className="font-mono text-xs font-semibold">
              {fmtNum(p.signature, 2)}
              {cloaked && p.raw !== p.signature && <span className="ml-1.5 text-[10px] text-muted-foreground">from {fmtNum(p.raw, 2)}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}