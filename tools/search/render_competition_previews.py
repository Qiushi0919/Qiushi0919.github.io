"""Render sequential, source-faithful competition thumbnails with cyclic fades.

Run using the project Python runtime after fetching the six public Intel inputs.
Existing figures and experiments are never modified. Output is silent H.264.
"""
from pathlib import Path
import hashlib, json, subprocess

ROOT = Path(__file__).resolve().parent
FFMPEG = '/opt/homebrew/bin/ffmpeg'
FFPROBE = '/opt/homebrew/bin/ffprobe'
FPS = 24
FADE = .5
INTEL_SCENE_SECONDS = (2.8, 2.3, 1.5, 2.5, None, 2)
C_SCENE_SECONDS = 2
INTEL_FILES = ['flight-summary.mp4', 'self-check.mp4', 'simulation.mp4',
               'free-route.mp4', 'gesture-gaze.mp4', 'text-recognition.mp4']


def probe(path):
    info = json.loads(subprocess.check_output([FFPROBE, '-v', 'quiet', '-show_format', '-show_streams', '-of', 'json', str(path)]))
    stream = next(s for s in info['streams'] if s['codec_type'] == 'video')
    return info, stream


def intel_durations(originals):
    return [target if target is not None else round(originals[i]*FPS)/FPS
            for i, target in enumerate(INTEL_SCENE_SECONDS)]


def cyclic_fades(labels, durations):
    # Begin after the first clip's fade-in. Finish with its opening frames, so
    # the loop resumes at exactly the same phase rather than jumping to frame 0.
    filters = [f'[{labels[0]}]split=2[firstmain][firsthead]',
               f'[firstmain]trim=start={FADE},setpts=PTS-STARTPTS[first]',
               f'[firsthead]trim=duration={FADE},setpts=PTS-STARTPTS[wrap]']
    current, elapsed = 'first', durations[0] - FADE
    for index, (label, duration) in enumerate(zip(labels[1:]+['wrap'], durations[1:]+[FADE])):
        target = f'joined{index}'
        filters.append(f'[{current}][{label}]xfade=transition=fade:duration={FADE}:offset={elapsed-FADE:.6f}[{target}]')
        current = target
        elapsed += duration - FADE
    return filters, current, elapsed


def encode(inputs, filters, output_label, duration, output):
    output.parent.mkdir(parents=True, exist_ok=True)
    command = [FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-filter_complex_threads', '1']
    for args in inputs:
        command += args
    command += ['-filter_complex', ';'.join(filters), '-map', '['+output_label+']',
                '-t', f'{duration:.6f}', '-an', '-c:v', 'libx264', '-preset', 'medium',
                '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(output)]
    subprocess.run(command, check=True)
    poster = output.with_suffix('.jpg')
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(output),
                    '-frames:v', '1', '-update', '1', str(poster)], check=True)
    return poster


def record(path):
    return {'path': str(path.relative_to(ROOT.parent)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def main():
    source = ROOT / 'source/project-previews'
    intel = source / 'intelcup-2026'
    files = [intel/'inputs'/name for name in INTEL_FILES]
    original_durations = [float(probe(path)[0]['format']['duration']) for path in files]
    durations = intel_durations(original_durations)
    inputs = [['-i', str(path)] for path in files]
    filters = [f'[{i}:v]setpts=(PTS-STARTPTS)*{d/original_durations[i]:.12f},fps={FPS},scale=1080:720:force_original_aspect_ratio=decrease,pad=1080:720:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,format=yuv420p,tpad=stop_mode=clone:stop_duration=0.1,trim=duration={d},settb=1/{FPS},setpts=PTS-STARTPTS[v{i}]' for i,d in enumerate(durations)]
    transitions, label, duration = cyclic_fades([f'v{i}' for i in range(6)], durations)
    filters += transitions
    video = intel / 'preview-sequence.mp4'
    encode(inputs, filters, label, duration, video)
    (intel/'sequence-sources.json').write_text(json.dumps({'dimensions':[1080,720], 'fps':FPS,
        'fade_seconds':FADE,'duration_seconds':duration,'sound':False,
        'fit':'contain with white padding; no cropping or stretching',
        'order':INTEL_FILES,'scene_duration_seconds':durations,'original_duration_seconds':original_durations,'retiming':'complete original clips; speed adjusted to target duration','inputs':[record(path) for path in files]},indent=2)+'\n')
    print(json.dumps({'intel':str(video),'duration':duration,'bytes':video.stat().st_size}),flush=True)
    public = ROOT.parent / 'project-sites/nuedc-c/website/public'
    cfiles = [public/'images/test-integrated.jpg',public/'images/software-unlock.png',
              public/'report/pdoa-principle.png',public/'report/program-flow.png']
    inputs = [['-loop','1','-framerate',str(FPS),'-t',str(C_SCENE_SECONDS),'-i',str(path)] for path in cfiles]
    filters = [f'[{i}:v]scale=1280:960:force_original_aspect_ratio=decrease,pad=1280:960:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,format=yuv420p,settb=1/{FPS},setpts=PTS-STARTPTS[v{i}]' for i in range(2)]
    filters += [f'[2:v]scale=716:936:force_original_aspect_ratio=decrease,pad=736:960:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,format=yuv420p,settb=1/{FPS},setpts=PTS-STARTPTS[left]',
                f'[3:v]scale=520:936:force_original_aspect_ratio=decrease,pad=544:960:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,format=yuv420p,settb=1/{FPS},setpts=PTS-STARTPTS[right]',
                '[left][right]hstack=inputs=2[v2]']
    transitions, label, duration = cyclic_fades(['v0','v1','v2'], [C_SCENE_SECONDS]*3)
    filters += transitions
    video = source/'nuedc-c/preview-sequence.mp4'
    encode(inputs, filters, label, duration, video)
    (video.parent/'sequence-sources.json').write_text(json.dumps({'dimensions':[1280,960],
        'fps':FPS,'fade_seconds':FADE,'duration_seconds':duration,'sound':False,
        'order':['Complete hardware','Unlock interface','PDoA principle left / control loop right'],
        'scene_duration_seconds':[C_SCENE_SECONDS]*3,'fit':'contain; original figures retained in full', 'inputs':[record(path) for path in cfiles]},indent=2)+'\n')
    print(json.dumps({'c_topic':str(video),'duration':duration,'bytes':video.stat().st_size}),flush=True)


if __name__ == '__main__': main()
