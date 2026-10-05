"""Convert the supplied artwork to website icon formats using macOS sips."""
from pathlib import Path
import re
import struct
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parent
DESTINATION = ROOT / 'source/favicon'
ORIGINAL = DESTINATION / 'original.png'


def sips(*args):
    return subprocess.check_output(['/usr/bin/sips', *map(str, args)], text=True)


dimensions = sips('-g', 'pixelWidth', '-g', 'pixelHeight', ORIGINAL)
width = int(re.search(r'pixelWidth: (\d+)', dimensions).group(1))
height = int(re.search(r'pixelHeight: (\d+)', dimensions).group(1))

with tempfile.TemporaryDirectory(prefix='portfolio-favicon-') as temporary:
    square = Path(temporary) / 'square.png'
    sips('--padToHeightWidth', max(width, height), max(width, height),
         '--padColor', '3A5096', ORIGINAL, '--out', square)
    for size, filename in [(192, 'qiushi-favicon.png'), (180, 'apple-touch-icon.png')]:
        sips('--resampleHeightWidth', size, size, square, '--out', DESTINATION / filename)
    images = []
    for size in (16, 32, 48, 96):
        frame = Path(temporary) / f'{size}.png'
        sips('--resampleHeightWidth', size, size, square, '--out', frame)
        images.append((size, frame.read_bytes()))
    header = struct.pack('<HHH', 0, 1, len(images))
    offset = len(header) + 16 * len(images)
    directory = bytearray()
    for size, data in images:
        directory.extend(struct.pack('<BBBBHHII', size, size, 0, 0, 1, 32,
                                     len(data), offset))
        offset += len(data)
    (DESTINATION / 'favicon.ico').write_bytes(
        header + directory + b''.join(data for _, data in images))

print(f'Generated website icons from {width}×{height} artwork.')
