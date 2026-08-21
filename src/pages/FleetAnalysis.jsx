import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DatabaseZap, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useGameCatalog, fmtNum } from "@/lib/gameData";
import FleetHeader from "@/components/fleet/FleetHeader";
import FleetPicker from "@/components/fleet/FleetPicker";
import FleetSummary from "@/components/fleet/FleetSummary";
import FleetContribution from "@/components/fleet/FleetContribution";
import FleetComposition from "@/components/fleet/FleetComposition";
import FleetResearch from "@/components/fleet/FleetResearch";
import { DEFAULT_CLASS } from "@/components/fleet/classes";

const STORE_KEY = "fleet:roster";

// ?u=CMX_FRI3:2,MOD.X:1 — id:count pairs; duplicate ids merge by summing counts.
const parseRoster = (str) => {
  const out = new Map();
  for (const part of String(str || "").split(",")) {
    const [id, n] = part.split(":");
    const game_id = (id || "").trim();
    if (!game_id) continue;
    const count = Math.max(1, Math.floor(Number(n) || 1));
    out.set(game_id, (out.get(game_id) || 0) + count);
  }
  return [...out.entries()].map(([game_id, count]) => ({ game_id, count }));
};

const serializeRoster = (roster) => roster.map((r) => `${r.game_id}:${r.count}`).join(",");

// URL wins over localStorage so a shared link always shows the sender's fleet.
const initialRoster = () => {
  const u = new URLSearchParams(window.location.search).get("u");
  if (u) {
    const r = parseRoster(u);
    if (r.length) return r;
  }
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return parseRoster(arr.map((x) => `${x?.game_id}:${x?.count}`).join(","));
    }
  } catch {
    /* corrupt store — start empty */
  }
  return [];
};

const retryBtn = "mt-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors";

// Fleet Analysis — compose a force from real Units + Modules and roll it up through
// the deployed fleetPlan function (cost / energy / research chain / dps-vs-class).
export default function FleetAnalysis() {
  const cat = useGameCatalog();
  const [, setSearchParams] = useSearchParams();
  const [roster, setRoster] = useState(initialRoster);
  const [selectedClass, setSelectedClass] = useState(DEFAULT_CLASS);

  // Shareable URL + persistence across sessions.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (roster.length) p.set("u", serializeRoster(roster));
        else p.delete("u");
        return p;
      },
      { replace: true }
    );
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(roster));
    } catch {
      /* quota — non-fatal */
    }
  }, [roster, setSearchParams]);

  // Debounce the fleetPlan invoke while counts are being stepped.
  const rosterKey = serializeRoster(roster);
  const [debouncedKey, setDebouncedKey] = useState(rosterKey);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKey(rosterKey), 350);
    return () => clearTimeout(t);
  }, [rosterKey]);

  // Split ids into units[] vs modules[] for the request body. Ids matching neither
  // table are sent anyway — fleetPlan reports them back in unknown[].
  const unitIds = useMemo(() => new Set(cat.units.map((u) => u.game_id)), [cat.units]);
  const body = useMemo(() => {
    const units = [];
    const modules = [];
    for (const r of parseRoster(debouncedKey)) (unitIds.has(r.game_id) ? units : modules).push({ game_id: r.game_id, count: r.count });
    return { units, modules };
  }, [debouncedKey, unitIds]);

  const plan = useQuery({
    queryKey: ["fleetPlan", debouncedKey, unitIds.size],
    enabled: !cat.isLoading && body.units.length + body.modules.length > 0,
    retry: 1,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      // invoke() resolves to a full AxiosResponse — the JSON body lives at res.data.
      const res = await base44.functions.invoke("fleetPlan", body);
      return res?.data ?? res;
    },
  });
  const data = roster.length > 0 ? plan.data : null;
  // On non-2xx the SDK throws a raw AxiosError; the function's message is in response.data.error.
  const planErr = /** @type {any} */ (plan.error);
  const planError = plan.isError ? planErr?.response?.data?.error || planErr?.message || "request failed" : null;

  const addItem = (game_id) =>
    setRoster((prev) =>
      prev.some((r) => r.game_id === game_id)
        ? prev.map((r) => (r.game_id === game_id ? { ...r, count: r.count + 1 } : r))
        : [...prev, { game_id, count: 1 }]
    );
  const setCount = (game_id, count) =>
    setRoster((prev) =>
      count < 1 ? prev.filter((r) => r.game_id !== game_id) : prev.map((r) => (r.game_id === game_id ? { ...r, count: Math.floor(count) } : r))
    );
  const removeItem = (game_id) => setRoster((prev) => prev.filter((r) => r.game_id !== game_id));

  // Dataset stamp comes from data, never hardcoded: fleetPlan's own game_version/game_build
  // when a plan exists, else the catalog rows'.
  const catStamp = cat.modules[0] ? `game ${cat.modules[0].game_version} · build ${cat.modules[0].game_build}` : "";
  const planStamp = data ? `game ${data.game_version} · build ${data.game_build}` : "";
  const t = data?.totals;
  const readout = [
    ["LINES", roster.length],
    ["PARTS", t ? fmtNum(t.part_count) : "—"],
    ["COST RU", t ? fmtNum(t.cost_resources) : "—"],
    ["CREW", t ? fmtNum(t.cost_population) : "—"],
  ];

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <FleetHeader readout={readout} stamp={planStamp || catStamp} onClear={() => setRoster([])} canClear={roster.length > 0} />

      {cat.isLoading ? (
        <div className="schematic-panel p-12 tech-label text-center animate-pulse">Loading unit &amp; module catalog…</div>
      ) : cat.isError ? (
        <div className="schematic-panel p-8 text-center">
          <AlertTriangle size={28} className="mx-auto text-destructive mb-3" />
          <div className="font-display font-bold uppercase tracking-wider">Couldn&apos;t load the catalog</div>
          <p className="tech-label mt-1">{String(cat.error?.message || cat.error || "")}</p>
          <button onClick={() => window.location.reload()} className={retryBtn}>Retry</button>
        </div>
      ) : cat.isEmpty ? (
        <div className="schematic-panel p-8 text-center">
          <DatabaseZap size={28} className="mx-auto text-primary mb-3" />
          <div className="font-display font-bold uppercase tracking-wider">No game data loaded yet</div>
          <p className="tech-label mt-1">
            Import the dataset from the <Link to="/gamedata" className="text-primary underline">Game Data</Link> page.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <FleetPicker
            units={cat.units}
            modules={cat.modules}
            roster={roster}
            byId={cat.byId}
            onAdd={addItem}
            onSetCount={setCount}
            onRemove={removeItem}
          />

          {roster.length === 0 ? (
            <div className="schematic-panel p-12 text-center">
              <div className="font-display font-bold uppercase tracking-wider mb-2">Compose a force</div>
              <p className="tech-label max-w-xl mx-auto leading-relaxed">
                Add units and modules from the catalog above. The deployed fleetPlan function rolls up cost, crew,
                build time, energy and per-target-class DPS, and resolves the full research chain needed to field
                the force. The roster is shareable via the ?u= link and remembered in this browser.
              </p>
            </div>
          ) : planError ? (
            <div className="schematic-panel p-8 text-center">
              <AlertTriangle size={28} className="mx-auto text-destructive mb-3" />
              <div className="font-display font-bold uppercase tracking-wider">Couldn&apos;t compute the fleet plan</div>
              <p className="tech-label mt-1">{planError}</p>
              <button onClick={() => plan.refetch()} className={retryBtn}>Retry</button>
            </div>
          ) : !data ? (
            <div className="schematic-panel p-12 tech-label text-center animate-pulse">Computing fleet plan…</div>
          ) : (
            <div className={`space-y-4 transition-opacity ${plan.isFetching ? "opacity-60" : ""}`}>
              {data.unknown?.length > 0 && (
                <div className="flex items-center gap-2 border border-[#ffb020]/50 bg-[#ffb020]/10 px-3 py-2">
                  <AlertTriangle size={14} className="text-[#ffb020] shrink-0" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#ffb020]">
                    Unknown ids dropped from the totals: {data.unknown.join(", ")}
                  </span>
                </div>
              )}
              <FleetSummary totals={data.totals} stamp={planStamp} />
              <FleetContribution
                dpsVsClass={data.totals?.dps_vs_class}
                selected={selectedClass}
                onSelect={setSelectedClass}
                capability={data.capabilities?.dps || ""}
              />
              <FleetComposition lines={data.lines} selectedClass={selectedClass} />
              <FleetResearch research={data.required_research} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
