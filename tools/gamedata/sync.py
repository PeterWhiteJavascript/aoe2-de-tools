"""Compare the project data in src/ with snapshot.json and patch it.

Sync.run() calls the check_* methods. Each one compares one part of the project with the
snapshot and records Findings; findings that can be fixed automatically carry an `apply`
function. Sync.apply() runs these functions and saves the changed files. The files are edited
with jsonedit, so their hand formatting survives.

Everything the game data cannot tell (name mappings, exceptions, meaning of special engine
values) comes from config.json, see README.md.
"""
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional

from jsonedit import Doc

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'src'
IMG = SRC / 'img'

COST_RESOURCES = ('food', 'wood', 'gold', 'stone')
FLOAT_TOLERANCE = 0.002

# Engine IDs, see the effect format in extract.py
EFFECT_RESOURCE_MODIFY = 1
EFFECT_ATTRIBUTE_MULTIPLY = {5, 15}  # 15 is the team bonus variant
ATTRIBUTE_WORK_RATE, ATTRIBUTE_TRAIN_TIME = 13, 101
UNIT_CLASS_CIVILIAN = 4
UNIT_TYPE_CREATABLE = 70  # trainable units, as opposed to buildings, projectiles etc.
AGE_TECHS = {101, 102, 103, 104}
# Armor classes that data.json keeps as separate fields (mAtk/mDef, pAtk/pDef)
ARMOR_CLASS_MELEE, ARMOR_CLASS_PIERCE = 4, 3
# Every unit has class 31 as hidden armor since DE
HIDDEN_ARMOR_CLASSES = {31}

ECONOMY_FIELDS = ['trainTime']
STAT_FIELDS = ['hp', 'mAtk', 'pAtk', 'mDef', 'pDef', 'range', 'minimumRange', 'speed', 'rateOfFire',
               'accuracy', 'projSpeed', 'blastRadius', 'lineOfSight', 'garrison', 'ageReq']
UPGRADE_EFFECT_FIELDS = ['hp', 'mAtk', 'pAtk', 'mDef', 'pDef', 'range', 'speed', 'lineOfSight', 'rateOfFire']
# unitsShow.json: the unique unit group starts with trebuchet and petard, the unique units follow alphabetically
UNIQUE_GROUP_FIXED_ENTRIES = 2


@dataclass
class Finding:
    kind: str  # 'diff' (project differs from the game), 'new' (missing in the project) or 'info'
    where: str
    message: str
    apply: Optional[Callable] = field(default=None, repr=False)


def values_match(a, b):
    if isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool):
        return abs(a - b) <= FLOAT_TOLERANCE
    return a == b


def clean_number(x):
    """Round to 3 digits and turn whole numbers into ints, as the project files write them."""
    x = round(float(x), 3)
    return int(x) if x == int(x) else x


def load_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


class Sync:
    def __init__(self, snapshot, config, stats=False):
        """`stats` also checks combat stats, which only the unmaintained tech tree pages use."""
        self.snapshot, self.config, self.stats = snapshot, config, stats
        # Project unit name -> game ID for names that cannot be found by the game name
        self.pinned_units = {**config['units'], **config['renames']}
        self.units = {int(k): v for k, v in snapshot['units'].items()}
        self.techs = {int(k): v for k, v in snapshot['techs'].items()}
        self.civ_count = snapshot['meta']['civCount']
        self.findings = []
        self.docs = {}
        self.data = self.open_doc(SRC / 'data.json')
        self.variety = self.open_doc(SRC / 'data' / 'unitVariety.json')
        self.units_show = self.open_doc(SRC / 'data' / 'unitsShow.json')
        self.order = self.open_doc(SRC / 'data' / 'order.json')
        self.eco = self.open_doc(SRC / 'data' / 'ecoBonuses.json')
        self.derived = self.open_doc(SRC / 'data' / 'derivedGatherRates.json')
        self.new_images = []  # icon jobs for icons.create()
        self.known_classes = ({int(k) for k in self.data.root['armorClasses'].keys()}
                              - {ARMOR_CLASS_MELEE, ARMOR_CLASS_PIERCE})
        self.unknown_classes = set()
        # Upgrade target -> (unit it upgrades from, tech the player researches for it). If several
        # units upgrade into the same target, the first one with a researchable tech wins.
        self.upgrade_parent = {}
        for unit_id, unit in sorted(self.units.items()):
            for target, tech_id in unit.get('upgradesTo', []):
                tech_id = self.researched_tech(tech_id)
                if target not in self.upgrade_parent or (tech_id is not None and self.upgrade_parent[target][1] is None):
                    self.upgrade_parent[target] = (unit_id, tech_id)
        self.unit_ids_by_name = self._name_index(self.units, lambda unit: 'civs' in unit)
        self.tech_ids_by_name = self._name_index(self.techs, lambda tech: 'civs' in tech or tech.get('locations'))

    def open_doc(self, path):
        doc = Doc(path)
        self.docs[path] = doc
        return doc

    @staticmethod
    def _name_index(items, preferred):
        """Lower-case name -> IDs with that name; IDs matching `preferred` first, then by ID."""
        index = {}
        for item_id, item in sorted(items.items()):
            index.setdefault(item['name'].lower().strip(), []).append(item_id)
        return {name: sorted(ids, key=lambda i: (not preferred(items[i]), i)) for name, ids in index.items()}

    def add(self, kind, where, message, apply=None):
        self.findings.append(Finding(kind, where, message, apply))

    def add_diff(self, where, field_name, node, expected):
        self.add('diff', where, f'{field_name}: {json.dumps(node.value())} -> {json.dumps(expected)}',
                 lambda doc=node.doc, n=node, value=expected: doc.replace(n, value))

    # --- Lookups in the snapshot ---

    def find_unit_id(self, name):
        """Game ID for a unit name in the project: the config.json mapping or a tech tree unit with that name."""
        if name in self.pinned_units:
            return self.pinned_units[name]
        ids = self.unit_ids_by_name.get(name)
        return ids[0] if ids and 'civs' in self.units[ids[0]] else None

    def find_tech_id(self, name):
        """Game ID of the tech a player researches for a project upgrade name.

        Tries the config.json mapping, a researchable tech with that name, and finally a unit with
        that name (unit upgrades like "war galley" are named after the target unit).
        """
        if name in self.config['upgrades']:
            return self.config['upgrades'][name]
        ids = [i for i in self.tech_ids_by_name.get(name, []) if self.is_researchable(i)]
        if ids:
            return ids[0]
        for unit_id in self.unit_ids_by_name.get(name, []):
            if self.upgrade_parent.get(unit_id, (None, None))[1] is not None:
                return self.upgrade_parent[unit_id][1]
        return None

    def is_researchable(self, tech_id):
        return bool(self.techs.get(tech_id, {}).get('locations'))

    def researched_tech(self, tech_id):
        """The tech a player researches to get tech_id: itself or a researchable prerequisite.

        Unit upgrades are often done by hidden techs that require the researched one
        (e.g. "Heavy Warships" triggers the upgrades of several ship lines).
        """
        if self.is_researchable(tech_id):
            return tech_id
        for required in self.techs.get(tech_id, {}).get('requiredTechs', []):
            if required not in AGE_TECHS and self.is_researchable(required):
                return required
        return None

    def upgrade_chain(self, unit_id):
        """All units unit_id upgrades into (directly or indirectly), breadth-first."""
        chain, todo = [], [unit_id]
        while todo:
            for target, _ in sorted(self.units.get(todo.pop(0), {}).get('upgradesTo', [])):
                if target in self.units and target not in chain:
                    chain.append(target)
                    todo.append(target)
        return chain

    def line_start(self, unit_id):
        """The first unit of the upgrade line unit_id belongs to."""
        seen = set()
        while unit_id in self.upgrade_parent and unit_id not in seen:
            seen.add(unit_id)
            unit_id = self.upgrade_parent[unit_id][0]
        return unit_id

    def category(self, unit_id):
        """'unique', 'generic' or 'regional', see README.md."""
        first = self.units[self.line_start(unit_id)]
        enabling_techs = [self.techs[t] for t in first.get('enabledBy', []) if t in self.techs]
        civ_count = len(first.get('civs', []))
        if (enabling_techs and all(t['civ'] > 0 for t in enabling_techs)) or civ_count == 1:
            return 'unique'
        return 'generic' if civ_count / self.civ_count > self.config['genericShare'] else 'regional'

    def gatherer_group_by_unit(self):
        """Villager task unit ID -> key in config.json "gatherers"."""
        return {unit_id: key for key, group in self.config['gatherers'].items() for unit_id in group['units']}

    def project_values(self, unit):
        """A snapshot unit in the field names of data.json.

        '_attacks' and '_armours' hold the attack bonuses and armor classes the project knows
        (data.json "armorClasses"). Unknown classes are collected for a note in run().
        """
        attacks = dict(map(tuple, unit.get('attacks', [])))
        armours = dict(map(tuple, unit.get('armours', [])))
        values = {k: unit[k] for k in ('hp', 'range', 'minimumRange', 'speed', 'rateOfFire', 'accuracy', 'projSpeed',
                                       'blastRadius', 'lineOfSight', 'garrison', 'trainTime', 'ageReq') if k in unit}
        if ARMOR_CLASS_MELEE in attacks:
            values['mAtk'] = attacks[ARMOR_CLASS_MELEE]
        if ARMOR_CLASS_PIERCE in attacks:
            values['pAtk'] = attacks[ARMOR_CLASS_PIERCE]
        if ARMOR_CLASS_MELEE in armours:
            values['mDef'] = armours[ARMOR_CLASS_MELEE]
        if ARMOR_CLASS_PIERCE in armours:
            values['pDef'] = armours[ARMOR_CLASS_PIERCE]
        values['cost'] = unit.get('cost', {})
        known = self.known_classes
        self.unknown_classes |= ((attacks.keys() | armours.keys()) - known
                                 - {ARMOR_CLASS_MELEE, ARMOR_CLASS_PIERCE} - HIDDEN_ARMOR_CLASSES)
        # Negative attack values are placeholders in the .dat
        values['_attacks'] = {cls: amount for cls, amount in attacks.items() if cls in known and amount >= 0}
        values['_armours'] = {cls: amount for cls, amount in armours.items()
                              if cls in known and cls not in HIDDEN_ARMOR_CLASSES}
        return values

    # --- Checks ---

    @staticmethod
    def merge_classes(current, game, keep_zero):
        """Update a data.json class list ([[class, value], ...] or bare class numbers) with the game values.

        Keeps the project's order, drops classes the game does not have and appends new non-zero
        classes. Zero values are only kept if `keep_zero` is set or the project already had 0.
        """
        merged, seen = [], set()
        for entry in current:
            cls, value = entry if isinstance(entry, list) else (entry, 0)
            seen.add(cls)
            if cls in game and (keep_zero or game[cls] != 0 or value == 0):
                merged.append([cls, game[cls]])
        merged += [[cls, value] for cls, value in sorted(game.items()) if cls not in seen and value != 0]
        return merged

    def check_units(self):
        for node in self.data.root['units'].children():
            name = node['name'].value()
            where = f'data.json units/{name}'
            unit_id = self.find_unit_id(name)
            if unit_id is None:
                self.add('info', where, 'no matching unit found in the game '
                         '(renamed? add it to config.json "renames", otherwise map it in "units")')
                continue
            unit = self.units[unit_id]
            candidates = [i for i in self.unit_ids_by_name.get(name, []) if 'civs' in self.units[i]]
            if len(candidates) > 1 and name not in self.pinned_units:
                self.add('info', where, f'ambiguous {candidates}, using ID {unit_id} '
                         '(set it in config.json "units" if necessary)')
            game = self.project_values(unit)
            ignore = set(self.config['ignoreFields'].get(name, []))
            for field_name in ECONOMY_FIELDS + (STAT_FIELDS if self.stats else []):
                if (field_name in node and field_name not in ignore and field_name in game
                        and not values_match(node[field_name].value(), game[field_name])):
                    self.add_diff(where, field_name, node[field_name], game[field_name])
            if 'cost' in node:
                self.check_cost(where, node['cost'], game['cost'])
            # data.json "armorClasses" lists 0 values on purpose, "bonus" only real bonuses
            for field_name, game_classes, keep_zero in (('armorClasses', game['_armours'], True),
                                                        ('bonus', game['_attacks'], False)):
                if self.stats and field_name in node and field_name not in ignore:
                    current = node[field_name].value()
                    merged = self.merge_classes(current, game_classes, keep_zero)
                    if merged != current:
                        self.add_diff(where, field_name, node[field_name], merged)

    def check_cost(self, where, node, game_cost):
        current = node.value()
        for resource in COST_RESOURCES:
            if current.get(resource, 0) != game_cost.get(resource, 0):
                if resource in current:
                    self.add_diff(where, f'cost.{resource}', node[resource], game_cost.get(resource, 0))
                else:
                    self.add('diff', where, f'cost.{resource}: - -> {game_cost[resource]}',
                             lambda doc=node.doc, n=node, r=resource, v=game_cost[resource]: doc.set_key(n, r, v))

    # Only eco techs: the villager calculator reads nothing else from data.json "upgrades",
    # the remaining entries belong to the tech tree pages, which are no longer maintained.
    def check_upgrades(self):
        gatherers = self.config['gatherers']
        for node in self.data.root['upgrades'].children():
            effects = node.get('effects')
            if effects is None or 'gatherRate' not in effects:
                continue
            name = node['name'].value()
            where = f'data.json upgrades/{name}'
            tech_id = self.find_tech_id(name)
            if tech_id is None:
                self.add('info', where, 'not in any tech tree of the game '
                         '(removed or renamed? map it in config.json "upgrades" if necessary)')
                continue
            tech = self.techs[tech_id]
            if 'time' in node and 'time' in tech and not values_match(node['time'].value(), tech['time']):
                self.add_diff(where, 'time', node['time'], tech['time'])
            if self.stats and 'ageReq' in node and 'ageReq' in tech and node['ageReq'].value() != tech['ageReq']:
                self.add_diff(where, 'ageReq', node['ageReq'], tech['ageReq'])
            if 'cost' in node:
                self.check_cost(where, node['cost'], tech['cost'])
            # "gatherRate": ["lumberjack", "*1.2"]
            gatherer, factor = effects['gatherRate'].value()
            group = gatherers.get(gatherer)
            game_factor = self.work_rate_factor(tech, group['units']) if group else None
            if game_factor is not None and not values_match(float(factor.lstrip('*')), game_factor):
                self.add_diff(where, 'effects.gatherRate', effects['gatherRate'], [gatherer, f'*{clean_number(game_factor)}'])

    def work_rate_factor(self, tech, unit_ids):
        """Combined work rate multiplier of a tech for a gatherer, or None if the tech does not change it.

        Techs change the male and female task unit alike, so the first unit ID is enough.
        """
        factor = None
        for effect_type, unit_id, unit_class, attribute, value in tech['effects']:
            hits_gatherer = unit_id == unit_ids[0] or (unit_id == -1 and unit_class == UNIT_CLASS_CIVILIAN)
            if effect_type in EFFECT_ATTRIBUTE_MULTIPLY and attribute == ATTRIBUTE_WORK_RATE and hits_gatherer:
                factor = (factor or 1) * value
        return factor

    def check_gathering(self):
        gathering = self.data.root['units'].find('name', 'villager')['gathering']
        effective_rates = self.config['effectiveGatherRates']
        for key, group in self.config['gatherers'].items():
            if key not in gathering or key in effective_rates:
                continue
            unit = self.units.get(group['units'][0])
            node = gathering[key]
            where = f'data.json units/villager/gathering/{key}'
            if not values_match(node['gatherRate'].value(), unit['workRate']):
                self.add_diff(where, 'gatherRate', node['gatherRate'], unit['workRate'])
            if 'carryCapacity' in node and node['carryCapacity'].value() != unit['resourceCapacity']:
                self.add_diff(where, 'carryCapacity', node['carryCapacity'], unit['resourceCapacity'])
        known = {unit_id for group in self.config['gatherers'].values() for unit_id in group['units']}
        known |= set(self.config['notGatherers'])
        for unit_id, unit in sorted(self.units.items()):
            # Task units without their own work rate (1) or resource capacity do not gather
            if (unit['class'] == UNIT_CLASS_CIVILIAN and unit.get('workRate', 1) != 1 and unit_id not in known
                    and unit.get('resourceCapacity')):
                self.add('info', 'config.json gatherers', f'unknown gatherer in the game: {unit["name"]} '
                         f'(ID {unit_id}, rate {unit["workRate"]}) - new resource? Add it to config.json "gatherers"')

    def train_speed_factor(self, tech, unit):
        """Training speed multiplier (>1 = faster) a tech gives a unit, as unitVariety.json stores it.

        Techs either shorten the train time of the unit or raise the work rate of the building
        that trains it (Kasbah). `unit` needs its ID under 'id'. Returns None if the tech does neither.
        """
        factor = None
        locations = {location['location'] for location in unit.get('trainLocations', [])[:1]}
        for effect_type, unit_id, unit_class, attribute, value in tech['effects']:
            if effect_type not in EFFECT_ATTRIBUTE_MULTIPLY or not value:
                continue
            hits_unit = unit_id == unit['id'] or (unit_id == -1 and unit_class == unit['class'])
            if attribute == ATTRIBUTE_TRAIN_TIME and hits_unit:
                factor = (factor or 1) / value
            elif attribute == ATTRIBUTE_WORK_RATE and unit_id in locations:
                factor = (factor or 1) * value
        return factor

    def check_variety(self):
        for key, entry in self.variety.root.items():
            unit_id = self.find_unit_id(key)
            if unit_id is None or 'upgrades' not in entry:
                continue
            unit = dict(self.units[unit_id], id=unit_id)
            chain = {self.units[c]['name'].lower(): c for c in self.upgrade_chain(unit_id)}
            for upgrade_name, upgrade in entry['upgrades'].items():
                where = f'unitVariety.json {key}/{upgrade_name}'
                values = upgrade.value()
                if values.get('trainTimePercent'):
                    tech_id = self.find_tech_id(upgrade_name.lower())
                    factor = self.train_speed_factor(self.techs[tech_id], unit) if tech_id is not None else None
                    # The file stores the factor with 2 decimals
                    if factor is not None and abs(values['trainTime'] - factor) > 0.011:
                        self.add_diff(where, 'trainTime', upgrade['trainTime'], round(factor, 2))
                elif 'trainTime' in values and upgrade_name.lower() in chain:
                    game_time = self.units[chain[upgrade_name.lower()]]['trainTime']
                    if values['trainTime'] != game_time:
                        self.add_diff(where, 'trainTime', upgrade['trainTime'], game_time)

    def civ_gather_bonuses(self, civ):
        """The gather bonuses a civ's bonus techs give.

        Returns
        - bonuses: project resource -> extra share (0.15 = +15 %), as ecoBonuses.json stores it
        - derived: new resource name -> derivedGatherRates.json entry (config.json "specialResources")
        - labels: short descriptions for the name of a new ecoBonuses.json entry
        - checkable: resources whose bonus comes from a single tech without prerequisites, so the
          value in ecoBonuses.json can be compared directly (age-dependent bonuses cannot)
        """
        gatherer_groups = self.gatherer_group_by_unit()
        bonuses, derived, labels, techs_per_group = {}, {}, [], {}
        for tech_id in self.snapshot['civs'][civ]['bonusTechs']:
            tech = self.techs[tech_id]
            factors = {}
            for effect_type, a, b, attribute, value in tech['effects']:
                if effect_type in EFFECT_ATTRIBUTE_MULTIPLY and attribute == ATTRIBUTE_WORK_RATE and a in gatherer_groups:
                    factors.setdefault(gatherer_groups[a], value)
                special = self.config['specialResources'].get(str(a))
                if effect_type == EFFECT_RESOURCE_MODIFY and special:
                    share = round(value / 100, 3)
                    if special['kind'] == 'ecoBonus':
                        for resource in special['resources']:
                            bonuses[resource] = share
                        labels.append(f'{special["label"]} +{share:.0%}')
                    else:
                        for name, source in special['resources'].items():
                            # The engine applies some sources with a different share than the .dat value
                            # says; that logic lives in the game executable, so config.json sets "scale"
                            scale = 1
                            if isinstance(source, dict):
                                source, scale = source['from'], source['scale']
                            derived[name] = {'res': special['res'], 'from': source,
                                             'factor': round(share * scale, 3), 'civ': civ}
            for group, factor in factors.items():
                techs_per_group.setdefault(group, []).append(tech)
                for resource in self.config['gatherers'][group]['resources']:
                    bonuses[resource] = round((1 + bonuses.get(resource, 0)) * factor - 1, 4)
                labels.append(group)
        checkable = {resource for group, techs in techs_per_group.items()
                     if len(techs) == 1 and not techs[0]['requiredTechs']
                     and group not in self.config['effectiveGatherRates']
                     for resource in self.config['gatherers'][group]['resources']}
        return bonuses, derived, labels, checkable

    def check_eco_bonuses(self):
        # Keys look like "Aztecs (Farms)" or "Japanese - Dark Age"
        civ_entries = self.eco.root['civ']
        covered_civs = {key.split(' ')[0] for key in civ_entries.keys()}
        existing_derived = self.derived.root
        for civ in sorted(self.snapshot['civs']):
            bonuses, derived, labels, checkable = self.civ_gather_bonuses(civ)
            for key, node in civ_entries.items():
                # Per-age entries hold age-dependent values that no single tech gives
                if not key.startswith(civ + ' ') or 'Age' in key:
                    continue
                for resource, value in node.value().items():
                    if isinstance(value, (int, float)) and resource in checkable \
                            and not values_match(value, bonuses[resource]):
                        self.add_diff(f'ecoBonuses.json {key}', resource, node[resource], bonuses[resource])
            # Work rate factors below 1 make a resource last longer (Goths hunt, Tatars sheep),
            # the gather rate itself stays the same
            bonuses = {resource: value for resource, value in bonuses.items() if value > 0}
            if bonuses and civ not in covered_civs:
                name = f'{civ} ({", ".join(dict.fromkeys(labels))})'
                self.add('new', f'ecoBonuses.json {name}', json.dumps(bonuses),
                         lambda n=name, b=bonuses: self.eco.set_key(self.eco.root['civ'], n, b))
            for name, spec in derived.items():
                if name in existing_derived.keys():
                    node = existing_derived[name]
                    if not values_match(node['factor'].value(), spec['factor']):
                        self.add_diff(f'derivedGatherRates.json {name}', 'factor', node['factor'], spec['factor'])
                else:
                    self.add('new', f'Resource "{name}"', f'{spec["factor"]:.0%} of {spec["from"]} as {spec["res"]} '
                             f'({civ})', lambda n=name, s=spec: self.add_derived_resource(n, s))

    def check_renames(self):
        """Adopt the game name for the units in config.json "renames", including their upgrades."""
        for old_name, unit_id in self.config['renames'].items():
            if not self.data.root['units'].find('name', old_name):
                continue  # already renamed
            new_name = self.units[unit_id]['name']
            # Upgrades get the same change: "elite longboat" -> "Elite Longship"
            names = {old_name: (unit_id, new_name)}
            for target_id in self.upgrade_chain(unit_id):
                target_name = self.units[target_id]['name']
                old_target_name = target_name.lower().replace(new_name.lower(), old_name)
                if old_target_name != target_name.lower():
                    names[old_target_name] = (target_id, target_name)
            self.add('diff', f'data.json units/{old_name}', 'renamed in the game: '
                     + ', '.join(f'{old} -> {new.lower()}' for old, (_, new) in names.items()),
                     lambda n=names: self.rename(n))

    def rename(self, names):
        """Replace unit names in all project files (string values and object keys) and replace their icons.

        `names` maps the old lower-case name to (unit ID, game name). Only whole strings are replaced.
        Lower-case text stays lower-case, other text gets the game's capitalization ("Elite Longship").
        """
        def new_text(text):
            if text.lower() not in names:
                return None
            game_name = names[text.lower()][1]
            return game_name.lower() if text == text.lower() else game_name

        for doc in self.docs.values():
            for node in doc.root.walk():
                if node.kind == 'value' and isinstance(node.value(), str) and new_text(node.value()):
                    doc.replace(node, new_text(node.value()))
                if node.kind == 'object':
                    for key in node.keys():
                        if new_text(key):
                            doc.rename_key(node, key, new_text(key))
        for old_name, (unit_id, game_name) in names.items():
            if (IMG / f'{old_name}.webp').exists():
                self.new_images.append({'file': game_name.lower(), 'kind': self.category(unit_id), 'unit': unit_id,
                                        'replaces': old_name})

    def check_civs(self):
        project_civs = set(self.data.root['civlist'].value())
        missing = sorted(set(self.snapshot['civs']) - project_civs)
        if missing:
            self.add('info', 'data.json civlist', 'civs missing (rankings/tech tree are editorial, hence not '
                     'automatic): ' + ', '.join(missing))

    def check_new_units(self):
        """Report trainable tech tree units that the project has neither as unit nor as upgrade."""
        covered = set()
        project_names = set()
        for node in self.data.root['units'].children():
            project_names.add(node['name'].value())
            unit_id = self.find_unit_id(node['name'].value())
            if unit_id is not None:
                covered |= {unit_id, *self.upgrade_chain(unit_id)}
        for node in self.data.root['upgrades'].children():
            project_names.add(node['name'].value())
            covered |= set(self.unit_ids_by_name.get(node['name'].value(), []))
        for unit_id, unit in sorted(self.units.items()):
            # Upgrade targets are added together with the first unit of their line
            if (unit_id in covered or 'civs' not in unit or unit['type'] != UNIT_TYPE_CREATABLE
                    or not unit.get('trainLocations') or unit_id in self.upgrade_parent
                    or unit_id in self.config['skipNewUnits'] or unit['name'].lower() in project_names):
                continue
            self.add('new', f'Unit "{unit["name"]}" (ID {unit_id})',
                     f'{self.category(unit_id)}, {len(unit["civs"])} civs, cost {unit["cost"]}, {unit["trainTime"]}s',
                     lambda i=unit_id: self.add_unit(i))

    # --- Entries for new units and resources ---

    def unit_entry(self, unit_id):
        """data.json "units" entry."""
        unit = self.units[unit_id]
        values = self.project_values(unit)
        ranged = unit.get('range', 0) > 0 and values.get('pAtk', 0) > 0
        entry = {'name': unit['name'].lower(), 'ageReq': unit.get('ageReq', 1)}
        if not ranged and 'mAtk' in values:
            entry['mAtk'] = values['mAtk']
        if ranged:
            entry['pAtk'] = values['pAtk']
        entry.update(mDef=values.get('mDef', 0), pDef=values.get('pDef', 0), hp=unit['hp'], range=unit.get('range', 0))
        if unit.get('minimumRange'):
            entry['minimumRange'] = unit['minimumRange']
        if 'speed' in unit:
            entry['speed'] = unit['speed']
        if 'rateOfFire' in unit:
            entry['rateOfFire'] = unit['rateOfFire']
        if ranged:
            entry['accuracy'] = unit['accuracy']
            if 'projSpeed' in unit:
                entry['projSpeed'] = unit['projSpeed']
        if unit.get('blastRadius'):
            entry['blastRadius'] = unit['blastRadius']
        entry['lineOfSight'] = unit['lineOfSight']
        if unit.get('garrison'):
            entry['garrison'] = unit['garrison']
        entry['cost'] = {r: unit['cost'][r] for r in COST_RESOURCES if unit['cost'].get(r)}
        entry['armorClasses'] = [[cls, amount] for cls, amount in sorted(values['_armours'].items())]
        entry['bonus'] = [[cls, amount] for cls, amount in sorted(values['_attacks'].items()) if amount]
        entry['trainTime'] = unit['trainTime']
        return entry

    def upgrade_entry(self, from_id, to_id, tech_id):
        """data.json "upgrades" entry for a unit upgrade; effects are the stat differences between both units."""
        before, after = self.project_values(self.units[from_id]), self.project_values(self.units[to_id])
        tech = self.techs.get(tech_id, {})
        effects = {}
        for field_name in UPGRADE_EFFECT_FIELDS:
            delta = clean_number(after.get(field_name, 0) - before.get(field_name, 0))
            if delta:
                effects[field_name] = delta
        bonus = [[cls, clean_number(amount - before['_attacks'].get(cls, 0))]
                 for cls, amount in sorted(after['_attacks'].items()) if amount != before['_attacks'].get(cls, 0)]
        if bonus:
            effects['bonus'] = bonus
        entry = {'name': self.units[to_id]['name'].lower(),
                 'ageReq': tech.get('ageReq', self.units[to_id].get('ageReq', 1)),
                 'cost': {r: tech['cost'][r] for r in COST_RESOURCES if tech.get('cost', {}).get(r)},
                 'effects': effects}
        if 'time' in tech:
            entry['time'] = tech['time']
        entry['classChange'] = True
        return entry

    def variety_entry(self, unit_id):
        """unitVariety.json entry: upgrades with their own train time or cost, plus known percentage techs."""
        unit = dict(self.units[unit_id], id=unit_id)
        upgrades = {}
        tech_names = {n['name'].value() for n in self.data.root['upgrades'].children()
                      if not (n.get('classChange') and n['classChange'].value())}
        for target_id in self.upgrade_chain(unit_id):
            target = self.units[target_id]
            if target['trainTime'] != unit['trainTime'] or target['cost'] != unit['cost']:
                img = target['name'].lower()
                if img in tech_names:
                    self.add('info', f'src/img/{img}.webp', f'belongs to the tech "{img}"; unit icon is named '
                             f'"{img} unit.webp"')
                    img += ' unit'
                upgrade = {'trainTime': target['trainTime'], 'img': img}
                if target['cost'] != unit['cost']:
                    upgrade['cost'] = {r: target['cost'][r] for r in COST_RESOURCES if target['cost'].get(r)}
                upgrades[target['name']] = upgrade
                self.new_images.append({'file': img, 'kind': self.category(target_id), 'unit': target_id})
        # Percentage techs (Conscription, Kasbah, ...) already used for other units, in file order
        known_percentage_techs = {}
        for entry in self.variety.root.value().values():
            for name, upgrade in entry.get('upgrades', {}).items():
                if upgrade.get('trainTimePercent'):
                    known_percentage_techs.setdefault(name, None)
        for name in known_percentage_techs:
            tech_id = self.find_tech_id(name.lower())
            factor = self.train_speed_factor(self.techs[tech_id], unit) if tech_id is not None else None
            if factor and abs(factor - 1) > 0.001:
                upgrades[name] = {'trainTime': round(factor, 2), 'trainTimePercent': True}
        return {'civs': {}, 'upgrades': upgrades}

    def add_unit(self, unit_id):
        """Add a new unit line: data.json unit and upgrades, unitVariety.json, unitsShow.json and icons."""
        unit = self.units[unit_id]
        name = unit['name'].lower()
        self.data.append(self.data.root['units'], self.unit_entry(unit_id))
        existing = {n['name'].value() for n in self.data.root['upgrades'].children()}
        for target_id in self.upgrade_chain(unit_id):
            parent_id, tech_id = self.upgrade_parent[target_id]
            if self.units[target_id]['name'].lower() not in existing:
                self.data.append(self.data.root['upgrades'], self.upgrade_entry(parent_id, target_id, tech_id))
        self.variety.set_key(self.variety.root, name, self.variety_entry(unit_id))

        category = self.category(unit_id)
        unique_group = self.config['uniqueCategory']
        if category == 'unique':
            group_index = unique_group
        else:
            building = str(unit['trainLocations'][0]['location'])
            group_index = self.config['unitsShowCategories'].get(building)
        if group_index is not None:
            group = self.units_show.root[group_index]
            if group_index == unique_group:
                names = [n.value() for n in group.children()]
                position = next((i for i, n in enumerate(names) if i >= UNIQUE_GROUP_FIXED_ENTRIES and n > name), None)
                self.units_show.append(group, name, position)
            else:
                self.units_show.append(group, name)
        self.new_images.append({'file': name, 'kind': category, 'unit': unit_id})

    def add_derived_resource(self, name, spec):
        """Add a resource like "gold from hunter" to derivedGatherRates.json and order.json, with icon."""
        self.derived.set_key(self.derived.root, name, spec)
        # order.json groups the resources by what they yield (food, wood, gold, stone)
        group = next(i for i, g in enumerate(self.order.root.children())
                     if any(item['name'].value().startswith(spec['res']) for item in g.children()))
        self.order.append(self.order.root[group], {'name': name, 'show': False})
        self.new_images.append({'file': name, 'kind': 'resource', 'source': spec['from'], 'res': spec['res'],
                                'civ': self.snapshot['civs'][spec['civ']]['internalName']})

    # --- Entry points ---

    def run(self):
        self.check_renames()
        self.check_units()
        self.check_upgrades()
        self.check_gathering()
        self.check_variety()
        self.check_eco_bonuses()
        self.check_new_units()
        self.check_civs()
        if self.unknown_classes:
            self.add('info', 'data.json armorClasses', 'classes without a name in the project are ignored: '
                     + ', '.join(map(str, sorted(self.unknown_classes))))
        return self.findings

    def apply(self):
        """Apply all fixable findings and save the changed files. Returns their paths.

        Applying can add findings (notes on new entries); they are appended to self.findings.
        """
        for finding in self.findings:
            if finding.apply:
                finding.apply()
        changed = [doc.path for doc in self.docs.values() if doc.changed()]
        for doc in self.docs.values():
            if doc.changed():
                doc.save()
        return changed
