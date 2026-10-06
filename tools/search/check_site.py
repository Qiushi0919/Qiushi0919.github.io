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
    expected_locations = 16 if origin == 'cn' else 15
    assert len(locations) == expected_locations and len(set(locations)) == expected_locations
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
        relative = p.relative_to(directory).as_posix()
        if relative == 'device-preview/index.html':
            assert tree.xpath('//meta[@name="robots"]/@content') == ['noindex,follow']
            assert tree.xpath('//input[@name="device"]/@value') == ['tablet','phone','desktop']
            assert tree.xpath('//input[@name="device" and @checked]/@value') == ['phone']
            assert len(tree.xpath('//iframe[@id="deviceFrame"]')) == 1
            for path in tree.xpath('//script/@src | //link[@rel="stylesheet"]/@href'):
                clean = urlsplit(path).path
                assert ((directory / clean.lstrip('/')) if clean.startswith('/') else (p.parent / clean)).is_file(), path
            continue
        if relative == 'nav/index.html':
            assert origin == 'cn'
            assert 'title: "主页设备预览"' in p.read_text() and 'url: "/device-preview/"' in p.read_text()
            continue
        if p.relative_to(directory).as_posix() == 'battery-rul/index.html':
            assert origin == 'cn'
            assert tree.xpath('//link[@rel="canonical"]/@href') == ['https://qiushi0919.cn/battery-rul/']
            assert len(tree.xpath('//h1')) == 1
            assert len(tree.xpath('//div[@class="method-grid"]/figure')) == 4
            assert len(tree.xpath('//video/source[@type="video/mp4"]')) == 1
            for src in tree.xpath('//img/@src | //video/@poster | //source/@src | //script/@src | //link[@rel="stylesheet"]/@href'):
                assert (p.parent / urlsplit(src).path).is_file(), src
            styles = (p.parent / 'styles.css').read_text()
            assert 'grid-template-columns:1fr' in styles
            assert 'position:sticky;top:0' in styles and 'Times New Roman' in styles
            continue
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
        assert not tree.xpath('//*[contains(@class,"profile-mobile-summary") and contains(string(.),"（拟入学）")]')
        battery = tree.xpath('//*[@id="eecsCoverTrigger"]')
        if battery:
            if origin == 'cn':
                preview = battery[0].xpath('./video[@muted and @loop and @playsinline and @data-preview-auto]')
                assert len(preview) == 1 and preview[0].get('data-src') == '/assets/portfolio-cover/eecs-2026/method-preview.mp4'
                assert (directory / preview[0].get('data-src').lstrip('/')).is_file()
            else:
                assert battery[0].xpath('./img[@class="paper-preview-image"]')
        assert '谢秋实' in tree.text_content() and 'Qiushi Xie' in tree.text_content()
        assert tree.xpath('//meta[@name="description"]/@content')[0]
        schema = json.loads(tree.xpath('//script[@type="application/ld+json"]/text()')[0])
        person = schema['@graph'][0]
        assert person['@type'] == 'Person'
        assert person['@id'] == 'https://qiushi0919.cn/#person'
        assert 'https://scholar.google.com/citations?user=TkPyZ-UAAAAJ' in person['sameAs']
        assert not tree.xpath('//a[starts-with(@href,"https://scholar.google.com/scholar?")]')
        assert len(tree.xpath('//div[@class="site-toolbar"]/nav[@class="work-category-nav"]')) == 1
        route = urlsplit(canonical).path
        collections = tree.xpath('//section[@class="work-collection"]')
        if route in ('/','/papers/','/competitions/','/projects/'):
            assert len(collections) == 1, str(p)
            assert collections[0].xpath('.//input[@name="work-view"]/@value') == ['overview','large']
            assert collections[0].xpath('.//input[@name="work-view" and @checked]/@value') == ['overview']
            assert len(collections[0].xpath('.//article[@data-work-category]')) == len(tree.xpath('//article[@data-work-category]'))
            assert len(collections[0].xpath('.//div[@class="work-reading-details"]')) == len(tree.xpath('//article[@data-work-category]'))
            assert len(collections[0].xpath('.//fieldset/legend')) == 1
        else:
            assert not collections
        c_thumbnail = tree.xpath('//*[@id="nuedcCoverTrigger"]/img/@src')
        if c_thumbnail:
            assert c_thumbnail == ['/assets/portfolio-cover/nuedc-c/test-integrated.webp']
        if urlsplit(canonical).path in ('/', '/about/'):
            assert len(tree.xpath('//section[@class="profile-section"]')) == 1
        else:
            assert not tree.xpath('//section[@class="profile-section"]'), str(p)
        if urlsplit(canonical).path == '/about/':
            assert schema['@graph'][1]['@type'] == 'ProfilePage'
            assert len(tree.xpath('//section[@class="biography"]/p')) == 5
            assert not tree.xpath('//article[@data-work-category]')
            assert len(tree.xpath('//section[@data-profile-page="about"]//img[@class="profile-photo"]')) == 1
            assert len(tree.xpath('//section[@data-profile-page="about"]//nav[contains(@class,"profile-icon-links")]/*')) == 9
            assert len(tree.xpath('//dialog[@id="contactDialog"]')) == 1
            assert len(tree.xpath('//section[@class="biography"]//li/a')) == 4
        if len(urlsplit(canonical).path.strip('/').split('/')) == 2:
            intro = tree.xpath('//*[@class="works-head"]/p')[0].text_content().strip()
            assert intro and 'Research papers, competition projects' not in intro, str(p)
            assert '科研论文、竞赛项目与独立小项目' not in intro, str(p)
            image = tree.xpath('//meta[@property="og:image"]/@content')[0]
            assert not image.endswith('/assets/contact/profile-photo.jpg'), str(p)
            assert tree.xpath('//meta[@property="og:image:alt"]/@content')[0]
            assert tree.xpath('//meta[@name="twitter:image"]/@content') == [image]
            primary = schema['@graph'][1]['primaryImageOfPage']['@id']
            assert next(item for item in schema['@graph'] if item.get('@id') == primary)['contentUrl'] == image
            work = next(item for item in schema['@graph'] if item.get('@id') == canonical + '#work')
            assert work['image'] == image
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
print(json.dumps({'status':'passed','static_pages':count,'paper_project_pages':1,'sitemap_urls':31,'legacy_redirects':legacy_count,'checks':'languages, headings, canonicals, hreflang, schema, links, IDs, visible content, root migration redirects, paper project assets'}))
