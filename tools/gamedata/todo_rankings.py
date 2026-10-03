"""The "Rankings to review" rounds of TODO_RANKINGS.txt.

`techtree:update` rewrites the file, but keeps the "Rankings to review" of earlier updates as rounds of their own, so
a review that is not finished when the next patch arrives is not lost. Reviewed rounds may be deleted from the file by
hand, but need not be. The ranking editor shows the rounds and keeps which notes are done in the browser.
"""
import re
from pathlib import Path

TODO_RANKINGS = Path(__file__).resolve().parents[2] / 'TODO_RANKINGS.txt'
TITLE = 'Rankings to review'
ROUND = re.compile(r'== Rankings to review(?:: (.+?))? \(\d+\) ==')


def notes_from_findings(findings):
    """(civ, note) pairs of the "ranking" findings of sync.py; their message is one "- note" line per change."""
    return [(f.where, line.strip()[2:]) for f in findings if f.kind == 'ranking'
            for line in f.message.splitlines() if line.strip().startswith('- ')]


def read_rounds(path=TODO_RANKINGS):
    """[(round name, [(civ, note), ...])] of a TODO file, newest first. Rounds without notes are left out."""
    path = Path(path)
    if not path.exists():
        return []
    rounds, current, civ = [], None, None
    for line in path.read_text(encoding='utf-8').splitlines():
        if line.startswith('== '):
            match = ROUND.match(line)
            # Files written before rounds existed have one unnamed section
            current = (match.group(1) or 'earlier update', []) if match else None
            if current:
                rounds.append(current)
            civ = None
        elif current is None:
            continue
        elif match := re.match(r' {2}(\S.*?):\s*$', line):
            civ = match.group(1)
        elif (match := re.match(r'\s+- (.+)', line)) and civ:
            current[1].append((civ, match.group(1).strip()))
    return [r for r in rounds if r[1]]


def add_round(rounds, name, notes):
    """The rounds with the notes of an update as round `name` in front.

    Notes an earlier round lists already stay there; a round of the same name (the update ran again for the same
    game build) is extended instead.
    """
    rounds = [(n, list(items)) for n, items in rounds]
    known = {pair for _, items in rounds for pair in items}
    new = [pair for pair in dict.fromkeys(notes) if pair not in known]
    same = next((items for n, items in rounds if n == name), None)
    if same is not None:
        same.extend(new)
        return rounds
    return [(name, new)] + rounds if new else rounds


def format_rounds(rounds):
    """The rounds as sections of TODO_RANKINGS.txt, in the format the report uses for the findings."""
    if not rounds:
        return f'\n== {TITLE} (0) ==\n'
    text = ''
    for name, items in rounds:
        by_civ = {}
        for civ, note in items:
            by_civ.setdefault(civ, []).append(note)
        text += f'\n== {TITLE}: {name} ({len(by_civ)}) ==\n'
        text += ''.join(f'  {civ}: \n' + ''.join(f'    - {note}\n' for note in notes) for civ, notes in by_civ.items())
    return text
