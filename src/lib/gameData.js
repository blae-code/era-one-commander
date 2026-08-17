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

const LIMITS = { Module: 500, Unit: 200, Weapon: 300, Turret: 300, Subsystem: 100, ResearchNode: 500, Resource: 50, Station: 50, GameBlueprint: 200 };

export function useGameEntity(entity, enabled = true) {
  return useQuery({
    queryKey: ["game", entity],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        return await base44.entities[entity].list("game_id", LIMITS[entity] || 500);
      } catch {
        return []; // entity not deployed yet — pages show the "import game data" hint
      }
    },
  });
}

// Lookup maps keyed by game_id across the catalog entities used for cross-links.
export function useGameCatalog() {
  const modules = useGameEntity("Module");
  const units = useGameEntity("Unit");
  const weapons = useGameEntity("Weapon");
  const turrets = useGameEntity("Turret");
  const subsystems = useGameEntity("Subsystem");
  const research = useGameEntity("ResearchNode");
  const byId = {};
  for (const q of [modules, units, weapons, turrets, subsystems, research]) {
    for (const r of q.data || []) byId[r.game_id] = r;
  }
  return {
    modules: modules.data || [], units: units.data || [], weapons: weapons.data || [], turrets: turrets.data || [],
    subsystems: subsystems.data || [], research: research.data || [], byId,
    isLoading: [modules, units, weapons, turrets, subsystems, research].some((q) => q.isLoading),
    isEmpty: ![modules, units, weapons, turrets, subsystems, research].some((q) => (q.data || []).length > 0),
  };
}

// The game's "Add 0.11" on a rate/health stat means +11 %; on absolute stats (abs=true) it is a raw amount.
export const fmtModifier = (m) => {
  if (!m) return "";
  const v = m.value ?? 0;
  const sign = m.operation === "Subtract" ? "−" : m.operation === "Add" ? "+" : "";
  if (m.operation === "Multiply") return `${m.stat} ×${fmtNum(v, 2)}`;
  if (m.operation === "Set") return `${m.stat} = ${fmtNum(v, 2)}`;
  return m.abs ? `${m.stat} ${sign}${fmtNum(v, 2)}` : `${m.stat} ${sign}${fmtNum(v * 100, 0)}%`;
};
