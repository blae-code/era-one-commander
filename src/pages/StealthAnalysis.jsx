import React, { useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useGameCatalog, fmtNum } from "@/lib/gameData";
import { STATES, signatureFor, detectorsFrom } from "@/lib/stealth";
import SignatureProfile from "@/components/stealth/SignatureProfile";
import DetectionMatrix from "@/components/stealth/DetectionMatrix";
import EngagementRings from "@/components/stealth/EngagementRings";

export default function StealthAnalysis() {
  const game = useGameCatalog();
  const [contactId, setContactId] = useState(null);
  const [threatId, setThreatId] = useState(null);
  const [state, setState] = useState("cruise");
  const [cloaked, setCloaked] = useState(true);

  const emitters = [...game.units, ...game.modules].filter(
    (r) => (r.base_signature_noise || 0) > 0 || (r.thrust_noise || 0) > 0 || (r.attack_noise || 0) > 0 || (r.cloak_strength || 0) > 0
  );
  const detectors = detectorsFrom([...game.units, ...game.modules]);
  const contact = emitters.find((r) => r.game_id === contactId);
  const threat = detectors.find((r) => r.game_id === threatId) || detectors[0];
  const signature = signatureFor(contact, state, cloaked);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-5">
        <h1 className="font-display font-bold text-xl tracking-[0.15em] uppercase">Stealth Analysis</h1>
        <p className="tech-label mt-0.5">Signature emission, cloak suppression and detection reach</p>
      </div>

      {game.isEmpty ? (
        <div className="schematic-panel p-16 text-center tech-label">Import game data first to run stealth analysis</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            <div>
              <div className="tech-label mb-1.5">Contact (emitter)</div>
              <Select value={contactId || ""} onValueChange={setContactId}>
                <SelectTrigger className="rounded-none font-mono text-xs"><SelectValue placeholder="Select a hull…" /></SelectTrigger>
                <SelectContent>
                  {emitters.map((r) => <SelectItem key={r.game_id} value={r.game_id} className="font-mono text-xs">{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="tech-label mb-1.5">Threat (detector)</div>
              <Select value={threat?.game_id || ""} onValueChange={setThreatId}>
                <SelectTrigger className="rounded-none font-mono text-xs"><SelectValue placeholder="Select a detector…" /></SelectTrigger>
                <SelectContent>
                  {detectors.map((r) => <SelectItem key={r.game_id} value={r.game_id} className="font-mono text-xs">{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="tech-label mb-1.5">Behaviour state</div>
              <div className="flex flex-wrap gap-1">
                {STATES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setState(s.key)}
                    className={`px-2 py-1 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                      state === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {s.key}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="tech-label mb-1.5">Cloak</div>
              <button
                onClick={() => setCloaked(!cloaked)}
                className={`w-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                  cloaked ? "border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {cloaked ? "✔ Suppression active" : "✖ Suppression off"}
              </button>
              <div className="font-mono text-[10px] text-muted-foreground mt-1.5">
                Current signature // <span className="text-primary font-semibold">{fmtNum(signature, 2)}</span>
              </div>
            </div>
          </div>

          {!contact ? (
            <div className="schematic-panel p-16 text-center tech-label">Select a contact to plot its emission profile</div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <SignatureProfile record={contact} cloaked={cloaked} />
                <EngagementRings contact={contact} threat={threat} state={state} cloaked={cloaked} />
              </div>
              <DetectionMatrix detectors={detectors} signature={signature} />
              <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                Model // signature = base noise + thrust noise (under thrust) + attack noise (firing) − own cloak strength.
                Acquisition distance = detector range × (channel strength ÷ signature), capped at the channel's range.
                Values come straight from the extracted records; the ratio rule is this app's approximation.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}