import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Wrench, Crosshair } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { fmtNum } from "@/lib/gameData";
import { CLASSES } from "./catalog";

// Loadout configurator for a unit with selectable equipment (backend `unitLoadout` function).
// The verified headline finding behind this panel: 130 of 143 unit-class cases have a strictly
// better fit than the one the game ships. So the shipped fit is marked, and the delta between
// shipped and best-for-class is the first thing shown.
//
// RULE-3: fits are RE-RANKED CLIENT-SIDE by dps_vs_class[selected class] — never by the
// response's class-free `dps` scalar and never by its own `fits` order.
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const short = (c) => String(c).replace("Unit", "").replace("Module", " mod");
const bestClassOf = (dpsVs) => {
  let best = null;
  for (const [c, v] of Object.entries(dpsVs || {})) if (num(v) > (best ? num(dpsVs[best]) : 0)) best = c;
  return best;
};

export default function LoadoutPanel({ unit, byId, open }) {
  const q = useQuery({
    queryKey: ["unitLoadout", unit?.game_id],
    enabled: Boolean(open && unit?.game_id),
    staleTime: 30 * 60 * 1000, // per-unit cache; the dataset only changes on reimport
    retry: 1,
    queryFn: async () => {
      const res = await base44.functions.invoke("unitLoadout", { unit_id: unit.game_id, enumerate: true });
      return res?.data ?? res;
    },
  });

  const data = q.data;
  const fits = useMemo(() => data?.fits || [], [data]);
  const slots = data?.slots || {};
  // Default ranking class: the class the unit's own armament is strongest against.
  const defaultCls = useMemo(
    () => bestClassOf(unit?.dps_vs_class) || bestClassOf(data?.fit?.totals?.dps_vs_class) || "FighterUnit",
    [unit, data],
  );
  const [clsSel, setClsSel] = useState(null);
  const cls = clsSel || defaultCls;

  const classOptions = useMemo(
    () => CLASSES.filter((c) => fits.some((f) => num(f.dps_vs_class?.[c]) > 0)),
    [fits],
  );
  const ranked = useMemo(
    () => [...fits].sort((a, b) => num(b.dps_vs_class?.[cls]) - num(a.dps_vs_class?.[cls])),
    [fits, cls],
  );
  const isShipped = (f) =>
    (f.primary ?? null) === (slots.primary?.default ?? null) && (f.secondary ?? null) === (slots.secondary?.default ?? null);
  const shipped = ranked.find(isShipped) || null;
  const best = ranked[0] || null;
  const dDps = best && shipped ? num(best.dps_vs_class?.[cls]) - num(shipped.dps_vs_class?.[cls]) : 0;
  const dCost = best && shipped ? num(best.cost_resources) - num(shipped.cost_resources) : 0;
  const nameOf = (id) => (id ? byId?.[id]?.name || id : "—");

  if (q.isLoading) return <div className="schematic-panel p-8 tech-label text-center animate-pulse">Enumerating fits…</div>;
  if (q.isError) {
    // invoke() throws a raw AxiosError: the function's own message lives at response.data.error.
    const err = /** @type {any} */ (q.error);
    return (
      <div className="schematic-panel p-6 text-center">
        <AlertTriangle size={20} className="mx-auto text-primary mb-2" aria-hidden="true" />
        <div className="tech-label" role="alert">Couldn't compute loadouts: {err?.response?.data?.error || err?.message || String(err)}</div>
        <button onClick={() => q.refetch()} className="mt-3 px-3 h-7 font-mono text-[10px] uppercase tracking-wider border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">Retry</button>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-4" role="region" aria-label="Loadout configurator">
      {/* the headline: shipped vs best-for-class */}
      {best && shipped && (
        <div className={`schematic-panel p-3 relative overflow-hidden ${dDps > 0 ? "border-primary/70" : ""}`}>
          <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes opacity-60" aria-hidden="true" />
          {dDps > 0 ? (
            <>
              <div className="tech-label">Refit advantage // vs {cls}</div>
              <div className="font-display font-bold text-lg text-primary leading-tight mt-0.5">
                +{fmtNum(dDps, 1)} DPS over the shipped fit
                <span className="font-mono text-xs text-muted-foreground ml-2">({dCost >= 0 ? "+" : "−"}{fmtNum(Math.abs(dCost))} RU)</span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground mt-1">
                best: {nameOf(best.primary)} · {nameOf(best.secondary)} — shipped: {nameOf(shipped.primary)} · {nameOf(shipped.secondary)}
              </div>
            </>
          ) : (
            <div className="tech-label">The shipped fit is already the strongest vs {cls}</div>
          )}
        </div>
      )}

      {/* ranking class selector */}
      <div>
        <div className="tech-label mb-1 flex items-center gap-1.5"><Crosshair size={11} aria-hidden="true" /> Rank fits by DPS vs class</div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Target class for fit ranking">
          {classOptions.map((c) => (
            <button key={c} onClick={() => setClsSel(c)} aria-pressed={cls === c}
              className={`px-2 h-7 border font-mono text-[10px] uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary ${cls === c ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>
              {short(c)}{c === defaultCls ? " ●" : ""}
            </button>
          ))}
        </div>
        <div className="font-mono text-[9px] text-muted-foreground mt-1">● = the class this hull's own armament is strongest against (default)</div>
      </div>

      {/* slots */}
      <div>
        <div className="tech-label mb-1 flex items-center gap-1.5"><Wrench size={11} aria-hidden="true" /> Hardpoints</div>
        {Object.entries(slots).filter(([, s]) => s.count > 0 || (s.options || []).length > 0).map(([slot, s]) => (
          <div key={slot} className="mb-2">
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{slot} × {s.count || 1}</div>
            <div className="flex flex-wrap gap-1">
              {(s.options || []).map((o) => (
                <span key={o.game_id}
                  className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 border font-mono text-[10px] ${o.game_id === s.default ? "border-accent text-accent" : "border-border text-muted-foreground"}`}
                  title={`${o.name} · ${fmtNum(num(o.dps_vs_class?.[cls]), 1)} dps vs ${cls} · ${fmtNum(o.cost_resources)} RU`}>
                  {o.name}
                  <span className="tabular-nums text-foreground/80">{fmtNum(num(o.dps_vs_class?.[cls]), 1)} vs {short(cls)}</span>
                  {o.game_id === s.default && <span className="text-[8px] tracking-widest">DEFAULT</span>}
                </span>
              ))}
              {!(s.options || []).length && <span className="text-[11px] text-muted-foreground">no options</span>}
            </div>
          </div>
        ))}
      </div>

      {/* enumerated fits, re-ranked client-side */}
      {ranked.length > 1 && (
        <div>
          <div className="tech-label mb-1">All fits // ranked by DPS vs {cls}</div>
          <table className="w-full text-xs border-separate border-spacing-0" aria-label={`Enumerated fits ranked by DPS versus ${cls}`}>
            <thead>
              <tr>
                {["#", "Primary", "Secondary", `DPS vs ${short(cls)}`, "Δ DPS", "Δ Cost RU"].map((h) => (
                  <th key={h} className="tech-label px-2 py-1.5 font-normal text-left border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.map((f, i) => {
                const ship = isShipped(f);
                const v = num(f.dps_vs_class?.[cls]);
                const dv = shipped ? v - num(shipped.dps_vs_class?.[cls]) : 0;
                const dc = shipped ? num(f.cost_resources) - num(shipped.cost_resources) : 0;
                return (
                  <tr key={`${f.primary}|${f.secondary}`} className={ship ? "bg-[#0f1720]" : i === 0 ? "bg-primary/10" : ""}
                    style={ship ? { boxShadow: "inset 2px 0 0 hsl(var(--accent))" } : undefined}>
                    <td className="px-2 py-1 border-b border-border/50 font-mono text-[10px] text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-1 border-b border-border/50 text-[11px]">{nameOf(f.primary)}</td>
                    <td className="px-2 py-1 border-b border-border/50 text-[11px]">{nameOf(f.secondary)}</td>
                    <td className="px-2 py-1 border-b border-border/50 font-mono tabular-nums text-right">{fmtNum(v, 1)}</td>
                    <td className={`px-2 py-1 border-b border-border/50 font-mono tabular-nums text-right ${dv > 0 ? "text-emerald-400" : dv < 0 ? "text-red-400" : "text-muted-foreground"}`}>{dv === 0 ? "—" : `${dv > 0 ? "+" : "−"}${fmtNum(Math.abs(dv), 1)}`}</td>
                    <td className={`px-2 py-1 border-b border-border/50 font-mono tabular-nums text-right ${dc > 0 ? "text-red-400" : dc < 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                      {dc === 0 ? "—" : `${dc > 0 ? "+" : "−"}${fmtNum(Math.abs(dc))}`}
                      {ship && <span className="ml-1.5 px-1 py-0.5 border border-accent text-accent text-[8px] tracking-widest align-middle">SHIPPED</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="font-mono text-[9px] text-muted-foreground mt-1.5">
            Ranked here by the game's per-class DPS tables for the named class — never by the class-free nominal DPS. Δ columns are relative to the shipped fit.
          </div>
        </div>
      )}
    </div>
  );
}
