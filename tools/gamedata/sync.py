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
EFFECT_RESOURCE_TYPES = {1, 6, 11, 16}  # modify / multiply, 10+ are the team bonus variants
EFFECT_ATTRIBUTE_MULTIPLY = {5, 15}  # 15 is the team bonus variant
EFFECT_ATTRIBUTE_ADD = {4, 14}
EFFECT_ATTRIBUTE_SET = {0, 10}
EFFECT_TEAM_TYPES = {10, 14, 15}  # the attribute effects above that also apply to allies
ATTRIBUTE_WORK_RATE, ATTRIBUTE_TRAIN_TIME = 13, 101
ATTRIBUTE_COST = 100  # all resources of the cost at once
ATTRIBUTE_COST_RESOURCES = {103: 'food', 104: 'wood', 105: 'gold', 106: 'stone'}
AGE_BY_TECH = {101: 2, 102: 3, 103: 4}
AGE_NAMES = {1: 'Dark', 2: 'Feudal', 3: 'Castle', 4: 'Imperial'}
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


@dataclass
class Finding:
    kind: str  # 'diff' (project differs from the game), 'new' (missing in the project) or 'info'
    where: str
    message: str
    apply: Optional[Callable] = field(default=None, repr=False)


@dataclass
class VarietyCandidate:
    """A unitVariety.json entry derived from the game data, see Sync.variety_candidates()."""
    section: str  # 'civs' or 'upgrades'
    key: str
    values: dict
    owner: tuple  # the game source: ('tech', tech ID), (civ, 'civ') or (civ, 'team')
    tech_ids: list


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
        # Without these fields check_variety() would remove the bonuses they hold
        if any('techTreeBonus' not in civ or 'teamTechs' not in civ for civ in snapshot['civs'].values()):
            raise SystemExit('snapshot.json was written by an older version of extract.py. Run "update" or "extract" first.')
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

    def resource_types(self):
        """Project resource name -> what it yields ('food', 'wood', 'gold', 'stone').

        order.json has one group per yield; the villager gather rates in data.json tell which one.
        """
        gathering = self.data.root['units'].find('name', 'villager')['gathering'].value()
        types = {}
        for group in self.order.root.value():
            names = [item['name'] for item in group]
            types.update(dict.fromkeys(names, next(gathering[n]['res'] for n in names if n in gathering)))
        return types

    def special_targets(self, special):
        """Project resources a config.json "specialResources" bonus of kind "ecoBonus" applies to: the
        resources of the listed "gatherers", or all resources of the yield "res" except the listed ones."""
        if 'gatherers' in special:
            return [r for group in special['gatherers'] for r in self.config['gatherers'][group]['resources']]
        return [r for r, res in self.resource_types().items() if res == special['res'] and r not in special['except']]

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

    def check_resources(self):
        """Compare the resources in order.json with config.json "gatherers": civ bonuses on a villager
        task only reach the resources listed there, so a missing one would silently get no bonus."""
        assigned = {r for group in self.config['gatherers'].values() for r in group['resources']}
        project = set(self.resource_types())
        for resource in sorted(project - assigned - set(self.derived.root.keys()) - set(self.config['otherResources'])):
            self.add('info', f'order.json {resource}', 'not assigned to a villager task. Add it to the right group '
                     'in config.json "gatherers", or to "otherResources" if no villager gathers it')
        for resource in sorted((assigned | set(self.config['otherResources'])) - project):
            self.add('info', f'config.json {resource}', 'not in order.json (renamed or removed?)')

    def building_at(self, building_id, age):
        """The variant of a building in an age. Most buildings are replaced by a new unit in each
        age (Dock 45 -> 133 -> 47 -> 51), and some bonuses give each variant its own value (Persians)."""
        variant, variant_age = building_id, 1
        for target, tech_id in self.units.get(building_id, {}).get('upgradesTo', []):
            target_age = AGE_BY_TECH.get(tech_id)
            if target_age and variant_age < target_age <= age:
                variant, variant_age = target, target_age
        return variant

    def training_values(self, effects, unit, age):
        """unitVariety.json values for what `effects` do to training `unit` (needs its ID under 'id') in `age`.

        Train time becomes a speed factor (>1 = faster). It also covers techs that raise the work rate
        of a building that trains the unit (Kasbah); if the unit has several, the fastest one counts,
        since one tech often speeds up all of them (Conscription). Cost multipliers become the share
        saved (costPercent), added or set amounts the amount added. Returns {} if the effects do neither.
        """
        speed, factors, amounts = 1, {}, {}
        base_cost = unit.get('cost', {})
        work_rates = {self.building_at(location['location'], age): 1 for location in unit.get('trainLocations', [])}
        for effect_type, unit_id, unit_class, attribute, value in effects:
            multiply = effect_type in EFFECT_ATTRIBUTE_MULTIPLY
            if multiply and attribute == ATTRIBUTE_WORK_RATE and unit_id in work_rates:
                work_rates[unit_id] *= value
            if not (unit_id == unit['id'] or (unit_id == -1 and unit_class == unit['class'])):
                continue
            if multiply and attribute == ATTRIBUTE_TRAIN_TIME and value:
                speed /= value
            resources = COST_RESOURCES if attribute == ATTRIBUTE_COST else [ATTRIBUTE_COST_RESOURCES.get(attribute)]
            for resource in filter(None, resources):
                if multiply and base_cost.get(resource):
                    factors[resource] = factors.get(resource, 1) * value
                elif effect_type in EFFECT_ATTRIBUTE_ADD:
                    amounts[resource] = amounts.get(resource, 0) + value
                elif effect_type in EFFECT_ATTRIBUTE_SET:
                    amounts[resource] = amounts.get(resource, 0) + value - base_cost.get(resource, 0)
        speed *= max(work_rates.values(), default=1)
        values = {}
        if abs(speed - 1) > 0.001:
            values.update(trainTime=round(speed, 2), trainTimePercent=True)
        # The calculator cannot combine both kinds in one entry; no tech does that so far
        shares = {r: round(1 - f, 2) for r, f in factors.items() if abs(f - 1) > 0.001}
        if shares:
            values.update(cost=shares, costPercent=True)
        elif any(amounts.values()):
            values['cost'] = {r: clean_number(a) for r, a in amounts.items() if a}
        return values

    @staticmethod
    def tech_age(tech):
        return max((AGE_BY_TECH[t] for t in tech['requiredTechs'] if t in AGE_BY_TECH), default=1)

    def variety_candidates(self, unit_id):
        """The unitVariety.json entries the game data gives a unit line.

        - researchable techs: "upgrades", named like the tech,
        - team bonuses: "upgrades", "<Civ> Team Bonus" (they help every civ),
        - civ bonuses (bonus techs and the civ's tech tree effect): "civs", "<Civ> Civ Bonus", or one
          "<Civ> - <Age> Age" entry per age with the values up to that age if they change with the ages.
        Techs and civ bonuses only count for civs that can have the unit; techs of other civs still
        count with their team effects (Kasbah). Units without civs in the tech trees (buildings) and
        units a civ gives its team (Genitour) count for every civ, as do techs without civs (ages).
        Techs in config.json "ignoreTechs" are left out.
        """
        all_civs = set(self.snapshot['civs'])
        line = [unit_id, *self.upgrade_chain(unit_id)]
        line_civs = set().union(*(self.units[i].get('civs', []) for i in line))
        team_techs = {t for info in self.snapshot['civs'].values() for t in info['teamTechs']}
        if not line_civs or any(team_techs & set(self.units[i].get('enabledBy', [])) for i in line):
            line_civs = all_civs
        # Copies of the unit with the same name are trained elsewhere (Serjeant in the castle), and
        # techs that speed up those buildings count as well
        name = self.units[unit_id]['name'].lower()
        locations = [location for copy_id in self.unit_ids_by_name.get(name, [unit_id])
                     if copy_id == unit_id or 'civs' in self.units[copy_id]
                     for location in self.units[copy_id].get('trainLocations', [])]
        unit = dict(self.units[unit_id], id=unit_id, trainLocations=locations)
        ignored = set(self.config['ignoreTechs'])
        first_age = unit.get('ageReq', 1)
        candidates = []
        for tech_id, tech in sorted(self.techs.items()):
            if not self.is_researchable(tech_id) or tech_id in ignored:
                continue
            effects = tech['effects']
            if not line_civs & set(tech.get('civs', all_civs)):
                effects = [e for e in effects if e[0] in EFFECT_TEAM_TYPES]
            values = self.training_values(effects, unit, max(first_age, tech.get('ageReq', 1)))
            if values:
                candidates.append(VarietyCandidate('upgrades', tech['name'], values, ('tech', tech['name'].lower()),
                                                   [tech_id]))
        for civ, info in sorted(self.snapshot['civs'].items()):
            values = self.training_values(info['teamBonus'], unit, first_age)
            if values:
                candidates.append(VarietyCandidate('upgrades', f'{civ} Team Bonus', values, (civ, 'team'), []))
            if civ not in line_civs:
                continue
            # (age, effects, tech ID); the tech tree effect has no tech
            sources = [(1, info['techTreeBonus'], None)] + [
                (self.tech_age(self.techs[t]), self.techs[t]['effects'], t) for t in info['bonusTechs'] if t not in ignored]
            sources = [s for s in sources if any(self.training_values(s[1], unit, age) for age in range(first_age, 5))]
            per_age, previous = [], {}
            for age in range(first_age, 5):
                values = self.training_values([e for a, effects, _ in sources if a <= age for e in effects], unit, age)
                if values and values != previous:
                    per_age.append((age, values))
                previous = values
            # Each candidate names all techs of the bonus: ignoring only some of them leaves wrong values
            tech_ids = [t for _, _, t in sources if t is not None]
            if len(per_age) == 1 and per_age[0][0] == first_age and all(a <= first_age for a, _, _ in sources):
                candidates.append(VarietyCandidate('civs', f'{civ} Civ Bonus', per_age[0][1], (civ, 'civ'), tech_ids))
            else:
                candidates += [VarietyCandidate('civs', f'{civ} - {AGE_NAMES[age]} Age', values, (civ, 'civ'), tech_ids)
                               for age, values in per_age]
        return candidates

    def variety_owner(self, section, key):
        """The game source of a unitVariety.json key, as in VarietyCandidate.owner, or None.

        Civ and team bonus keys may be hand-written ("Aztec Civ Bonus", "Vikings - Feudal/Castle Age",
        "Gurjara Team Bonus"), so they are matched by the civ name at their start.
        """
        lower = key.lower()
        civ = max((c for c in self.snapshot['civs'] if lower.startswith(c.lower().rstrip('s'))), key=len, default=None)
        if section == 'upgrades' and civ and 'team' in lower:
            return civ, 'team'
        if section == 'civs':
            return (civ, 'civ') if civ else None
        if any(self.is_researchable(t) for t in self.tech_ids_by_name.get(lower, [])):
            return 'tech', lower
        return None

    @staticmethod
    def cost_after(base, change):
        """Cost after a unitVariety.json cost change, as the calculator computes it.

        Numbers between 0 and 1 are the share saved, other numbers an amount added. Texts like "+0.40"
        add a share of the cost in "baseResource" (Detinets: stone turns into wood).
        """
        cost = dict(base)
        for resource in COST_RESOURCES:
            value = change.get(resource)
            before = base.get(resource, 0)
            if isinstance(value, str):
                cost[resource] = before + base.get(change.get('baseResource', resource), 0) * float(value)
            elif value:
                cost[resource] = before * (1 - value) if 0 < value < 1 else before + value
        return cost

    def same_training(self, values, expected, unit):
        """Whether project values have the same effect as the game values (the notation may differ)."""
        if values.get('trainTimePercent'):
            speed = values['trainTime']
        else:
            speed = unit['trainTime'] / values['trainTime'] if values.get('trainTime') else 1
        # The file stores the factor with 2 decimals
        if abs(speed - expected.get('trainTime', 1)) > 0.011:
            return False
        project = self.cost_after(unit.get('cost', {}), values.get('cost', {}))
        game = self.cost_after(unit.get('cost', {}), expected.get('cost', {}))
        return all(abs(project.get(r, 0) - game.get(r, 0)) < 1 for r in COST_RESOURCES)

    def replace_variety(self, section, old, new):
        """Replace the keys of `old` in a unitVariety.json section node with `new`, where the first old key was."""
        content = self.variety.object_content(section)
        items = list(content.items())
        position = next((i for i, (k, _) in enumerate(items) if k in old), len(items))
        items = ([(k, v) for k, v in items[:position] if k not in old] + list(new.items())
                 + [(k, v) for k, v in items[position:] if k not in old])
        content.clear()
        content.update(items)

    def tier_values(self, unit_id, tier_id):
        """unitVariety.json values of an upgrade tier: its train time and, since the calculator adds the
        cost to the base unit's cost, the cost difference."""
        base, tier = self.units[unit_id].get('cost', {}), self.units[tier_id].get('cost', {})
        values = {'trainTime': self.units[tier_id].get('trainTime')}
        cost = {r: tier.get(r, 0) - base.get(r, 0) for r in COST_RESOURCES if tier.get(r, 0) != base.get(r, 0)}
        if cost:
            values['cost'] = cost
        return values

    def elite_tiers(self, unit_id):
        """Upgrade tiers of a line that train in another time or for another cost than the tier before them.

        The tier before is the deepest unit of the line that upgrades into it: the Archer also upgrades
        directly to the Arbalester, but the tier before it is the Crossbowman. Units of another class are
        conversions, not tiers (Flemish Revolution turns villagers into militia).
        """
        line = [unit_id, *self.upgrade_chain(unit_id)]
        sources = {u: [t for t, _ in self.units[u].get('upgradesTo', []) if t in line] for u in line}
        depth = dict.fromkeys(line, 0)
        for _ in line:
            for source, targets in sources.items():
                for target in targets:
                    depth[target] = max(depth[target], min(depth[source] + 1, len(line)))
        tiers = []
        for tier_id in line[1:]:
            before = max((u for u in line if tier_id in sources[u]), key=depth.get)
            tier, previous = self.units[tier_id], self.units[before]
            if tier['class'] == self.units[unit_id]['class'] and (
                    tier.get('trainTime') != previous.get('trainTime') or tier.get('cost') != previous.get('cost')):
                tiers.append(tier_id)
        return tiers

    def tier_entry(self, unit_id, tier_id):
        """unitVariety.json entry of an upgrade tier with its icon, which is queued for icons.create()."""
        tech_names = {n['name'].value() for n in self.data.root['upgrades'].children()
                      if not (n.get('classChange') and n['classChange'].value())}
        img = self.units[tier_id]['name'].lower()
        if img in tech_names:
            self.add('info', f'src/img/{img}.webp', f'belongs to the tech "{img}"; unit icon is named "{img} unit.webp"')
            img += ' unit'
        self.new_images.append({'file': img, 'kind': self.category(tier_id), 'unit': tier_id})
        return {**self.tier_values(unit_id, tier_id), 'img': img}

    def add_tier(self, section, name, entry):
        """Insert a tier entry after the existing tiers (entries with "img") of a unitVariety.json section."""
        content = self.variety.object_content(section)
        items = list(content.items())
        position = max((i + 1 for i, (_, v) in enumerate(items) if isinstance(v, dict) and 'img' in v), default=0)
        items.insert(position, (name, entry))
        content.clear()
        content.update(items)

    def check_variety(self):
        """Compare each unitVariety.json entry with variety_candidates() and elite_tiers().

        Entries are grouped by their game source (a tech, a civ's bonus, a team bonus); a group that
        differs from the game is replaced as a whole, so renamed, outdated or obsolete keys go away.
        Elite tiers are found by their name or their icon ("Castle Age" with the icon "eagle warrior"),
        checked for train time and cost, and added if missing. Keys in config.json "manualVariety" have
        no game source and are left alone.
        """
        for key, entry in self.variety.root.items():
            manual = set(self.config['manualVariety'].get(key, []))
            unit_id = self.find_unit_id(key)
            if unit_id is None:
                self.add('info', f'unitVariety.json {key}', 'no matching unit found in the game, so it is not checked '
                         '(renamed? add it to config.json "renames", otherwise map it in "units")')
                continue
            unit = dict(self.units[unit_id], id=unit_id)
            chain = {self.units[c]['name'].lower(): c for c in self.upgrade_chain(unit_id)}
            found_tiers = set()
            wanted = {'civs': {}, 'upgrades': {}}
            for candidate in self.variety_candidates(unit_id):
                if candidate.values.get('trainTime', 1) < 1:
                    # Usually a malus for another building than the one the calculator shows, which
                    # the effect does not name (Mapuche settlements)
                    self.add('info', f'unitVariety.json {key}/{candidate.key}',
                             f'{json.dumps(candidate.values)} slows training down, not added. Check it in the game; '
                             f'if it only applies to another building, add {candidate.tech_ids} to config.json "ignoreTechs"')
                    continue
                wanted[candidate.section].setdefault(candidate.owner, {})[candidate.key] = candidate.values
            for section_name, section in (('civs', entry['civs']), ('upgrades', entry['upgrades'])):
                current = {}
                for name, values in section.value().items():
                    where = f'unitVariety.json {key}/{name}'
                    img = values.get('img', '').removesuffix(' unit')
                    tier_id = chain.get(name.lower(), chain.get(img))
                    if tier_id is not None:
                        found_tiers.add(tier_id)
                        expected = self.tier_values(unit_id, tier_id)
                        actual = {'trainTime': values.get('trainTime'), **({'cost': values['cost']} if 'cost' in values else {})}
                        if actual != expected:
                            def update(s=section, n=name, e=expected):
                                tier = self.variety.object_content(s)[n]
                                tier.pop('cost', None)
                                tier.update(e)
                            self.add('diff', where, f'{json.dumps(actual)} -> {json.dumps(expected)}', update)
                        continue
                    if 'img' in values:
                        continue
                    if name in manual:
                        continue
                    owner = self.variety_owner(section_name, name)
                    if owner is None:
                        self.add('info', where, 'no game source found. Rename it to the tech name, or add it to '
                                 f'config.json "manualVariety" under "{key}" if it is not a tech or bonus')
                        continue
                    current.setdefault(owner, {})[name] = values
                for owner in list(current) + [o for o in wanted[section_name] if o not in current]:
                    old, new = current.get(owner, {}), wanted[section_name].get(owner, {})
                    if old.keys() == new.keys() and all(self.same_training(old[k], new[k], unit) for k in old):
                        continue
                    where = f'unitVariety.json {key}/{", ".join(old or new)}'
                    message = f'{json.dumps(old)} -> {json.dumps(new) if new else "removed"}' if old else json.dumps(new)
                    self.add('diff' if old else 'new', where, message,
                             lambda s=section, o=old, n=new: self.replace_variety(s, o, n))
            for tier_id in self.elite_tiers(unit_id):
                if tier_id not in found_tiers:
                    tier_name = self.units[tier_id]['name']
                    self.add('new', f'unitVariety.json {key}/{tier_name}', json.dumps(self.tier_values(unit_id, tier_id)),
                             lambda s=entry['upgrades'], n=tier_name, u=unit_id, i=tier_id:
                             self.add_tier(s, n, self.tier_entry(u, i)))

    def check_missing_variety(self):
        """Add unitVariety.json entries for calculator units that have none, if the game gives them
        techs, bonuses or elite tiers. check_variety() keeps them up to date from then on."""
        for name in dict.fromkeys(n.value() for group in self.units_show.root.children() for n in group.children()):
            unit_id = self.find_unit_id(name)
            if name in self.variety.root or unit_id is None:
                continue
            # A dry run: variety_entry() queues icon jobs and notes, which only the apply below should add
            images, findings = len(self.new_images), len(self.findings)
            entry = self.variety_entry(unit_id)
            del self.new_images[images:], self.findings[findings:]
            if entry['civs'] or entry['upgrades']:
                self.add('new', f'unitVariety.json {name}', json.dumps(entry),
                         lambda n=name, i=unit_id: self.variety.set_key(self.variety.root, n, self.variety_entry(i)))

    def civ_gather_bonuses(self, civ):
        """The gather bonuses a civ's bonus techs and tech tree effect give.

        Returns
        - bonuses: project resource -> extra share (0.15 = +15 %), as ecoBonuses.json stores it
        - derived: new resource name -> derivedGatherRates.json entry (config.json "specialResources")
        - labels: short descriptions for the name of a new ecoBonuses.json entry
        - checkable: resources whose bonus comes from a single tech without prerequisites, so the
          value in ecoBonuses.json can be compared directly (age-dependent bonuses cannot)
        """
        info = self.snapshot['civs'][civ]
        # The tech tree effect applies from the start like a bonus tech without prerequisites (Koreans)
        sources = [{'effects': info['techTreeBonus'], 'requiredTechs': []}] + [self.techs[t] for t in info['bonusTechs']]
        bonuses, derived, labels, techs_per_group = {}, {}, [], {}
        checkable = set()
        for tech in sources:
            factors = {}
            for group, gatherer in self.config['gatherers'].items():
                factor = self.work_rate_factor(tech, gatherer['units'])
                if factor is not None:
                    factors[group] = factor
            for effect_type, a, b, attribute, value in tech['effects']:
                special = self.config['specialResources'].get(str(a))
                if effect_type == EFFECT_RESOURCE_MODIFY and special:
                    share = round(value / 100, 3)
                    if special['kind'] == 'ecoBonus':
                        targets = self.special_targets(special)
                        for resource in targets:
                            bonuses[resource] = share
                        if not tech['requiredTechs']:
                            checkable |= set(targets)
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
        checkable |= {resource for group, techs in techs_per_group.items()
                      if len(techs) == 1 and not techs[0]['requiredTechs']
                      and group not in self.config['effectiveGatherRates']
                      for resource in self.config['gatherers'][group]['resources']}
        return bonuses, derived, labels, checkable

    def check_eco_bonuses(self):
        # Keys look like "Aztecs (Farms)" or "Japanese - Dark Age"
        civ_entries = self.eco.root['civ']
        covered_civs = {key.split(' ')[0] for key in civ_entries.keys()}
        manual = set(self.config['manualEcoBonuses'])
        existing_derived = self.derived.root
        for key, node in civ_entries.items():
            if node.value() and key.split(' ')[0] not in self.snapshot['civs'] and key not in manual:
                self.add('info', f'ecoBonuses.json {key}', 'civ not found in the game (renamed or removed?)')
        for civ in sorted(self.snapshot['civs']):
            bonuses, derived, labels, checkable = self.civ_gather_bonuses(civ)
            keys = [key for key in civ_entries.keys() if key.startswith(civ + ' ') and key not in manual]
            for key in keys:
                node = civ_entries[key]
                # A bonus the game no longer has is only reported: the entry may stand for a mechanic
                # the tool cannot see, which then belongs into config.json "manualEcoBonuses"
                removed = [resource for resource in node.value() if resource not in bonuses]
                if removed:
                    self.add('info', f'ecoBonuses.json {key}', 'no gather bonus found in the game for '
                             f'{", ".join(removed)}. Remove it if the bonus is gone, otherwise add the key '
                             'to config.json "manualEcoBonuses"')
                # Per-age entries hold age-dependent values that no single tech gives
                if 'Age' in key:
                    continue
                for resource, value in node.value().items():
                    if isinstance(value, (int, float)) and resource in checkable \
                            and not values_match(value, bonuses[resource]):
                        self.add_diff(f'ecoBonuses.json {key}', resource, node[resource], bonuses[resource])
                # New resources of a bonus (a new food resource for the Danes); with several entries
                # per civ it is unclear which one they belong to
                missing = [r for r in sorted(checkable) if r not in node.value() and bonuses[r] > 0]
                if len(keys) == 1:
                    for resource in missing:
                        self.add('new', f'ecoBonuses.json {key}', f'{resource}: {bonuses[resource]}',
                                 lambda n=node, r=resource, v=bonuses[resource]: self.eco.set_key(n, r, v))
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
        for name, node in existing_derived.items():
            civ = node['civ'].value()
            if civ not in self.snapshot['civs'] or name not in self.civ_gather_bonuses(civ)[1]:
                self.add('info', f'derivedGatherRates.json {name}', f'the game gives {civ} no such bonus anymore. '
                         'Remove the resource (also from order.json) or fix config.json "specialResources"')

    def check_unknown_resources(self):
        """Report engine resources in civ bonuses and civ techs that config.json does not know yet.

        New eco mechanics often come as a new engine resource whose meaning only the game executable
        knows (Malians gold miners, Varangians gold from food), so a new ID is a hint to check them.
        """
        known = set(self.config['knownResources']) | {int(k) for k in self.config['specialResources']}
        found = {}
        for civ, info in sorted(self.snapshot['civs'].items()):
            sources = [('tech tree', info['techTreeBonus']), ('team bonus', info['teamBonus'])]
            sources += [(f'tech {tech_id} "{tech["name"]}"', tech['effects'])
                        for tech_id, tech in sorted(self.techs.items()) if tech['civ'] == info['id']]
            for source, effects in sources:
                for effect_type, resource, *_ in effects:
                    if effect_type in EFFECT_RESOURCE_TYPES and resource not in known:
                        found.setdefault(resource, []).append(f'{civ} {source}')
        for resource, sources in sorted(found.items()):
            self.add('info', 'config.json knownResources', f'unknown engine resource {resource} in '
                     f'{", ".join(sources)}. If it changes gathering, add it to "specialResources", '
                     'otherwise to "knownResources"')

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
        """unitVariety.json entry: the elite_tiers(), plus the techs and bonuses from variety_candidates()
        (except those that slow training, check_variety() reports them)."""
        entry = {'civs': {}, 'upgrades': {}}
        for tier_id in self.elite_tiers(unit_id):
            entry['upgrades'][self.units[tier_id]['name']] = self.tier_entry(unit_id, tier_id)
        for candidate in self.variety_candidates(unit_id):
            if candidate.values.get('trainTime', 1) >= 1:
                entry[candidate.section][candidate.key] = candidate.values
        return entry

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
        group = self.units_show_group(unit_id)
        if group is not None:
            # Unique units come last in each group, sorted alphabetically
            position = None
            if category == 'unique':
                position = next((i for i, n in enumerate(n.value() for n in group.children())
                                 if n > name and self.is_unique(n)), None)
            self.units_show.append(group, name, position)
        self.new_images.append({'file': name, 'kind': category, 'unit': unit_id})

    def is_unique(self, project_name):
        unit_id = self.find_unit_id(project_name)
        return unit_id is not None and self.category(unit_id) == 'unique'

    def units_show_group(self, unit_id):
        """The unitsShow.json group of a new unit: the one with the most units trained in the same
        building (unique units of the castle included). None if no group fits."""
        building = self.units[unit_id]['trainLocations'][0]['location']

        def fits(project_name):
            other = self.find_unit_id(project_name)
            locations = self.units[other].get('trainLocations', []) if other is not None else []
            return bool(locations) and locations[0]['location'] == building
        counts = [(sum(map(fits, (n.value() for n in group.children()))), group)
                  for group in self.units_show.root.children()]
        count, group = max(counts, key=lambda c: c[0])
        return group if count else None

    def add_derived_resource(self, name, spec):
        """Add a resource like "gold from hunter" to derivedGatherRates.json and order.json, with icon."""
        self.derived.set_key(self.derived.root, name, spec)
        # order.json groups the resources by what they yield (food, wood, gold, stone)
        types = self.resource_types()
        group = next(g for g in self.order.root.children() if types[g[0]['name'].value()] == spec['res'])
        self.order.append(group, {'name': name, 'show': False})
        self.new_images.append({'file': name, 'kind': 'resource', 'source': spec['from'], 'res': spec['res'],
                                'civ': self.snapshot['civs'][spec['civ']]['internalName']})

    # --- Entry points ---

    def run(self):
        self.check_renames()
        self.check_units()
        self.check_upgrades()
        self.check_gathering()
        self.check_resources()
        self.check_variety()
        self.check_missing_variety()
        self.check_eco_bonuses()
        self.check_unknown_resources()
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
