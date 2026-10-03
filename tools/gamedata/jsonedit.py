"""Edit hand-formatted JSON files in place.

The project's JSON files are formatted by hand (some objects on one line, others spread over
many). Loading them with json.load and dumping them again would reformat every file and bury
the real change in a huge git diff. This module instead parses a file into Nodes that remember
their character positions, collects text edits and applies them on save(), so everything that
is not edited keeps its exact formatting.

Usage:
    doc = Doc('src/data.json')
    unit = doc.root['units'].find('name', 'villager')
    doc.replace(unit['hp'], 30)
    doc.set_key(unit, 'speed', 0.8)
    doc.save()

Node positions always refer to the text as it was loaded. Edits are only collected, so any
number of them can be made before save() applies them all at once.
"""
import json
import re
from pathlib import Path

WHITESPACE = re.compile(r'\s*')
SCALAR = re.compile(r'-?\d+(\.\d+)?([eE][-+]?\d+)?|true|false|null')


def render(value, indent='    ', base='', sort_keys=False):
    """Format a value as JSON in the project style.

    Objects and lists of objects get one member per line, other lists stay on one line.
    `base` is the indentation of the line the value starts on, `indent` one indentation level.
    """
    if isinstance(value, dict):
        if not value:
            return '{}'
        items = sorted(value.items()) if sort_keys else value.items()
        inner = base + indent
        body = ',\n'.join(f'{inner}{json.dumps(str(k), ensure_ascii=False)}: {render(v, indent, inner, sort_keys)}'
                          for k, v in items)
        return '{\n' + body + '\n' + base + '}'
    if isinstance(value, list):
        if any(isinstance(v, dict) for v in value):
            inner = base + indent
            return '[\n' + ',\n'.join(inner + render(v, indent, inner, sort_keys) for v in value) + '\n' + base + ']'
        return '[' + ', '.join(render(v, indent, base, sort_keys) for v in value) + ']'
    return json.dumps(value, ensure_ascii=False)


class Node:
    """An object, array or scalar value in a Doc, located by its [start, end) character range.

    Objects and arrays offer a read-only, dict-like interface: node['key'], node[0], 'key' in node,
    get(), keys(), items(). value() parses the node's text into a plain Python value.
    """

    def __init__(self, doc, kind, start):
        self.doc = doc
        self.kind = kind  # 'object', 'array' or 'value'
        self.start = self.end = start
        self.members = []  # (key, Node) pairs; the key is None for array elements
        self.key_range = None  # [start, end) of the key text if this node is an object member

    def __getitem__(self, key):
        if self.kind == 'array':
            return self.members[key][1]
        for member_key, node in self.members:
            if member_key == key:
                return node
        raise KeyError(key)

    def __contains__(self, key):
        return any(member_key == key for member_key, _ in self.members)

    def get(self, key, default=None):
        return self[key] if key in self else default

    def keys(self):
        return [key for key, _ in self.members]

    def items(self):
        return list(self.members)

    def children(self):
        return [node for _, node in self.members]

    def find(self, key, value):
        """Return the first child object whose `key` has the given value, or None."""
        for node in self.children():
            if node.kind == 'object' and key in node and node[key].value() == value:
                return node
        return None

    def walk(self):
        """This node and all nodes below it."""
        yield self
        for child in self.children():
            yield from child.walk()

    def value(self):
        return json.loads(self.doc.text[self.start:self.end])

    def line_indent(self):
        """Indentation of the line this node starts on."""
        text = self.doc.text
        line_start = text.rfind('\n', 0, self.start) + 1
        return WHITESPACE.match(text, line_start).group()


class Doc:
    """A JSON file that can be edited without touching the formatting of unchanged parts."""

    def __init__(self, path):
        self.path = Path(path)
        self.text = self.path.read_text(encoding='utf-8')
        # (start, sequence number, end, new text); the sequence number keeps insertions at the
        # same position in the order they were made
        self.edits = []
        # Containers that are rendered in full on save: id(node) -> (node, content). Empty containers
        # have no member to copy the formatting from; object_content() also uses this
        self.filled_containers = {}
        self.removals = {}  # id(container) -> (container, indexes of the members to remove)
        self.root = self._parse(self._skip_whitespace(0))[0]
        # The smallest indentation in the file is its indentation step
        indents = {len(m) for m in re.findall(r'\n( +)\S', self.text)}
        self.indent = ' ' * (min(indents) if indents else 2)

    def _skip_whitespace(self, i):
        return WHITESPACE.match(self.text, i).end()

    def _string_end(self, i):
        i += 1
        while self.text[i] != '"':
            i += 2 if self.text[i] == '\\' else 1
        return i + 1

    def _parse(self, i):
        """Parse the value starting at position i. Returns the node and the position after it."""
        char = self.text[i]
        if char in '{[':
            node = Node(self, 'object' if char == '{' else 'array', i)
            close = '}' if char == '{' else ']'
            i = self._skip_whitespace(i + 1)
            while self.text[i] != close:
                key = key_range = None
                if node.kind == 'object':
                    end = self._string_end(i)
                    key, key_range = json.loads(self.text[i:end]), (i, end)
                    i = self._skip_whitespace(end)
                    assert self.text[i] == ':', f'{self.path}: ":" expected at {i}'
                    i = self._skip_whitespace(i + 1)
                child, i = self._parse(i)
                child.key_range = key_range
                node.members.append((key, child))
                i = self._skip_whitespace(i)
                if self.text[i] == ',':
                    i = self._skip_whitespace(i + 1)
            node.end = i + 1
            return node, i + 1
        node = Node(self, 'value', i)
        if char == '"':
            node.end = self._string_end(i)
        else:
            match = SCALAR.match(self.text, i)
            assert match, f'{self.path}: unexpected character at {i}'
            node.end = match.end()
        return node, node.end

    def _edit(self, start, end, text):
        self.edits.append((start, len(self.edits), end, text))

    def replace(self, node, value):
        self._edit(node.start, node.end, render(value, self.indent, node.line_indent()))

    def replace_lines(self, node, values):
        """Replace a node with an array that has one element per line, for long texts ("bonusDesc").

        render() keeps arrays without objects on one line.
        """
        if not values:
            self._edit(node.start, node.end, '[]')
            return
        base = node.line_indent()
        inner = base + self.indent
        # Keep the indentation of the current elements, the file is not indented consistently
        if node.members and '\n' in self.text[node.start:node.members[0][1].start]:
            inner = node.members[0][1].line_indent()
        body = ',\n'.join(inner + json.dumps(v, ensure_ascii=False) for v in values)
        self._edit(node.start, node.end, '[\n' + body + '\n' + base + ']')

    def set_key(self, obj, key, value):
        """Set a key of an object node. New keys are appended in the style of the last member."""
        if key in obj:
            self.replace(obj[key], value)
            return
        if not obj.members:
            self.filled_containers.setdefault(id(obj), (obj, {}))[1][key] = value
            return
        last = obj.members[-1][1]
        single_line = '\n' not in self.text[obj.start:last.start]
        if single_line:
            separator, member_indent = ', ', ''
        else:
            member_indent = last.line_indent()
            separator = ',\n' + member_indent
        rendered = render(value, self.indent, member_indent or obj.line_indent())
        self._edit(last.end, last.end, f'{separator}{json.dumps(key, ensure_ascii=False)}: {rendered}')

    def rename_key(self, obj, key, new_key):
        self._edit(*obj[key].key_range, json.dumps(new_key, ensure_ascii=False))

    def append(self, arr, value, index=None):
        """Insert a value into an array node before position `index` (default: at the end).

        The new element copies the style of the first element: one per line or all on one line,
        objects written compactly if the first element is a one-line object.
        """
        if not arr.members:
            self.filled_containers.setdefault(id(arr), (arr, []))[1].append(value)
            return
        first = arr.members[0][1]
        multiline = '\n' in self.text[arr.start:first.start]
        element_indent = first.line_indent() if multiline else ''
        separator = (',\n' + element_indent) if multiline else ', '
        if first.kind == 'object' and '\n' not in self.text[first.start:first.end]:
            rendered = json.dumps(value, ensure_ascii=False)
        else:
            rendered = render(value, self.indent, element_indent or arr.line_indent())
        if index is None or index >= len(arr.members):
            last = arr.members[-1][1]
            self._edit(last.end, last.end, separator + rendered)
        else:
            at = arr.members[index][1]
            self._edit(at.start, at.start, rendered + separator)

    def remove(self, container, key):
        """Remove an array element (key: index) or an object member (key: name) with its separator.

        Removals are collected per container and turned into edits on save(), so neighbouring
        members can be removed by separate calls without overlapping edits.
        """
        keys = container.keys() if container.kind == 'object' else list(range(len(container.members)))
        self.removals.setdefault(id(container), (container, set()))[1].add(keys.index(key))

    def _removal_edits(self, container, indexes):
        members = [node for _, node in container.members]

        def start(node):
            return node.key_range[0] if node.key_range else node.start

        kept = [i for i in range(len(members)) if i not in indexes]
        if not kept:
            self._edit(start(members[0]), members[-1].end, '')
            return
        # Members before the last kept one go with the separator after them, the ones after it
        # together with the separator before them
        for i in sorted(indexes):
            if i < kept[-1]:
                self._edit(start(members[i]), start(members[i + 1]), '')
        if kept[-1] < len(members) - 1:
            self._edit(members[kept[-1]].end, members[-1].end, '')

    def object_content(self, obj):
        """The value of an object node as a dict that save() writes back in full.

        For edits that remove or reorder keys. The object is rendered in the project style then, so
        no other edit may touch it (save() refuses overlapping edits).
        """
        return self.filled_containers.setdefault(id(obj), (obj, obj.value()))[1]

    def changed(self):
        return bool(self.edits or self.filled_containers or self.removals)

    def save(self):
        for node, content in self.filled_containers.values():
            self._edit(node.start, node.end, render(content, self.indent, node.line_indent()))
        for container, indexes in self.removals.values():
            self._removal_edits(container, indexes)
        edits = sorted(self.edits)
        for (_, _, end, _), (next_start, _, _, _) in zip(edits, edits[1:]):
            if next_start < end:
                raise ValueError(f'{self.path}: overlapping edits at {next_start}')
        text = self.text
        # Apply from the end of the file backwards so earlier positions stay valid
        for start, _, end, new_text in reversed(edits):
            text = text[:start] + new_text + text[end:]
        json.loads(text)  # refuse to write broken JSON
        self.path.write_text(text, encoding='utf-8')
        self.text, self.edits, self.filled_containers, self.removals = text, [], {}, {}
