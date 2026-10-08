"""Atomic reviewed frontend deployment to the existing portfolio and nav roots."""
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import hashlib, json, os, shutil

HERE = Path(__file__).resolve().parent
ROOTS = {'portfolio': Path('/opt/portfolio'), 'navigation': Path('/opt/opt/mining')}

def target(name):
    group, relative = name.split('/', 1)
    assert group in ROOTS and not Path(relative).is_absolute() and '..' not in Path(relative).parts
    if group == 'navigation': assert relative == 'nav/index.html'
    return ROOTS[group] / relative

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None

def main():
    manifest = json.loads((HERE / 'manifest.json').read_text())
    files = manifest['files']
    for name, record in files.items():
        assert digest(target(name)) == record['before'], 'Concurrent edit: ' + name
        assert digest(HERE / 'files' / name) == record['after'], 'Staging mismatch: ' + name
    backup = Path('/opt/backups') / (manifest['version'] + '-' + datetime.now(ZoneInfo('Asia/Shanghai')).strftime('%Y%m%d-%H%M%S'))
    backup.mkdir(parents=True)
    (backup / 'manifest.json').write_text(json.dumps(manifest, indent=2))
    for name, record in files.items():
        if record['before'] is not None:
            destination = backup / name; destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(target(name), destination)
    changed = []
    try:
        for name in sorted(files, key=lambda name: (files[name]['after'] is None, name.endswith('.html'), name)):
            destination = target(name)
            assert digest(destination) == files[name]['before'], 'Edit during publication: ' + name
            if files[name]['after'] is None:
                destination.unlink(); changed.append(name); continue
            destination.parent.mkdir(parents=True, exist_ok=True)
            temporary = destination.with_name(destination.name + '.scoped-release-tmp')
            shutil.copyfile(HERE / 'files' / name, temporary)
            if destination.exists():
                info = destination.stat(); os.chmod(temporary, info.st_mode & 0o777); os.chown(temporary, info.st_uid, info.st_gid)
            else: os.chmod(temporary, 0o644)
            os.replace(temporary, destination); changed.append(name)
        assert all(digest(target(name)) == record['after'] for name, record in files.items())
    except BaseException:
        for name in reversed(changed):
            if files[name]['before'] is None: target(name).unlink()
            else: shutil.copy2(backup / name, target(name))
        raise
    print(json.dumps({'status': 'published', 'backup': str(backup), 'verified_files': len(files), 'paths': list(files)}))

if __name__ == '__main__': main()
