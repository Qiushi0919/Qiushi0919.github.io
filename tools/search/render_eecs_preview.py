"""Retime complete EECS stages; keep frozen-endpoint 0.55s dissolves.

The original 30fps source is retained alongside the output. Do not rerender or
alter the research figures/data: only the presentation timeline changes.
"""
from pathlib import Path
import hashlib,json,shutil,subprocess
ROOT=Path(__file__).resolve().parent
DIRECTORY=ROOT/'source/publication-figures/eecs-2026'
ORIGINAL=DIRECTORY/'method-preview-original.mp4'
OUTPUT=DIRECTORY/'method-preview.mp4'
SOURCE_SHA='012822d017607c45c2927c720fbb74b9ea85ab7974c155927c3c1bef9442027a'
STAGES=[('Overview',0,1.5,1.5),('ALA–VMD',2.05,5.175,3.125),
        ('Input grouping',5.725,7.725,1.8),('BiTCN + Attention',8.275,10.675,2.4),
        ('Aggregation and result',11.225,16.233333,2.5)]
FPS=30
FADE=.55
LOOP_INTRO_EXTRA=1.2

def main():
    if not ORIGINAL.exists():
        assert hashlib.sha256(OUTPUT.read_bytes()).hexdigest()==SOURCE_SHA
        shutil.copy2(OUTPUT,ORIGINAL)
    assert hashlib.sha256(ORIGINAL.read_bytes()).hexdigest()==SOURCE_SHA
    filters=[]; lengths=[]
    for i,(_,start,end,target) in enumerate(STAGES):
        before=FADE if i else 0
        after=FADE if i<len(STAGES)-1 else 0
        filters.append(f'[0:v]trim=start={start}:end={end},setpts=(PTS-STARTPTS)*{target/(end-start):.12f},fps={FPS},tpad=stop_mode=clone:stop_duration=0.1,trim=duration={target},tpad=start_mode=clone:start_duration={before}:stop_mode=clone:stop_duration={after},settb=1/{FPS},setpts=PTS-STARTPTS[v{i}]')
        lengths.append(target+before+after)
    current='v0';elapsed=lengths[0]
    for i in range(1,len(STAGES)):
        label=f'joined{i}'
        filters.append(f'[{current}][v{i}]xfade=transition=fade:duration={FADE}:offset={elapsed-FADE:.9f}[{label}]')
        elapsed+=lengths[i]-FADE;current=label
    subprocess.run(['/opt/homebrew/bin/ffmpeg','-hide_banner','-loglevel','error','-y','-filter_complex_threads','1','-i',str(ORIGINAL),'-filter_complex',';'.join(filters),'-map',f'[{current}]','-t',str(elapsed),'-an','-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',str(OUTPUT)],check=True)
    duration=float(json.loads(subprocess.check_output(['/opt/homebrew/bin/ffprobe','-v','error','-show_entries','format=duration','-of','json',str(OUTPUT)]))['format']['duration'])
    record={'fps':FPS,'original_sha256':SOURCE_SHA,'output_sha256':hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
        'scene_seconds':{name:target for name,_,_,target in STAGES},'crossfade_seconds':FADE,
        'first_cycle_seconds':duration,'later_cycle_seconds':duration+LOOP_INTRO_EXTRA,
        'later_overview_seconds':STAGES[0][3]+LOOP_INTRO_EXTRA,'loop_intro_extra_seconds':LOOP_INTRO_EXTRA,
        'source_content_complete':True,'planned_first_cycle_seconds':elapsed}
    (DIRECTORY/'preview-timing.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(record,ensure_ascii=False),flush=True)

if __name__=='__main__': main()
