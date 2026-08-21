import React from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { fmtNum } from "@/lib/gameData";
import { EntityIcon } from "@/components/databank/Cells";
import { PHASES, camelWords, commitRange, deriveDoctrine, personaHex, plannerOf } from "./dossierModel";

const Section = ({ title, note, children }) => (
  <div className="schematic-panel p-4">
    <div className="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
      <div className="font-display font-bold uppercase tracking-[0.15em] text-xs">{title}</div>
      {note ? <div className="tech-label text-[9px]">{note}</div> : null}
    </div>
    {children}
  </div>
);

function PctBar({ label, value = 0, color }) {
  const pct = Math.max(0, Math.min(1, Number(value) || 0));
  return (
    <div className="flex items-center gap-2">
      <span className="w-32 shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground truncate">{label}</span>
      <span className="flex-1 h-2.5 border border-border/70 bg-black/50">
        <span className="block h-full" style={{ width: `${pct * 100}%`, background: color, boxShadow: `0 0 4px ${color}55` }} />
      </span>
      <span className="w-[52px] text-right font-mono text-[10px] tabular-nums">{fmtNum(pct * 100, 1)}%</span>
    </div>
  );
}

// Attack-cadence window: [min,max] seconds on a shared 0..tMax track.
function CadenceRow({ label, win, tMax, color }) {
  const [a, b] = Array.isArray(win) ? win : [0, 0];
  const l = tMax > 0 ? (a / tMax) * 100 : 0;
  const w = tMax > 0 ? Math.max(0.5, ((b - a) / tMax) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-40 shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground truncate">{label}</span>
      <span className="flex-1 h-2.5 border border-border/70 bg-black/50 relative">
        <span className="absolute top-0 bottom-0" style={{ left: `${l}%`, width: `${w}%`, background: color, opacity: 0.85 }} />
      </span>
      <span className="w-[86px] text-right font-mono text-[10px] tabular-nums">{fmtNum(a)}–{fmtNum(b)}s</span>
    </div>
  );
}

const PhaseHeader = () => (
  <tr>
    <th className="text-left tech-label font-normal py-1 pr-3">phase</th>
    {PHASES.map((p) => (
      <th key={p} className="text-right tech-label font-normal py-1 pl-3">{p}</th>
    ))}
  </tr>
);

const num = (v) => (v === -1 ? "∞" : v === undefined || v === null ? "—" : fmtNum(v));

// The full intelligence file for one personality.
export default function DossierFile({ row, cat, onClose = () => {} }) {
  const hex = personaHex(row);
  const [cMin, cMax] = commitRange(row);
  const planner = plannerOf(row);

  const cadence = row.time_between_attacks && typeof row.time_between_attacks === "object" ? Object.entries(row.time_between_attacks) : [];
  const tMax = cadence.reduce((m, [, w]) => Math.max(m, Array.isArray(w) ? w[1] : 0), 0);

  // fleet_type_requirements keys are Unit.unit_type values — resolve names through the catalog.
  const unitsByType = {};
  for (const u of cat.units) (unitsByType[u.unit_type] ??= []).push(u);
  const fleetReq = row.fleet_type_requirements && typeof row.fleet_type_requirements === "object" ? Object.entries(row.fleet_type_requirements) : [];

  const buildOrder = Array.isArray(row.priority_module_identifiers) ? row.priority_module_identifiers.filter(Boolean) : [];

  const granted = row.granted_researches && typeof row.granted_researches === "object" ? row.granted_researches : {};
  const grantedPhases = PHASES.filter((p) => Array.isArray(granted[p]) && granted[p].length);

  const stanceProbs = [["defensive", row.defensive_probability], ["aggressive", row.aggressive_probability], ["hunter", row.hunter_probability]];
  const approachProbs = [["chase", row.chase_probability], ["flyby", row.flyby_probability], ["orbit", row.orbit_probability], ["frontal", row.frontal_probability], ["lateral", row.lateral_probability]];
  const warpProbs = [["frigate warp attack", row.frigate_warp_attack_chance], ["stations warp attack", row.stations_warp_attack_chance]];
  const formationProbs = row.formation_type_probability && typeof row.formation_type_probability === "object" ? Object.entries(row.formation_type_probability) : [];

  const limits = row.secondary_stations_limits && typeof row.secondary_stations_limits === "object" ? row.secondary_stations_limits : {};
  const ccAttack = row.min_units_for_command_center_attack && typeof row.min_units_for_command_center_attack === "object" ? row.min_units_for_command_center_attack : {};

  return (
    <div className="schematic-panel rust-wash p-5 relative">
      <div className="absolute top-0 left-0 right-0 h-[3px] opacity-70" style={{ background: hex }} />
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="border p-2 bg-black/40 welded-frame" style={{ borderColor: `${hex}66` }}>
            <span className="block w-6 h-6" style={{ background: hex, boxShadow: `0 0 10px ${hex}88` }} />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-xl tracking-[0.15em] leading-none uppercase">FILE: {row.name}</h2>
            <p className="tech-label mt-1.5">{row.game_id} · designation as offered in match setup · {deriveDoctrine(row)}</p>
          </div>
        </div>
        <button onClick={onClose} className="px-2 h-8 border border-border font-mono text-[10px] uppercase tracking-wider hover:border-primary hover:text-primary transition-colors flex items-center gap-1">
          <X size={12} /> Close file
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section title="Commit &amp; cadence" note={`planner depth ${planner.maxDepth ?? "—"} · ${fmtNum(planner.maxNodes)} nodes`}>
          <div className="font-mono text-[11px] mb-3">
            Attack wave: <span className="ember-glow" style={{ color: hex }}>{cMin === cMax ? `exactly ${cMin}` : `${cMin}–${cMax}`}</span> units
            <span className="text-muted-foreground"> · formation {fmtNum(row.min_units_per_formation)}–{fmtNum(row.max_units_per_formation)} units · keeps {fmtNum(row.min_defending_units)} defending</span>
          </div>
          {cadence.length ? (
            <div className="space-y-1">
              <div className="tech-label text-[9px] mb-1">time between attacks by target (seconds, window)</div>
              {cadence.map(([k, w]) => (
                <CadenceRow key={k} label={camelWords(k)} win={w} tMax={tMax} color={hex} />
              ))}
            </div>
          ) : (
            <div className="tech-label">No cadence windows declared.</div>
          )}
        </Section>

        <Section title="Fleet requirements" note="fleet_type_requirements · resolved through Unit">
          {fleetReq.length ? (
            <div className="space-y-2">
              {fleetReq.map(([type, count]) => {
                const matches = unitsByType[type] || [];
                return (
                  <div key={type} className="flex items-center gap-3 border border-border/60 bg-black/30 px-3 py-2">
                    <span className="font-mono text-lg font-semibold ember-glow w-10 text-right shrink-0" style={{ color: hex }}>{fmtNum(count)}</span>
                    <span className="tech-label w-28 shrink-0">{camelWords(type)}</span>
                    <span className="flex items-center gap-2 flex-wrap min-w-0">
                      {matches.length ? (
                        matches.map((u) => (
                          <Link key={u.game_id} to={`/database?t=Unit&id=${encodeURIComponent(u.game_id)}`} className="flex items-center gap-1.5 font-mono text-[10px] border border-border/70 px-1.5 py-0.5 hover:border-primary hover:text-primary transition-colors">
                            <EntityIcon row={u} kindKey="Unit" size={13} />
                            {u.name}
                          </Link>
                        ))
                      ) : (
                        <span className="font-mono text-[10px] text-muted-foreground">no unit of this type in catalog</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="tech-label">No standing fleet composition demanded.</div>
          )}
        </Section>

        <Section title="Scripted build order" note="priority_module_identifiers · via Module catalog">
          {buildOrder.length ? (
            <ol className="flex flex-wrap items-center gap-y-2">
              {buildOrder.map((id, i) => {
                const m = cat.byId[id];
                return (
                  <li key={`${id}-${i}`} className="flex items-center">
                    {i > 0 && <span className="mx-1 text-muted-foreground font-mono text-[10px]">→</span>}
                    <Link to={`/database?t=Module&id=${encodeURIComponent(id)}`} className="flex items-center gap-1.5 border border-border/70 bg-black/30 px-2 py-1 hover:border-primary transition-colors">
                      <span className="font-mono text-[9px] w-4 h-4 flex items-center justify-center border border-border/70 text-muted-foreground shrink-0">{i + 1}</span>
                      <span className="font-mono text-[10px]">{m ? m.name : id}</span>
                      {m ? (
                        <span className="tech-label text-[8px]">{m.module_class} · {fmtNum(m.cost_resources)} RU</span>
                      ) : (
                        <span className="tech-label text-[8px] text-destructive">unresolved</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="tech-label">No scripted opening — construction is left entirely to the planner.</div>
          )}
        </Section>

        <Section title="Granted research" note="granted_researches by game phase · via ResearchNode">
          {grantedPhases.length ? (
            <div className="space-y-2">
              {grantedPhases.map((phase) => (
                <div key={phase} className="flex items-center gap-3 flex-wrap">
                  <span className="tech-label w-14 shrink-0">{phase}</span>
                  {granted[phase].map((id) => {
                    const r = cat.byId[id];
                    return (
                      <Link key={id} to={`/database?t=ResearchNode&id=${encodeURIComponent(id)}`} className="font-mono text-[10px] border border-border/70 bg-black/30 px-2 py-1 hover:border-primary transition-colors">
                        {r ? r.name : id}
                        {r && r.tier !== undefined ? <span className="tech-label text-[8px] ml-1.5">TIER {r.tier}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="tech-label">Nothing handed for free — every unlock is researched in-game.</div>
          )}
        </Section>

        <Section title="Behaviour probabilities" note="attack-stance &amp; approach vectors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <div className="space-y-1">
              <div className="tech-label text-[9px] mb-1">stance selection · default {String(row.default_attack_stance || "—").toLowerCase()}</div>
              {stanceProbs.map(([k, v]) => <PctBar key={k} label={k} value={v} color={hex} />)}
              <div className="tech-label text-[9px] mt-3 mb-1">warp attacks</div>
              {warpProbs.map(([k, v]) => <PctBar key={k} label={k} value={v} color={hex} />)}
            </div>
            <div className="space-y-1">
              <div className="tech-label text-[9px] mb-1">approach pattern</div>
              {approachProbs.map(([k, v]) => <PctBar key={k} label={k} value={v} color={hex} />)}
              {formationProbs.length ? (
                <>
                  <div className="tech-label text-[9px] mt-3 mb-1">formation type</div>
                  {formationProbs.map(([k, v]) => <PctBar key={k} label={k} value={v} color={hex} />)}
                </>
              ) : null}
            </div>
          </div>
        </Section>

        <Section title="Expansion &amp; assault limits" note="secondary_stations_limits · min_units_for_command_center_attack">
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[11px] tabular-nums">
              <thead><PhaseHeader /></thead>
              <tbody>
                <tr className="border-t border-border/50">
                  <td className="py-1 pr-3 tech-label">secondary stations</td>
                  {PHASES.map((p) => (
                    <td key={p} className="py-1 pl-3 text-right">{num(limits[p] && limits[p].maxStations)}</td>
                  ))}
                </tr>
                <tr className="border-t border-border/50">
                  <td className="py-1 pr-3 tech-label">max station size</td>
                  {PHASES.map((p) => (
                    <td key={p} className="py-1 pl-3 text-right">{num(limits[p] && limits[p].maxSize)}</td>
                  ))}
                </tr>
                <tr className="border-t border-border/50">
                  <td className="py-1 pr-3 tech-label">units for CC assault</td>
                  {PHASES.map((p) => (
                    <td key={p} className="py-1 pl-3 text-right" style={{ color: hex }}>{num(ccAttack[p])}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="tech-label text-[9px] mt-2">∞ = unlimited (−1 in data) · CC assault row = minimum fleet massed before it storms your command center.</div>
        </Section>
      </div>
    </div>
  );
}
