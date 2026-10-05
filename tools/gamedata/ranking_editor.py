"""Local editor for the civ ranking ratings in src/data.json.

Serves ranking_editor.html with two views:
- Civs: the civs' "ranks", "ranksUnique" and "bonusDesc" and the review rounds of TODO_RANKINGS.txt (see
  todo_rankings.py). Which notes are done the page keeps in the browser.
- Unit upgrades: the techs a unit's tooltip shows ("relevantUpgrades"), with the upgrade groups and the
  buildings of the techs they use ("upgradeGroups", "upgradeBuilding") and the units sharing a list ("unitGroups").
Edits go back to data.json via jsonedit, so only the edited values change in the git diff.

Usage:
  npm run ranking:edit
  python tools/gamedata/ranking_editor.py [--port 8765] [--no-browser]

The server only listens on localhost. It is a maintainer tool and not part of the website build (src/).
"""
import argparse
import json
import sys
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))  # allows running the script from any working directory

import todo_rankings  # noqa: E402
from jsonedit import Doc  # noqa: E402

ROOT = HERE.parents[1]
DATA = ROOT / 'src' / 'data.json'
IMG = ROOT / 'src' / 'img'
PAGE = HERE / 'ranking_editor.html'
EDITABLE = ('bonusDesc', 'ranksUnique', 'ranks')
UPGRADE_KEYS = ('relevantUpgrades', 'unitGroups', 'upgradeGroups', 'upgradeBuilding')
RANK_VALUES = {x / 2 for x in range(9)}  # 0 (F) to 4 (S) in half steps, see "rankConversion"


def validate(value):
    """Error message for edited values the civ ranking page cannot show, or None."""
    if not all(isinstance(t, str) for t in value['bonusDesc']):
        return 'bonusDesc must be a list of texts'
    for pair in value['ranksUnique']:
        if not (len(pair) == 2 and isinstance(pair[0], str) and pair[0] and all(isinstance(u, str) for u in pair[1])):
            return f'ranksUnique: invalid entry {pair}'
    for building, units in value['ranks'].items():
        for unit, ranks in units.items():
            if len(ranks) > 4 or any(r not in RANK_VALUES for r in ranks):
                return f'ranks {building}/{unit}: up to 4 values from 0 to 4 in steps of 0.5 expected'
    return None


def validate_upgrades(value):
    """Error message for unit upgrade data civ-ranking.js would fail on, or None."""
    for key in UPGRADE_KEYS:
        if not isinstance(value[key], dict):
            return f'{key} must be an object'
    relevant, unit_groups, groups, buildings = (value[key] for key in UPGRADE_KEYS)
    if not all(isinstance(v, str) for v in [*unit_groups.values(), *buildings.values()]):
        return 'unitGroups and upgradeBuilding must map names to names'
    for name, members in groups.items():
        if not (isinstance(members, list) and members and all(isinstance(m, str) for m in members)):
            return f'upgradeGroups {name}: a list of at least one name expected'
    for unit, entries in relevant.items():
        if not (isinstance(entries, list) and all(isinstance(e, str) for e in entries)) or len(set(entries)) < len(entries):
            return f'relevantUpgrades {unit}: a list of different names expected'
        for entry in entries:
            # The page looks every tech up in the tech tree building "upgradeBuilding" names
            techs = groups.get(entry, [entry])
            if missing := [t for t in techs if t not in buildings]:
                return f'relevantUpgrades {unit}: no building in upgradeBuilding for {", ".join(missing)}'
    return None


def patch(doc, node, old, new):
    """Change an object node from `old` to `new` member by member, so unchanged members keep their formatting."""
    if old == new:
        return
    if isinstance(old, dict) and isinstance(new, dict) and any(key in new for key in old):
        for key in old:
            if key not in new:
                doc.remove(node, key)
        for key, value in new.items():
            if key in old:
                patch(doc, node[key], old[key], value)
            else:
                doc.set_key(node, key, value)
        return
    doc.replace(node, new)


def save(civ_name, base, value):
    """Write the edited values of a civ. Returns (HTTP status, response)."""
    if error := validate(value):
        return 400, {'error': error}
    doc = Doc(DATA)
    civ = doc.root['civilizations'].find('name', civ_name)
    if civ is None:
        return 404, {'error': f'civ {civ_name} not in data.json'}
    current = {key: civ[key].value() if key in civ else None for key in EDITABLE}
    if current != base:
        return 409, {'error': f'The ratings of {civ_name} in data.json changed since the editor loaded them.'}
    for key in EDITABLE:
        if key not in civ:
            doc.set_key(civ, key, value[key])
        elif key == 'bonusDesc':
            if current[key] != value[key]:
                doc.replace_lines(civ[key], value[key])
        else:
            patch(doc, civ[key], current[key], value[key])
    if doc.changed():
        doc.save()
    return 200, {'ok': True}


def save_upgrades(base, value):
    """Write the edited unit upgrade data (UPGRADE_KEYS). Returns (HTTP status, response)."""
    if error := validate_upgrades(value):
        return 400, {'error': error}
    doc = Doc(DATA)
    current = {key: doc.root[key].value() for key in UPGRADE_KEYS}
    if current != base:
        return 409, {'error': 'The unit upgrades in data.json changed since the editor loaded them.'}
    for key in UPGRADE_KEYS:
        patch(doc, doc.root[key], current[key], value[key])
    if doc.changed():
        doc.save()
    return 200, {'ok': True}


class Handler(BaseHTTPRequestHandler):
    def send(self, status, body, content_type='application/json; charset=utf-8'):
        if not isinstance(body, bytes):
            body = json.dumps(body, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/':
            self.send(200, PAGE.read_bytes(), 'text/html; charset=utf-8')
        elif path == '/data.json':
            self.send(200, DATA.read_bytes())
        elif path == '/notes':
            self.send(200, [{'name': name, 'notes': [{'civ': civ, 'note': note} for civ, note in items]}
                            for name, items in todo_rankings.read_rounds()])
        elif path.startswith('/img/'):
            file = (IMG / unquote(path[5:])).resolve()
            if file.parent != IMG.resolve() or not file.is_file():
                self.send(404, {'error': 'not found'})
                return
            types = {'.webp': 'image/webp', '.png': 'image/png'}
            self.send(200, file.read_bytes(), types.get(file.suffix, 'application/octet-stream'))
        else:
            self.send(404, {'error': 'not found'})

    def do_POST(self):
        try:
            request = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            if self.path == '/save':
                status, response = save(request['civ'], request['base'], request['value'])
            elif self.path == '/save-upgrades':
                status, response = save_upgrades(request['base'], request['value'])
            else:
                status, response = 404, {'error': 'not found'}
        except (KeyError, TypeError, ValueError) as e:
            status, response = 400, {'error': f'{type(e).__name__}: {e}'}
        self.send(status, response)

    def log_message(self, format, *args):
        pass  # one line per image request would bury the save messages


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    url = f'http://localhost:{args.port}/'
    print(f'Ranking editor: {url} (Ctrl+C to stop)')
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == '__main__':
    sys.exit(main())
