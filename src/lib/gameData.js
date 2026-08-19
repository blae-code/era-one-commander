// Shared helpers for the real ERA ONE dataset (entities Module/Unit/Weapon/Turret/ResearchNode …).
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const fmtNum = (n, d = 0) =>
  n === undefined || n === null || Number.isNaN(Number(n))
    ? "—"
    : Number(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 });

// Count repeated ids: ["WPN.032","WPN.032"] -> [["WPN.032", 2]]
export const countIds = (ids = []) => {
  const m = new Map();
  for (const id of ids) m.set(id, (m.get(id) || 0) + 1);
  return [...m.entries()];
};

import { listAll } from "@/lib/seedGameData";

// Every game entity is keyed by game_id (synthetic for the relation tables). listAll pages if needed.
//
// This used to swallow every error and return [], which made an auth expiry, a 500, a dropped network
// and a genuinely empty table indistinguishable — all four rendered as "No game data loaded yet, import
// the dataset". Failures now propagate so callers can tell "couldn't load" from "nothing there".
// An entity that is simply not deployed yet is still an empty result, not an error.
export function useGameEntity(entity, enabled = true) {
  return useQuery({
    queryKey: ["game", entity],
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const api = base44.entities[entity];
      if (!api) return []; // entity not deployed yet — genuinely nothing to show
      return await listAll(api, "game_id");
    },
  });
}

/** Escape hatch: rows for any entity by name, without editing this file for every new Databank kind. */
export function useGameEntityRows(entity, enabled = true) {
  const q = useGameEntity(entity, enabled);
  return { rows: q.data || [], isLoading: q.isLoading, isError: q.isError, error: q.error };
}

// Lookup maps keyed by game_id across the catalog entities used for cross-links.
// `extended` also loads doctrine (CombatTemplate/FormationModifier), GameBlueprint and StatDefinition.
export function useGameCatalog(extended = false) {
  const modules = useGameEntity("Module");
  const units = useGameEntity("Unit");
  const weapons = useGameEntity("Weapon");
  const turrets = useGameEntity("Turret");
  const subsystems = useGameEntity("Subsystem");
  const research = useGameEntity("ResearchNode");
  const combat = useGameEntity("CombatTemplate", extended);
  const formations = useGameEntity("FormationModifier", extended);
  const blueprints = useGameEntity("GameBlueprint", extended);
  const statDefs = useGameEntity("StatDefinition", extended);
  const byId = {};
  for (const q of [modules, units, weapons, turrets, subsystems, research, combat, formations, blueprints]) {
    for (const r of q.data || []) byId[r.game_id] = r;
  }
  const kindOf = (id) => {
    if (!byId[id]) return null;
    for (const [k, q] of [["Module", modules], ["Unit", units], ["Weapon", weapons], ["Turret", turrets], ["Subsystem", subsystems], ["ResearchNode", research], ["CombatTemplate", combat], ["FormationModifier", formations], ["GameBlueprint", blueprints]])
      if ((q.data || []).some((r) => r.game_id === id)) return k;
    return null;
  };
  const statLabels = {};
  for (const d of statDefs.data || []) statLabels[d.game_id] = d.name;
  const core = [modules, units, weapons, turrets, subsystems, research];
  return {
    modules: modules.data || [], units: units.data || [], weapons: weapons.data || [], turrets: turrets.data || [],
    subsystems: subsystems.data || [], research: research.data || [],
    combatTemplates: combat.data || [], formations: formations.data || [], blueprints: blueprints.data || [], statLabels,
    byId, kindOf,
    isLoading: core.some((q) => q.isLoading),
    // isEmpty means GENUINELY ZERO ROWS. If a query failed we do not know whether the table is empty,
    // so isError takes precedence — render "couldn't load", never "import the dataset".
    isError: core.some((q) => q.isError),
    error: core.find((q) => q.isError)?.error ?? null,
    isEmpty: !core.some((q) => q.isError) && !core.some((q) => (q.data || []).length > 0),
  };
}

// StatDefinition: the game's own display names for StatModifier stats (e.g. MaxSpeed -> "Speed").
export function useStatDefinitions() {
  const q = useGameEntity("StatDefinition");
  const labels = {};
  for (const d of q.data || []) labels[d.game_id] = d.name;
  return { ...q, labels };
}

// The game's "Add 0.11" on a rate/health stat means +11 %; on absolute stats (abs=true) it is a raw amount.
// Pass `labels` (from useStatDefinitions) to render the player-facing stat name instead of the enum name.
export const fmtModifier = (m, labels = null) => {
  if (!m) return "";
  const stat = (labels && labels[m.stat]) || m.stat;
  const v = m.value ?? 0;
  const sign = m.operation === "Subtract" ? "−" : m.operation === "Add" ? "+" : "";
  if (m.operation === "Multiply") return `${stat} ×${fmtNum(v, 2)}`;
  if (m.operation === "Set") return `${stat} = ${fmtNum(v, 2)}`;
  return m.abs ? `${stat} ${sign}${fmtNum(v, 2)}` : `${stat} ${sign}${fmtNum(v * 100, 0)}%`;
};
