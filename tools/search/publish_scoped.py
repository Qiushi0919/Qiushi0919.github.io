"""Publish an explicit file scope to CN and GitHub with hashes, backups and drift checks.

Run --spec <JSON> --prepare, review plan.json, then --spec <JSON> --publish.
No source directories or private inputs are uploaded implicitly.
"""
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse, base64, hashlib, json, shlex, shutil, subprocess, tarfile, tempfile
import time

ROOT = Path(__file__).resolve().parent
REPO = 'repos/Qiushi0919/Qiushi0919.github.io'
SSH = ['ssh', '-o', 'BatchMode=yes', '-o', 'ClearAllForwardings=yes', '182.92.61.100']

def api(path, method='GET', body=None):
    from urllib.request import Request, urlopen
    from urllib.error import HTTPError, URLError
    credential = subprocess.check_output(['/opt/homebrew/bin/gh','auth','token'], text=True).strip()
    request = Request('https://api.github.com/' + REPO + '/' + path,
        data=json.dumps(body,ensure_ascii=False).encode() if body is not None else None,
        method=method,headers={'Authorization':'Bearer '+credential,
            'User-Agent':'PortfolioReleaseCheck/1.0','Accept':'application/vnd.github+json',
            'Content-Type':'application/json'})
    for attempt in range(4):
        try:
            with urlopen(request, timeout=45) as response: return json.load(response)
        except HTTPError as error:
            if error.code not in (502,503,504) or attempt == 3: raise
        except (URLError,TimeoutError):
            if attempt == 3: raise
        time.sleep(2 ** attempt)

def digest(data):
    return hashlib.sha256(data).hexdigest() if data is not None else None

def gitsha(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() if data is not None else None

def content(origin):
    scope=SPEC[origin]
    result={}
    for name, source in scope['files'].items():
        assert not Path(name).is_absolute() and '..' not in Path(name).parts
        path=(ROOT/source).resolve()
        assert path.is_relative_to(ROOT) and '.private' not in path.parts
        result[name]=path.read_bytes()
    for name in scope.get('remove',[]):
        assert name not in result and not Path(name).is_absolute() and '..' not in Path(name).parts
        result[name]=None
    return result

def github_content(): return content('github')
def cn_content(): return {'portfolio/'+name:data for name,data in content('cn').items()}

def prepare():
    cn = cn_content()
    read_remote = '''from pathlib import Path
import hashlib,json,sys
roots={'portfolio':Path('/opt/portfolio'),'navigation':Path('/opt/opt/mining')}
result={}
for name in json.load(sys.stdin):
 group,path=name.split('/',1); file=roots[group]/path
 result[name]=hashlib.sha256(file.read_bytes()).hexdigest() if file.is_file() else None
print(json.dumps(result))
'''
    before = json.loads(subprocess.check_output(SSH + ['python3 -c ' + shlex.quote(read_remote)], input=json.dumps(list(cn)).encode()))
    gh = github_content()
    head = api('git/ref/heads/main')['object']['sha']
    tree = api('git/trees/' + head + '?recursive=1')
    assert not tree.get('truncated')
    old = {item['path']: item['sha'] for item in tree['tree'] if item['type'] == 'blob'}
    plan = {'version': SPEC['version'], 'prepared_at': datetime.now(ZoneInfo('Asia/Shanghai')).isoformat(),
            'github_head': head,
            'cn': {name: {'before': before[name], 'after': digest(data)} for name, data in cn.items() if before[name] != digest(data)},
            'github': {name: {'before': old.get(name), 'after': gitsha(data), 'sha256': digest(data)} for name, data in gh.items() if old.get(name) != gitsha(data)}}
    (HERE / 'plan.json').write_text(json.dumps(plan, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'prepared': True, 'cn_files': len(plan['cn']), 'github_files': len(plan['github']), 'github_head': head}))

def publish_cn(plan):
    content = cn_content()
    stage = HERE / 'release-staging'
    assert not stage.exists(), 'Use a fresh reviewed staging directory'
    for name, record in plan['cn'].items():
        assert digest(content[name]) == record['after'], 'Local changes after review: ' + name
        if content[name] is not None:
            path = stage / 'files' / name; path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content[name])
    shutil.copyfile(ROOT / 'deploy_scoped.py', stage / 'deploy.py')
    (stage / 'manifest.json').write_text(json.dumps({'files': plan['cn'], 'version': SPEC['version']}, indent=2))
    archive = HERE / 'cn-release.tar.gz'
    with tarfile.open(archive, 'w:gz') as tar:
        for file in stage.rglob('*'):
            if file.is_file(): tar.add(file, arcname=file.relative_to(stage).as_posix())
    remote = '/tmp/portfolio-scoped-release-' + datetime.now(ZoneInfo('Asia/Shanghai')).strftime('%Y%m%d-%H%M%S')
    subprocess.run(SSH + ['mkdir ' + shlex.quote(remote)], check=True)
    subprocess.run(['scp', '-o', 'BatchMode=yes', '-o', 'ClearAllForwardings=yes', str(archive), '182.92.61.100:' + remote + '/release.tar.gz'], check=True)
    command = 'tar -xzf ' + shlex.quote(remote + '/release.tar.gz') + ' -C ' + shlex.quote(remote) + ' && python3 ' + shlex.quote(remote + '/deploy.py')
    result = json.loads(subprocess.check_output(SSH + [command]))
    result['staging'] = remote
    (HERE / 'cn-release.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'cn': result}), flush=True)

def publish_github(plan):
    head = api('git/ref/heads/main')['object']['sha']
    assert head == plan['github_head'], 'GitHub main changed since review'
    commit = api('git/commits/' + head)
    content = github_content(); entries = []; uploads = []
    cache_path = HERE / 'github-blobs.json'
    cached = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    for name, record in plan['github'].items():
        data = content[name]
        assert digest(data) == record['sha256'], 'Local changes after review: ' + name
        entry = {'path': name, 'mode': '100644', 'type': 'blob'}
        if data is None:
            entry['sha'] = None; entries.append(entry); continue
        try: entry['content'] = data.decode('utf-8')
        except UnicodeDecodeError:
            if cached.get(name) == record['after']: entry['sha'] = cached[name]
            else: uploads.append((name, data, entry))
        entries.append(entry)
    def upload(item):
        name, data, entry = item
        sha = api('git/blobs', 'POST', {'encoding': 'base64', 'content': base64.b64encode(data).decode()})['sha']
        assert sha == plan['github'][name]['after'], 'Uploaded blob mismatch: ' + name
        return name, sha, entry
    with ThreadPoolExecutor(max_workers=3) as pool:
        for future in as_completed([pool.submit(upload, item) for item in uploads]):
            name, sha, entry = future.result()
            entry['sha'] = sha; cached[name] = sha
            cache_path.write_text(json.dumps(cached, indent=2) + '\n')
    tree = api('git/trees', 'POST', {'base_tree': commit['tree']['sha'], 'tree': entries})
    new = api('git/commits', 'POST', {'message': SPEC['message'], 'tree': tree['sha'], 'parents': [head]})
    assert api('git/ref/heads/main')['object']['sha'] == head, 'Concurrent GitHub edit before update'
    api('git/refs/heads/main', 'PATCH', {'sha': new['sha'], 'force': False})
    published = api('git/trees/' + tree['sha'] + '?recursive=1')
    actual = {entry['path']: entry['sha'] for entry in published['tree'] if entry['type'] == 'blob'}
    assert all(actual.get(name) == record['after'] for name, record in plan['github'].items())
    result = {'commit': new['sha'], 'parent': head, 'verified_files': len(entries), 'paths': list(plan['github'])}
    (HERE / 'github-release.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'github': result}), flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--spec', type=Path, required=True)
    parser.add_argument('--prepare', action='store_true')
    parser.add_argument('--publish', action='store_true')
    args = parser.parse_args()
    HERE=args.spec.resolve().parent
    assert HERE.is_relative_to(ROOT), 'Release records must stay in this project'
    SPEC=json.loads(args.spec.read_text())
    if args.prepare: prepare()
    elif args.publish:
        plan = json.loads((HERE / 'plan.json').read_text())
        assert api('git/ref/heads/main')['object']['sha'] == plan['github_head'], 'GitHub main changed since review'
        publish_cn(plan); publish_github(plan)
    else: parser.error('Choose --prepare or --publish')
