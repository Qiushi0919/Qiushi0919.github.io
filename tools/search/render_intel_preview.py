"""Arrange the six existing Intel Cup demonstrations into two rows of three."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import urlopen
import argparse, hashlib, json, shutil, subprocess

ROOT = Path(__file__).resolve().parent
SOURCES = [
    ('flight-summary.mp4', 'assets/portfolio-cover/flight-summary.mp4'),
    ('self-check.mp4', 'assets/nationals/demos/self-check.mp4'),
    ('simulation.mp4', 'assets/portfolio-cover/simulation.mp4'),
    ('free-route.mp4', 'assets/portfolio-cover/free-route.mp4'),
    ('gesture-gaze.mp4', 'assets/portfolio-cover/gesture-gaze.mp4'),
    ('text-recognition.mp4', 'assets/portfolio-cover/text-recognition.mp4'),
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input-directory', type=Path, required=True)
    args = parser.parse_args()
    folder = args.input_directory
    folder.mkdir(parents=True, exist_ok=True)
    def download(entry):
        name, path = entry
        target = folder/name
        if not target.exists():
            with urlopen('https://qiushi0919.cn/'+path,timeout=45) as response:
                target.write_bytes(response.read())
        return {'url':'https://qiushi0919.cn/'+path,'name':name,
                'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
    with ThreadPoolExecutor(max_workers=3) as pool:
        records = list(pool.map(download, SOURCES))
    output = ROOT/'source/project-previews/intelcup-2026'
    output.mkdir(parents=True, exist_ok=True)
    ffmpeg = shutil.which('ffmpeg') or '/opt/homebrew/bin/ffmpeg'
    command = [ffmpeg,'-hide_banner','-loglevel','error','-y']
    for name, _ in SOURCES:
        command += ['-stream_loop','-1','-i',str(folder/name)]
    filters = [f'[{i}:v]fps=20,scale=360:240:force_original_aspect_ratio=decrease,pad=360:240:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,setpts=PTS-STARTPTS[v{i}]' for i in range(6)]
    filters.append('[v0][v1][v2][v3][v4][v5]xstack=inputs=6:layout=0_0|360_0|720_0|0_240|360_240|720_240:fill=white[v]')
    video = output/'preview-2x3.mp4'
    command += ['-filter_complex',';'.join(filters),'-map','[v]','-t','12','-an','-c:v','libx264','-preset','medium','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',str(video)]
    subprocess.run(command,check=True)
    subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-ss','1','-i',str(video),'-frames:v','1','-update','1',str(output/'preview-2x3.jpg')],check=True)
    (output/'sources.json').write_text(json.dumps({'layout':'2 rows x 3 columns','dimensions':[1080,480],
        'duration_seconds':12,'fps':20,'sound':False,'fit':'contain; original aspect ratios, no cropping',
        'inputs':records},indent=2)+'\n')
    print(json.dumps({'video':str(video),'bytes':video.stat().st_size,'dimensions':[1080,480]}))


if __name__=='__main__':
    main()
