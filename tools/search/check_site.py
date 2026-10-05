"""Check the generated pages as a crawler sees them, without JavaScript."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
from urllib.robotparser import RobotFileParser
import json
from lxml import html, etree

ROOT = Path(__file__).resolve().parent / 'build'
count = 0
for origin, host, prefix in [('cn', 'qiushi0919.cn', ''), ('github', 'qiushi0919.github.io', '')]:
    directory = ROOT / origin
    sitemap = etree.parse(str(directory / 'sitemap.xml'))
    locations = sitemap.xpath('//*[local-name()="loc"]/text()')
    assert len(locations) == 14 and len(set(locations)) == 14
    robots = RobotFileParser()
    robots.parse((directory / 'robots.txt').read_text().splitlines())
    assert robots.site_maps() == [f'https://{host}/sitemap.xml']
    for agent in ('OAI-SearchBot', 'Bingbot', 'UnlistedCrawler'):
        assert robots.can_fetch(agent, f'https://{host}/')
        assert robots.can_fetch(agent, f'https://{host}/assets/css/portfolio.css')
        for path in ('analytics/', 'cost-per-day/api/', 'tools/search/'):
            assert not robots.can_fetch(agent, f'https://{host}/{path}')
    for p in directory.rglob('index.html'):
        tree = html.fromstring(p.read_text())
        count += 1
        assert len(tree.xpath('//h1')) == 1, str(p)
        phone_canvas = tree.xpath('//head/script[not(@type) and not(@src)]')
        assert len(phone_canvas) == 1 and 'const portraitCanvasWidth = 980' in phone_canvas[0].text, str(p)
        assert "classList.add('portfolio-loading')" not in phone_canvas[0].text, str(p)
        assert len(tree.xpath('//link[@rel="canonical"]')) == 1
        canonical = tree.xpath('//link[@rel="canonical"]/@href')[0]
        expected_host = 'qiushi0919.cn' if tree.get('lang') == 'zh-CN' else 'qiushi0919.github.io'
        assert urlsplit(canonical).hostname == expected_host, str(p)
        assert not urlsplit(canonical).path.startswith('/Qiushi-Portfolio/'), str(p)
        assert set(tree.xpath('//link[@rel="alternate"]/@hreflang')) == {'zh-CN','en','x-default'}
        assert not tree.xpath('//article[@hidden]')
        assert '谢秋实' in tree.text_content() and 'Qiushi Xie' in tree.text_content()
        assert tree.xpath('//meta[@name="description"]/@content')[0]
        schema = json.loads(tree.xpath('//script[@type="application/ld+json"]/text()')[0])
        assert schema['@graph'][0]['@type'] == 'Person'
        ids = tree.xpath('//*[@id]/@id'); assert len(ids) == len(set(ids)), str(p)
        for link in tree.xpath('//a/@href'):
            if not link.startswith('/') or link.startswith('//') or link.startswith(prefix + '/assets/'):
                continue
            path = unquote(urlsplit(link).path)
            if origin == 'github':
                assert path.startswith(prefix + '/'), link
                path = path[len(prefix):]
            target = directory / path.lstrip('/')
            if target.is_dir(): target /= 'index.html'
            assert target.exists(), (str(p),link)
    for link in locations:
        parts=urlsplit(link); assert parts.hostname == host
        path=parts.path[len(prefix):]
        assert (directory / path.lstrip('/') / 'index.html').exists()
legacy_count = 0
for p in (ROOT / 'github-legacy').rglob('index.html'):
    tree = html.fromstring(p.read_text())
    relative = str(p.relative_to(ROOT / 'github-legacy').parent)
    target = 'https://qiushi0919.github.io/' + (relative + '/' if relative != '.' else '')
    assert tree.xpath('//meta[@http-equiv="refresh"]/@content') == ['0;url=' + target], str(p)
    assert tree.xpath('//a/@href') == [target], str(p)
    legacy_count += 1
assert legacy_count == 30
print(json.dumps({'status':'passed','static_pages':count,'sitemap_urls':28,'legacy_redirects':legacy_count,'checks':'languages, headings, canonicals, hreflang, schema, links, IDs, visible content, root migration redirects'}))
