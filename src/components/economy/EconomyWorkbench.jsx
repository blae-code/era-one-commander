import React, { useMemo, useState } from "react";
import { Factory, Play, AlertTriangle, ChevronRight, Minus, Plus, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { fmtNum } from "@/lib/gameData";

// The five asteroid resource types (Resource entity ids). economyModel silently falls back to
// RU.MET on an unknown id, so only ever send one of these.
const RESOURCES = [
  { id: "RU.CRB", label: "CRB", name: "Carbonaceous" },
  { id: "RU.MET", label: "MET", name: "Metallic" },
  { id: "RU.SIL", label: "SIL", name: "Silicaceous" },
  { id: "RU.URA", label: "URA", name: "Uranian" },
  { id: "RU.WRE", label: "WRE", name: "Wreck" },
];

// Nearly every structural module carries a baseline refining_rate of ~0.833; only rates above
// this are a module's actual economic role, so the picker uses > 1 to skip the baseline.
const REFINE_BASELINE = 1;

const roleTags = (m) => {
  const t = [];
  if ((m.extraction_rate || 0) > 0) t.push(["EXTRACT", `${fmtNum(m.extraction_rate, 1)}/s`, "#ffb020"]);
  if ((m.resource_production || 0) > 0) t.push(["PRODUCE", `${fmtNum(m.resource_production, 1)}/s`, "#22c55e"]);
  if ((m.refining_rate || 0) > REFINE_BASELINE) t.push(["REFINE", `${fmtNum(m.refining_rate, 1)}/s`, "#38bdf8"]);
  const store = (m.cargo_capacity || 0) + (m.resource_capacity_bonus || 0);
  if (store > 0) t.push(["STORE", fmtNum(store), "#d24bff"]);
  return t;
};

const Readout = ({ label, value, unit = "", accent = false, dim = false, danger = false, title = undefined }) => (
  <div className={`px-3 py-2 border bg-black/30 min-w-[108px] ${danger ? "border-destructive/60" : "border-border"}`} title={title}>
    <div className={`font-mono text-lg leading-none ${danger ? "text-destructive" : dim ? "text-muted-foreground" : accent ? "text-accent ember-glow" : "text-primary ember-glow"}`}>
      {value}
      {unit && <span className="text-[10px] text-muted-foreground ml-1">{unit}</span>}
    </div>
    <div className="text-[9px] font-mono tracking-[0.2em] text-muted-foreground mt-1 uppercase">{label}</div>
  </div>
);

// Economy workbench: compose extraction / production / refining / storage modules, pick a
// resource, and let the deployed economyModel function state the throughput — and its own model.
export default function EconomyWorkbench({ modules }) {
  const [counts, setCounts] = useState({});
  const [resourceId, setResourceId] = useState("RU.MET");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { data, reqKey }
  const [showModel, setShowModel] = useState(false);

  const pickable = useMemo(
    () =>
      (modules || [])
        .filter(
          (m) =>
            (m.extraction_rate || 0) > 0 ||
            (m.resource_production || 0) > 0 ||
            (m.refining_rate || 0) > REFINE_BASELINE ||
            (m.cargo_capacity || 0) > 0 ||
            (m.resource_capacity_bonus || 0) > 0,
        )
        .sort((a, b) => (a.game_id > b.game_id ? 1 : -1)),
    [modules],
  );

  const selected = useMemo(
    () =>
      Object.entries(counts)
        .filter(([, n]) => n > 0)
        .map(([game_id, count]) => ({ game_id, count }))
        .sort((a, b) => (a.game_id > b.game_id ? 1 : -1)),
    [counts],
  );
  const reqKey = JSON.stringify({ resourceId, selected });
  const stale = result && result.reqKey !== reqKey;

  const bump = (id, d) =>
    setCounts((c) => {
      const n = Math.max(0, (c[id] || 0) + d);
      const next = { ...c, [id]: n };
      if (n === 0) delete next[id];
      return next;
    });

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("economyModel", { modules: selected, resource_id: resourceId });
      const data = res?.data ?? res; // invoke() resolves to a full AxiosResponse
      setResult({ data, reqKey });
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || String(e));
    } finally {
      setRunning(false);
    }
  };

  const stamp = modules?.[0] ? `game ${modules[0].game_version || "—"} · build ${modules[0].game_build || "—"}` : null;
  const d = result?.data;
  const t = d?.totals;

  return (
    <div className="schematic-panel plate-texture p-4 relative">
      <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes-ember opacity-50" />
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2">
          <Factory size={16} className="text-accent" />
          <div className="font-display font-bold uppercase tracking-[0.15em]">Economy workbench</div>
          <div className="tech-label hidden md:block">server model // deployed economyModel function</div>
        </div>
        {stamp && <div className="font-mono text-[9px] text-muted-foreground tracking-[0.15em] uppercase">{stamp}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4">
        {/* left: composition */}
        <div className="min-w-0">
          <div className="tech-label mb-1.5">Resource</div>
          <div className="flex gap-1 mb-3 flex-wrap">
            {RESOURCES.map((r) => (
              <button key={r.id} onClick={() => setResourceId(r.id)} title={r.name}
                className={`px-2.5 h-7 font-mono text-[10px] uppercase tracking-wider border ${resourceId === r.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                {r.label}
              </button>
            ))}
          </div>

          <div className="tech-label mb-1.5">Economy modules // extraction · production · refining · storage</div>
          <div className="space-y-1 max-h-[330px] overflow-y-auto pr-1">
            {pickable.map((m) => {
              const n = counts[m.game_id] || 0;
              return (
                <div key={m.game_id}
                  className={`flex items-center gap-2 border px-2 py-1.5 ${n > 0 ? "border-primary/60 bg-primary/10" : "border-border bg-black/20"}`}>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px] truncate">
                      {m.name || m.game_id}
                      <span className="text-muted-foreground ml-1.5 text-[9px]">{m.game_id}</span>
                      {m.work_in_progress && <span className="ml-1.5 text-[8px] uppercase border border-[#ffb020] text-[#ffb020] px-1">wip</span>}
                    </div>
                    <div className="flex gap-1.5 mt-0.5 flex-wrap">
                      {roleTags(m).map(([k, v, hex]) => (
                        <span key={k} className="font-mono text-[8px] uppercase tracking-wider" style={{ color: hex }}>{k} {v}</span>
                      ))}
                      {(m.cost_resources || 0) > 0 && <span className="font-mono text-[8px] text-muted-foreground uppercase">{fmtNum(m.cost_resources)} RU</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => bump(m.game_id, -1)} disabled={n === 0} aria-label={`remove one ${m.game_id}`}
                      className="w-6 h-6 border border-border text-muted-foreground hover:border-primary/50 disabled:opacity-30 inline-flex items-center justify-center"><Minus size={11} /></button>
                    <div className={`w-7 text-center font-mono text-[11px] ${n > 0 ? "text-primary" : "text-muted-foreground"}`}>{n}</div>
                    <button onClick={() => bump(m.game_id, 1)} aria-label={`add one ${m.game_id}`}
                      className="w-6 h-6 border border-border text-muted-foreground hover:border-primary/50 inline-flex items-center justify-center"><Plus size={11} /></button>
                  </div>
                </div>
              );
            })}
            {pickable.length === 0 && <div className="tech-label py-4 text-center">no economy modules in the catalog</div>}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button onClick={run} disabled={running || selected.length === 0}
              className="inline-flex items-center gap-1.5 px-4 h-8 font-mono text-[10px] uppercase tracking-wider border border-primary bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-40 transition-colors">
              <Play size={11} /> {running ? "Computing…" : "Run model"}
            </button>
            {selected.length > 0 && (
              <button onClick={() => setCounts({})}
                className="inline-flex items-center gap-1 px-2 h-8 font-mono text-[9px] uppercase tracking-wider border border-border text-muted-foreground hover:border-primary/40">
                <X size={10} /> clear
              </button>
            )}
            <div className="tech-label">{selected.reduce((a, s) => a + s.count, 0) || "no"} modules staged</div>
          </div>
        </div>

        {/* right: server result */}
        <div className="min-w-0">
          {error ? (
            <div className="border border-destructive/60 bg-destructive/10 p-4 text-center">
              <AlertTriangle size={20} className="mx-auto text-destructive mb-2" />
              <div className="font-display font-bold uppercase tracking-[0.15em] text-sm">Couldn't compute</div>
              <p className="tech-label mt-1 normal-case">{error}</p>
              <button onClick={run} disabled={running || selected.length === 0}
                className="mt-3 px-4 h-7 font-mono text-[10px] uppercase tracking-wider border border-primary bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-40">
                Retry
              </button>
            </div>
          ) : running ? (
            <div className="border border-border p-10 tech-label text-center animate-pulse">Running server economy model…</div>
          ) : !d ? (
            <div className="border border-border border-dashed p-10 text-center">
              <div className="tech-label">Stage extraction, production or storage modules and run the model.</div>
              <div className="tech-label mt-1 opacity-70">Throughput is computed server-side against the {RESOURCES.find((r) => r.id === resourceId)?.name} rate table.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {stale && (
                <div className="border border-[#ffb020]/60 bg-[#ffb020]/10 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-[#ffb020]">
                  composition changed since this result — re-run
                </div>
              )}
              <div className="tech-label">
                Yield // {d.resource?.name || d.resource?.game_id} <span className="opacity-70">(extract ×{fmtNum(d.resource?.extraction_rate, 2)} · refine ×{fmtNum(d.resource?.refining_rate, 2)})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Readout label="Gross RU/s" value={fmtNum(t.gross_ru_per_s, 2)} accent />
                <Readout label="RU / min" value={fmtNum(t.ru_per_minute, 1)} accent />
                <Readout label="Extraction" value={fmtNum(t.extraction_ru_per_s, 2)} unit="RU/s" />
                <Readout label="Refining" value={fmtNum(t.refining_ru_per_s, 2)} unit="RU/s" />
                <Readout label="Production" value={fmtNum(t.production_ru_per_s, 2)} unit="RU/s" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Readout label="Storage" value={fmtNum(t.cargo_capacity)} unit="RU" />
                <Readout label="Fill time" value={t.minutes_to_fill_storage == null ? "—" : fmtNum(t.minutes_to_fill_storage, 1)} unit={t.minutes_to_fill_storage == null ? "" : "min"}
                  dim={t.minutes_to_fill_storage == null} title={t.minutes_to_fill_storage == null ? "no income or no storage in this composition" : undefined} />
                <Readout label="Payback" value={t.payback_minutes == null ? "—" : fmtNum(t.payback_minutes, 1)} unit={t.payback_minutes == null ? "" : "min"}
                  dim={t.payback_minutes == null} title={t.payback_minutes == null ? "no gross income — cost never pays back" : undefined} />
                <Readout label="Energy net" value={`${t.energy_net >= 0 ? "+" : ""}${fmtNum(t.energy_net, 1)}`} unit="/s" danger={t.energy_net < 0}
                  title={`production ${fmtNum(t.energy_production, 1)}/s − use ${fmtNum(t.energy_use, 1)}/s`} />
                <Readout label="Crew" value={fmtNum(t.crew)} />
                <Readout label="Cost" value={fmtNum(t.cost_resources)} unit="RU" />
              </div>

              {d.unknown?.length > 0 && (
                <div className="border border-[#ffb020]/60 bg-[#ffb020]/10 px-2 py-1 font-mono text-[9px] text-[#ffb020]">
                  dropped from totals — unknown ids: {d.unknown.join(", ")}
                </div>
              )}

              {d.lines?.length > 0 && (
                <div className="overflow-x-auto border border-border">
                  <table className="w-full font-mono text-[10px] whitespace-nowrap">
                    <thead>
                      <tr className="text-muted-foreground uppercase text-[8px] tracking-[0.15em] border-b border-border bg-black/30">
                        <th className="text-left px-2 py-1.5">Module</th>
                        <th className="text-right px-2 py-1.5">×</th>
                        <th className="text-right px-2 py-1.5">Extract RU/s</th>
                        <th className="text-right px-2 py-1.5">Refine RU/s</th>
                        <th className="text-right px-2 py-1.5">Produce RU/s</th>
                        <th className="text-right px-2 py-1.5">Storage</th>
                        <th className="text-right px-2 py-1.5">Energy /s</th>
                        <th className="text-right px-2 py-1.5">Crew</th>
                        <th className="text-right px-2 py-1.5">Cost RU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.lines.map((l) => (
                        <tr key={l.game_id} className="border-b border-border/50 last:border-0">
                          <td className="px-2 py-1">{l.name || l.game_id} <span className="text-muted-foreground text-[8px]">{l.game_id}</span></td>
                          <td className="text-right px-2 py-1 text-primary">{l.count}</td>
                          <td className="text-right px-2 py-1">{fmtNum(l.extraction_ru_per_s, 2)}</td>
                          <td className="text-right px-2 py-1">{fmtNum(l.refining_ru_per_s, 2)}</td>
                          <td className="text-right px-2 py-1">{fmtNum(l.production_ru_per_s, 2)}</td>
                          <td className="text-right px-2 py-1">{fmtNum((l.cargo_capacity || 0) + (l.resource_capacity_bonus || 0))}</td>
                          <td className="text-right px-2 py-1">{fmtNum((l.energy_production || 0) - (l.energy_use || 0), 1)}</td>
                          <td className="text-right px-2 py-1">{fmtNum(l.crew)}</td>
                          <td className="text-right px-2 py-1">{fmtNum(l.cost_resources)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* the function states its own model — surface it verbatim, collapsed */}
              <div className="border border-border bg-black/20">
                <button onClick={() => setShowModel((s) => !s)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 tech-label hover:text-foreground text-left">
                  <ChevronRight size={11} className={`transition-transform ${showModel ? "rotate-90" : ""}`} />
                  model // what the server does and does not compute
                </button>
                {showModel && (
                  <div className="px-3 pb-2.5 space-y-2">
                    <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">{d.model}</p>
                    {d.settings && (
                      <div className="font-mono text-[9px] text-muted-foreground/80 space-y-0.5">
                        {Object.entries(d.settings).map(([k, v]) => (
                          <div key={k}>
                            <span className="uppercase tracking-wider">{k.split("_").join(" ")}:</span>{" "}
                            {v == null ? "not set" : typeof v === "object" ? JSON.stringify(v) : String(v)}
                          </div>
                        ))}
                      </div>
                    )}
                    {stamp && <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-muted-foreground/70">{stamp}</div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
