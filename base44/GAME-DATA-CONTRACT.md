# ERA ONE Commander — game-data backend contract

What the backend provides to the frontend, and how the two sides share this repo without stepping on
each other. Kept in `base44/` because it is the backend's statement of its own surface.

**Last updated 2026-08-17 — 48 entities (dataset: game 0.12.2, Steam build 24615926). Sync from era-one-data: `./sync-app.fish`.**

---

## 0. Who owns what (parallel work rules)

| Owner | Paths | Notes |
|---|---|---|
| **Backend** (Blae's Claude session, from `Code/era-one-data`) | `base44/entities/*.jsonc` (except `Blueprint`, `Component`, `Hull`, `User`), `base44/functions/**`, `src/data/era-one/**`, `src/lib/seedGameData.js`, `src/lib/gameData.js`, `base44/GAME-DATA-CONTRACT.md`, README "Game data" section | The entity files are **generated** **Backend → frontend (Phase 5 shipped — workplan complete):** `LocalizedString` now carries all 9 languages (+`namespace`); `DatasetBuild` + `BuildChange` for "what changed in the patch". All 48 entities verified synced.
* **Backend → frontend (Phase 4 shipped):** `GameBlueprint.assembly` trees (draw shipped designs), `AttachmentRule`, `Module.prefab_guid`; functions `blueprintStats` (design roll-up + warnings) and `importStationFile` (drop a `.station` file → parts + stats, optional save). This is the backend for a **module-graph Ship Builder / design viewer** replacing the Hull/Component grid.
* **Backend → frontend (Phase 3 shipped):** `AiPersonality` (AI dossier), `AiLogicGraph` + `AiFact/AiGoal/AiOperation` + `AiColorScheme` (render the AI's decision graphs), `MatchOption` (match-setup matrix), `ScoreWeight`; functions `economyModel`, `scoreEstimate`.
* **Backend → frontend (Phase 2 shipped):** **Maps** — `Scenario` + `ScenarioEntity` (world x/z per entity, kind, team, resources) = minimap + resource totals + enemy-base HP/DPS/cost per map; `EnemyWave`/`EnemyUpgrade` = wave timeline & difficulty curve; `Objective`/`GameHint`/`GameEvent`/`Remain` = codex; `ArenaTurn`; function `researchImpact`. Suggested pages: *Maps* (card grid → minimap + intel), *Waves* timeline, *Codex*.
* **Backend → frontend (2026-08-17, Phase 0+1 shipped):** `StatDefinition` (real stat names — use in every modifier chip), `Effectiveness` + `dps_vs_class` (counters matrix / heatmap), decoded unit doctrine + flight fields, turret costs, and functions `unitLoadout` (loadout configurator with ranked fits) and `engagement` (TTK / modifier stack). Suggested wiring: Compare page → `Unit`/`Module` + `engagement`; Fleet Analysis → `fleetPlan`; a Loadout panel on Unit detail → `unitLoadout`; `gameFileImport.importEntityRows` → `upsertEntityRows`.
* — change them upstream in era-one-data, never by hand here. |
| **Frontend** (Base44 builder / Blae) | `src/pages/**`, `src/components/**`, `src/index.css`, `tailwind.config.js`, `src/App.jsx` routes, `src/components/Layout.jsx` nav | The backend only touched `src/pages/Database.jsx`, `src/pages/GameData.jsx`, `src/pages/Dashboard.jsx` and `src/components/database/GameEntityDetail.jsx` once to prove the data flows; from here on they are yours to restyle or replace. |

Both sides commit to `main`; the backend always `git fetch && git rebase` before pushing and never force-pushes.
If the frontend needs a new field or a new function, add a line under **§4 Requests** and the backend will pick it up.

---

## 1. Entities (all read-only reference data; key = `game_id`)

Every record has `game_id` (the game's own identifier, e.g. `TUR.002`, `CMX_FRI3`, `WPN.032`, `R.U.FRS1`),
`name`, `game_version`, `game_build`. Base44's own `id` is **not** stable across imports — always join on `game_id`.
`work_in_progress: true` marks assets the game itself flags as unfinished (hide by default).

| Entity | Rows | What it is | Fields you'll use most |
|---|---|---|---|
| `Module` | 103 | Every buildable station/ship part | `module_class` (Command · Structural · Weapon · Facility · Utility), `module_type`, `module_sub_type`, `weapon_category`, `tier`, `cost_resources`, `cost_population` (crew), `construction_time`, `max_health`, `armor`, `mass`, `energy_per_second` (consumption, +N means −N/s), `energy_production`, `cargo_capacity`, `extraction_rate`, `resource_production`, `*_capacity_bonus`, `visual_range`, `sensors_range`, `weapons` (**authoritative armament**, repeated id = count), **`dps_total`** (Σ weapon dps), `turrets`, `prefab_guid` (Addressables GUID — what `.station` files reference), `required_research`, `constructable_ships`, `spawned_unit`, `perfect_attachment_bonus[]`, `power_on_modifiers[]`, `mount_size`, `is_command`, `description`, `info` |
| `Unit` | 27 | Ships (player CMX_* and pirate PIR_*) | `unit_class` (Fighter · Corvette · Frigate · Utility · Platform · Mine), `unit_type`, `faction`, `tier`, cost/hp/armor/mass as above, `max_speed`, `turning_power`, `weapons` (fixed guns), `dps_total`, `hardpoints` `{primary?, secondary?, tertiary?}` counts, `primary_equip`/`secondary_equip`/`tertiary_equip` (default fit) + `primary_equip_options`/`secondary_equip_options` (selectable fits — ids live in `Turret` ∪ `Weapon` ∪ `Subsystem`), `levels[]` (veterancy: `experience_required`, `stat_upgrades[]`), `required_research`, `production_facilities` |
| `Weapon` | 65 | Guns / launchers / mines | `dps`, `range`, `hp_change` (hull dmg/hit), `shield_change`, `armor_penetration` (0..1), `class_damage_multipliers[] {entity_class, multiplier}`, `rate_of_fire`, `burst_amount`, `burst_interval`, `requires_reload`, `reload_time`, `bullet_speed`, `deal_area_damage`, `area_radius`, `weapon_type` (Standard · Missile · EMP · Radiation · SelfDestruct · LongRangeTorpedo · NuclearBomb · SubWeapon, may be `A|B`), `implementation` (Projectile · Raycast · AreaOfEffect · SelfDestructSystem · MineLayer), `applied_status_on_hit`, `required_research` |
| `Turret` | 51 | Turret mounts (module or ship) | `weapons` (ids, repeat = count), `weapons_count`, `dps`, `horizontal_fov`/`vertical_fov` `[min,max]`, `horizontal_rotation_speed`, `time_between_volleys`, `is_fixed`, `attack_priority[]`, `weapons_source` (`prefab` or `shared_prefab:<id>` = inferred) |
| `Subsystem` | 4 | Fighter equipment slots (bomber/interceptor/scout defaults) | `name`, `dps` |
| `ResearchNode` | 131 | The tech tree | `research_type` (Upgrade · Technology · Tier · Ability), `tier`, `cost_resources`, `cost_energy`, `construction_time`, `required_nodes[]` (parents), `child_nodes[]`, `other_requirements[]` (module ids), `unlocks[]` (game's own list), **`unlocks_modules[]` / `unlocks_units[]` / `unlocks_weapons[]` / `unlocks_turrets[]`** (computed reverse links: everything whose `required_research` names this node), `modifiers[] {stat, operation, value, abs}`, `unit_class_affected`, `module_class_affected`, `module_types_affected[]`, **`tree_depth`** (0 = root; longest prerequisite chain) and **`tree_order`** (stable topological index) for laying out the tree |
| `Resource` | 5 | Asteroid resource types | `extraction_rate`, `refining_rate`, `color_rgba` |
| `Station` | 6 | Station archetypes | mostly names |
| `GameBlueprint` | 42 | Ship/station designs shipped with the game (+ AI stations, + player imports) | `modules` `{game_id: count}`, `part_count`, `cost_resources`, `cost_population`, `construction_time`, `required_research[]`, `sum_module_*` roll-ups, `weapon_modules[]`, `source` (shipped/player), `folder`, **`assembly`** (nested tree: `{index, module_id, name, position[3], rotation[4], connection, children[]}` from the root part — render the design), `assembly_depth`, `dps_total`, `dps_vs_class`, `energy_production`, `energy_use`, `mass_total`, `crew_total`, `cargo_capacity`, `module_classes` |
| `StatModifier` | 1249 | Long table of every stat modifier | `source_type` (research · unit_level · module), `source_id`, `context` (upgrade · level_N · perfect_attachment_bonus · power_on_modifiers), `stat`, `operation` (Add · Subtract · Multiply · Divide · Set), `value`, `abs` |
| `LootEntry` | 71 | Research loot tables (wreck drops) | `table`, `item_id` (research id; null = nothing), `item_name`, `weight`, `probability` |
| `Asteroid` | 17 | Asteroid archetypes (ENV.*) | resource yields, size, health |
| `UnitLevel` | 1080 | Veterancy, one row per unit × level × stat | `unit_id`, `level`, `experience_required`, `stat`, `operation`, `value` |
| `BlueprintPart` | 2788 | Every part placement in every `GameBlueprint` | `blueprint_id`, `index`, `module_id`, `module_name`, `position` `[x,y,z]`, `rotation` `[x,y,z,w]`, `parent_part`, `parent_connection` — enough to draw the design |
| `ResearchEdge` | 448 | Tech-tree edges | `from_id`, `to_id`, `kind` (child · requires) |
| `ModuleWeapon` / `UnitWeapon` | 41 / 36 | Armament join tables | `module_id`/`unit_id`, `turret_id`, `weapon_id`, `count` |
| `CombatTemplate` | 12 | **Stances / attack styles / orientations** (`kind` = Stance · Style · Orientation · Neutral) | `id` (`AT.STANCE_AGGRESSIVE`, `AT.STYLE_FLYBY`, …), `modifiers[] {stat, operation, value}` — e.g. Aggressive → AttackReactivity +16 %, FlyBy → WeaponRate +40 %, Armor +20 %, MaxSpeed… |
| `FormationModifier` | 8 | **Formation effects** | `id` (`FM.CLAW_FORMATION`, `FM.DELTA_FORMATION`, `FM.SPHERE_FORMATION`, `FM.WALL_FORMATION`, `FM.GROUPED_FORMATION`, `FM.FORMATION` = base bonus for being in any formation, `FM.STATION_TURBO_MODE`, `FM.FRIGATE_SLOWDOWN`), `modifiers[]` — e.g. Claw → WeaponDamage +10 %, WeaponRate +10 %; base Formation → Armor/HP/Regen +20 %, WeaponDamage +20 %, AttackRange +10 %, MaxSpeed −10 % … |
| `Faction` | 2 | Federation (CMX) / The Cosmo Kids (PIR) | `name`, `short_name`, `description`, `full` |
| `Ability` | 5 | Ship abilities (Improved Engines, Field Repair, Ion Ultimate, Sonar, Temporary Shield) | numeric fields per ability class, `modifiers[]` |
| `BuildCap` | 1 | Unit/module caps per class, single- vs multiplayer | `unit_class_cap_multiplayer {Corvette:100, Fighter:150 …}`, `module_class_cap_*`, global caps |
| `GameSetting` | 1 | Global tunables (`combat_zone_size`, `damage_by_mass`, `unit_damage_from_collisions`, drag, camera…) | flat numeric/string fields |
| `StatDefinition` | 47 | Every `StatModifier` stat with the **game's own display name** (`MaxSpeed`→"Speed", `MaxHealth`→"Health"…), `enum_value`, `higher_is_better`, `typically_percent`, `used_by {research, unit_level, module, attack_template, formation}`, `usage_count` | use for every modifier label: `useStatDefinitions().labels` + `fmtModifier(m, labels)` |
| `Effectiveness` | 845 | **Counters matrix**: weapon × target class (13 classes) | `weapon_id`, `target_class`, `multiplier` (1.0 when the game defines none; `explicit` flags real entries), `dps`, `hp_per_hit`, `armor_penetration`, `range` |
| **`Scenario`** | 24 | **Maps** (20 playable + 4 test; `playable` flag) | `name`, `short_name`, `description`, `description_statistics` (the game's own stat block: size, resources, nebula, enemy…), `teams[]`, counts (`asteroid_count`, `wreck_count`, `module_count`, `station_count`, `objective_count`, `unit_count`, `hazard_count`), `bbox {x_min,x_max,z_min,z_max}`, `size_x/size_z`, `resources_total {RU.MET: …}`, `resources_sum`, `asteroid_types {ENV.006: n}`, `enemy_modules {module_id: n}`, `enemy_module_count`, `enemy_hp_total`, `enemy_dps_total`, `enemy_cost_total`, `enemy_weapon_modules`, `has_spawner`, `objectives[]`, `game_version` |
| **`ScenarioEntity`** | 6596 | Every placed thing on every map — the **minimap** | `scenario_id`, `index`, `kind` (asteroid · wreck · module · station · objective · unit · hazard · other), `identifier` (→ Module/Unit/Asteroid/Objective id), `name`, `entity_class`, `team` (None/Team1/Team2/Rogue), **`x`,`y`,`z` world position** (modules resolved through their station: parent + local, rotation ignored ⇒ metres-accurate for stations, approximate inside a compound), `local_x/z`, `parent_index`, `resources {RU.MET: 60000}` on asteroids/wrecks, `spawner` |
| `ScenarioObjective` | 338 | objective ids per map | `scenario_id`, `objective_id`, `name`, `category`, `description` |
| `Objective` | 46 | Objective codex | `name`, `category` (Primary · Secondary · Challenge), `description`, `assigned/completed/failed_message`, `is_challenge`, `can_fail`, `lose_on_fail`, `time_to_complete_before_fail`, `resources_target`, `enemies_to_kill`, `resource_reward`, `game_hint` |
| `GameHint` | 12 | Tutorial hints | `name` (title), `text`, `pause_game`, `has_video`, `cooldown_time` |
| `GameEvent` | 63 | Every in-game event/notification | `id` (`EVT.<EventType>`), `name` (message), `event_type`, `event_category`, `priority`, `expire_time`, `cooldown`, `audio_only`, `show_notification` |
| `Remain` | 27 | Wreck types (WRK.*) | `name`, `info`, `max_health`, `life_span` (s), `base_signature_noise` — yields: `GameSetting.harvestable_remains_yield` |
| **`EnemySpawner` / `EnemyWave` / `EnemyUpgrade`** | 2 / 32 / 16 | **Wave tables** of the two enemy HQs (`SPAWN.PIR`, `SPAWN.CMX`) | wave: `index`, `name`, `time_to_spawn` (+`random_time_to_spawn`), `units {slot: {count, random_extra, unit_id}}`, `unit_total`, `unit_total_max`, `possible_formations[]`, `formation_stance`, `stations_to_spawn`, `difficulty_deltas {VeryEasy…Insane: {slot: ±n}}`, `trade_chance`, `trade_resources`, `replaces_wave` + `alternative_probability` for alternates; upgrade: `time_to_upgrade` → `research_ids[]` the AI receives; spawner: `initial_delay`, `mode`, `only_spawn_when_enemy_detected` |
| `ArenaTurn` | 9 | Battle-arena turns | `build_time_by_difficulty {VeryEasy…Insane}`, `reward_for_victory`, `max_combat_time`, `opponent_blueprints[]` (→ GameBlueprint ids `shipped:BattleArenaBlueprints/N_*`), `support_wave_units`, trade fields |
| **`AiPersonality`** | 5 | Passive · Defensive · Balanced · Aggressive · Rogue — every AI knob (~95 fields) | `starting_resource_bonus [min,max]`, `min_max_units_for_attack`, `default_attack_stance`, `priority_module_identifiers[]`, `priority_research_identifiers[]`, `stations_percent_before_attack`, `flyby/orbit/chase/frontal/lateral_probability`, `defensive/aggressive/hunter_probability`, `time_between_attacks`, `frigate_warp_attack_chance`, `fleet_type_requirements {UnitType: n}`, `secondary_stations_limits {Start…End: {maxSize,maxStations}}`, `min_units_for_command_center_attack {phase: n}`, `granted_researches`, `formation_type_probability`, build concurrency limits, `disabled_operations/goals` |
| `AiFact` / `AiGoal` / `AiOperation` | 86 / 15 / 42 | GOAP vocabulary | `name`, `category` (AgentCategory), `color`; operations: `value` (utility 0–100), `cost`, `construction_channel` |
| **`AiLogicGraph`** | 13 | The AI decision graphs, renderable | `name`, `faction`, `category`, `nodes[{guid, kind: fact·operation·goal·logic·linked_fact·timer_fact, identifier, name, x, y, enabled, logic_type}]`, `edges[{from, to, negated, kind: condition·operand}]`, `comments[]` (designer notes) — palette in `AiColorScheme.category_colors` |
| `MatchOption` | 56 | Every match-setup enum member | `setting` (game_mode · settings_preset · ai_personality · difficulty · game_speed · starting_resources · starting_ships · crew_module_cap · research_module_cap · eclipse_duration · wrecks_contain_research · map_resources · wreck_lifetime · attack_frequency), `option`, `value` |
| `ScoreWeight` | 20 | Score formula weights | `id` (TierWeight, ArmamentWeight, …), `weight` (+ team score multipliers) |
| `AttachmentRule` | 103 | Per module: what it needs/forbids when attached | `mount_size`, `is_command`, `link_range`, `perfect_attachment_requires`, `perfect_attachment_bonus[]`, `prohibited_attachments[]`, `provides_hardpoint`, `requires_hardpoint` |
| `LocalizedString` | 2448 | Every game string, **9 languages** | `key`, `namespace` (Module · Unit · Equip · Research · Map · ObjectiveData · GameHint · GameplayUI · …), `text_en`, `text_fr`, `text_de`, `text_it`, `text_es`, `text_pt`, `text_ru`, `text_zh`, `text_zh_tw` (only when different from English) |
| `DatasetBuild` | 1+ | One row per imported dataset build | `game_version`, `buildid`, `catalog_hash`, `generated_utc`, `previous_build`, `changes`, `row_counts{}` |
| `BuildChange` | 0+ | **Patch diff**: record-level changes between consecutive builds | `table`, `game_id`, `name`, `change` (added · removed · changed), `fields[]`, `before{}`, `after{}`, `from_build`, `to_build` — empty until the game updates and the pipeline is re-run |

**`full`** — every catalog entity (Module, Weapon, Turret, Subsystem, Unit, ResearchNode, Resource, Station, Asteroid) also carries a
`full` object: the **complete decoded game record** (e.g. 124 fields on a module: tumble/AI/attack/noise/cloak/shield/pool
settings, `cost`/`requirements`/`staticBonuses` Quantities, `radarDetection` bits, `attackPriority` ints, decoded Odin
dictionaries under `full.odin`). Enum-valued fields are raw ints there; the curated columns carry the names. Use it for
granular views and comparisons the curated columns don't cover.

All relation tables also have a synthetic `game_id` (e.g. `unit_id#level#stat`), so every entity upserts idempotently.

**Phase 0 additions (2026-08-17):** `Unit` now carries the decoded doctrine/flight model — `default_style`, `enabled_styles` (Flyby·Hold·Chase·Orbit), `default_orientation`, `enabled_orientations` (Frontal·Back·Lateral·Top·Bottom), `evade_actions[]`, `evade_on_attack_probability`, `switch_target_interval/probability`, `disengage_multiplier_by_class {EntityClass: ×}`, `hardpoints` (primary/secondary/tertiary from the game's own table), flyby/swing/banking/backflip/oversteer fields. `Turret` gains `cost_resources`, `cost_population`, `cost_energy`, `construction_time`, `required_research`, `additional_dps`. Module/Unit gain `shield_noise`, `activation_noise`, `electrical_integrity_regen`, `jammed_duration` (EMP), `structural_damage_multiplier`, `max_concurrent_healers`, `predictive_aim`, `leading_factor`, `aim_required`, `requirements{}`, `static_bonuses{}`. `GameSetting.score_calculation_weights` = the per-entity score formula weights (TierWeight, ArmamentWeight, …). `Ability.agent_category` decoded.

**Phase 1 additions:** `Weapon`, `Module`, `Unit`, `Turret` carry **`dps_vs_class {FighterUnit, CorvetteUnit, FrigateUnit, UtilityUnit, PlatformUnit, MineUnit, CommandModule, StructuralModule, WeaponModule, FacilityModule, UtilityModule, Station, Wreckage}`** (Σ weapon dps × class multiplier); `Weapon` also `hp_per_hit_vs_class`. **Doctrine profile** of a unit = `enabled_stances`/`default_stance`, `enabled_styles`/`default_style`, `enabled_orientations`/`default_orientation`, `attack_priority[]`, `evade_actions[]`, `evade_on_attack_probability`, `switch_target_interval`, `disengage_multiplier_by_class`, `attack_reactivity`, `attack_cooldown` — all flat columns now; join `CombatTemplate` for what each stance/style changes.

### Interpretation rules (please respect in the UI)
* **Armament:** `Module.weapons` / `Unit.weapons` already include the guns inside their turrets. Don't add `Turret.weapons` on top (double count).
* **Modifiers:** `Add 0.11` with `abs:false` on a rate/health/speed stat = **+11 %**; with `abs:true` it is a raw amount. `src/lib/gameData.js` → `fmtModifier(m)` renders this correctly.
* **Energy:** `energy_per_second` is consumption (show as −N/s); `energy_production` is generation.
* **Armor prose** in `description` ("light armor 95 % …") is designer flavor text — the numbers are `armor_penetration` and `class_damage_multipliers`.
* Display names can repeat where the game lacks a localization key (e.g. "Kinetic Turret" ×2) — key on `game_id`.
* Enums arrive as strings; flag enums as `A|B|C`.

---

## 2. Frontend helpers already in the repo
* `src/lib/gameData.js` — `useGameEntity(entity)`, `useGameCatalog()` (all catalogs + `byId` map), `useStatDefinitions()` (`labels` map), `fmtNum`, `countIds`, `fmtModifier(m, labels?)`.
* `src/lib/seedGameData.js` — `seedGameData(base44, {onProgress, deleteMissing})`, `loadIndex()`, and **`upsertEntityRows(base44, entity, rows, opts)`** (the single upsert routine — `/gamedata` uses it; `src/lib/gameFileImport.js` can call it instead of its own copy so the two import paths can't drift).
* Bundled data: `src/data/era-one/*.json` + `INDEX.json` (build stamp + row counts) — lazy chunks.

---

## 3. Backend functions (`base44/functions/*`) — all `POST` JSON, authenticated

**`importGameData`** (admin only) — `{ entity, records[], mode?: "upsert" | "replace" }` → `{ entity, created, updated, deleted }`.
Server-side alternative to the `/gamedata` page seeder.

**`fleetPlan`** — cost/roll-up for a set of parts. Request:
```json
{ "modules": [{ "game_id": "TUR.002", "count": 4 }], "units": [{ "game_id": "CMX_FRI3", "count": 2 }] }
```
Response:
```json
{ "totals": { "cost_resources", "cost_population", "construction_time", "max_health", "mass",
              "energy_production", "energy_use", "energy_net", "dps", "cargo_capacity",
              "extraction_rate", "resource_production", "part_count" },
  "lines": [ { "game_id", "name", "kind": "Module|Unit", "count", "cost_resources", "dps", "energy_net", ... } ],
  "required_research": [ { "game_id", "name", "tier", "cost_resources", "construction_time" } ],  // transitive closure, ordered buildable-first
  "unknown": ["ids that matched nothing"] }
```
DPS per module/unit = Σ over `weapons` of `Weapon.dps` (the game's own per-weapon dps).

**`researchPath`** — everything needed to reach one or more research nodes.
```json
{ "targets": ["R.U.FRS3"], "have": ["R.U.E1"] }
```
→ `{ "path": [ { game_id, name, research_type, tier, cost_resources, cost_energy, construction_time, depth } ],
     "totals": { cost_resources, cost_energy, construction_time, nodes }, "missing": [] }` — topologically ordered, excluding `have`.

**`gameDataStatus`** — `{}` → `{ game: {game_version, buildid, …}, entities: { Module: { expected, live, live_build, missing[], extra[], state } … }, ok }`.
`state` ∈ synced · partial · stale · empty · missing_entity. The expected counts and every expected `game_id` are
**embedded at generation time**, so this is the authoritative "is the data present and accounted for" check
(the `/gamedata` page has a *Verify server-side* button that calls it). GENERATED file — regenerate via era-one-data.

**`unitLoadout`** — configurable-ship fits. `{ unit_id, primary?, secondary?, tertiary?, enumerate? }` →
`{ unit, fixed {weapons, dps}, slots {primary|secondary|tertiary: {count, default, options[{game_id,name,kind,weapons,dps,dps_vs_class,range,cost_resources,required_research}]}},
   fit {choice, lines[], errors[], totals {dps, dps_vs_class, cost_resources (unit + turrets×slots), construction_time, max_health, armor, max_speed}, required_research[]},
   fits?[ {primary, secondary, dps, cost_resources, dps_vs_class} ] }` (enumerate = every primary×secondary combination, best dps first).

**`engagement`** — attacker vs defender with the modifier stack. `{ attacker: {game_id, primary?, secondary?, stance?, style?, formation?, level?}, defender: {game_id, stance?, formation?, level?} }` →
`{ attacker {…, weapons[], factors {weapon_damage, weapon_rate, attack_range}}, defender {…, max_health, armor, health_regen, factors}, per_weapon[{game_id, base_dps, class_multiplier, dps, range, armor_penetration, hp_per_hit}],
   result {dps, alpha, net_dps, time_to_kill_s, shots_to_kill, max_range, armor_model}, modifiers_applied {attacker, defender} }`.
Stances: `passive|reactive|defensive|aggressive|hunter`; styles: `flyby|hold|chase|orbit`; formations: `claw|delta|sphere|wall|grouped` (base `FM.FORMATION` bonus is added automatically); `level` 1–10 applies UnitLevel upgrades. Additive fractions stack per stat (`1 + Σadd`), then Multiply/Set. **Armor is reported, not applied** — the game's armor formula is not in the extracted data; present it alongside.

**`researchImpact`** — `{ targets: ["R.U.FRS3"], have?: [...], cumulative?: true }` → `{ path[{game_id, name, depth, cost…, modifiers[], affected_units[], affected_modules[], unlocks_*}], totals, cumulative_by_entity {CMX_FRI3: {MaxSpeed: 0.33, Power: 0.21}}, unlocked {modules, units, weapons, turrets}, missing }` — class/type filters resolved to concrete ids; cumulative sums Add/Subtract fractions along the chain.

**`economyModel`** — `{ modules:[{game_id,count}], units:[…], resource_id?: "RU.MET" }` → `{ resource, totals {extraction_ru_per_s, refining_ru_per_s, production_ru_per_s, gross_ru_per_s, ru_per_minute, cargo_capacity, minutes_to_fill_storage, payback_minutes, energy_*, crew, cost_resources}, lines[], settings {harvestable_remains_yield, …}, model }` — the model is stated in the response.

**`scoreEstimate`** — `{ game_ids:[…] }` → per entity `{ score (game's own), components {Weight: {value, weight}}, contributions }` — weight × observable, side by side with the actual score (the combination formula is not extracted).

**`blueprintStats`** — `{ modules:{id:count} | parts:[{module_id,count}] | blueprint_id }` → `{ totals {parts, cost_resources, cost_population, construction_time, max_health, mass, energy_production/use/net, dps, dps_vs_class, cargo_capacity, *_capacity_bonus, extraction_rate, resource_production}, by_class, by_type, weapons[], lines[], warnings[] (no/multiple command module, hardpoint shortfall, energy deficit), required_research[], research_totals }` — the real replacement for the grid builder's `computeStats`.

**`importStationFile`** — `{ file_base64, name?, create? }` (an ERA ONE `.station` file, e.g. from `Documents/My Games/Era One/Blueprints/`) → `{ name, era_one_version, parts[{index, guid, module_id, module_name, position, rotation, parent, connection}], modules{}, unresolved[], cost, construction_time, required_research, stats }`; `create:true` upserts it as `GameBlueprint` `player:<name>` (source `player`). Decodes the Sirenix Odin binary server-side; parts resolve via `Module.prefab_guid`.

All functions read the entities as service role; they need the data imported first (`/gamedata`).

---

## 4. Requests from the frontend to the backend
_(append here — one line each: what you need, where you'd use it)_

* ~~Fleet-formation / stance effects on weapon performance (spacing, focus-fire, engagement-range modifiers) — nothing in the current dataset exposes them; would feed `src/components/database/WeaponBreakdown.jsx`.~~
  **DONE (backend, 2026-08-17):** extracted from the game's `AttackTemplate` / `ModifiersTemplate` assets → entities **`CombatTemplate`** (5 stances, 4 styles, 2 orientations, neutral) and **`FormationModifier`** (5 formations + base formation bonus + station turbo + frigate slowdown), each with `modifiers[] {stat, operation, value, abs}` in the same shape as research modifiers (`fmtModifier` renders them). They are also flattened into `StatModifier` with `source_type` `attack_template` / `formation`. Weapon-relevant stats: `WeaponDamage`, `WeaponRate`, `AttackRange`, `AttackReactivity`, `AttackSwitchTargetInterval`, `Armor`, `MaxHealth`, `MaxSpeed`. Spacing/focus-fire are behaviours, not numbers — nothing numeric exists for them in the game data.
* —