"""Add the owner's bilingual portfolio links to each public project's README."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent
PLAN = ROOT / '.deployment/identity-readme-plan'
CN = 'https://qiushi0919.cn/'
GH = 'https://qiushi0919.github.io/'


def api(path, method='GET', body=None):
    args = ['/opt/homebrew/bin/gh', 'api', path, '--method', method]
    if body is None:
        return json.loads(subprocess.check_output(args))
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json') as f:
        json.dump(body, f, ensure_ascii=False)
        f.flush()
        return json.loads(subprocess.check_output(args + ['--input', f.name]))


def git_blob_sha(text):
    data = text.encode()
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def plan():
    inventory = json.loads((ROOT / '.deployment/repository-inventory/repos.json').read_text())
    PLAN.mkdir(parents=True, exist_ok=True)
    result = []
    for item in inventory:
        if item['name'] in ('MetaPencil', 'Qiushi-Portfolio', 'Qiushi0919.github.io'):
            continue
        repo = 'repos/Qiushi0919/' + item['name']
        head = api(repo + '/git/ref/heads/' + item['branch'])['object']['sha']
        commit = api(repo + '/git/commits/' + head)
        changes = []
        for name in item['readmes'] or ['README.md']:
            data = api(repo + '/contents/' + name) if item['readmes'] else None
            old = base64.b64decode(data['content']).decode() if data else '# ' + item['name'] + '\n'
            updated = old.replace('https://qiushi0919.github.io/Qiushi-Portfolio/', GH)
            if CN not in updated or GH not in updated:
                label = "Fork maintainer's portfolio / 此分支维护者的个人主页" if item['fork'] else 'Personal portfolio / 个人主页'
                updated = updated.rstrip() + '\n\n## ' + label + '\n\n'
                updated += '[谢秋实 / Qiushi Xie · 中文主页](' + CN + ') · [English portfolio](' + GH + ')\n'
            scholar = 'https://scholar.google.com/citations?user=TkPyZ-UAAAAJ'
            if scholar not in updated:
                updated = updated.rstrip() + '\n\n[个人介绍 / About Qiushi Xie](' + CN + 'about/) · [Google Scholar](' + scholar + ')\n'
            assert CN in updated and GH in updated and scholar in updated
            folder = PLAN / item['name']
            (folder / 'before').mkdir(parents=True, exist_ok=True)
            (folder / 'after').mkdir(parents=True, exist_ok=True)
            (folder / 'before' / name).write_text(old)
            (folder / 'after' / name).write_text(updated)
            if old != updated:
                changes.append({'path': name, 'content': updated, 'old_sha': data['sha'] if data else None})
        result.append({'name': item['name'], 'repo': repo, 'branch': item['branch'], 'head': head,
                       'tree': commit['tree']['sha'], 'changes': changes})
        print(json.dumps({'repo': item['name'], 'files': [c['path'] for c in changes]}), flush=True)
    (PLAN / 'plan.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))


def publish():
    result = []
    for item in json.loads((PLAN / 'plan.json').read_text()):
        if not item['changes']:
            continue
        repo = item['repo']
        assert api(repo + '/git/ref/heads/' + item['branch'])['object']['sha'] == item['head'], item['name']
        tree = api(repo + '/git/trees', 'POST', {'base_tree': item['tree'], 'tree': [
            {'path': c['path'], 'mode': '100644', 'type': 'blob', 'content': c['content']} for c in item['changes']]})
        commit = api(repo + '/git/commits', 'POST', {'message': 'docs: Link author biography and Google Scholar profile',
                     'tree': tree['sha'], 'parents': [item['head']]})
        assert api(repo + '/git/ref/heads/' + item['branch'])['object']['sha'] == item['head'], item['name']
        api(repo + '/git/refs/heads/' + item['branch'], 'PATCH', {'sha': commit['sha'], 'force': False})
        actual = {e['path']: e['sha'] for e in api(repo + '/git/trees/' + tree['sha'])['tree']}
        for c in item['changes']:
            assert actual[c['path']] == git_blob_sha(c['content'])
        record = {'repo': item['name'], 'commit': commit['sha'], 'branch': item['branch'], 'files': len(item['changes'])}
        result.append(record)
        (PLAN / 'published.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
        print(json.dumps(record), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['plan', 'publish'])
    args = parser.parse_args()
    plan() if args.action == 'plan' else publish()
