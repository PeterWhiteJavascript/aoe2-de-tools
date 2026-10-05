"""Keep the project data in sync with the AoE2:DE game data.

Commands:
  extract  read the installed game and write snapshot.json
  verify   compare the project with snapshot.json without changing anything
           (exit code 1 on differences or new things)
  patch    fix differences, add new units and resources, create missing icons
  update   extract + patch

See README.md for the rules and config.json.
"""
import argparse
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))  # allows running the script from any working directory

import extract  # noqa: E402
import sync  # noqa: E402

SNAPSHOT = HERE / 'snapshot.json'
CONFIG = HERE / 'config.json'
TITLES = {'diff': 'Differences', 'new': 'New in the game', 'info': 'Notes'}


def report(findings):
    for kind in TITLES:
        items = [f for f in findings if f.kind == kind]
        if not items:
            continue
        print(f'\n== {TITLES[kind]} ({len(items)}) ==')
        for finding in items:
            print(f'  {finding.where}: {finding.message}')
    if not findings:
        print('Project data matches the game data.')


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('command', choices=['extract', 'verify', 'patch', 'update'])
    parser.add_argument('--game', help='installation folder of AoE2DE (default: taken from the Steam libraries)')
    parser.add_argument('--stats', action='store_true', help='also check combat stats (hp, attack, armor, ...)')
    args = parser.parse_args()

    game = None
    if args.command in ('extract', 'update'):
        game = extract.find_game(args.game)
        config = sync.load_json(CONFIG)
        # IDs pinned in config.json must be in the snapshot even if no tech tree lists them
        pinned_units = [*config['units'].values(), *config['renames'].values()]
        snapshot = extract.extract(game, pinned_units, config['upgrades'].values())
        extract.write_snapshot(snapshot, SNAPSHOT)
        meta = snapshot['meta']
        print(f'{SNAPSHOT.name}: {meta["datVersion"]}, build {meta["buildId"]}, '
              f'{len(snapshot["units"])} units, {len(snapshot["techs"])} Techs')
        if args.command == 'extract':
            return 0

    syncer = sync.Sync(sync.load_json(SNAPSHOT), sync.load_json(CONFIG), args.stats)
    findings = syncer.run()
    report(findings)
    if args.command == 'verify':
        return 1 if any(f.kind in ('diff', 'new') for f in findings) else 0

    findings_before_apply = len(findings)
    changed = syncer.apply()
    report(syncer.findings[findings_before_apply:])
    if syncer.new_images:
        import icons  # only needed here; avoids loading Pillow for extract and verify
        icons.create(syncer.new_images, syncer.units, game or extract.find_game(args.game))
    print('\nChanged: ' + (', '.join(str(Path(p).relative_to(sync.ROOT)) for p in changed) or 'nothing'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
