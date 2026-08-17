# ERA ONE Commander — game-data backend contract

What the backend provides to the frontend, and how the two sides share this repo without stepping on
each other. Kept in `base44/` because it is the backend's statement of its own surface.

**Last updated 2026-08-17 (dataset: game 0.12.2, Steam build 24615926). Sync from era-one-data: `./sync-app.fish`.**

---

## 0. Who owns what (parallel work rules)

| Owner | Paths | Notes |
|---|---|---|
| **Backend** (Blae's Claude session, from `Code/era-one-data`) | `base44/entities/*.jsonc` (except `Blueprint`, `Component`, `Hull`, `User`), `base44/functions/**`, `src/data/era-one/**`, `src/lib/seedGameData.js`, `src/lib/gameData.js`, `base44/GAME-DATA-CONTRACT.md`, README "Game data" section | The entity files are **generated** — change them upstream in era-one-data, never by hand here. |
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
| `Module` | 103 | Every buildable station/ship part | `module_class` (Command · Structural · Weapon · Facility · Utility), `module_type`, `module_sub_type`, `weapon_category`, `tier`, `cost_resources`, `cost_population` (crew), `construction_time`, `max_health`, `armor`, `mass`, `energy_per_second` (consumption, +N means −N/s), `energy_production`, `cargo_capacity`, `extraction_rate`, `resource_production`, `*_capacity_bonus`, `visual_range`, `sensors_range`, `weapons` (**authoritative armament**, repeated id = count), `turrets`, `required_research`, `constructable_ships`, `spawned_unit`, `perfect_attachment_bonus[]`, `power_on_modifiers[]`, `mount_size`, `is_command`, `description`, `info` |
| `Unit` | 27 | Ships (player CMX_* and pirate PIR_*) | `unit_class` (Fighter · Corvette · Frigate · Utility · Platform · Mine), `unit_type`, `faction`, `tier`, cost/hp/armor/mass as above, `max_speed`, `turning_power`, `weapons` (fixed guns), `hardpoints` `{primary?, secondary?, tertiary?}` counts, `primary_equip`/`secondary_equip`/`tertiary_equip` (default fit) + `primary_equip_options`/`secondary_equip_options` (selectable fits — ids live in `Turret` ∪ `Weapon` ∪ `Subsystem`), `levels[]` (veterancy: `experience_required`, `stat_upgrades[]`), `required_research`, `production_facilities` |
| `Weapon` | 65 | Guns / launchers / mines | `dps`, `range`, `hp_change` (hull dmg/hit), `shield_change`, `armor_penetration` (0..1), `class_damage_multipliers[] {entity_class, multiplier}`, `rate_of_fire`, `burst_amount`, `burst_interval`, `requires_reload`, `reload_time`, `bullet_speed`, `deal_area_damage`, `area_radius`, `weapon_type` (Standard · Missile · EMP · Radiation · SelfDestruct · LongRangeTorpedo · NuclearBomb · SubWeapon, may be `A|B`), `implementation` (Projectile · Raycast · AreaOfEffect · SelfDestructSystem · MineLayer), `applied_status_on_hit`, `required_research` |
| `Turret` | 51 | Turret mounts (module or ship) | `weapons` (ids, repeat = count), `weapons_count`, `dps`, `horizontal_fov`/`vertical_fov` `[min,max]`, `horizontal_rotation_speed`, `time_between_volleys`, `is_fixed`, `attack_priority[]`, `weapons_source` (`prefab` or `shared_prefab:<id>` = inferred) |
| `Subsystem` | 4 | Fighter equipment slots (bomber/interceptor/scout defaults) | `name`, `dps` |
| `ResearchNode` | 131 | The tech tree | `research_type` (Upgrade · Technology · Tier · Ability), `tier`, `cost_resources`, `cost_energy`, `construction_time`, `required_nodes[]` (parents), `child_nodes[]`, `other_requirements[]` (module ids), `unlocks[]` (game's own list), **`unlocks_modules[]` / `unlocks_units[]` / `unlocks_weapons[]` / `unlocks_turrets[]`** (computed reverse links: everything whose `required_research` names this node), `modifiers[] {stat, operation, value, abs}`, `unit_class_affected`, `module_class_affected`, `module_types_affected[]` |
| `Resource` | 5 | Asteroid resource types | `extraction_rate`, `refining_rate`, `color_rgba` |
| `Station` | 6 | Station archetypes | mostly names |
| `GameBlueprint` | 42 | Ship/station designs shipped with the game (+ AI stations) | `modules` `{game_id: count}`, `part_count`, `cost_resources`, `cost_population`, `construction_time`, `required_research[]`, `sum_module_*` roll-ups, `weapon_modules[]`, `source` (shipped/player), `folder` |
| `StatModifier` | 1249 | Long table of every stat modifier | `source_type` (research · unit_level · module), `source_id`, `context` (upgrade · level_N · perfect_attachment_bonus · power_on_modifiers), `stat`, `operation` (Add · Subtract · Multiply · Divide · Set), `value`, `abs` |
| `LootEntry` | 71 | Research loot tables (wreck drops) | `table`, `item_id` (research id; null = nothing), `item_name`, `weight`, `probability` |

### Interpretation rules (please respect in the UI)
* **Armament:** `Module.weapons` / `Unit.weapons` already include the guns inside their turrets. Don't add `Turret.weapons` on top (double count).
* **Modifiers:** `Add 0.11` with `abs:false` on a rate/health/speed stat = **+11 %**; with `abs:true` it is a raw amount. `src/lib/gameData.js` → `fmtModifier(m)` renders this correctly.
* **Energy:** `energy_per_second` is consumption (show as −N/s); `energy_production` is generation.
* **Armor prose** in `description` ("light armor 95 % …") is designer flavor text — the numbers are `armor_penetration` and `class_damage_multipliers`.
* Display names can repeat where the game lacks a localization key (e.g. "Kinetic Turret" ×2) — key on `game_id`.
* Enums arrive as strings; flag enums as `A|B|C`.

---

## 2. Frontend helpers already in the repo
* `src/lib/gameData.js` — `useGameEntity(entity)`, `useGameCatalog()` (all catalogs + `byId` map), `fmtNum`, `countIds`, `fmtModifier`.
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

All functions read the entities as service role; they need the data imported first (`/gamedata`).

---

## 4. Requests from the frontend to the backend
_(append here — one line each: what you need, where you'd use it)_

* —
