import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { RotateCw } from "lucide-react";
import { fmtNum } from "@/lib/gameData";
import { RESOURCE_IDS } from "./queueMath";

// Economic context for the build queue via the real economyModel backend function:
// income of the queued modules against a NAMED target resource, minutes-to-fill and payback.
// economyModel silently defaults an unknown resource_id to RU.MET, so the selector only
// offers the five real Resource ids (default RU.MET) and never free-types one.
export default function EconomyPanel({ entries, stamp }) {
  const [resource, setResource] = useState("RU.MET");
  const payloadKey = useMemo(() => JSON.stringify(entries), [entries]);

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["economyModel", resource, payloadKey],
    enabled: entries.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 0,
    queryFn: async () => {
      const res = await base44.functions.invoke("economyModel", { modules: entries, resource_id: resource });
      return res?.data ?? res;
    },
  });

  // invoke() rejects with a raw AxiosError: the function's message lives at response.data.error.
  const anyErr = /** @type {any} */ (error);
  const errMsg = anyErr?.response?.data?.error || anyErr?.message || "unknown error";

  const t = data?.totals;
  const readouts = [
    ["GROSS RU/S", t ? fmtNum(t.gross_ru_per_s, 2) : "—"],
    ["RU / MINUTE", t ? fmtNum(t.ru_per_minute, 1) : "—"],
    ["MIN TO FILL STORAGE", t?.minutes_to_fill_storage == null ? "—" : fmtNum(t.minutes_to_fill_storage, 1)],
    ["PAYBACK MIN", t?.payback_minutes == null ? "—" : fmtNum(t.payback_minutes, 1)],
  ];

  return (
    <div className="schematic-panel plate-texture p-3 relative">
      <div className="absolute top-0 left-0 right-0 h-[2px] hazard-stripes-ember opacity-60" />
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="tech-label">Economy context // economyModel</div>
        {stamp && <div className="font-mono text-[9px] tracking-[0.16em] text-muted-foreground">{stamp}</div>}
      </div>

      <div className="flex flex-wrap items-center gap-1 mb-2">
        <span className="tech-label mr-1">Target resource</span>
        {RESOURCE_IDS.map((id) => (
          <button
            key={id}
            onClick={() => setResource(id)}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
              resource === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            {id.replace("RU.", "")}
            {id === "RU.MET" ? <span className="opacity-60 ml-1">DEF</span> : null}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="tech-label py-6 text-center">Queue something to model its economy</div>
      ) : isError ? (
        <div className="border border-[#ff2d55]/40 bg-[#ff2d55]/5 px-2 py-2 flex items-center justify-between gap-2">
          <span className="tech-label text-[#ff2d55]">Couldn&apos;t model: {errMsg}</span>
          <button onClick={() => refetch()} className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:text-primary">
            <RotateCw size={10} /> Retry
          </button>
        </div>
      ) : isFetching && !data ? (
        <div className="tech-label py-6 text-center animate-pulse">Modelling economy…</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-y border-border py-2">
            {readouts.map(([label, value]) => (
              <div key={label}>
                <div className="font-mono text-lg text-accent ember-glow leading-none">{value}</div>
                <div className="text-[8px] font-mono tracking-[0.18em] text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="font-mono text-[9px] text-muted-foreground mt-2">
            vs <span className="text-foreground">{data.resource?.name || resource}</span> ({data.resource?.game_id || resource})
            {t?.minutes_to_fill_storage == null || t?.payback_minutes == null ? " · — = no income or no storage in this queue" : ""}
          </div>
          {Array.isArray(data.unknown) && data.unknown.length > 0 && (
            <div className="tech-label mt-2 text-[#ffd21a]">▲ {data.unknown.length} id(s) unknown to the model, dropped from totals: {data.unknown.join(", ")}</div>
          )}
          {data.model && (
            <div className="mt-2 border border-border/60 bg-black/20 px-2 py-1.5">
              <div className="tech-label mb-1">Model</div>
              <p className="font-mono text-[9px] leading-relaxed text-muted-foreground">{data.model}</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
