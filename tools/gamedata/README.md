# Game data sync (gamedata)

Checks the project data against the real AoE2:DE game data and applies changes:
costs, training and research times, gather rates, eco bonuses, new units, new
resources and their icons (webp).

## After a game patch

```shell
pip install -r tools/gamedata/requirements.txt   # once
python tools/gamedata/gamedata.py update          # or: npm run gamedata:update
git diff                                          # review the changes
```

| Command   | Effect |
|-----------|--------|
| `extract` | reads the game and writes `snapshot.json` |
| `verify`  | compares the project with `snapshot.json`, changes nothing (exit code 1 on differences) |
| `patch`   | fixes differences, adds new things, creates missing icons |
| `update`  | `extract` + `patch` |

Options: `--game <path>` (default: the Steam library in which app 813780 is installed),
`--stats` (additionally check combat stats such as hp, attack and armor, which the villager calculator does not need).

`snapshot.json` is checked in. Its diff shows what a game patch changed.

## Data sources

- `resources/_common/dat/empires2_x2_p1.dat` holds the game data and is read with [genieutils-py](https://github.com/SiegeEngineers/genieutils-py).
- `resources/_common/dat/futuravailableunits.json`: tech tree per civ (availability, age).
- `resources/_common/dat/civilizations.json`: civ names.
- `resources/en/strings/key-value/key-value-strings-utf8.txt`: display names.
- `widgetui/textures/menu/techtree/normal`: tech tree frames.
- `resources/_common/wpfg/resources/uniticons` (PNG) and `widgetui/textures/ingame/units` (DDS): unit portraits.
- `widgetui/textures/menu/civs`: civ emblems.
- `widgetui/textures/ingame/icons`: resource symbols.
- `resources/_common/fonts/georgiab.ttf`: font for the unit names.

## Rules

- **Values** come from the Gaia copy of a unit. All civ copies are identical; civ differences arise via techs.
- **Upgrades** in `data.json` are only checked if they have `effects.gatherRate` (eco techs such as Double-Bit Axe or Gold Mining). The villager calculator reads nothing else from them.
- **Unit upgrades of new units** are named like the target unit ("war galley", "fire ship"). Cost and time come from the researchable tech behind them, even if it affects several lines ("Medium Warships", "Heavy Warships").
- **Category** of new units (frame color, placement in `unitsShow.json`):
  - *unique* if unlocked via a civ-specific tech or available to only one civ,
  - *generic* for more than 80 % of the civs (`genericShare`),
  - *regional* otherwise.
- **unitVariety** of new units: elite tiers with a different time or cost (with `img`) plus all percentage techs the project already knows (Conscription, Kasbah, Perfusion, Shipwright ...), provided they affect the unit.
- **Eco bonuses** of new civs are detected from gather rate multipliers. Factors below 1 are ignored: they make a resource last longer (Goths hunt, Tatars sheep) and do not change the gather rate.
  Engine resources with special meaning are listed in `config.json` under `specialResources`:
  - 241 = gold from stone (Poles),
  - 267 = wood from berries (Portuguese),
  - 298 = gold from food (Varangians),
  - 299 = food bonus on drop-off (Danes).
- **Derived resources** (a share of a gathered resource as another resource) live in `src/data/derivedGatherRates.json`. `src/_data/gatherRates.js` computes them from the source rate, new ones are also added to `order.json` with an icon.
- **Renamed units** get the game name everywhere in `src/` (also their upgrades, e.g. "elite longboat" →
  "elite longship"), and their icons are recreated under the new name. See `renames` below.
- Editorial data (civ rankings, tech tree pages, civ bonus texts) is left untouched; missing civs are only reported.

## Code overview

| File | Purpose |
|------|---------|
| `gamedata.py` | command line entry point, prints the findings |
| `extract.py` | reads the game files and writes `snapshot.json`; the only module that touches the game installation besides `icons.py` |
| `sync.py` | compares `src/` with `snapshot.json`; each `check_*` method records findings, fixable ones carry an `apply` function that `patch` runs |
| `jsonedit.py` | edits the project JSON files in place so their hand formatting and the git diff stay small |
| `icons.py` | creates the webp icons for new units and resources from the game textures |

`verify` and `patch` only read `snapshot.json`, so they work without the game installed (except for
creating icons). To test a change to the tool, run `verify` before and after it and compare the output;
for changes to `patch`, run it on a copy of the repository.

## config.json

`config.json` holds everything the tool cannot derive from the game data by itself: name mappings,
exceptions and the meaning of special engine values. It only needs to change when `verify` reports
a note that points to it, or when a patch introduces a new kind of mechanic.

Game IDs can be looked up in `snapshot.json` (search for the English name; `units` and `techs`
are keyed by ID). Units that exist in several copies (Gaia, per civ, hero) have several IDs; use the
one with a `civs` list.

| Key | Purpose |
|-----|---------|
| `units` | project name → unit ID, if the name in `data.json` is ambiguous or differs from the game name |
| `renames` | old project name → unit ID, for units that were renamed in the game; `patch` renames them in the project, afterwards the entry can be removed |
| `upgrades` | project name → tech ID, if an eco tech in `data.json` cannot be found by its name |
| `ignoreFields` | fields that are not compared for a unit (e.g. monks: `rateOfFire` is the conversion time there) |
| `skipNewUnits` | unit IDs that are never adopted as new units (heroes, campaign units) |
| `gatherers` | villager task units in the game (male and female ID) → resources in the project that use their work rate |
| `notGatherers` | unit IDs with a work rate that are not gatherers (repairers), so they are not reported as unknown |
| `effectiveGatherRates` | resources the project tracks as effective rates including walking time (farms, pastures); they are not compared with the pure work rate |
| `specialResources` | engine resource ID → meaning, for civ bonuses that are not a gather rate multiplier (see below) |
| `unitsShowCategories` | building ID → group index in `src/data/unitsShow.json` where new units trained there are listed |
| `uniqueCategory` | group index in `unitsShow.json` for unique units |
| `genericShare` | share of civs above which a new unit counts as *generic* instead of *regional* |

### Handling notes from `verify`

| Note | What to do |
|------|------------|
| `units/<name>: no matching unit found in the game` | If the unit was renamed in the game, add `"<name>": <ID>` to `renames`, otherwise to `units`. |
| `units/<name>: ambiguous [...]` | Check the IDs in `snapshot.json` and pin the right one in `units`. |
| `upgrades/<name>: not in any tech tree of the game` | The eco tech was renamed or removed. Map it in `upgrades` or remove the effect from `data.json`. |
| `config.json gatherers: unknown gatherer in the game` | New villager task. Add it to `gatherers` with the resources that should use its rate, or to `notGatherers`. |
| difference in a field that means something else for a unit | Add the field to `ignoreFields` for that unit. |
| new unit that should not appear in the calculator | Add its ID to `skipNewUnits`. |

After changing `config.json`, run `verify` again. Mappings in `units` and `upgrades` also decide what
`extract` writes to `snapshot.json`, so run `update` (or `extract`) if a mapping points to an ID that is
not yet in the snapshot.

### Special resources

Some civ bonuses are stored as engine resources instead of work rate multipliers. `verify` does not detect
new ones by itself; they show up as a civ bonus that is missing in the calculator. To add one, find the
resource ID in the civ's bonus tech in `snapshot.json` (`effects` entries of type 1:
`[1, resource, mode, -1, value]`) and add an entry:

- `"kind": "derived"`: a share of a gathered resource is also credited as another resource (Poles: gold from stone). `res` is the credited resource, `resources` maps the new project resource to its source resource. The share is `value / 100`. If the game applies a different share to a single source, write it as `{"from": "<source>", "scale": <factor>, "note": "<how it was tested>"}` instead of the plain source name (Varangians: fish traps only get half of the 10 %). New entries are written to `src/data/derivedGatherRates.json` and `order.json` and get an icon.
- `"kind": "ecoBonus"`: a percentage bonus on the listed project resources, written to `ecoBonuses.json` with `label` as the bonus name.

Verify the share in the game once. The `.dat` only holds the value; which sources it applies to and
how is decided by the game executable and is not documented in the game files. The civ descriptions do
not give percentages either.
