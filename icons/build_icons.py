"""Rebuild the hand-drawn GitHub Assets icon; requires Pillow only.
SVG and raster share a 64-unit canvas. Touch/PWA icons stay fully opaque.
Run: python3 icons/build_icons.py (from any working directory).
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
PREVIEW = ROOT.parent.parent / 'favicon-preview'
PREVIEW.mkdir(parents=True, exist_ok=True)


def draw_icon(size, rounded=True):
    # Supersampling preserves the silhouette and sun at 16px.
    n = max(512, size * 4)
    scale = n / 64
    start, end = (89, 101, 242), (116, 98, 220)
    ramp = Image.linear_gradient('L').resize((2 * n, 2 * n))
    ramp = ramp.transform((n, n), Image.Transform.AFFINE, (1, 0, 0, 1, 1, 0))
    gradient = Image.composite(Image.new('RGBA', (n, n), end + (255,)),
                               Image.new('RGBA', (n, n), start + (255,)), ramp)
    image = gradient.copy()
    if rounded:
        mask = Image.new('L', (n, n), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, n - 1, n - 1), radius=14 * scale, fill=255)
        image.putalpha(mask)
    d = ImageDraw.Draw(image)
    def box(coords):
        return tuple(round(v * scale) for v in coords)
    # Stroke centered on SVG frame boundary: x15 y17 w34 h30 rx5.
    d.rounded_rectangle(box((13, 15, 51, 49)), radius=7 * scale, fill='white')
    # Erase the inner frame by restoring the original gradient.
    hole = Image.new('L', (n, n), 0)
    ImageDraw.Draw(hole).rounded_rectangle(box((17, 19, 47, 45)), radius=3 * scale, fill=255)
    image.paste(gradient, (0, 0), hole)
    d = ImageDraw.Draw(image)
    d.ellipse(box((37, 23, 43, 29)), fill='white')
    d.polygon([(round(x * scale), round(y * scale)) for x, y in
               [(17, 43), (28, 31), (36, 39), (41, 34), (47, 40), (47, 45), (17, 45)]], fill='white')
    image = image.resize((size, size), Image.Resampling.LANCZOS)
    return image if rounded else image.convert('RGB')


for size in (16, 32, 48, 64):
    draw_icon(size).save(ROOT / f'favicon-{size}.png', optimize=True)
for size in (180, 192, 512):
    name = 'apple-touch-icon.png' if size == 180 else f'icon-{size}.png'
    draw_icon(size, rounded=False).save(ROOT / name, optimize=True)
draw_icon(48).save(ROOT / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
draw_icon(512).save(PREVIEW / 'icon-preview.png', optimize=True)

# Decode every output, verify dimensions/opacity and ICO directory entries.
for path in sorted(ROOT.glob('*.png')):
    with Image.open(path) as im:
        im.load()
        if path.name.startswith(('apple-', 'icon-')):
            assert im.mode == 'RGB', f'{path.name} must be opaque'
        print(f'{path.name}: {im.format}, {im.size}, {im.mode}, {path.stat().st_size} bytes')
with Image.open(ROOT / 'favicon.ico') as im:
    assert im.ico.sizes() == {(16, 16), (32, 32), (48, 48)}
    for size in sorted(im.ico.sizes()):
        im.ico.getimage(size).load()
    print('favicon.ico: verified embedded 16/32/48 PNG frames')
