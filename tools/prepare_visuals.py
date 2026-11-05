"""Compose the hero from existing store photographs, without generated products."""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'images'
canvas = Image.new('RGB', (1000, 900), '#eeece4')

for name, size, position, angle in [
    ('category-173', (450, 670), (480, 10), -15),
    ('category-174', (510, 750), (10, 85), 15),
]:
    photo = Image.open(ASSETS / f'{name}.webp').convert('RGBA')
    rgb = photo.convert('RGB')
    highest = ImageChops.lighter(ImageChops.lighter(rgb.getchannel('R'), rgb.getchannel('G')), rgb.getchannel('B'))
    lowest = ImageChops.darker(ImageChops.darker(rgb.getchannel('R'), rgb.getchannel('G')), rgb.getchannel('B'))
    chroma = ImageChops.subtract(highest, lowest)
    # Only remove neutral, light areas connected to the photograph's exterior.
    # This preserves highlights inside the ribbon and avoids rectangular edges.
    eligible = Image.new('L', photo.size)
    eligible.putdata([255 if light > 170 and saturation < 40 else 0
                      for light, saturation in zip(highest.tobytes(), chroma.tobytes())])
    w, h = eligible.size
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if eligible.getpixel(seed) == 255:
            ImageDraw.floodfill(eligible, seed, 128)
    mask = eligible.point(lambda value: 0 if value == 128 else 255).filter(ImageFilter.GaussianBlur(.65))
    # Restore pale highlights along the photographed roll's outside edge.
    # Coordinates refer to the cached 1000px photographs.
    highlight = ImageDraw.Draw(mask)
    if name == 'category-174':
        highlight.polygon([(250,160),(270,117),(309,80),(350,55),(393,48),(444,51),(480,64),(445,61),(400,69),(355,91),(315,127),(282,171),(259,215)], fill=255)
    else:
        highlight.polygon([(379,54),(310,70),(232,112),(169,169),(121,231),(82,329),(65,430),(65,526),(82,604),(104,641),(100,500),(129,371),(179,246),(253,138),(344,71)], fill=255)
    photo.putalpha(mask)
    photo.thumbnail(size)
    photo = photo.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    shadow = Image.new('RGBA', photo.size, (42, 40, 33, 0))
    shadow.putalpha(photo.getchannel('A').point(lambda value: int(value * .13)).filter(ImageFilter.GaussianBlur(14)))
    canvas.paste(shadow, (position[0] + 16, position[1] + 30), shadow)
    canvas.paste(photo, position, photo)

canvas.save(ASSETS / 'hero-materials.webp', 'WEBP', quality=91)
print('Hero composed from category-173 and category-174.')
