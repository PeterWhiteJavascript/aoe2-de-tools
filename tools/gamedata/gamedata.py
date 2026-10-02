"""Keep the project data in sync with the AoE2:DE game data.

Commands:
  extract  read the installed game and write snapshot.json
  verify   compare the project with snapshot.json without changing anything
           (exit code 1 on differences or new things)
  patch    fix differences, add new units and resources, create missing icons
  update   extract + patch

--techtree runs these commands for the civ ranking tech trees only; patch and update write
TODO_RANKINGS.txt.

See README.md for the rules and config.json.
"""
import argparse
import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))  # allows running the script from any working directory

import extract  # noqa: E402
import sync  # noqa: E402

SNAPSHOT = HERE / 'snapshot.json'
CONFIG = HERE / 'config.json'
TITLES = {'diff': 'Differences', 'new': 'New in the game', 'info': 'Notes', 'ranking': 'Rankings to review'}
TODO_RANKINGS = sync.ROOT / 'TODO_RANKINGS.txt'
TODO_HEADER = """Civ ranking: what to review after the tech tree changes below
Written by "npm run techtree:update", overwritten on every run.

The ratings in src/data.json ("ranks", "ranksUnique") are editorial; the tool does not change them.
Once the tech trees are updated, the ratings still describe the old tech trees until they are
reviewed. Techs removed from the game stay in the tech trees as unavailable until nothing in
"By hand" names them anymore, because civ-ranking.js fails on names missing in a tech tree.
"""


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


def write_todo_rankings(findings):
    """Write the findings the maintainer has to handle to TODO_RANKINGS.txt and open it."""
    sections = [('Tech tree changes', [f for f in findings if f.kind in ('diff', 'new')]),
                ('By hand', [f for f in findings if f.kind == 'info']),
                ('Rankings to review', [f for f in findings if f.kind == 'ranking'])]
    text = TODO_HEADER
    for title, items in sections:
        text += f'\n== {title} ({len(items)}) ==\n' + ''.join(f'  {f.where}: {f.message}\n' for f in items)
    TODO_RANKINGS.write_text(text, encoding='utf-8')
    print(f'\nWritten: {TODO_RANKINGS.name}')
    try:
        if sys.platform == 'win32':
            os.startfile(TODO_RANKINGS)
        else:
            subprocess.Popen(['open' if sys.platform == 'darwin' else 'xdg-open', str(TODO_RANKINGS)])
    except OSError:
        pass  # no program to open it; the path is printed above


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('command', choices=['extract', 'verify', 'patch', 'update'])
    parser.add_argument('--game', help='installation folder of AoE2DE (default: taken from the Steam libraries)')
    parser.add_argument('--stats', action='store_true', help='also check combat stats (hp, attack, armor, ...)')
    parser.add_argument('--techtree', action='store_true', help='check the civ ranking tech trees only')
    args = parser.parse_args()

    game = None
    if args.command in ('extract', 'update'):
        game = extract.find_game(args.game)
        config = sync.load_json(CONFIG)
        # IDs pinned in config.json must be in the snapshot even if no tech tree lists them
        pinned_units = [*config['units'].values(), *config['renames'].values()]
        pinned_techs = [*config['upgrades'].values(), *config['techRenames'].values()]
        snapshot = extract.extract(game, pinned_units, pinned_techs)
        extract.write_snapshot(snapshot, SNAPSHOT)
        meta = snapshot['meta']
        print(f'{SNAPSHOT.name}: {meta["datVersion"]}, build {meta["buildId"]}, '
              f'{len(snapshot["units"])} units, {len(snapshot["techs"])} Techs')
        if args.command == 'extract':
            return 0

    syncer = sync.Sync(sync.load_json(SNAPSHOT), sync.load_json(CONFIG), args.stats)
    findings = syncer.run(args.techtree)
    report(findings)
    if args.command == 'verify':
        return 1 if any(f.kind in ('diff', 'new') for f in findings) else 0

    # Written before applying: afterwards the changes are no longer visible
    if args.techtree:
        write_todo_rankings(findings)
    findings_before_apply = len(findings)
    changed = syncer.apply()
    if args.techtree:
        syncer.write_techtree_baseline()
    report(syncer.findings[findings_before_apply:])
    if syncer.new_images:
        import icons  # only needed here; avoids loading Pillow for extract and verify
        icons.create(syncer.new_images, syncer.units, game or extract.find_game(args.game))
    print('\nChanged: ' + (', '.join(str(Path(p).relative_to(sync.ROOT)) for p in changed) or 'nothing'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
