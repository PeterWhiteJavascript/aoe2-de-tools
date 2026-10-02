"""Read the installed game and condense everything the sync needs into snapshot.json.

The snapshot is keyed by game IDs:
- units: every unit in a civ tech tree, everything those units upgrade to, all villager task
  units and the units pinned in config.json. Values come from the Gaia copy (see README).
- techs: every tech in a tech tree, the techs that enable or upgrade those units, civ bonus
  techs and the techs pinned in config.json.
- civs: per civ its bonus techs and team bonus.

Tech effects are stored as [type, a, b, c, d], the raw effect command of the .dat file:
- attribute effects: a = unit ID (-1: all units of class b), c = attribute, d = value
- resource effects: a = engine resource ID, b = mode (0: set, 1: add), d = value
Only the effects listed in RELEVANT_EFFECT_TYPES / RELEVANT_ATTRIBUTES are kept.
"""
import json
import os
import re
import winreg
from pathlib import Path

from genieutils.datfile import DatFile

from jsonedit import render

STEAM_APP_ID = '813780'
DAT_FILE = Path('resources', '_common', 'dat', 'empires2_x2_p1.dat')
COST_RESOURCES = {0: 'food', 1: 'wood', 2: 'stone', 3: 'gold'}  # engine resource ID -> name

# Effect command types
EFFECT_ENABLE_UNIT = 2   # b = 1 enables unit a, b = 0 disables it
EFFECT_UPGRADE_UNIT = 3  # turns unit a into unit b
EFFECT_TEAM_TECH = 18    # applies tech a to the whole team (Wu houses, Italians Condottiero)
ATTRIBUTE_EFFECT_TYPES = {0, 4, 5, 10, 14, 15}  # set / add / multiply, 10+ are the team bonus variants
RESOURCE_EFFECT_TYPES = {1, 6, 11, 16}          # modify / multiply, 10+ are the team bonus variants

# 13 work rate, 14 carry capacity, 100 all costs, 101 train time, 103-106 food/wood/stone/gold cost
RELEVANT_ATTRIBUTES = {13, 14, 100, 101, 103, 104, 105, 106}
UNIT_CLASS_CIVILIAN = 4  # villagers and their task units

AGE_TECHS = {101: 2, 102: 3, 103: 4}  # Feudal, Castle and Imperial Age tech -> age number
# civilizations.json "era" of the regular civs; Chronicles civs have their own era and are skipped
CIV_ERA = 'base'
CIV_GAIA = 'Gaia'
# Internal civ name -> name used in the project and in the game UI
CIV_RENAMES = {'Indians': 'Hindustanis'}


def find_game(explicit=None):
    """Return the AoE2:DE installation folder: --game, AOE2DE_PATH or the Steam library that has the game."""
    candidates = [explicit, os.environ.get('AOE2DE_PATH')]
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Software\Valve\Steam') as key:
            steam = Path(winreg.QueryValueEx(key, 'SteamPath')[0])
        library_folders = (steam / 'steamapps' / 'libraryfolders.vdf').read_text(encoding='utf-8')
        # One block per library: "path" plus the IDs of the apps installed there
        for block in re.split(r'\n\t"\d+"\n', library_folders)[1:]:
            path = re.search(r'"path"\s+"([^"]+)"', block)
            if path and re.search(rf'"{STEAM_APP_ID}"', block):
                library = Path(path.group(1).replace('\\\\', '\\'))
                candidates.append(str(library / 'steamapps' / 'common' / 'AoE2DE'))
    except OSError:
        pass
    for candidate in candidates:
        if candidate and (Path(candidate) / DAT_FILE).exists():
            return Path(candidate)
    raise SystemExit('AoE2:DE not found. Specify the path with --game or AOE2DE_PATH.')


def read_build_id(game):
    """Steam build ID of the installation, stored in the snapshot to tell which game version it describes."""
    manifest = game.parent.parent / f'appmanifest_{STEAM_APP_ID}.acf'
    if manifest.exists():
        match = re.search(r'"buildid"\s+"(\d+)"', manifest.read_text(encoding='utf-8'))
        if match:
            return int(match.group(1))
    return None


def read_strings(game):
    """English display names: string ID -> text."""
    strings = {}
    path = game / 'resources' / 'en' / 'strings' / 'key-value' / 'key-value-strings-utf8.txt'
    for line in path.read_text(encoding='utf-8').splitlines():
        match = re.match(r'^(\d+)\s+"(.*)"', line)
        if match:
            strings[int(match.group(1))] = match.group(2)
    return strings


def clean_number(x, digits=4):
    """Round away float noise from the .dat file and turn whole numbers into ints."""
    x = round(float(x), digits)
    return int(x) if x == int(x) else x


def most_common_age(ages):
    """The age most civs get a unit in; on a tie the earlier age."""
    return max(set(ages), key=lambda age: (ages.count(age), -age))


def tech_age(techs, tech_id, seen=()):
    """Age a tech requires, derived from the age techs in its chain of required techs."""
    if tech_id in AGE_TECHS:
        return AGE_TECHS[tech_id]
    if not 0 <= tech_id < len(techs) or tech_id in seen:
        return 1
    required = [r for r in techs[tech_id].required_techs if r >= 0]
    return max([1] + [tech_age(techs, r, seen + (tech_id,)) for r in required])


def is_relevant(command):
    return ((command.type in ATTRIBUTE_EFFECT_TYPES and command.c in RELEVANT_ATTRIBUTES)
            or command.type in RESOURCE_EFFECT_TYPES)


def relevant_effects(dat, effect_id):
    if effect_id < 0:
        return []
    return [[c.type, c.a, c.b, c.c, clean_number(c.d)] for c in dat.effects[effect_id].effect_commands
            if is_relevant(c)]


def team_techs(dat, effect_ids):
    """Techs the effects apply to the whole team."""
    return sorted({int(c.a) for effect_id in effect_ids if effect_id >= 0
                   for c in dat.effects[effect_id].effect_commands if c.type == EFFECT_TEAM_TECH})


def costs(resource_costs):
    # The .dat has fixed cost slots; a slot is in use if it has an amount or its "paid" flag is set
    return {COST_RESOURCES[r.type]: r.amount for r in resource_costs
            if r.type in COST_RESOURCES and (r.amount > 0 or r.flag)}


def unit_stats(unit, gaia_units):
    stats = {
        'internalName': unit.name,
        'type': unit.type,
        'class': unit.class_,
        'icon': unit.icon_id,
        'hp': unit.hit_points,
        'lineOfSight': clean_number(unit.line_of_sight),
        'garrison': unit.garrison_capacity,
        'resourceCapacity': unit.resource_capacity,
    }
    if unit.speed is not None:
        stats['speed'] = clean_number(unit.speed)
    if unit.bird:  # genieutils' name for the section with task data
        stats['workRate'] = clean_number(unit.bird.work_rate)
    combat = unit.type_50
    if combat:
        attacks, armours = {}, {}
        # The engine sums up duplicate attack classes (Huskarl)
        for attack in combat.attacks:
            attacks[attack.class_] = attacks.get(attack.class_, 0) + attack.amount
        for armour in combat.armours:
            armours.setdefault(armour.class_, armour.amount)
        stats.update(
            attacks=sorted([cls, amount] for cls, amount in attacks.items()),
            armours=sorted([cls, amount] for cls, amount in armours.items()),
            range=clean_number(combat.displayed_range if combat.displayed_range > 0 else combat.max_range),
            minimumRange=clean_number(combat.min_range),
            rateOfFire=clean_number(combat.reload_time),
            accuracy=clean_number(combat.accuracy_percent / 100),
            blastRadius=clean_number(combat.blast_width),
        )
        projectile_id = combat.projectile_unit_id
        if projectile_id >= 0 and gaia_units[projectile_id] and gaia_units[projectile_id].speed:
            stats['projSpeed'] = clean_number(gaia_units[projectile_id].speed)
    creatable = unit.creatable
    if creatable:
        stats['cost'] = costs(creatable.resource_costs)
        locations = [location for location in creatable.train_locations if location.unit_id >= 0]
        stats['trainLocations'] = [{'location': location.unit_id, 'time': location.train_time}
                                   for location in locations]
        times = [location.train_time for location in creatable.train_locations if location.train_time > 0]
        if times:
            stats['trainTime'] = times[0]
    return stats


def read_tech_trees(common, civs):
    """Which civs have which unit and tech, and the age each unit becomes available in.

    Reads CivTechTrees/, the data of the in-game tech tree screen. futuravailableunits.json is not
    used: it also lists units and techs a civ's tech tree effect disables (Vikings Thumb Ring).
    Nodes are buildings, units or techs; a unit upgrade node (Crossbowman) is the unit, its
    "Trigger Tech ID" the tech that researches it.
    """
    unit_civs, unit_ages, tech_civs = {}, {}, {}
    for info in civs:
        tree = json.loads((common / 'CivTechTrees' / f'{info["tech_tree_name"]}.json').read_text(encoding='utf-8'))
        civ = CIV_RENAMES.get(info['internal_name'], info['internal_name'])
        for node in tree['civ_techs_buildings'] + tree['civ_techs_units']:
            if node['Node Status'] == 'NotAvailable':
                continue
            if node['Use Type'] == 'Tech':
                tech_civs.setdefault(node['Node ID'], set()).add(civ)
                continue
            unit_civs.setdefault(node['Node ID'], set()).add(civ)
            if 'Age ID' in node:
                unit_ages.setdefault(node['Node ID'], []).append(node['Age ID'])
            if node.get('Trigger Tech ID', -1) >= 0:
                tech_civs.setdefault(node['Trigger Tech ID'], set()).add(civ)
    unit_age = {unit_id: most_common_age(ages) for unit_id, ages in unit_ages.items()}
    return unit_civs, unit_age, tech_civs


def read_unit_techs(dat):
    """unit ID -> techs that enable it, and unit ID -> [[target unit ID, tech ID], ...] it upgrades to."""
    enabled_by, upgrades = {}, {}
    for tech_id, tech in enumerate(dat.techs):
        if tech.effect_id < 0:
            continue
        for command in dat.effects[tech.effect_id].effect_commands:
            if command.type == EFFECT_ENABLE_UNIT and command.b != 0:
                enabled_by.setdefault(command.a, set()).add(tech_id)
            elif command.type == EFFECT_UPGRADE_UNIT:
                upgrades.setdefault(command.a, []).append([command.b, tech_id])
    return enabled_by, upgrades


def tech_entry(dat, strings, tech_id, tech_civs):
    tech = dat.techs[tech_id]
    locations = [{'location': location.location_id, 'time': location.research_time}
                 for location in tech.research_locations if location.location_id >= 0]
    entry = {
        'name': strings.get(tech.language_dll_name, tech.name) if tech.language_dll_name > 0 else tech.name,
        'internalName': tech.name,
        'civ': tech.civ,
        'cost': costs(tech.resource_costs),
        'requiredTechs': [r for r in tech.required_techs if r >= 0],
        'locations': locations,
        'effects': relevant_effects(dat, tech.effect_id),
    }
    if locations:
        entry['time'] = locations[0]['time']
    entry['ageReq'] = tech_age(dat.techs, tech_id)
    if tech_id in tech_civs:
        entry['civs'] = sorted(tech_civs[tech_id])
    return entry


def extract(game, extra_units=(), extra_techs=()):
    """Build the snapshot. extra_units/extra_techs are IDs pinned in config.json (None entries are ignored)."""
    game = Path(game)
    dat_path = game / DAT_FILE
    print(f'Reading {dat_path} ...')
    dat = DatFile.parse(str(dat_path))
    strings = read_strings(game)
    common = dat_path.parent
    civ_list = json.loads((common / 'civilizations.json').read_text(encoding='utf-8'))['civilization_list']
    # civilizations.json lists the civs in the same order as the .dat file
    civ_index = {civ['internal_name']: i for i, civ in enumerate(civ_list)
                 if civ.get('era') == CIV_ERA and civ['internal_name'] != CIV_GAIA}
    gaia_units = dat.civs[0].units

    unit_civs, unit_age, tech_civs = read_tech_trees(common, [civ_list[i] for i in civ_index.values()])
    enabled_by, upgrades = read_unit_techs(dat)

    # Follow the upgrades to get units the tech trees do not show (packed/unpacked variants etc.)
    unit_ids = set(unit_civs) | {i for i in extra_units if i is not None}
    todo = list(unit_ids)
    while todo:
        for target, _ in upgrades.get(todo.pop(), []):
            if target not in unit_ids and 0 <= target < len(gaia_units) and gaia_units[target]:
                unit_ids.add(target)
                todo.append(target)
    unit_ids |= {unit.id for unit in gaia_units if unit and unit.class_ == UNIT_CLASS_CIVILIAN}

    units = {}
    for unit_id in sorted(unit_ids):
        unit = gaia_units[unit_id]
        if not unit:
            continue
        entry = {'name': strings.get(unit.language_dll_name, unit.name)}
        entry.update(unit_stats(unit, gaia_units))
        if unit_id in unit_civs:
            entry['civs'] = sorted(unit_civs[unit_id])
        if unit_id in unit_age:
            entry['ageReq'] = unit_age[unit_id]
        elif unit_id in enabled_by:
            # Units no tech tree shows (Xolotl Warrior) get the age of the tech that enables them
            entry['ageReq'] = min(tech_age(dat.techs, t) for t in enabled_by[unit_id])
        if unit_id in enabled_by:
            entry['enabledBy'] = sorted(enabled_by[unit_id])
        if unit_id in upgrades:
            entry['upgradesTo'] = sorted(upgrades[unit_id])
        units[str(unit_id)] = entry

    tech_ids = set(tech_civs) | {i for i in extra_techs if i is not None}
    for entry in units.values():
        tech_ids.update(entry.get('enabledBy', []))
        tech_ids.update(tech_id for _, tech_id in entry.get('upgradesTo', []))

    civs = {}
    for internal_name, i in civ_index.items():
        # Civ bonuses are civ-specific techs that cannot be researched anywhere; the game applies them at start
        bonus_techs = [tech_id for tech_id, tech in enumerate(dat.techs)
                       if tech.civ == i and tech.effect_id >= 0
                       and not any(location.location_id >= 0 for location in tech.research_locations)]
        tech_ids.update(bonus_techs)
        team_tech_ids = team_techs(dat, [dat.civs[i].tech_tree_id, dat.civs[i].team_bonus_id])
        civ = civ_list[i]
        civs[CIV_RENAMES.get(internal_name, internal_name)] = {
            'id': i,
            'internalName': internal_name,
            'uniqueUnits': [unit_id for unit_id in (civ.get('unique_unit_id'), civ.get('elite_unique_unit_id'))
                            if unit_id is not None],
            'bonusTechs': bonus_techs,
            # The tech tree effect also holds bonuses that apply from the start (Aztecs military
            # production, Spanish builders)
            'techTreeBonus': relevant_effects(dat, dat.civs[i].tech_tree_id),
            # Techs the civ gives its whole team: bonuses (Wu houses) or units (Italians Condottiero)
            'teamTechs': team_tech_ids,
            'teamBonus': relevant_effects(dat, dat.civs[i].team_bonus_id)
            + [e for t in team_tech_ids for e in relevant_effects(dat, dat.techs[t].effect_id)],
        }

    techs = {str(tech_id): tech_entry(dat, strings, tech_id, tech_civs)
             for tech_id in sorted(tech_ids) if 0 <= tech_id < len(dat.techs)}

    return {
        'meta': {'datVersion': dat.version, 'buildId': read_build_id(game), 'civCount': len(civs)},
        'civs': civs,
        'units': units,
        'techs': techs,
    }


def write_snapshot(snapshot, path):
    Path(path).write_text(render(snapshot, indent='  ', sort_keys=True) + '\n', encoding='utf-8')
