"""Compose bilingual covers and complete original demos into a seamless cycle.

The first cover holds 1.5 seconds, then crossfades for 0.5 seconds. Original
Intel clips are retimed (never cropped) to 4/4/3/3/original/3 seconds. C-topic
figures each occupy 3.5-second segments. Every boundary has a 0.5-second overlap.
"""
from pathlib import Path
import json
from render_competition_previews import probe, cyclic_fades, encode, INTEL_FILES, FPS, FADE
ROOT=Path(__file__).resolve().parent
records=[]
for project in ['intelcup-2026','nuedc-c']:
 directory=ROOT/'source/project-previews'/project
 for lang in ['zh','en']:
  cover=directory/f'cover-{lang}.jpg'
  output=directory/f'preview-with-cover-{lang}.mp4'
  inputs=[['-loop','1','-framerate',str(FPS),'-t','2.5','-i',str(cover)]]
  size='1080:720' if project=='intelcup-2026' else '1280:960'
  filters=[f'[0:v]fps={FPS},scale={size},setsar=1,format=yuv420p,settb=1/{FPS},setpts=PTS-STARTPTS[cover]']
  if project=='intelcup-2026':
   files=[directory/'inputs'/name for name in INTEL_FILES]
   originals=[float(probe(path)[0]['format']['duration']) for path in files]
   durations=[4,4,3,3,round(originals[4]*FPS)/FPS,3]
   inputs += [['-i',str(path)] for path in files]
   for i,d in enumerate(durations):
    filters.append(f'[{i+1}:v]setpts=(PTS-STARTPTS)*{d/originals[i]:.12f},fps={FPS},scale=1080:720:force_original_aspect_ratio=decrease,pad=1080:720:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,format=yuv420p,tpad=stop_mode=clone:stop_duration=0.1,trim=duration={d},settb=1/{FPS},setpts=PTS-STARTPTS[v{i}]')
   labels=['cover']+[f'v{i}' for i in range(6)]
  else:
   public=ROOT.parent/'project-sites/nuedc-c/website/public'
   files=[public/'images/test-integrated.jpg',public/'images/software-unlock.png',public/'report/pdoa-principle.png',public/'report/program-flow.png']
   inputs += [['-loop','1','-framerate',str(FPS),'-t','3.5','-i',str(path)] for path in files]
   durations=[3.5,3.5,3.5]
   for i in range(2):
    filters.append(f'[{i+1}:v]scale=1280:960:force_original_aspect_ratio=decrease,pad=1280:960:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,format=yuv420p,settb=1/{FPS},setpts=PTS-STARTPTS[v{i}]')
   filters += [f'[3:v]scale=716:936:force_original_aspect_ratio=decrease,pad=736:960:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,format=yuv420p,settb=1/{FPS},setpts=PTS-STARTPTS[left]',f'[4:v]scale=520:936:force_original_aspect_ratio=decrease,pad=544:960:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,format=yuv420p,settb=1/{FPS},setpts=PTS-STARTPTS[right]','[left][right]hstack=inputs=2[v2]']
   labels=['cover','v0','v1','v2']
  transitions,label,duration=cyclic_fades(labels,[2.5]+durations)
  filters+=transitions
  # The poster layer uses the separately rendered cover JPEG. encode also saves
  # a first-frame still for frame verification; it is not a second thumbnail.
  encode(inputs,filters,label,duration,output)
  records.append({'project':project,'language':lang,'output':str(output.relative_to(ROOT)),
   'scene_seconds':durations,'cover_hold':1.5,'crossfade':FADE,'duration_seconds':duration,
   'retiming':'Full original clips; speed adjusted; no trimming of content'})
  print(json.dumps(records[-1]),flush=True)
(ROOT/'docs/preview-replay-covers-20261006/media-build.json').write_text(json.dumps(records,indent=2)+'\n')
