"""Render existing silent preview videos into lazy Canvas sprite sequences.

Requires FFmpeg and Pillow; original MP4s remain the authoritative inputs.
Frames keep their timeline (including holds/fades). Identical frames share a
tile, and atlases stay below 2560px per side for mobile decoding.
"""
from pathlib import Path
import hashlib, json, math, subprocess, tempfile
from PIL import Image

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / 'source/preview-frames'
FPS, WIDTH, COLUMNS, TILES = 12, 640, 4, 16
INPUTS = {
    **{f'{project}-{lang}': ROOT / f'source/project-previews/{project}/preview-with-cover-{lang}.mp4'
       for project in ('intelcup-2026', 'nuedc-c') for lang in ('zh', 'en')},
    'battery-method': ROOT / 'source/publication-figures/eecs-2026/method-preview.mp4',
}

def render(name, source):
    info = json.loads(subprocess.check_output(['/opt/homebrew/bin/ffprobe', '-v', 'error',
        '-show_entries', 'format=duration', '-of', 'json', str(source)]))
    duration = float(info['format']['duration'])
    destination = OUTPUT / name
    destination.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='qiushi-preview-frames-') as tmp:
        subprocess.run(['/opt/homebrew/bin/ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
            '-i', str(source), '-vf', f'fps={FPS},scale={WIDTH}:-2:flags=lanczos',
            str(Path(tmp) / 'frame-%05d.png')], check=True)
        paths = sorted(Path(tmp).glob('frame-*.png'))
        unique, hashes, frames = [], {}, []
        for path in paths:
            image = Image.open(path).convert('RGB')
            digest = hashlib.sha256(image.tobytes()).digest()
            if digest not in hashes:
                hashes[digest] = len(unique)
                unique.append(image)
            else:
                image.close()
            frames.append(hashes[digest])
        width, height = unique[0].size
        sheets = []
        for start in range(0, len(unique), TILES):
            batch = unique[start:start + TILES]
            atlas = Image.new('RGB', (width * COLUMNS, height * math.ceil(len(batch) / COLUMNS)), 'white')
            for offset, image in enumerate(batch):
                atlas.paste(image, ((offset % COLUMNS) * width, (offset // COLUMNS) * height))
            sheet = f'sheet-{start // TILES:03d}.webp'
            atlas.save(destination / sheet, 'WEBP', quality=85, method=6)
            sheets.append(sheet)
            atlas.close()
        manifest = {'version': 1, 'fps': FPS, 'duration': duration,
                    'replayStart': 0 if name == 'battery-method' else 2,
                    'width': width,
                    'height': height, 'columns': COLUMNS, 'tilesPerSheet': TILES,
                    'frames': frames, 'sheets': sheets,
                    'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest()}
        (destination / 'sequence.json').write_text(json.dumps(manifest, separators=(',', ':')) + '\n')
        for image in unique:
            image.close()
    return {'name': name, 'duration': duration, 'frames': len(frames), 'uniqueFrames': len(unique),
            'sheets': len(sheets), 'bytes': sum(p.stat().st_size for p in destination.iterdir())}

if __name__ == '__main__':
    print(json.dumps([render(name, path) for name, path in INPUTS.items()], indent=2))
