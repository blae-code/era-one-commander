// The 13 EntityClass keys — the ONLY axis comparative DPS may be expressed on.
// Class-free scalar DPS is banned as a comparison metric; every DPS figure rendered
// from this list must print the target class name beside the number.
export const ENTITY_CLASSES = [
  "FighterUnit",
  "CorvetteUnit",
  "FrigateUnit",
  "UtilityUnit",
  "PlatformUnit",
  "MineUnit",
  "CommandModule",
  "StructuralModule",
  "WeaponModule",
  "FacilityModule",
  "UtilityModule",
  "Station",
  "Wreckage",
];

// The labeled default for class selectors (the house pattern).
export const DEFAULT_CLASS = "FrigateUnit";

export const CLASS_LABEL = {
  FighterUnit: "FIGHTER",
  CorvetteUnit: "CORVETTE",
  FrigateUnit: "FRIGATE",
  UtilityUnit: "UTILITY SHIP",
  PlatformUnit: "PLATFORM",
  MineUnit: "MINE",
  CommandModule: "COMMAND MOD",
  StructuralModule: "STRUCTURAL",
  WeaponModule: "WEAPON MOD",
  FacilityModule: "FACILITY",
  UtilityModule: "UTILITY MOD",
  Station: "STATION",
  Wreckage: "WRECKAGE",
};
