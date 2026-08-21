import React, { useMemo, useState } from "react";
import { Radar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGameCatalog, useGameEntityRows, fmtNum } from "@/lib/gameData";
import ThreatTimeline from "@/components/threat/ThreatTimeline";
import {
  buildThreatClock, TARGET_CLASSES, NOMINAL, NOMINAL_LABEL, targetLabel,
  DIFFICULTIES, CLASS_COLOR, fmtClock,
} from "@/components/threat/threatModel";

const FACTION_HEX = { PIR: "#ff4d4d", CMX: "#2f9bff" };

// Threat Clock — the enemy wave timeline, relative to first contact.
// The game itself announces incoming waves; what it withholds — and this page adds — is
// COMPOSITION, per-class DPS and the cumulative curve. The timeline itself is not a secret.
export default function ThreatClock() {
  const qc = useQueryClient();
  const cat = useGameCatalog();
  const spawners = useGameEntityRows("EnemySpawner");
  const waves = useGameEntityRows("EnemyWave");
  const upgrades = useGameEntityRows("EnemyUpgrade");

  const [spawnerId, setSpawnerId] = useState("SPAWN.PIR");
  const [targetClass, setTargetClass] = useState("FrigateUnit");
  const [difficulty, setDifficulty] = useState("base");

  const isLoading = cat.isLoading || spawners.isLoading || waves.isLoading || upgrades.isLoading;
  const isError = cat.isError || spawners.isError || waves.isError || upgrades.isError;
  const isEmpty = !isError && !isLoading && waves.rows.length === 0;

  const unitsById = useMemo(() => {
    const m = {};
    for (const u of cat.units) m[u.game_id] = u;
    return m;
  }, [cat.units]);
  const researchById = useMemo(() => {
    const m = {};
    for (const r of cat.research) m[r.game_id] = r;
    return m;
  }, [cat.research]);

  const spawner = spawners.rows.find((s) => s.game_id === spawnerId) || null;
  const model = useMemo(() => buildThreatClock({
    waves: waves.rows, upgrades: upgrades.rows, spawnerId, unitsById, researchById, targetClass, difficulty,
  }), [waves.rows, upgrades.rows, spawnerId, unitsById, researchById, targetClass, difficulty]);

  const stamp = waves.rows[0] || null;
  const realWaves = model.waves.filter((w) => !w.ghost).length;
  const ghostWaves = model.waves.length - realWaves;
  const classesPresent = [...new Set(model.waves.flatMap((w) => w.segments.map((s) => s.unitClass)))];

  const Chip = ({ active = false, disabled = false, title = "", children, ...p }) => (
    <button {...p} disabled={disabled} title={title}
      className={`px-2 h-7 border clip-plate font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
        disabled ? "border-border/50 text-muted-foreground/40 cursor-not-allowed"
        : active ? "border-primary bg-primary text-primary-foreground"
        : "border-border text-muted-foreground hover:border-primary/40"}`}>
      {children}
    </button>
  );

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto w-full">
      {/* header */}
      <div className="schematic-panel p-3 mb-3 flex items-center justify-between gap-4 bg-gradient-to-r from-card to-primary/5">
        <div className="flex items-center gap-3 min-w-0">
          <Radar size={30} className="text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl tracking-[0.15em] leading-none">THREAT CLOCK</h1>
            <p className="tech-label mt-1">Enemy wave timeline · composition, per-class DPS &amp; the cumulative curve the overlay never shows</p>
          </div>
        </div>
        <div className="hidden lg:flex flex-col items-end gap-1">
          <div className="flex gap-5 font-mono text-center">
            {[["WAVES", realWaves], ["GHOSTS", ghostWaves], ["UPGRADES", model.upgrades.length], ["PEAK DPS", fmtNum(model.maxDps)]].map(([k, v]) => (
              <div key={k}><div className="text-lg font-semibold text-primary ember-glow leading-none">{v}</div><div className="text-[9px] tracking-[0.2em] text-muted-foreground mt-1">{k}</div></div>
            ))}
          </div>
          {stamp && <div className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground">game {stamp.game_version} · build {stamp.game_build}</div>}
        </div>
      </div>

      {/* the honesty caption — persistent, not a tooltip */}
      <div className="schematic-panel p-3 mb-3">
        <p className="tech-label text-foreground/80">
          t=0 is when the spawner first detects you (only_spawn_when_enemy_detected) + {spawner ? Math.round(spawner.initial_delay) : 140}s initial delay — not match start.
        </p>
        <p className="tech-label mt-1">Stay undetected and t=0 never starts — the entire clock waits on first contact.</p>
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-1 mb-3">
        <span className="tech-label mr-1">Spawner</span>
        {["SPAWN.PIR", "SPAWN.CMX"].map((id) => {
          const fac = id.split(".")[1];
          return (
            <Chip key={id} active={spawnerId === id} onClick={() => setSpawnerId(id)}>
              <span className="inline-block w-2 h-2 mr-1.5 align-middle" style={{ background: FACTION_HEX[fac] }} />{fac}
            </Chip>
          );
        })}
        <div className="h-5 w-px bg-border mx-2" />
        <span className="tech-label mr-1">Difficulty</span>
        {DIFFICULTIES.map((d) => (
          <Chip key={d.key} active={difficulty === d.key} disabled={!d.available}
            title={d.available ? "" : "no extracted deltas for this difficulty"}
            onClick={() => d.available && setDifficulty(d.key)}>
            {d.label}
          </Chip>
        ))}
        <div className="h-5 w-px bg-border mx-2" />
        <span className="tech-label mr-1">Target class</span>
        {TARGET_CLASSES.map((c) => (
          <Chip key={c} active={targetClass === c} onClick={() => setTargetClass(c)}>{c.replace(/Unit$/, "")}</Chip>
        ))}
        <Chip active={targetClass === NOMINAL} onClick={() => setTargetClass(NOMINAL)} title="Unit.dps_total — not class-resolved">{NOMINAL_LABEL}</Chip>
      </div>

      {difficulty !== "base" && model.deltaWaveCount === 0 && (
        <div className="schematic-panel p-2 mb-3 tech-label text-accent">
          {difficulty} deltas are declared on 0 of this spawner's waves — the board is identical to baseline.
        </div>
      )}

      {isLoading ? (
        <div className="schematic-panel p-12 tech-label text-center animate-pulse">Winding the threat clock…</div>
      ) : isError ? (
        <div className="schematic-panel p-10 tech-label text-center">
          <p className="text-destructive mb-3">Couldn&apos;t load the enemy wave tables.</p>
          <button onClick={() => qc.invalidateQueries({ queryKey: ["game"] })}
            className="px-3 h-8 border border-primary text-primary font-mono text-[10px] uppercase tracking-[0.15em] hover:bg-primary hover:text-primary-foreground transition-colors">
            Retry
          </button>
        </div>
      ) : isEmpty ? (
        <div className="schematic-panel p-12 tech-label text-center">
          No EnemyWave rows found — import the game dataset from Data Ops to arm the clock.
        </div>
      ) : (
        <>
          <div className="schematic-panel p-3 mb-3">
            <ThreatTimeline model={model} targetClass={targetClass} />
          </div>

          {/* legend */}
          <div className="schematic-panel p-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {classesPresent.map((c) => (
              <span key={c} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5" style={{ background: CLASS_COLOR[c] || CLASS_COLOR.Unresolved }} />{c}
              </span>
            ))}
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="inline-block w-2.5 h-2.5 border border-dashed border-muted-foreground opacity-60" />ghosted = probabilistic (chance shown; excluded from cumulative)
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-t-0 border-b-[10px] border-l-transparent border-r-transparent border-b-primary" />AI upgrade grant
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="inline-block w-2.5 h-2.5" style={{ background: "hsl(26 88% 52% / 0.35)" }} />cumulative dps {targetLabel(targetClass)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">column width = spawn jitter · hover any column or tick for detail</span>
          </div>

          {spawner && (
            <p className="tech-label mt-3">
              {spawnerId} · {spawner.wave_count} scripted waves · initial delay {fmtClock(spawner.initial_delay)} · spawn speed ×{fmtNum(spawner.spawn_speed, 1)}
              {targetClass === NOMINAL ? ` · DPS shown is ${NOMINAL_LABEL} (Unit.dps_total), not resolved against a target class` : ` · DPS resolved ${targetLabel(targetClass)}`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
