"""Regenerate all unit icons in src/img with icons.py.

Optional one-time cleanup: older unit icons come from different sources, some are white (player
color not tinted) or show the wrong unit. This script overwrites every unit icon the project
references (unitsShow.json, the units in data.json and the tier icons in unitVariety.json), so all
of them share the same style. Buildings and the icons of the resource display are left alone.

Review the result with `git diff --stat src/img` and revert unwanted icons with `git restore`.

Usage: python tools/gamedata/patch_icons.py [--game PATH]
"""
import argparse
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))  # allows running the script from any working directory

import extract  # noqa: E402
import icons  # noqa: E402
import sync  # noqa: E402
from gamedata import CONFIG, SNAPSHOT  # noqa: E402

UNIT_TYPE = 70  # trainable units; buildings (80) have other icon styles


def referenced_unit_icons(syncer):
    """Icon file name -> project unit name for all unit icons the project uses."""
    names = {}
    for group in sync.load_json(sync.SRC / 'data' / 'unitsShow.json'):
        names.update({name: name for name in group})
    for unit in syncer.data.root['units'].value():
        names.setdefault(unit['name'], unit['name'])
    for entry in syncer.variety.root.value().values():
        for tier, values in entry.get('upgrades', {}).items():
            if 'img' in values:
                names.setdefault(values['img'], tier.lower())
    return names


def unit_jobs(syncer):
    resource_icons = {item['name'] for group in syncer.order.root.value() for item in group}
    jobs, skipped = [], []
    for file, name in referenced_unit_icons(syncer).items():
        if file in resource_icons or not (icons.IMG / f'{file}.webp').exists():
            continue
        unit_id = syncer.find_unit_id(name)
        if unit_id is None or syncer.units[unit_id]['type'] != UNIT_TYPE:
            skipped.append(file)
            continue
        jobs.append({'file': file, 'kind': syncer.category(unit_id), 'unit': unit_id})
    return jobs, skipped


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--game', help='installation folder of AoE2DE (default: taken from the Steam libraries)')
    args = parser.parse_args()

    syncer = sync.Sync(sync.load_json(SNAPSHOT), sync.load_json(CONFIG))
    jobs, skipped = unit_jobs(syncer)
    icons.create(jobs, syncer.units, extract.find_game(args.game), overwrite=True)
    print(f'\n{len(jobs)} unit icons regenerated. '
          f'Skipped (no trainable unit in the snapshot): {", ".join(skipped) or "none"}')


if __name__ == '__main__':
    main()
