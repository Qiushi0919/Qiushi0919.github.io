"""Verify private source and stale output cannot enter either public build."""
import importlib.util
from pathlib import Path
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
spec = importlib.util.spec_from_file_location('site_build', ROOT / 'build_site.py')
site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)
project = 'low-altitude-communication'
name = '__qa-private-presentation.pptx'
fixture = site.SOURCE / 'publication-figures' / project / name
assert not fixture.exists()
marker = b'QA-only private presentation; never publish.'
try:
    fixture.write_bytes(marker)
    for origin in ('cn', 'github'):
        directory = site.BUILD / origin / 'assets/portfolio-cover' / project
        directory.mkdir(parents=True, exist_ok=True)
        (directory / name).write_bytes(marker)
        (directory / 'page-08.webp').write_bytes(marker)
    site.build()
    assert fixture.read_bytes() == marker, 'Private source must be preserved'
    for origin in ('cn', 'github'):
        directory = site.BUILD / origin / 'assets/portfolio-cover' / project
        assert not (directory / name).exists(), 'Private source/stale PPT leaked'
        assert not (directory / 'page-08.webp').exists(), 'Stale slide export leaked'
        assert (directory / 'award-certificate.png').is_file()
        assert all((directory / ('cover-' + lang + '.jpg')).is_file() for lang in ('zh','en'))
        for lang in ('zh','en'):
            motion=(directory / ('cover-motion-'+lang+'.svg')).read_text()
            assert 'beam-sweep' in motion and 'drone-flight' in motion
            assert 'prefers-reduced-motion' in motion
            from lxml import etree
            svg=etree.fromstring(motion.encode())
            assert all(ref.startswith('data:') for ref in svg.xpath('//*[local-name()="image"]/@href')), 'Motion result must be self-contained'
    assert not site.public_media_allowed(project + '/slides/deck.pptx')
    assert not site.public_media_allowed(project + '/new-technical-cover.jpg')
    print('{"status":"passed","checks":"private source preserved; PPT and stale slide blocked in both builds; authorized hero, certificate and logos exported"}')
finally:
    assert fixture.read_bytes() == marker
    fixture.unlink()
