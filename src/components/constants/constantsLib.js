// Shared helpers for the Game Constants page (GameSetting / BuildCap / AiColorScheme / DatasetBuild).

// GameSetting columns that are dead in the dataset (empty arrays on the single row) — never rendered.
export const DEAD_FIELDS = new Set(["building_tooltip_actions", "waypoint_mode_tooltip_actions"]);

// Fields other parts of the Commander cross-reference (per base44/GAME-DATA-CONTRACT.md).
// NOTE: as of 2026-08-21 no page under src/pages|components reads these directly yet — the marker
// flags the contract-designated linkage, not a live import.
export const CROSS_REF = {
  combat_zone_size: "Combat-zone radius — contract-designated cross-reference",
  harvestable_remains_yield: "Wreck salvage yield range — the Remain codex resolves yields through this",
  constructable_remains_yield: "Constructable wreck yield range — sibling of harvestable_remains_yield",
  score_calculation_weights: "Score formula weights — overlaps the ScoreWeight entity (20 rows)",
};

// Ordered prefix-family rules; first match wins. Order is also the display order,
// except "Identity & meta" which renders last.
/** @type {Array<[string, RegExp]>} */
export const FAMILY_RULES = [
  ["Combat & damage", /^combat_|^damage_by_mass$|damage_from_collisions|damageable|repair_threshold|tumble_of_death|experience|^leader|commands_cooldown|turbo_mode|exp_modifiers/],
  ["Scoring", /score/],
  ["Warp", /warp/],
  ["Formations", /formation/],
  ["Pathfinding & navigation", /pathfinder|path_finder|collision_control|navigation|avoidance|trajectory|los_probe|direction_sensitivity|skip_queue|translation_distance|follow_distance|waypoint_orbit|docking_block/],
  ["AI planner", /budget$|temperature|^ai_player_name$/],
  ["Salvage & yield", /remains_yield|collector_per_drop/],
  ["Audio & speech", /audio|speech|soundtrack|clip_cooldown|response_probability|cloud_exit/],
  ["Camera & view", /camera|field_of_view|letter_box|edge_scrolling|cursor_lock|mouse_sensitivity|scroll_sensitivity/],
  ["FX & feedback", /shake|fxlod|slow_down|floating_text/],
  ["Input & controls", /steady_tap|gamepad|cockpit|vertical_targeting|selecting_modules/],
  ["Sensors & visibility", /visual_range|visibility|noise|sensors_grid|overlay/],
  ["Tooltips & hints", /tooltip|hint|waypoint_mode_loc_key/],
  ["UI & HUD", /^show_|^stick_|^hide_|ui_opacity|events_in_log|destroy_confirmations|selection|cutscenes|signals|boards|focus_indicators|heights/],
  ["Physics & motion", /drag|mass|speed_limit|distance|sensitivity/],
  ["Match defaults", /difficulty_level|game_speed|resources_amount|patrol_routes/],
  ["Engine & pooling", /pool/],
  ["Identity & meta", /^(game_id|name|m__name|game_version|game_build)$/],
  ["General", /./],
];

export const familyOf = (key) => {
  for (const [label, re] of FAMILY_RULES) if (re.test(key)) return label;
  return "General";
};

// Unity float RGBA [0..1] x4 -> #RRGGBB (alpha appended only when not fully opaque).
export const rgbaToHex = (arr) => {
  if (!Array.isArray(arr) || arr.length < 3) return "#000000";
  const h = (f) => Math.round(Math.max(0, Math.min(1, Number(f) || 0)) * 255).toString(16).padStart(2, "0");
  const base = `#${h(arr[0])}${h(arr[1])}${h(arr[2])}`;
  const a = arr.length > 3 ? Number(arr[3]) : 1;
  return a >= 1 ? base : `${base}${h(a)}`;
};

// Scalar / array value -> display string (objects are expanded into sub-rows by the table instead).
export const fmtVal = (v) => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return Number(v).toLocaleString("en-US", { maximumFractionDigits: 5 });
  if (Array.isArray(v))
    return `[${v.map((x) => (typeof x === "number" ? String(+Number(x).toFixed(4)) : String(x))).join(", ")}]`;
  return String(v);
};

// -1 in a BuildCap class dict means "no cap".
export const fmtCap = (v) => (Number(v) === -1 ? "∞" : Number(v).toLocaleString("en-US"));
