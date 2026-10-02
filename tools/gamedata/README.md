# Game data sync (gamedata)

Checks the project data in `src/` against the AoE2:DE game data and applies changes: costs, train and
research times, gather rates, eco bonuses, new units and resources with their icons, and the civ tech
trees of the civ ranking.

## After a game patch

```shell
pip install -r tools/gamedata/requirements.txt   # once
npm run gamedata:extract                        
npm run gamedata:verify                         # optional, preview all changes
npm run gamedata:update                         # apply changes
git diff                                        # review
```

| Command   | Effect |
|-----------|--------|
| `extract` | reads the game and writes `snapshot.json` |
| `verify`  | compares the project with `snapshot.json`, changes nothing (exit code 1 on differences) |
| `patch`   | applies differences and new entries, creates missing icons |
| `update`  | `extract` + `patch` |

Options:

  - `--game <path>` (default: the Steam library with app 813780), 
  - `--stats` (also check combat stats, which the villager calculator does not use),
  - `--techtree` (check only the civ ranking tech trees, see below).

`snapshot.json` is checked in; its diff shows what a game patch changed.

## Data sources

Paths in the game installation:

- `resources/_common/dat/empires2_x2_p1.dat`: game data
- `resources/_common/dat/CivTechTrees/<CIV>.json`: tech tree per civ as shown in the game (availability, age).
- `resources/_common/dat/civilizations.json`: civ names.
- `resources/en/strings/key-value/key-value-strings-utf8.txt`: display names.
- `widgetui/textures/menu/techtree/normal`: tech tree frames.
- `widgetui/textures/ingame/units` (DDS): unit portraits. Their alpha channel masks the player color.
- `resources/_common/palettes/spritecolors.json`: player colors (icon generation).
- `widgetui/textures/menu/civs`: civ emblems.
- `widgetui/textures/ingame/icons`: resource symbols.
- `resources/_common/fonts/georgiab.ttf`: font for the unit names (icon generation)

## Code overview

| File | Purpose |
|------|---------|
| `gamedata.py` | command line, prints the findings |
| `extract.py` | reads the game files (`.dat` via [genieutils-py](https://github.com/SiegeEngineers/genieutils-py), tech trees, strings) into `snapshot.json` |
| `sync.py` | compares `src/` with the snapshot; each `check_*` method records findings, fixable ones carry an `apply` function that `patch` runs |
| `jsonedit.py` | edits the project JSON files in place, keeping their formatting |
| `icons.py` | creates webp icons from the game textures |
| `patch_icons.py` | optional: regenerates all existing unit icons so they share the style of `icons.py` |

`verify` and `patch` only read the snapshot and work without the game installed, except for creating icons.
To test a change to the tool, compare the `verify` output before and after; run `patch` on a copy of the repository.

## Rules

Details are in the docstrings of the `check_*` methods in `sync.py`.

- **Unit values** come from the Gaia copy of a unit; civ differences come from techs. Only `trainTime` and `cost` are checked without `--stats`.
- **Eco techs** in `data.json` "upgrades" are checked if they have `effects.gatherRate`; the calculator reads nothing else from them.
- **Villager gather rates** are compared with the work rate of the task units in `gatherers`.
- **unitVariety.json** is derived from every tech and bonus that changes train time or cost of a unit line:
  - techs go to `upgrades` under the tech name, team bonuses as "<Civ> Team Bonus", civ bonuses to `civs` as "<Civ> Civ Bonus" or "<Civ> - <Age> Age",
  - a group of keys with the same game source is replaced as a whole if it differs; values are compared by effect, not notation,
  - elite tiers with another time or cost than the tier before go to `upgrades` with `img`; `cost` is the difference to the base unit, because the calculator adds it,
  - units in `unitsShow.json` without an entry get one,
  - keys without a game source and bonuses that slow training are only reported.
- **Eco bonuses** come from the work rate multipliers of a civ's bonus techs and tech tree effect, and from `specialResources`. Factors below 1 are ignored. Values are compared only for bonuses from a single tech without prerequisites; removed bonuses are only reported. The `team` section is not checked.
- **Resources** in `order.json` are checked against `gatherers` in both directions, so a new resource cannot silently miss its civ bonuses.
- **New units** get a `data.json` entry with their upgrades, a `unitVariety.json` entry, an icon and a place in the `unitsShow.json` group with the most units from the same building.
- **Renamed units** listed in `renames` get the game name everywhere in `src/`, including their upgrades and icons.
- **Civ tech trees** (`data.json` "civilizations" → "techTree", used by the civ ranking) follow the in-game tech tree. Only `--techtree` checks them, see below.
- Editorial data (civ ratings, tech tree pages, bonus texts) is not touched.

## Civ ranking tech trees

The civ ranking rates each civ by its tech tree. The ratings ("ranks", "ranksUnique" in `data.json`) are
editorial, so the tech trees are updated separately, by whoever reviews the ratings afterwards:

```shell
npm run techtree:verify                         # optional, preview
npm run techtree:update                         # extract + patch the tech trees, write TODO_RANKINGS.txt
```

`techtree:update` writes `TODO_RANKINGS.txt` to the repository root (git-ignored, overwritten by every update)
before it patches, and opens it. It lists the tech tree changes, what to update by hand, and per civ the changes
that touch its ratings, a building it is rated in or its bonuses ("Rankings to review"; changes most civs share by
`genericShare` are listed once). `techtree:verify` only prints the same list, so the file stays until the next update.

```
Britons:
  - gained mounted crossbowman
  - lost cavalry archer
Chinese:
  - cost increase: fire lancer - 35f 40g -> 45w 45g
Malians:
  - effect change: malians civ bonus - Gold Miners (resource 276) 15 -> 10
```

Effect and cost changes are compared with `techtree-baseline.json` (checked in), which `techtree:update` writes
after patching: they show what changed since the last tech tree update, no matter when `gamedata:update` ran.
Without the file, e.g. on the first run, they are missing. Only economic effects are compared (work rate, carry
capacity, cost, train time and the engine resources of `specialResources`), as the snapshot holds no other
effects; changes of combat stats (hp, attack, armor, range, speed) do not show up.

- `available` is fixed per entry; the finding lists the civs that gained (+) or lost (-) it.
- Techs researched in another building now are moved there, also in "upgradeBuilding".
- Units and techs of a tech tree building no entry stands for are added to every civ with that building.
- Names in `removedTechs` leave "relevantUpgrades" and "upgradeBuilding". They leave the tech trees only once
  neither `civ-ranking.js` nor "ranksUnique" names them, since the page fails on names missing in a tech tree;
  until then they become unavailable. Other mentions in `src/` are only reported.
- Techs in `techRenames` get the game name everywhere in `src/`; their icon files are renamed, since there is no
  generator for tech icons. If the game gave the tech a new effect too, replace the icon by hand.
- Civs missing in the project are only reported.

## config.json

Holds what neither the game data nor the project contains: name mappings, exceptions and the meaning of
engine values. It only changes when `verify` points to it. Game IDs are in `snapshot.json`; for units with
several copies use the ID with a `civs` list.

| Key | Purpose |
|-----|---------|
| `units` | project name → unit ID, if the name is ambiguous or differs from the game |
| `renames` | old project name → unit ID of a unit renamed in the game; can be removed after `patch` |
| `unitCivs` | unit ID → civs that can train it, for units no tech tree shows (Xolotl Warrior: trained in a converted Stable) |
| `upgrades` | project name → tech ID, if a tech cannot be found by name |
| `techRenames` | old project name → tech ID of a tech renamed in the game; can be removed after `techtree:update` |
| `removedTechs` | project names of techs removed from the game; can be removed once nothing mentions them |
| `ignoreFields` | fields not compared for a unit, because they mean something else there |
| `skipNewUnits` | unit IDs never adopted as new units (heroes, campaign units) |
| `ignoreTechs` | tech IDs that affect another building than the calculator shows; list all techs of a bonus |
| `manualVariety` | unit → `unitVariety` keys maintained by hand |
| `gatherers` | villager task unit IDs (male, female) → project resources using their work rate |
| `notGatherers` | unit IDs with a work rate that do not gather |
| `effectiveGatherRates` | resources stored as effective rates including walking; not compared with the work rate |
| `otherResources` | resources in `order.json` no villager gathers |
| `specialResources` | engine resource ID → meaning, see below |
| `knownResources` | engine resource IDs that do not affect gathering |
| `manualEcoBonuses` | `ecoBonuses.json` keys maintained by hand |
| `genericShare` | share of civs above which a new unit is *generic* instead of *regional* |

After changing `units` or `upgrades`, run `update`: the mappings also decide what `extract` writes.

### Notes from `verify`

| Note | Action |
|------|--------|
| `units/<name>: no matching unit` (also `unitVariety.json <unit>`) | add the ID to `renames` if renamed, else to `units` |
| `units/<name>: ambiguous` | pin the right ID in `units` |
| `upgrades/<name>: not in any tech tree` | map it in `upgrades` or remove the effect |
| `unknown gatherer in the game` | add it to `gatherers` or `notGatherers` |
| field differs that means something else | add it to `ignoreFields` |
| unwanted new unit | add its ID to `skipNewUnits` |
| `slows training down` | if it applies to another building, add the tech IDs to `ignoreTechs` |
| `no game source found` | rename the key to the tech name, or add it to `manualVariety` |
| `no gather bonus found in the game` | remove the entry, or add it to `manualEcoBonuses` |
| `no such bonus anymore` (derived resource) | remove it from `derivedGatherRates.json` and `order.json`, or fix `specialResources` |
| `not assigned to a villager task` | add it to its task in `gatherers`, or to `otherResources` |
| `not in order.json` | update `gatherers` or `otherResources` |
| `unknown engine resource` | add it to `specialResources` if it affects gathering, else to `knownResources` |
| `techTree <building>/<name>: not found in the game` | map it in `units` or `upgrades` if renamed, else add it to `removedTechs` |
| `techTree <name>: called "..." in the game` | nothing; rename the entry and its icon by hand if wanted |
| `removed tech "<name>": still mentioned in ...` | update these places by hand, then remove the name from `removedTechs` |

### Special resources

Most eco bonuses make villagers work faster, which the tool reads from the game data. Some bonuses
work differently: the game stores them as a number on an engine "resource" (e.g. Malians: resource 276
= 10), and only the game executable knows what that number does. `specialResources` tells the tool.

When `verify` reports an unknown engine resource, look at the listed tech in `snapshot.json`. Its effect
`[1, <resource ID>, <mode>, -1, <value>]` holds the value; `value / 100` is the share. Test the effect in
the game once, then add one of two kinds:

**`ecoBonus`**: villagers of some tasks gather faster. Written to `ecoBonuses.json`.

```json
"276": {"kind": "ecoBonus", "label": "Gold Miners", "gatherers": ["gold miner", "oyster gatherer"]}
```

`gatherers` names keys of `gatherers`. Alternatively `"res": "food", "except": [...]` applies the bonus
to all food resources except the listed ones.

**`derived`**: gathering one resource also yields another one (Poles get gold when mining stone). Each
pair becomes a new resource in `derivedGatherRates.json` and `order.json`, with an icon.

```json
"241": {"kind": "derived", "res": "gold", "resources": {"gold from stone": "stone miner"}}
```

`resources` maps the new resource to the resource it comes from. If the game uses a different share for
one source, write `{"from": "<source>", "scale": <factor>, "note": "<how it was tested>"}` instead of the name.

`verify` does not notice when a game patch gives a known resource ID a new meaning.
