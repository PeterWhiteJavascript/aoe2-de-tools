"""Create the webp icons for new units and resources in src/img from the game's textures.

Unit icons imitate the tech tree tiles: the unit portrait inside the frame of its category
with the unit name below it. Resource icons put the civ emblem and the resource symbol on top
of the icon of the source resource (e.g. "gold from hunter": hunter icon + emblem + gold).
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
IMG = ROOT / 'src' / 'img'
ICON_SIZE = (80, 84)  # size of all icons in src/img
PLAYER = 'Player 1'   # blue, the player color of the unit portraits

# Unit category -> name part of the tech tree frame texture
FRAMES = {'generic': 'units', 'regional': 'regionalunit', 'unique': 'specialunits'}
# Positions in frame texture coordinates
PORTRAIT_BOX = (30, 13, 54, 53)  # x, y, width, height of the portrait
TILE_CROP = (15, 12, 99, 100)    # left, top, right, bottom of the tile within the texture
LABEL_Y = {1: 80, 2: 75}         # vertical center of the first label line, by number of lines
LABEL_MAX_FONT_SIZE, LABEL_MIN_FONT_SIZE = 12, 9


def game_paths(game):
    return {
        'frames': game / 'widgetui' / 'textures' / 'menu' / 'techtree' / 'normal',
        'portraits': game / 'widgetui' / 'textures' / 'ingame' / 'units',
        'sprite_colors': game / 'resources' / '_common' / 'palettes' / 'spritecolors.json',
        'resource_symbols': game / 'widgetui' / 'textures' / 'ingame' / 'icons',
        'civ_emblems': game / 'widgetui' / 'textures' / 'menu' / 'civs',
        'font': game / 'resources' / '_common' / 'fonts' / 'georgiab.ttf',
    }


def label_lines(draw, label, font, width):
    """Keep the label on one line if it fits, otherwise split it into the two most even lines."""
    if draw.textlength(label, font=font) <= width or ' ' not in label:
        return [label]
    words = label.split()
    best = None
    for i in range(1, len(words)):
        lines = [' '.join(words[:i]), ' '.join(words[i:])]
        widest = max(draw.textlength(line, font=font) for line in lines)
        if best is None or widest < best[0]:
            best = (widest, lines)
    return best[1]


def player_color(paths):
    rgba = json.loads(paths['sprite_colors'].read_text())['TeamColors'][PLAYER]['FloatRGBA']
    return rgba['r'], rgba['g'], rgba['b']


def unit_portrait(paths, icon_id):
    """Load the portrait and tint it in the player color like the game's UI shader (widgetui_ps).

    The alpha channel of the DDS is a mask: texels with alpha < 0.8 get the color
    (red + 0.2) * player color, all others keep their color. The PNGs in wpfg/uniticons are
    not used because they are only available for some units and come pre-tinted in another blue.
    """
    image = Image.open(paths['portraits'] / f'{icon_id:03d}_50730.dds').convert('RGBA')
    r, _, _, a = image.split()
    tinted = Image.merge('RGB', [r.point(lambda v, c=c: min(255, round((v + 51) * c))) for c in player_color(paths)])
    mask = a.point(lambda v: 255 if v < 204 else 0)  # 204 = 0.8 * 255
    return Image.composite(tinted, image.convert('RGB'), mask)


def unit_tile(paths, icon_id, label, category):
    frame_file = f'techtreepanel_{FRAMES[category]}_castleage_active_normal.png'
    frame = Image.open(paths['frames'] / frame_file).convert('RGBA')
    x, y, width, height = PORTRAIT_BOX
    frame.paste(unit_portrait(paths, icon_id).resize((width, height), Image.LANCZOS), (x, y))

    draw = ImageDraw.Draw(frame)
    usable_width = TILE_CROP[2] - TILE_CROP[0] - 4
    size = LABEL_MAX_FONT_SIZE
    font = ImageFont.truetype(str(paths['font']), size)
    lines = label_lines(draw, label, font, usable_width)
    while size > LABEL_MIN_FONT_SIZE and max(draw.textlength(line, font=font) for line in lines) > usable_width:
        size -= 1
        font = ImageFont.truetype(str(paths['font']), size)
    center_x = (TILE_CROP[0] + TILE_CROP[2]) / 2
    for i, line in enumerate(lines):
        line_y = LABEL_Y[len(lines)] + i * (size + 1)
        draw.text((center_x + 1, line_y + 1), line, font=font, fill=(0, 0, 0, 255), anchor='mm')  # shadow
        draw.text((center_x, line_y), line, font=font, fill=(255, 255, 255, 255), anchor='mm')

    tile = frame.crop(TILE_CROP)
    background = Image.new('RGBA', tile.size, (255, 255, 255, 255))
    return Image.alpha_composite(background, tile).convert('RGB').resize(ICON_SIZE, Image.LANCZOS)


def cover(image, size):
    """Scale the image to fill `size` and crop the overflow evenly from both sides."""
    scale = max(size[0] / image.width, size[1] / image.height)
    image = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)
    left, top = (image.width - size[0]) // 2, (image.height - size[1]) // 2
    return image.crop((left, top, left + size[0], top + size[1]))


def resource_tile(paths, source, resource, civ):
    base = cover(Image.open(IMG / f'{source}.webp').convert('RGBA'), ICON_SIZE)
    emblem = Image.open(paths['civ_emblems'] / f'{civ.lower()}.png').convert('RGBA')
    emblem = emblem.crop(emblem.getchannel('A').getbbox())  # remove the transparent border
    emblem.thumbnail((34, 38), Image.LANCZOS)
    base.alpha_composite(emblem, (2, 2))
    symbol = Image.open(paths['resource_symbols'] / f'resource_{resource}_transparent.png').convert('RGBA')
    symbol.thumbnail((30, 30), Image.LANCZOS)
    base.alpha_composite(symbol, (ICON_SIZE[0] - symbol.width - 2, 2))
    return base.convert('RGB')


def create(jobs, units, game, overwrite=False):
    """Create the icons for the jobs collected by sync.Sync.new_images. Existing files are kept
    unless `overwrite` is set.

    Job formats:
        {'file': name, 'kind': 'generic' | 'regional' | 'unique', 'unit': unit ID, 'replaces': old name (optional)}
        {'file': name, 'kind': 'resource', 'source': source resource, 'res': 'gold' | ..., 'civ': internal civ name}
    `units` is the snapshot's unit table (unit ID -> entry). Icons of renamed units ('replaces') are
    deleted once the new icon exists, including the old png versions.
    """
    paths = game_paths(Path(game))
    done = set()
    for job in jobs:
        target = IMG / f'{job["file"]}.webp'
        if (target.exists() and not overwrite) or target in done:
            continue
        if job['kind'] == 'resource':
            image = resource_tile(paths, job['source'], job['res'], job['civ'])
        else:
            unit = units[job['unit']]
            image = unit_tile(paths, unit['icon'], unit['name'], job['kind'])
        image.save(target, 'WEBP', quality=90, method=6)
        done.add(target)
        print(f'Icon created: {target.relative_to(ROOT)}')
        if 'replaces' in job:
            for old in (IMG / f'{job["replaces"]}.webp', IMG / f'{job["replaces"]}.png'):
                if old.exists():
                    old.unlink()
                    print(f'Icon removed: {old.relative_to(ROOT)}')
