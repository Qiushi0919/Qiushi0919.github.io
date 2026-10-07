"""Check the generated pages as a crawler sees them, without JavaScript."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
from urllib.robotparser import RobotFileParser
import hashlib, json
from lxml import html, etree

ROOT = Path(__file__).resolve().parent / 'build'
teams = json.loads((ROOT.parent / 'source/competition-teams.json').read_text())
count = 0
for origin, host, prefix in [('cn', 'qiushi0919.cn', ''), ('github', 'qiushi0919.github.io', '')]:
    directory = ROOT / origin
    policy = json.loads((ROOT.parent / 'source/public-media-policy.json').read_text())
    for project, rules in policy.items():
        public = directory / 'assets/portfolio-cover' / project
        assert public.is_dir(), str(public)
        assert {f.name for f in public.rglob('*') if f.is_file()} <= set(rules['allowed']), str(public)
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
        language = 'zh' if tree.get('lang') == 'zh-CN' else 'en'
        assert len(tree.xpath('//h1')) == 1, str(p)
        phone_canvas = tree.xpath('//head/script[not(@type) and not(@src)]')
        assert len(phone_canvas) == 1 and 'const portraitCanvasWidth = 980' in phone_canvas[0].text, str(p)
        assert "portfolio-loading" not in phone_canvas[0].text, str(p)
        assert not tree.xpath('//*[@id="portfolioLoader"] | //*[@class="preview-loading-indicator"]'), str(p)
        assert not tree.xpath('//section[@class="profile-section"]//*[@id="portfolioLoader"]'), str(p)
        for card in tree.xpath('//article[@data-work-category]'):
            assert card.xpath('ancestor::div[@class="work-loading-region"]'), str(p)
        assert tree.xpath('//noscript/style'), str(p)
        assert len(tree.xpath('//link[@rel="canonical"]')) == 1
        canonical = tree.xpath('//link[@rel="canonical"]/@href')[0]
        expected_host = 'qiushi0919.cn' if tree.get('lang') == 'zh-CN' else 'qiushi0919.github.io'
        assert urlsplit(canonical).hostname == expected_host, str(p)
        assert not urlsplit(canonical).path.startswith('/Qiushi-Portfolio/'), str(p)
        assert set(tree.xpath('//link[@rel="alternate"]/@hreflang')) == {'zh-CN','en','x-default'}
        assert not tree.xpath('//article[@hidden]')
        for image in tree.xpath('//section[contains(concat(" ",@class," ")," feature-overlay ")]//figure/img'):
            assert int(image.get('width', '0')) > 0 and int(image.get('height', '0')) > 0, 'Unreserved gallery image: ' + str(p)
        assert not tree.xpath('//*[contains(@class,"profile-mobile-summary") and contains(string(.),"（拟入学）")]')
        battery = tree.xpath('//*[@id="eecsCoverTrigger"]')
        if battery:
            preview = battery[0].xpath('./canvas[@data-preview-auto]')
            assert len(preview) == 1 and urlsplit(preview[0].get('data-preview-sequence')).path == '/assets/preview-frames/battery-method/sequence.json'
            assert preview[0].get('data-preview-loop') == 'true'
            assert (directory / urlsplit(preview[0].get('data-preview-sequence')).path.lstrip('/')).is_file()
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
        for card in tree.xpath('//article[@data-work-category="competition"]'):
            team = teams[card.get('id')]
            members = card.xpath('.//div[contains(@class,"competition-team")]//span[@data-author-name]')
            assert [a.get('data-author-name') for a in members] == [person['zh'] for person in team['members'] + team['advisors']], str(p)
            assert [a.get('data-author-name') for a in members if a.get('data-team-role') == 'leader'] == [team['leader']], str(p)
            assert len(card.xpath('.//sup[text()="‡"]')) == 1, str(p)
            assert not card.xpath('.//sup[text()="†"]'), str(p)
            assert len(card.xpath('.//sup[text()="*"]')) == len(team['advisors']), str(p)
            assert len(card.xpath('.//*[contains(concat(" ",@class," ")," project-kicker ")]')) == 1, str(p)
            if card.get('id') != 'lowcomProjectCard' or team.get('award'):
                assert len(card.xpath('.//span[@class="competition-award"]')) == 1, str(p)
        for lowcom in tree.xpath('//*[@id="lowcomProjectCard"]'):
            images = lowcom.xpath('.//img[@src or @data-src]')
            certificates = [i for i in images if 'award-certificate.png' in (i.get('src') or i.get('data-src') or '')]
            assert len(certificates) == 2, str(p)
            assert len(lowcom.xpath('.//div[@class="lowcom-grid"]/figure')) == 1, str(p)
            for image in images:
                value = image.get('src') or image.get('data-src')
                if '/low-altitude-communication/' in value:
                    assert urlsplit(value).path.split('/')[-1] in policy['low-altitude-communication']['allowed'], str(p)
            assert '中国国际大学生创新大赛（2026）' not in lowcom.text_content(), str(p)
        for trigger, project in [('coverTrigger','intelcup-2026'), ('nuedcCoverTrigger','nuedc-c')]:
            for canvas in tree.xpath(f'//*[@id="{trigger}"]/canvas'):
                assert urlsplit(canvas.get('data-preview-sequence')).path == f'/assets/preview-frames/{project}-{language}/sequence.json', str(p)
                assert urlsplit(canvas.get('data-preview-sequence')).query.startswith('v='), str(p)
                poster = canvas.getnext()
                assert urlsplit(poster.get('src')).path == f'/assets/portfolio-cover/{project}/cover-{language}.jpg', str(p)
                poster_file = directory / urlsplit(poster.get('src')).path.lstrip('/')
                assert urlsplit(poster.get('src')).query == 'v=' + hashlib.sha256(poster_file.read_bytes()).hexdigest()[:12], str(p)
        for author in tree.xpath('//*[@id="vaseProjectCard"]//span[@data-author-name="Zeyu Zhang"]'):
            assert author.xpath('./sup/text()') == ['†','‡'], str(p)
        for author in tree.xpath('//*[@id="vaseProjectCard"]//span[@data-author-name="Hao Tang"]'):
            assert author.xpath('./sup/text()') == ['*'], str(p)
        assert not tree.xpath('//button//button'), str(p)
        for wrapper in tree.xpath('//div[@data-preview-motion]'):
            popup = 'data-preview-popup' in wrapper.attrib
            assert len(wrapper.xpath('./button[@data-preview-play]')) == (0 if popup or 'no-preview-control' in wrapper.get('class','').split() else 1), str(p)
            assert len(wrapper.xpath('./*[contains(concat(" ",@class," ")," preview-open ")]/img[@class="preview-poster"]')) == 1, str(p)
            assert not wrapper.xpath('.//video'), str(p)
            canvas = wrapper.xpath('./*[contains(concat(" ",@class," ")," preview-open ")]/canvas[@data-preview-auto]')
            assert len(canvas) == 1 and canvas[0].get('width') and canvas[0].get('height'), str(p)
            assert canvas[0].get('data-preview-load-order') in ('0','1','2'), str(p)
            video_url = urlsplit(canvas[0].get('data-preview-video'))
            video_file = directory / video_url.path.lstrip('/')
            assert video_file.is_file() and video_file.suffix == '.mp4', str(p)
            assert video_url.query == 'v=' + hashlib.sha256(video_file.read_bytes()).hexdigest()[:12], str(p)
            assert float(canvas[0].get('data-preview-duration')) > 0, str(p)
            assert int(canvas[0].get('data-preview-bytes')) == video_file.stat().st_size, str(p)
            assert not wrapper.xpath('./span[@class="preview-load-progress"]')[0].text_content().strip(), str(p)
            assert len(wrapper.xpath('./span[@class="preview-load-progress" and @role="progressbar"]')) == 1, str(p)
            sequence = directory / urlsplit(canvas[0].get('data-preview-sequence')).path.lstrip('/')
            data = json.loads(sequence.read_text())
            assert data['frames'] and data['duration'] > 0, str(p)
            assert all((sequence.parent / name).is_file() for name in data['sheets']), str(p)
            assert data['sheetBytes'] == [(sequence.parent / name).stat().st_size for name in data['sheets']], str(p)
            fingerprint = hashlib.sha256()
            for file in sorted(sequence.parent.iterdir()):
                if file.suffix in ('.json', '.webp'): fingerprint.update(file.name.encode() + b'\0' + file.read_bytes())
            assert urlsplit(canvas[0].get('data-preview-sequence')).query == 'v=' + fingerprint.hexdigest()[:12], str(p)
            if 'data-preview-popup' in wrapper.attrib:
                assert wrapper.getprevious().get('class') == 'overlay-head', str(p)
                assert len(wrapper.xpath('./div[@class="preview-transport"]/input[@data-preview-seek]')) == 1, str(p)
                assert not tree.xpath('//details[@class="preview-original"]'), str(p)
        assert not tree.xpath('//video[@autoplay]'), str(p)
        assert all('controls' in v.attrib for v in tree.xpath('//video')), str(p)
        for leader in tree.xpath('//sup[text()="‡"]'):
            assert leader.get('class') == 'role-lead', str(p)
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
print(json.dumps({'status':'passed','static_pages':count,'paper_project_pages':1,'sitemap_urls':31,'legacy_redirects':legacy_count,'checks':'languages, headings, canonicals, hreflang, schema, links, IDs, confirmed team rosters and roles, contribution marks, Canvas previews, original video controls and dimensions, root migration redirects, paper project assets'}))
