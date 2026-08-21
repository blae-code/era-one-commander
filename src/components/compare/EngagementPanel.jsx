import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Swords, AlertTriangle, ArrowRight, ArrowLeftRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { fmtNum } from "@/lib/gameData";

// Live engagement solver (backend `engagement` function), both directions of a unit pair.
// Doctrine options flagged `noop` are real combat templates that carry NO numeric modifiers —
// selecting them changes nothing (6 of the 12 templates are modifier-free: AT.NEUTRAL, both
// orientations, STANCE_PASSIVE, STYLE_CHASE, STYLE_ORBIT).
const STANCES = [
  { v: "reactive" }, { v: "defensive" }, { v: "aggressive" }, { v: "hunter" },
  { v: "passive", noop: true },
];
const STYLES = [
  { v: "flyby" }, { v: "hold" },
  { v: "chase", noop: true }, { v: "orbit", noop: true },
];
const FORMATIONS = [
  { v: "claw" }, { v: "delta" }, { v: "sphere" }, { v: "wall" }, { v: "grouped" },
];

function OptionChips({ label, options, value, onChange }) {
  return (
    <div>
      <div className="tech-label mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => onChange(null)}
          className={`px-2 py-1 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
            value == null ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
          }`}
        >
          default
        </button>
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            title={o.noop ? "carries no numeric modifiers — selecting it changes nothing" : undefined}
            className={`px-2 py-1 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
              value === o.v
                ? "border-primary bg-primary text-primary-foreground"
                : o.noop
                  ? "border-border/50 bg-card text-muted-foreground/40 hover:border-primary/30"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            {o.v}{o.noop ? " *" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

function BandBar({ result, color }) {
  const band = result?.ttk_band;
  if (!band || band.high == null || band.low == null) {
    return (
      <div className="font-mono text-[11px] text-muted-foreground border border-border/60 bg-secondary/40 px-3 py-2">
        no kill under any armour model — net DPS never positive
      </div>
    );
  }
  const scale = band.high * 1.12 || 1;
  const pct = (v) => `${Math.min(100, Math.max(0, (v / scale) * 100))}%`;
  const point = result.time_to_kill_s;
  return (
    <div>
      <div className="relative h-7 bg-secondary/50 border border-border">
        <div
          className="absolute top-0 bottom-0 border-x"
          style={{ left: pct(band.low), width: `calc(${pct(band.high)} - ${pct(band.low)})`, background: `${color}33`, borderColor: color }}
        />
        {point != null && (
          <div
            className="absolute top-0 bottom-0 w-[2px]"
            style={{ left: pct(point), background: color }}
            title={`point estimate ${fmtNum(point, 1)}s — armor_model: none`}
          />
        )}
      </div>
      <div className="flex justify-between font-mono text-[10px] mt-1">
        <span style={{ color }}>{fmtNum(band.low, 1)}s</span>
        <span className="text-muted-foreground">
          point {point != null ? `${fmtNum(point, 1)}s` : "—"} · armor_model: none
          {band.model_spread_ratio != null && <> · ×{fmtNum(band.model_spread_ratio, 2)} spread</>}
        </span>
        <span style={{ color }}>{fmtNum(band.high, 1)}s</span>
      </div>
    </div>
  );
}

function DirectionCard({ title, color, data }) {
  const r = data?.result;
  if (!r) return null;
  return (
    <div className="schematic-panel p-4">
      <div className="font-display font-semibold text-sm uppercase tracking-[0.1em] mb-3 flex items-center gap-2" style={{ color }}>
        <ArrowRight size={14} /> {title}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4 font-mono text-center">
        <div>
          <div className="text-lg ember-glow" style={{ color }}>{fmtNum(r.net_dps, 1)}</div>
          <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-0.5">NET DPS</div>
        </div>
        <div>
          <div className="text-lg ember-glow">{fmtNum(r.dps, 1)}</div>
          <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-0.5">RAW DPS</div>
        </div>
        <div>
          <div className="text-lg ember-glow">{fmtNum(r.max_range, 1)}</div>
          <div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-0.5">MAX RANGE</div>
        </div>
      </div>
      <div className="tech-label mb-1">TIME TO KILL // BAND ACROSS 4 ARMOUR MODELS</div>
      <BandBar result={r} color={color} />
      <p className="font-mono text-[10px] text-muted-foreground mt-2">
        The point estimate assumes armor_model:&nbsp;"none" (armour reported, not applied); the band spans
        the none / subtractive / diminishing / proportional armour shapes.
      </p>
    </div>
  );
}

export default function EngagementPanel({ units, colors, stamp }) {
  const ids = units.map((u) => u.game_id);
  const [pair, setPair] = useState({ a: null, b: null });
  const [stance, setStance] = useState(null);
  const [style, setStyle] = useState(null);
  const [formation, setFormation] = useState(null);

  const aId = pair.a && ids.includes(pair.a) ? pair.a : ids[0];
  const bId = pair.b && ids.includes(pair.b) && pair.b !== aId ? pair.b : ids.find((id) => id !== aId);
  const nameOf = (id) => units.find((u) => u.game_id === id)?.name || id;
  const colorOf = (id) => colors[ids.indexOf(id)] || "hsl(var(--primary))";

  const doctrine = {
    ...(stance ? { stance } : {}),
    ...(style ? { style } : {}),
    ...(formation ? { formation } : {}),
  };

  const q = useQuery({
    queryKey: ["engagement", aId, bId, stance, style, formation],
    enabled: Boolean(aId && bId),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const call = async (att, def) => {
        const res = await base44.functions.invoke("engagement", {
          attacker: { game_id: att, ...doctrine },
          defender: { game_id: def },
        });
        return res?.data ?? res;
      };
      const [ab, ba] = await Promise.all([call(aId, bId), call(bId, aId)]);
      return { ab, ba };
    },
  });

  if (!aId || !bId) return null;
  // invoke() throws a raw AxiosError: the function's own message lives at response.data.error,
  // e.message alone is only "Request failed with status code NNN".
  const err = /** @type {any} */ (q.error);
  const errMsg = q.isError ? (err?.response?.data?.error || err?.message || String(err)) : null;
  const caps = q.data?.ab?.capabilities;
  const respStamp = q.data?.ab?.game_version
    ? `game ${q.data.ab.game_version} · build ${q.data.ab.game_build}`
    : stamp;

  return (
    <div className="schematic-panel p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] hazard-stripes-ember opacity-50" />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Swords size={18} className="text-accent" />
          <span className="font-display font-bold uppercase tracking-[0.15em]">ENGAGEMENT SOLVER</span>
        </div>
        {respStamp && <span className="tech-label">{respStamp}</span>}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="tech-label mb-1">PAIR // BOTH DIRECTIONS COMPUTED</div>
          <div className="flex flex-wrap items-center gap-2">
            {ids.map((id) => (
              <button
                key={`a-${id}`}
                onClick={() => setPair((p) => ({ a: id, b: p.b === id ? null : p.b }))}
                className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider border transition-colors"
                style={id === aId
                  ? { borderColor: colorOf(id), background: colorOf(id), color: "#0c0a09" }
                  : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
              >
                {nameOf(id)}
              </button>
            ))}
            <button
              onClick={() => setPair({ a: bId, b: aId })}
              className="px-2 py-1 border border-border text-muted-foreground hover:border-primary/40"
              title="swap attacker/defender"
            >
              <ArrowLeftRight size={12} />
            </button>
            {ids.filter((id) => id !== aId).map((id) => (
              <button
                key={`b-${id}`}
                onClick={() => setPair((p) => ({ a: p.a && ids.includes(p.a) ? p.a : aId, b: id }))}
                className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider border transition-colors"
                style={id === bId
                  ? { borderColor: colorOf(id), background: colorOf(id), color: "#0c0a09" }
                  : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
              >
                {nameOf(id)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <OptionChips label="STANCE" options={STANCES} value={stance} onChange={setStance} />
          <OptionChips label="STYLE" options={STYLES} value={style} onChange={setStyle} />
          <OptionChips label="FORMATION" options={FORMATIONS} value={formation} onChange={setFormation} />
        </div>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground mb-4">
        * greyed options carry no numeric modifiers — passive stance and chase/orbit styles change nothing
        (6 of 12 combat templates are modifier-free, incl. AT.NEUTRAL and both orientations). Doctrine
        applies to the attacking side of each direction.
      </p>

      {q.isLoading || q.isFetching ? (
        <div className="schematic-panel p-12 tech-label text-center animate-pulse">solving engagement…</div>
      ) : q.isError ? (
        <div className="schematic-panel p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" />
          <AlertTriangle size={24} className="mx-auto text-primary mb-2" />
          <div className="font-display font-bold uppercase tracking-[0.15em]">SOLVER OFFLINE</div>
          <p className="tech-label mt-1">Couldn't run the engagement: {errMsg}</p>
          <button
            onClick={() => q.refetch()}
            className="mt-4 px-4 h-8 font-mono text-[10px] uppercase tracking-wider border border-primary bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : q.data ? (
        <>
          <div className="grid lg:grid-cols-2 gap-4">
            <DirectionCard title={`${nameOf(aId)} → ${nameOf(bId)}`} color={colorOf(aId)} data={q.data.ab} />
            <DirectionCard title={`${nameOf(bId)} → ${nameOf(aId)}`} color={colorOf(bId)} data={q.data.ba} />
          </div>
          {caps && (
            <details className="mt-4 border border-border/60 bg-secondary/30">
              <summary className="tech-label px-3 py-2 cursor-pointer select-none hover:text-foreground">
                WHAT THIS DOES NOT MODEL
              </summary>
              <div className="px-3 pb-3">
                <ul className="font-mono text-[11px] text-muted-foreground list-disc list-inside space-y-0.5">
                  {(caps.unmodelled || []).map((u) => <li key={u}>{u}</li>)}
                </ul>
                {caps.armor && <p className="font-mono text-[10px] text-muted-foreground/80 mt-2">armour: {caps.armor}</p>}
                {caps.veterancy && <p className="font-mono text-[10px] text-muted-foreground/80">veterancy: {caps.veterancy}</p>}
              </div>
            </details>
          )}
        </>
      ) : null}
    </div>
  );
}
