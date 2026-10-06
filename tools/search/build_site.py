"""Build crawlable bilingual portfolio pages for the CN and GitHub origins.

Requires lxml. All text comes from the existing portfolio and its translations.
Run: python3 build_site.py
"""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urljoin

from lxml import etree, html

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'source'
BUILD = ROOT / 'build'
VERSION = 'preview-timing-landscape-20261006'
CN = 'https://qiushi0919.cn/'
GH = 'https://qiushi0919.github.io/'
LEGACY_GH = 'https://qiushi0919.github.io/Qiushi-Portfolio/'
CATEGORIES = {'papers': ('论文', 'Papers', 'paper'),
              'competitions': ('竞赛项目', 'Competitions', 'competition'),
              'projects': ('个人作品', 'Side Projects', 'side')}
DETAILS = {
    'vaseProjectCard': 'papers/vasemuseum',
    'eecsProjectCard': 'papers/battery-rul',
    'projectCard': 'competitions/intelcup-2026',
    'nuedcProjectCard': 'competitions/nuedc-c',
    'lowcomProjectCard': 'competitions/lowcom',
    'embeddedProjectCard': 'competitions/embedded-2025',
    'codexTidyProjectCard': 'projects/codex-tidy',
    'sideProjectCard': 'projects/boring-notch-focus',
    'altTabProjectCard': 'projects/alttab',
    'mindMapProjectCard': 'projects/mindmap',
}
EXTERNAL_PROJECTS = {
    'https://qiushi0919.cn/battery-rul/': 'https://qiushi0919.github.io/ALA-VMD-BiTCN-AM/',
    'https://qiushi0919.cn/vasemuseum/': 'https://aigeeksgroup.github.io/VaseMuseum/',
    'https://qiushi0919.cn/intelcup-2026/': 'https://qiushi0919.github.io/IntelCup-2026/',
    'https://qiushi0919.cn/nuedc-c/': 'https://qiushi0919.github.io/2026-NUEDC-C/',
    'https://qiushi0919.cn/embedded-2025/': 'https://www.socchina.net/details?id=8a9b099de40642f48e40bdeb04649df1',
}
ROUTES = ['', 'about', *CATEGORIES, *DETAILS.values()]
TRANSLATIONS = json.loads((SOURCE / 'translations.json').read_text())
AUTHOR = json.loads((SOURCE / 'author-profile.json').read_text())
PROJECT_PAGES = json.loads((SOURCE / 'project-pages.json').read_text())
COMPETITION_TEAMS = json.loads((SOURCE / 'competition-teams.json').read_text())
VERIFICATION = json.loads((SOURCE / 'search-verification.json').read_text()) if (SOURCE / 'search-verification.json').exists() else {}
PORTRAIT_PATH = 'assets/contact/profile-photo.jpg'
PORTRAIT_VERSION = hashlib.sha256((SOURCE / 'contact/profile-photo.jpg').read_bytes()).hexdigest()[:12]


def portrait_url(base=''):
    return base + PORTRAIT_PATH + '?v=' + PORTRAIT_VERSION


def translated(value):
    if not value:
        return value
    m = re.match(r'^(\s*)(.*?)(\s*)$', value, re.S)
    return m[1] + TRANSLATIONS.get(m[2], m[2]) + m[3]


def translate_tree(tree):
    for e in tree.iter():
        if not isinstance(e.tag, str):
            continue
        if e.tag not in ('script', 'style'):
            e.text = translated(e.text)
            for attr in ('alt', 'title', 'aria-label', 'data-label', 'data-contact-title',
                         'data-contact-description', 'placeholder'):
                if attr in e.attrib:
                    e.set(attr, translated(e.get(attr)))
        e.tail = translated(e.tail)


def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8')


def route_url(base, route):
    return base + (route + '/' if route else '')


def element(tag, text=None, **attrs):
    e = etree.Element(tag, {k.replace('_', '-'): v for k, v in attrs.items()})
    e.text = text
    return e


def author_paragraphs(language):
    # Authored bilingual prose keeps its emphasis and advisor link without
    # relying on text-fragment translation across nested markup.
    return [html.fragment_fromstring('<p>' + paragraph + '</p>')
            for paragraph in AUTHOR['biography'][language]]


def format_competition_team(card, language):
    team = COMPETITION_TEAMS[card.get('id')]
    copy = card.xpath('.//div[contains(concat(" ",@class," ")," work-copy ")]')[0]
    meta = copy.xpath('./div[@class="project-meta"]')[0]
    award = ''.join(meta.find('p').itertext()).strip() if card.get('id') != 'lowcomProjectCard' else team.get('award', {}).get(language, '')
    meta.set('class', 'project-meta competition-team')
    for child in list(meta): meta.remove(child)
    roster = element('p', **{'class':'paper-authors project-authors'})
    all_people = [(person, 'leader' if person['zh'] == team['leader'] else 'member') for person in team['members']]
    all_people += [(person, 'advisor') for person in team['advisors']]
    for index, (person, role) in enumerate(all_people):
        author = element('span', **{'class':'paper-author' + (' paper-author-self' if person['zh'] == '谢秋实' else ''),
                                  'data-author-name':person['zh'],'data-team-role':role})
        if person['zh'] == '谢秋实':
            author.append(element('a', person[language], **{'class':'paper-author-name','data-author-home':'self','href':'/'}))
        else: author.text = person[language]
        if role in ('leader','advisor'):
            meaning = {'leader':('队长','Team lead'),'advisor':('指导教师','Advisor')}[role][0 if language == 'zh' else 1]
            author.append(element('sup', '‡' if role == 'leader' else '*', title=meaning, aria_label=meaning,
                                  **{'class':'role-lead' if role == 'leader' else 'role-advisor'}))
        if index < len(all_people)-1: author.tail = ', '
        roster.append(author)
    meta.append(roster)
    for kicker in copy.xpath('./*[contains(concat(" ",@class," ")," project-kicker ")]'):
        if award:
            suffix = element('span', ' · ' + award, **{'class':'competition-award'})
            (kicker[0] if 'kicker-lines' in kicker.get('class', '') and len(kicker) else kicker).append(suffix)
    if card.xpath('./div[@class="work-detail-media"]'):
        note = element('p', '‡ 队长 · * 指导教师' if language == 'zh' else '‡ Team lead · * Advisor', **{'class':'team-symbol-note'})
        card.xpath('./div[@class="work-detail-media"]')[0].insert(0, note)


def format_vase_contributions(tree, language, is_detail):
    cards = tree.xpath('//*[@id="vaseProjectCard"]')
    if not cards: return
    card = cards[0]
    for author in card.xpath('.//p[@class="paper-authors"]/span[@data-author-name]'):
        name = author.get('data-author-name')
        for mark in author.findall('sup'):
            if name == 'Hao Tang':
                mark.text = '*'
                meaning = '通讯作者' if language == 'zh' else 'Corresponding author'
            else:
                mark.text = '†'
                meaning = '共同第一作者' if language == 'zh' else 'Equal contribution'
            mark.set('title', meaning); mark.set('aria-label', meaning)
        if name == 'Zeyu Zhang':
            meaning = '项目负责人' if language == 'zh' else 'Project lead'
            author.append(element('sup', '‡', title=meaning, aria_label=meaning, **{'class':'role-lead'}))
    if is_detail:
        affiliations = card.xpath('.//div[@class="paper-affiliations"]')[0]
        affiliations.insert(0, element('p', '† 共同第一作者 · ‡ 项目负责人 · * 通讯作者' if language == 'zh' else '† Equal contribution · ‡ Project lead · * Corresponding author', **{'class':'paper-symbol-note'}))


def format_project_list(card, is_detail, language):
    """Use the publication layout while retaining original content and destinations."""
    card.set('class', card.get('class', '') + ' work-list-card')
    copy = card.xpath('./div[contains(concat(" ",@class," ")," project-copy ")]')[0]
    copy.set('class', copy.get('class').replace('has-signature', '') + ' work-copy')
    topline = card.xpath('./div[@class="project-topline"]')[0]
    kicker = topline.xpath('./*[contains(concat(" ",@class," ")," project-kicker ")]')[0]
    meta = copy.xpath('./div[@class="project-meta"]')[0]
    meta.addnext(kicker)
    extras = element('div', **{'class':'work-detail-media'})
    for visual in topline.xpath('./div[@class="project-logos"]') + copy.xpath('./div[contains(concat(" ",@class," ")," signature-visuals ")]'):
        extras.append(visual)
    card.remove(topline)
    if is_detail and len(extras):
        card.append(extras)
    if card.get('id') == 'projectCard':
        wrapper = card.xpath('./div[@class="cover-column"]')[0]
        preview = wrapper.find('button')
        wrapper.addprevious(preview)
        card.remove(wrapper)
        video = preview.find('video')
        video.attrib.pop('src', None)
        video.attrib.pop('autoplay', None)
        video.set('class', 'competition-preview-video')
        video.set('data-src', f'assets/portfolio-cover/intelcup-2026/preview-with-cover-{language}.mp4')
        video.set('data-preview-auto', '')
        video.set('aria-label', 'Intel Cup sequential demo preview')
        video.set('poster', f'assets/portfolio-cover/intelcup-2026/cover-{language}.jpg')
    else:
        preview = card.find('button')
        # Dense carousels remain in the full preview; the list shows one clear work image.
        if card.get('id') == 'nuedcProjectCard':
            for child in list(preview):
                if 'cover-zoom-hint' not in child.get('class', ''):
                    preview.remove(child)
            preview.insert(0, element('video', **{'class':'competition-preview-video', 'muted':'', 'loop':'',
                'playsinline':'', 'preload':'none', 'poster':f'assets/portfolio-cover/nuedc-c/cover-{language}.jpg',
                'data-src':f'assets/portfolio-cover/nuedc-c/preview-with-cover-{language}.mp4', 'data-preview-auto':'',
                'aria-label':'数字钥匙实验系统循环演示'}))
        chosen = {
            'embeddedProjectCard': (f'assets/portfolio-cover/embedded-2025/cover-{language}.jpg', '智能烟雾检测与预测系统组成' if language == 'zh' else 'Smoke detection and prediction system components'),
        }.get(card.get('id'))
        if chosen:
            for child in list(preview):
                if 'cover-zoom-hint' not in child.get('class', ''):
                    preview.remove(child)
            preview.insert(0, element('img', src=chosen[0], alt=chosen[1], loading='lazy', decoding='async'))
    preview.set('class', preview.get('class', '') + ' work-preview')
    resources = {
        '项目主页': ('Website', 'Project', 'website'),
        '项目仓库': ('GitHub', 'CODE', 'code'),
        '公开测试版': ('Release', 'Beta', 'release'),
        '下载': ('Release', 'Download', 'release'),
        '上游项目': ('GitHub', 'Upstream', 'code'),
        '课程报告': ('Report', 'PDF', 'report'),
        '赛事页面': ('Contest', 'Website', 'event'),
        'MCSP Lab': ('MCSP', 'Lab', 'lab'),
    }
    for links in copy.xpath('.//div[@class="links"]'):
        links.set('class', 'links paper-links work-links')
        for link in links.findall('a'):
            original = ''.join(link.itertext()).strip()
            label, value, kind = resources[original]
            link.text = None
            link.set('aria-label', original)
            link.set('class', 'paper-resource resource-' + kind)
            link.append(element('span', label, **{'class':'resource-label'}))
            link.append(element('span', value, **{'class':'resource-value'}))


def build():
    raw = (SOURCE / 'portfolio.html').read_text()
    template = html.document_fromstring(raw)
    # Preserve the original phone portrait canvas before CSS is loaded. The
    # loader class belongs to the removed loading screen, so keep it separate.
    viewport_script = next(s.text for s in template.xpath('//head/script')
                           if 'portraitCanvasWidth' in (s.text or ''))
    viewport_script = viewport_script.replace("document.documentElement.classList.add('portfolio-loading');", '')
    viewport_script = viewport_script.replace(
        'const screenWidth = Math.min(window.innerWidth, window.screen.width, window.screen.height);',
        "const previewQuery = new URLSearchParams(location.search);\n      const previewPhone = window.parent !== window && previewQuery.get('preview-device') === 'phone';\n      const previewWidth = Number(previewQuery.get('preview-width')) || 390;\n      const screenWidth = previewPhone ? Math.max(320,Math.min(600,previewWidth)) : Math.min(window.innerWidth, window.screen.width, window.screen.height);")
    viewport_script = viewport_script.replace('const portraitPhone = screenWidth <= 600 && window.innerHeight > window.innerWidth;', 'const portraitPhone = previewPhone || (screenWidth <= 600 && window.innerHeight > window.innerWidth);')
    css = template.find('head/style').text.replace('url("assets/', 'url("../').replace('.profile-copy h1{', '.profile-copy :is(h1,h2){')
    # The browser never hides content while images load.
    css = re.sub(r'html\.portfolio-loading[^}]*}', '', css)
    css += '''
.profile-name-latin{display:block;margin-top:7px;font-size:18px;color:#607483;letter-spacing:0}
.profile-copy h2{margin:0 0 20px;text-align:center;color:#172b3a;font-size:32px;font-weight:400;letter-spacing:-.025em}
.works-head h1{margin:0 0 10px;font-size:26px;font-weight:700;line-height:1.4;overflow-wrap:anywhere}
.language-switch a{padding:4px 0;color:#81909b;border-bottom:1px solid transparent}
.language-switch a.is-active{color:#314e64;font-weight:700;border-bottom-color:#536b7c}
.work-category-nav{flex-wrap:wrap;width:auto;overflow:visible;max-width:none;gap:4px}
.work-category-tab{white-space:nowrap}
.site-toolbar{gap:18px;padding-bottom:14px;margin-bottom:24px;border-bottom:1px solid var(--line)}
.site-toolbar .work-category-nav{margin:0;max-width:none;justify-content:flex-end}
.site-toolbar .language-switch{flex-shrink:0}
body{overflow-x:clip}
.site-toolbar{position:sticky;top:0;z-index:20;background:#fff;padding-top:10px}
.project-card,.works-head{scroll-margin-top:80px}
.nav-label-compact{display:none}
.profile-mobile-summary{display:none}
.profile-section[data-profile-page="about"] .profile-mobile-summary{display:block}
.profile-biography{display:contents}
.project-copy h2{overflow-wrap:anywhere}
.site-footer{margin:28px 16px 0;padding-top:18px;border-top:1px solid var(--line);color:#607483;line-height:1.8}
.site-footer a{margin-right:14px}
.biography{margin:0 16px;padding:12px 0 8px;max-width:720px;color:#344d60;font-size:15px;line-height:1.85}
.biography p{margin:0 0 18px}.biography h2{margin:24px 0 10px;color:#213747;font-size:18px}
.biography ul{padding-left:20px}.biography li{margin:9px 0}.biography .author-links{display:flex;flex-wrap:wrap;gap:10px 20px}
.skip-link{position:absolute;left:12px;top:-70px;padding:10px;background:#fff;z-index:1100}
.skip-link:focus{top:12px}
.feature-overlay{overflow-y:auto;max-height:85vh}
@media(max-width:760px){
 .page{width:calc(100% - 24px);padding:16px 0 40px}
 .profile-section{padding:0 8px 24px;gap:18px}
 .profile-copy{padding:0}.profile-copy :is(h1,h2){font-size:30px;margin-bottom:18px}
 .profile-copy p{font-size:15px;line-height:1.75}
 .profile-photo{width:132px;aspect-ratio:3/4;grid-row:1}
 .profile-links,.profile-website{font-size:14px;line-height:1.8;gap:7px}
 .works-head{padding:24px 8px 10px}.works-head h2{font-size:22px}
 .works-head p{font-size:14px;line-height:1.65}
 .work-category-nav{margin:8px 8px 14px}
 .project-card,.vase-card{padding:20px 8px;row-gap:14px}
 .cover-column,.vase-cover-trigger,.nuedc-cover-trigger,.eecs-cover-trigger,.embedded-cover-trigger,.side-project-cover,.lowcom-cover-trigger{max-width:none;width:100%;height:210px;aspect-ratio:auto}
 .project-copy h2,.vase-copy h2,.eecs-copy h2,.embedded-copy h2{font-size:18px;line-height:1.45}
 .project-copy .summary,.vase-summary{font-size:15px;line-height:1.75}
 .project-meta p,.vase-meta p{line-height:1.6}
 .project-kicker,.vase-kicker{font-size:13px;line-height:1.6}
 .signature-visuals{float:right;margin:0 0 8px 12px}
 .feature-overlay{width:calc(100vw - 24px)}
 .feature-grid,.research-grid,.nuedc-grid,.eecs-grid,.embedded-grid,.side-project-demo-grid,.codex-tidy-demo-grid,.alttab-demo-grid,.mindmap-demo-grid{grid-template-columns:1fr}
 .site-footer{margin-inline:8px;font-size:13px}
}
html[lang="en"] .profile-copy p{font-size:12px;line-height:1.55;margin-bottom:10px}
.profile-icon-links{grid-template-columns:repeat(9,32px);gap:5px;min-height:40px}
.profile-contact-icon{width:32px;height:32px;padding:4px}
.profile-contact-icon svg{width:23px;height:23px}
.profile-contact-icon .cv-mark{font-size:20px}
html.portrait-phone .profile-icon-links{grid-template-columns:repeat(9,32px);gap:5px}
html.portrait-phone .profile-contact-icon{width:32px;height:40px;padding:4px}
html.portrait-phone .site-toolbar{width:78vw;max-width:100%;margin-left:auto;margin-right:0;padding-inline:0;flex-wrap:nowrap;gap:calc(4px / var(--portrait-ui-scale));padding-bottom:calc(8px / var(--portrait-ui-scale));margin-bottom:calc(14px / var(--portrait-ui-scale))}
html.portrait-phone .site-toolbar .work-category-nav{flex:1;flex-wrap:nowrap;min-width:0;max-width:100%;justify-content:space-between;gap:calc(1px / var(--portrait-ui-scale))}
html.portrait-phone .site-toolbar .work-category-tab{justify-content:center;text-align:center;gap:0;min-width:calc(28px / var(--portrait-ui-scale));min-height:calc(20px / var(--portrait-ui-scale));padding:calc(4px / var(--portrait-ui-scale)) calc(2px / var(--portrait-ui-scale));font-size:calc(9px / var(--portrait-ui-scale));border-radius:calc(5px / var(--portrait-ui-scale))}
html.portrait-phone .site-toolbar .work-category-tab.is-active::after{width:calc(12px / var(--portrait-ui-scale));height:calc(1px / var(--portrait-ui-scale));bottom:calc(-1px / var(--portrait-ui-scale))}
html.portrait-phone .site-toolbar .language-switch{gap:calc(2px / var(--portrait-ui-scale));font-size:calc(9px / var(--portrait-ui-scale))}
html.portrait-phone .site-toolbar .language-switch a{display:inline-flex;align-items:center;justify-content:center;min-width:calc(20px / var(--portrait-ui-scale));min-height:calc(20px / var(--portrait-ui-scale));padding:calc(3px / var(--portrait-ui-scale)) calc(1px / var(--portrait-ui-scale))}
html.portrait-phone .nav-label-wide{display:none}
html.portrait-phone .nav-label-compact{display:inline}
html.portrait-phone .profile-section{grid-template-columns:180px minmax(0,1fr);column-gap:28px;row-gap:4px;align-items:start}
html.portrait-phone .profile-copy{display:contents}
html.portrait-phone .profile-copy :is(h1,h2){grid-column:2;grid-row:1;text-align:left;margin:0;font-size:32px}
html.portrait-phone .profile-mobile-summary{display:block;grid-column:2;grid-row:2;margin-top:8px}
html.portrait-phone .profile-mobile-summary p{font-size:14px;line-height:1.65;margin:0}
html.portrait-phone .profile-mobile-summary p:last-child{margin-top:12px}
html.portrait-phone .profile-icon-links{grid-column:2;grid-row:3;justify-content:start;margin:8px 0 0}
html.portrait-phone .profile-views{grid-column:2;grid-row:4;text-align:left;margin:0}
html.portrait-phone .profile-photo{grid-column:1;grid-row:1 / 5;width:180px;justify-self:start;align-self:start}
html.portrait-phone .profile-biography{display:block;grid-column:1 / -1;grid-row:5;padding-top:32px}
html.portrait-phone .profile-biography p{font-size:14px;line-height:1.7;margin:0 0 16px}
.paper-copy h2{color:#202428;font-size:16px;line-height:1.4;font-weight:600}
.paper-title{display:flex;align-items:center;gap:8px}
.paper-title .title-link{flex:1;min-width:0}
.paper-authors{margin:7px 0 5px;color:#282e33;font-size:14px;line-height:1.65}
.paper-author{white-space:nowrap}
.paper-author-self .paper-author-name{text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px}
.paper-authors sup{margin-left:1px;font-size:.72em;line-height:0}
.paper-authors a{color:inherit;text-decoration:none}
.paper-authors a:hover,.paper-authors a:focus-visible{color:var(--blue);text-decoration:underline;text-underline-offset:3px}
.paper-venue{margin:0 0 5px;color:#30383e;font-size:14px;line-height:1.5}
.vase-card .paper-venue{color:#a42632;font-weight:700}
.eecs-card .paper-venue{color:#315b98;font-weight:700}
.paper-venue em{font-weight:700;font-style:italic}
.paper-author-note{margin:0 0 10px;color:#687985;font-size:11px;line-height:1.6}
.paper-copy .summary,.paper-copy .vase-summary{font-size:13px;line-height:1.55;margin-bottom:12px}
/* Paper lists put the work first; institutional marks only render on details. */
article[data-work-category="paper"]{grid-template-columns:minmax(0,30%) minmax(0,1fr)!important;column-gap:24px!important;row-gap:0!important;padding:20px 16px!important;border-top:1px solid #edf0f2;align-items:center!important}
article[data-work-category="paper"] .paper-copy{grid-column:2!important;grid-row:1!important;align-self:center;margin:0!important;padding:0!important}
article[data-work-category="paper"] .paper-preview{grid-column:1!important;grid-row:1!important;align-self:center;width:100%!important;max-width:none!important;height:auto!important;aspect-ratio:auto!important;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none}
.paper-preview-image{display:block;width:100%;height:auto;object-fit:contain}
.paper-preview-video{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:contain;background:#fff;pointer-events:none}
.paper-preview-stack{display:grid;gap:8px}
/* Let desktop CN thumbnails define the row height without cropping scientific figures. */
@media(min-width:761px){
 html[data-origin="cn"]:not(.portrait-phone) .page{width:min(1120px,calc(100% - 64px))}
 html[data-origin="cn"]:not(.portrait-phone) article[data-work-category="paper"]{grid-template-columns:minmax(0,34%) minmax(0,1fr)!important;align-items:stretch!important}
 html[data-origin="cn"]:not(.portrait-phone) article[data-work-category="paper"] .paper-preview{align-self:stretch;display:flex;align-items:center;justify-content:center}
 html[data-origin="cn"]:not(.portrait-phone) .paper-preview-stack{width:100%}
 html[data-origin="cn"]:not(.portrait-phone) .paper-preview-video{height:100%;min-height:100%;object-fit:contain}
}
article[data-work-category="paper"] .cover-zoom-hint{right:3px;top:3px;width:27px;height:27px;border:0;border-radius:2px;background:rgba(255,255,255,.8);color:#657783;box-shadow:none;opacity:.65}
article[data-work-category="paper"] .paper-preview:is(:hover,:focus-visible) .cover-zoom-hint{color:var(--blue);border:0;background:#fff;box-shadow:none;opacity:1}
.paper-authors{font-weight:400}
.paper-author-self .paper-author-name{font-weight:600}
.paper-links{gap:6px;font-size:11px;font-weight:400;line-height:1.4}
.paper-links .paper-resource{display:inline-flex;align-items:stretch;min-width:0;min-height:0;padding:0;border:0;border-radius:0;background:transparent;color:#fff;text-decoration:none;box-shadow:none;white-space:nowrap;transition:opacity .15s ease}
.paper-resource .resource-label,.paper-resource .resource-value{display:inline-flex;align-items:center;gap:4px;padding:3px 6px;background:#555;color:#fff}
.paper-resource .resource-value{background:#315b98;font-weight:700}
.paper-resource.resource-arxiv .resource-value{background:#b31b1b}
.paper-resource.resource-code .resource-value{background:#22863a}
.paper-resource.resource-website .resource-value{background:#ffddbc;color:#303030}
.paper-resource.resource-cite .resource-value{background:#675780}
.paper-resource .resource-icon{width:12px;height:12px;flex:0 0 12px}
.paper-links .paper-resource:hover{background:transparent;color:#fff;opacity:.85}
.paper-links .paper-resource:focus-visible{outline:2px solid var(--blue);outline-offset:3px;background:transparent;color:#fff}
.paper-affiliations{grid-column:1 / -1;grid-row:2;margin-top:20px;padding-top:14px;border-top:1px solid #edf0f2}
.paper-affiliations h3{margin:0 0 10px;color:#607483;font-size:12px;line-height:1.5;font-weight:400}
.paper-affiliations :is(.vase-logos,.project-logos){width:auto!important;justify-content:flex-start!important;margin-left:0!important;gap:14px;flex-wrap:wrap!important}
.paper-affiliations .vase-logos img,.paper-affiliations .vase-logos img.wide{width:100px;max-width:100px;height:28px;object-fit:contain}
.citation-dialog{width:min(620px,calc(100% - 36px))}
.citation-text{display:block;width:100%;height:260px;max-height:45vh;padding:12px;border:1px solid #d5dde2;border-radius:4px;background:#f7f9fb;color:#263b4b;font:12px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;resize:vertical;white-space:pre-wrap;overflow-wrap:anywhere}
.citation-status{min-height:20px;margin:8px 0;color:#607483;font-size:12px}
html.mobile-contact-ui .citation-text{height:calc(250px / var(--contact-ui-scale));padding:calc(10px / var(--contact-ui-scale));font-size:calc(12px / var(--contact-ui-scale))}
html.mobile-contact-ui .citation-status{min-height:calc(20px / var(--contact-ui-scale));margin:calc(8px / var(--contact-ui-scale)) 0;font-size:calc(12px / var(--contact-ui-scale))}
@media(max-width:760px){html:not(.portrait-phone) article[data-work-category="paper"]{grid-template-columns:1fr!important;row-gap:14px!important}html:not(.portrait-phone) article[data-work-category="paper"] .paper-copy{grid-column:1!important;grid-row:2!important}html:not(.portrait-phone) .paper-affiliations{grid-row:3}}
html.portrait-phone article[data-work-category="paper"]{-webkit-text-size-adjust:100%;text-size-adjust:100%}
html.portrait-phone .paper-copy h2{font-size:12px;line-height:1.3}
html.portrait-phone article[data-work-category="paper"] .cover-zoom-hint{width:calc(18px / var(--portrait-ui-scale));height:calc(18px / var(--portrait-ui-scale))}
html.portrait-phone .paper-authors,html.portrait-phone .paper-venue{font-size:11px;line-height:1.4}
html.portrait-phone .paper-authors{margin:5px 0 4px}
html.portrait-phone .paper-copy .summary,html.portrait-phone .paper-copy .vase-summary{font-size:12px;line-height:1.4;margin-bottom:9px}
/* Competitions and personal projects share the publication text and preview layout. */
.work-list-card{grid-template-columns:minmax(0,30%) minmax(0,1fr)!important;column-gap:24px!important;row-gap:0!important;padding:20px 16px!important;align-items:center!important;border-top:1px solid #edf0f2}
.work-list-card .work-preview{grid-column:1!important;grid-row:1!important;align-self:stretch!important;display:flex;align-items:center;justify-content:center;width:100%!important;max-width:none!important;height:auto!important;aspect-ratio:auto!important;padding:0!important;border:0!important;border-radius:0;background:transparent;box-shadow:none}
.work-preview>img,.work-preview>video{display:block;width:100%;height:auto;max-width:100%;object-fit:contain;background:transparent;transform:none!important}
.work-preview>video{pointer-events:none}
.work-list-card .work-copy{grid-column:2!important;grid-row:1!important;align-self:center!important;min-width:0;min-height:0!important;padding:0!important;margin:0!important}
.work-copy h2{margin:0;color:#202428!important;font-size:16px!important;line-height:1.4!important;font-weight:600!important}
.work-copy .project-meta{margin:7px 0 5px;color:#282e33;font-size:14px;line-height:1.65}
.work-copy .project-meta p{font-size:14px!important;line-height:1.65;font-weight:400}
.work-list-card[data-work-category="competition"] .project-meta p:first-child{color:#a35b19;font-weight:700}
.work-copy .project-kicker{margin:0 0 5px;color:#315b98;font-size:14px;line-height:1.5;font-weight:700;letter-spacing:0}
.work-copy .summary{max-width:none;margin:0 0 12px;font-size:13px!important;line-height:1.55!important}
.work-copy .project-bottom{max-width:none}
.work-copy .nuedc-note{margin:0 0 12px;padding:0;border:0;color:#687985;font-size:12px;line-height:1.55}
.work-links{gap:6px;font-size:11px;font-weight:400;line-height:1.4}
.work-list-card .cover-zoom-hint{right:3px;top:3px;width:27px;height:27px;border:0;border-radius:2px;background:rgba(255,255,255,.8);color:#657783;box-shadow:none;opacity:.65}
.work-list-card .work-preview:is(:hover,:focus-visible) .cover-zoom-hint{color:var(--blue);border:0;background:#fff;box-shadow:none;opacity:1}
.work-detail-media{grid-column:1/-1;grid-row:2;display:flex;flex-wrap:wrap;align-items:center;gap:20px;margin-top:20px;padding-top:14px;border-top:1px solid #edf0f2}
.work-detail-media .project-logos{width:auto;justify-content:flex-start;margin:0;flex-wrap:wrap}
.work-detail-media .signature-visuals{position:static;float:none;width:124px;margin:0;gap:8px}
.work-detail-media .signature-visuals img{height:auto}
@media(min-width:761px){html[data-origin="cn"]:not(.portrait-phone) .work-list-card{grid-template-columns:minmax(0,34%) minmax(0,1fr)!important}}
@media(max-width:760px){
 html:not(.portrait-phone) .work-list-card{grid-template-columns:1fr!important;row-gap:14px!important}
 html:not(.portrait-phone) .work-list-card .work-copy{grid-column:1!important;grid-row:2!important}
 html:not(.portrait-phone) .work-detail-media{grid-row:3}
}
html.portrait-phone .work-copy h2{font-size:12px!important;line-height:1.3!important}
html.portrait-phone .work-copy .project-meta p,html.portrait-phone .work-copy .project-kicker{font-size:11px!important;line-height:1.4}
html.portrait-phone .work-copy .summary{font-size:12px!important;line-height:1.4!important;margin-bottom:9px}
html.portrait-phone .work-list-card .cover-zoom-hint{width:calc(18px / var(--portrait-ui-scale));height:calc(18px / var(--portrait-ui-scale))}

'''
    css += (SOURCE / 'work-view.css').read_text()
    css += (SOURCE / 'competition-presentation.css').read_text()
    css += (SOURCE / 'preview-playback.css').read_text()
    typography = (SOURCE / 'site-typography.css').read_text()
    css += typography
    scripts = []
    for s in template.xpath('//script[not(@src)]'):
        code = s.text or ''
        if 'portraitCanvasWidth' in code or 'activateCategory' in code or 'maximumWaitMs' in code:
            continue
        # Detail/category pages have only a subset of the original projects.
        if 'const anyOpen' in code:
            code = code.replace('    ];\n    const anyOpen',
                                '    ].filter(project => project.card && project.trigger && project.overlay && project.close);\n    const anyOpen')
            code = re.sub(r"    const runWhenIdle =.*?    const hydrateOverlay", '    const hydrateOverlay', code, flags=re.S)
            code = re.sub(r'    const preloadAllProjectMedia =.*?    const setOpen', '    const setOpen', code, flags=re.S)
            code = code.replace("    window.addEventListener('portfolio:ready', preloadAllProjectMedia, {once:true});\n", '')
            # Original experiment videos are an explicit user choice; merely
            # opening a gallery must not activate a phone's native media player.
            code = code.replace('if (open && !reduceMotion) video.play().catch(() => {});\n        else video.pause();', 'if (!open) video.pause();')
            code = code.replace("if (!anyOpen() || (event.key !== 'Escape' && event.key !== ' ')) return;",
                "if (!anyOpen() || (event.key !== 'Escape' && event.key !== ' ')) return;\n      if (event.key === ' ' && event.target.closest('button,a,input,summary,video,select,textarea')) return;")
        scripts.append(code)
    scripts.append("requestAnimationFrame(() => { document.documentElement.classList.add('portfolio-ready'); window.dispatchEvent(new Event('portfolio:ready')); if (!matchMedia('(prefers-reduced-motion:reduce)').matches) document.documentElement.classList.add('carousels-running'); });")
    scripts.append((SOURCE / 'preview-frame-player.js').read_text())
    scripts.append((SOURCE / 'preview-playback.js').read_text())
    scripts.append((SOURCE / 'work-view.js').read_text())
    scripts.append((SOURCE / 'device-preview/frame-context.js').read_text())
    runtime = '\n'.join(scripts)
    cards = {e.get('id'): e for e in template.xpath('//article[@data-work-category]')}

    manifest = {'version': VERSION, 'origins': {}}
    for origin, base, default_lang in [('cn', CN, 'zh'), ('github', GH, 'en')]:
        destination = BUILD / origin
        for preview_file in (SOURCE / 'device-preview').glob('*'):
            if preview_file.name == 'frame-context.js': continue
            content = preview_file.read_text()
            if origin == 'github' and preview_file.name == 'index.html':
                content = content.replace('data-default-language="zh"', 'data-default-language="en"')
            write(destination / 'device-preview' / preview_file.name, content)
        if origin == 'cn':
            write(destination / 'nav/index.html', (SOURCE / 'site-nav/index.html').read_text())
        asset_prefix = '/assets/'
        path_prefix = '/'
        write(destination / 'assets/css/portfolio.css', css)
        write(destination / 'assets/css/site-typography.css', typography)
        write(destination / 'assets/js/portfolio-runtime.js', runtime)
        for source_file in (SOURCE / 'fonts').glob('*'):
            if source_file.is_file():
                target = destination / 'assets/fonts' / source_file.name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(source_file.read_bytes())
        for source_name, target_name in [('favicon.ico', 'favicon.ico'),
                                          ('qiushi-favicon.png', 'assets/contact/qiushi-favicon.png'),
                                          ('apple-touch-icon.png', 'assets/contact/apple-touch-icon.png')]:
            target = destination / target_name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes((SOURCE / 'favicon' / source_name).read_bytes())
        for source_file in (SOURCE / 'contact').glob('*'):
            if source_file.is_file():
                target = destination / 'assets/contact' / source_file.name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(source_file.read_bytes())
        for source_file in (SOURCE / 'publication-logos').glob('*.png'):
            target = destination / 'assets/portfolio-cover' / source_file.name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(source_file.read_bytes())
        # Native paper figures exported from the user's local experiment visualization.
        figures = SOURCE / 'publication-figures'
        for source_file in figures.rglob('*'):
            if source_file.is_file():
                target = destination / 'assets/portfolio-cover' / source_file.relative_to(figures)
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(source_file.read_bytes())
        for source_file in (SOURCE / 'project-previews').rglob('*'):
            if source_file.is_file() and 'inputs' not in source_file.parts and source_file.suffix in ('.mp4', '.jpg', '.webp', '.svg'):
                target = destination / 'assets/portfolio-cover' / source_file.relative_to(SOURCE/'project-previews')
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(source_file.read_bytes())
        for source_file in (SOURCE / 'preview-frames').rglob('*'):
            if source_file.is_file():
                target = destination / 'assets/preview-frames' / source_file.relative_to(SOURCE/'preview-frames')
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(source_file.read_bytes())
        for source_file in (SOURCE / 'citations').glob('*.bib'):
            target = destination / 'assets/citations' / source_file.name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(source_file.read_bytes())
        for language in ('zh', 'en'):
            lang_prefix = '' if language == default_lang else language + '/'
            local_base = path_prefix + lang_prefix
            canonical_base = CN if language == 'zh' else GH
            for route in ROUTES:
                tree = deepcopy(template)
                head = tree.find('head')
                body = tree.find('body')
                for s in tree.xpath('//script'):
                    s.getparent().remove(s)
                phone_viewport = element('script')
                phone_viewport.text = viewport_script
                viewport_meta = head.xpath('./meta[@name="viewport"]')[0]
                head.insert(list(head).index(viewport_meta) + 1, phone_viewport)
                for style in head.findall('style'):
                    head.remove(style)
                loader = tree.xpath('//*[@id="portfolioLoader"]')[0]
                loader.getparent().remove(loader)
                for ns in tree.xpath('//noscript'):
                    ns.getparent().remove(ns)
                category = CATEGORIES.get(route)
                detail_id = next((key for key, value in DETAILS.items() if value == route), None)
                for card in tree.xpath('//article[@data-work-category]'):
                    if ((route == 'about') or (category and card.get('data-work-category') != category[2]) or
                        (detail_id and card.get('id') != detail_id)):
                        card.getparent().remove(card)
                # Keep affiliation originals in each paper's own page, not list headers.
                if not detail_id:
                    for affiliations in tree.xpath('//*[@class="paper-affiliations"]'):
                        affiliations.getparent().remove(affiliations)
                for card in tree.xpath('//article[@data-work-category="competition" or @data-work-category="side"]'):
                    format_project_list(card, bool(detail_id), language)
                if language == 'en':
                    translate_tree(tree)
                for competition in tree.xpath('//article[@data-work-category="competition"]'):
                    format_competition_team(competition, language)
                format_vase_contributions(tree, language, detail_id == 'vaseProjectCard')
                for cite in tree.xpath('//*[@data-citation-key]'):
                    cite.set('data-citation-text', (SOURCE / 'citations' / (cite.get('data-citation-key') + '.bib')).read_text())
                if not tree.xpath('//*[@data-citation-key]'):
                    citation_dialog = tree.xpath('//*[@id="citationDialog"]')[0]
                    citation_dialog.getparent().remove(citation_dialog)
                for author_home in tree.xpath('//*[@data-author-home="self"]'):
                    author_home.set('href', local_base)
                profile_copy = tree.xpath('//*[contains(concat(" ",@class," ")," profile-copy ")]')[0]
                for paragraph in profile_copy.findall('p'):
                    profile_copy.remove(paragraph)
                if route == '':
                    for index, paragraph in enumerate(author_paragraphs(language), 1):
                        profile_copy.insert(index, paragraph)
                    biography = element('div', **{'class': 'profile-biography'})
                    for paragraph in profile_copy.findall('p'):
                        biography.append(paragraph)
                    profile_copy.insert(1, biography)
                if route in ('', 'about'):
                    summary = element('div', **{'class': 'profile-mobile-summary'})
                    for line in AUTHOR['mobile_summary'][language]:
                        summary.append(element('p', line))
                    profile_copy.insert(1, summary)
                if route == '':
                    # A name search should summarize the author; project pages
                    # remain available for unrestricted project snippets.
                    for card in tree.xpath('//article[@data-work-category]'):
                        parent = card.getparent()
                        wrapper = element('div', **{'class': 'homepage-project-context',
                                                    'data-nosnippet': ''})
                        parent.insert(parent.index(card), wrapper)
                        wrapper.append(card)
                tree.set('lang', 'zh-CN' if language == 'zh' else 'en')
                tree.set('data-language', language)
                tree.set('data-origin', origin)
                title = ('浙江大学2027级直博生-谢秋实（Qiushi Xie）' if language == 'zh'
                         else 'Qiushi Xie (谢秋实) — Incoming PhD Student, ZJU (2027)')
                description = AUTHOR['description'][language]
                heading = tree.xpath('//*[@class="works-head"]/h2')[0]
                if route == 'about':
                    heading.tag = 'h1'
                    heading.text = '关于谢秋实' if language == 'zh' else 'About Qiushi Xie'
                    title = '谢秋实（Qiushi Xie）｜个人介绍' if language == 'zh' else 'About Qiushi Xie (谢秋实)'
                    description = AUTHOR['description'][language]
                    heading.getparent().find('p').clear()
                    heading.getparent().find('p').text = '教育背景、研究兴趣与代表项目' if language == 'zh' else 'Education, research interests, and selected work'
                    tree.xpath('//*[@id="profileName"]')[0].tag = 'h2'
                if category:
                    heading.tag = 'h1'
                    label = category[0 if language == 'zh' else 1]
                    heading.text = label
                    title = label + (' | 谢秋实 Qiushi Xie' if language == 'zh' else ' | Qiushi Xie')
                    description = ('谢秋实的' + label + '：' if language == 'zh' else "Qiushi Xie's " + label.lower() + ': ') + ', '.join(''.join(c.xpath('.//h2')[0].itertext()).strip() for c in tree.xpath('//article[@data-work-category]'))
                if detail_id:
                    c = tree.xpath('//article[@data-work-category]')[0]
                    project_title = ''.join(c.xpath('.//h2')[0].itertext()).strip()
                    heading.tag = 'h1'
                    heading.text = project_title
                    title = project_title + (' | 谢秋实' if language == 'zh' else ' | Qiushi Xie')
                    summary = c.xpath('.//*[contains(concat(" ",@class," ")," summary ") or contains(concat(" ",@class," ")," vase-summary ")]')
                    if summary:
                        description = ''.join(summary[0].itertext()).strip()
                    intro = heading.getparent().find('p')
                    intro.clear()
                    intro.text = PROJECT_PAGES[route]['intro'][language]
                    tree.xpath('//*[@id="profileName"]')[0].tag = 'h2'
                head.find('title').text = title
                head.xpath('./meta[@name="description"]')[0].set('content', description)
                if route == '':
                    head.append(element('meta', name='robots', content='max-image-preview:large'))
                if route == '' and VERIFICATION.get('google'):
                    head.append(element('meta', name='google-site-verification', content=VERIFICATION['google']))
                if route == '' and VERIFICATION.get('bing'):
                    head.append(element('meta', name='msvalidate.01', content=VERIFICATION['bing']))
                if route == '':
                    for meta_name, meta_value in VERIFICATION.get('platform_meta', {}).get(origin, {}).items():
                        head.append(element('meta', name=meta_name, content=meta_value))
                head.append(element('link', rel='stylesheet', href=asset_prefix + 'css/portfolio.css?v=' + VERSION))
                canonical = route_url(canonical_base, route)
                head.append(element('link', rel='canonical', href=canonical))
                for lang, target in [('zh-CN', route_url(CN, route)), ('en', route_url(GH, route)), ('x-default', route_url(GH, route))]:
                    head.append(element('link', rel='alternate', hreflang=lang, href=target))
                share_image = (canonical_base + PROJECT_PAGES[route]['image'] if detail_id
                               else portrait_url(canonical_base))
                share_alt = PROJECT_PAGES[route]['image_alt'][language] if detail_id else '谢秋实 / Qiushi Xie'
                for prop, value in [('og:title', title), ('og:description', description), ('og:type', 'website'),
                                    ('og:url', canonical), ('og:locale', 'zh_CN' if language == 'zh' else 'en_US'),
                                    ('og:image', share_image), ('og:image:alt', share_alt)]:
                    head.append(element('meta', property=prop, content=value))
                head.append(element('meta', name='twitter:card', content='summary_large_image' if detail_id else 'summary'))
                head.append(element('meta', name='twitter:image', content=share_image))
                head.append(element('meta', name='twitter:image:alt', content=share_alt))
                person = {'@type': 'Person', '@id': CN + '#person', 'name': '谢秋实',
                          'alternateName': 'Qiushi Xie', 'url': canonical_base,
                          'description': AUTHOR['description'][language],
                          'image': portrait_url(canonical_base),
                          'affiliation': {'@type': 'CollegeOrUniversity', 'name': 'Huazhong University of Science and Technology'},
                          'sameAs': [AUTHOR['github'], CN, GH, AUTHOR['scholar']],
                          'subjectOf': [{'@id': route_url(CN, 'about') + '#page'}, {'@id': route_url(GH, 'about') + '#page'}],
                          'knowsAbout': AUTHOR['research_interests']}
                page = {'@type': 'ProfilePage' if route in ('', 'about') else 'CollectionPage' if category else 'WebPage',
                        '@id': canonical + '#page', 'url': canonical, 'name': title,
                        'description': description, 'inLanguage': 'zh-CN' if language == 'zh' else 'en',
                        'mainEntity': {'@id': person['@id']}, 'isPartOf': {'@id': canonical_base + '#website'}}
                graph = [person, page, {'@type': 'WebSite', '@id': canonical_base + '#website', 'url': canonical_base, 'name': 'Qiushi Xie / 谢秋实'}]
                if route == '':
                    portrait = {'@type': 'ImageObject', '@id': canonical_base + '#portrait',
                                'contentUrl': person['image'], 'url': person['image'],
                                'caption': '谢秋实 / Qiushi Xie'}
                    page['primaryImageOfPage'] = {'@id': portrait['@id']}
                    graph.append(portrait)
                if detail_id:
                    work = {'@type': 'ScholarlyArticle' if detail_id in ('eecsProjectCard', 'vaseProjectCard') else 'CreativeWork',
                            '@id': canonical + '#work', 'name': project_title, 'url': canonical,
                            'description': description, 'inLanguage': page['inLanguage']}
                    if detail_id == 'eecsProjectCard':
                        work.update({'identifier': 'doi:10.1117/12.3122481', 'sameAs': 'https://doi.org/10.1117/12.3122481', 'author': {'@id': person['@id']}})
                    if detail_id == 'vaseProjectCard':
                        work.update({'identifier': 'arXiv:2607.06374', 'sameAs': 'https://arxiv.org/abs/2607.06374',
                                     'author': [({'@type': 'Person', '@id': person['@id'], 'name': name}
                                                 if name == 'Qiushi Xie' else {'@type': 'Person', 'name': name})
                                                for name in cards[detail_id].xpath('.//*[@data-author-name]/@data-author-name')]})
                        for item, author_node in zip(work['author'], cards[detail_id].xpath('.//*[@data-author-name]')):
                            homepage = author_node.xpath('.//a/@href')
                            if homepage:
                                item['url'] = person['url'] if item['name'] == 'Qiushi Xie' else homepage[0]
                    graph.append(work)
                    page['mainEntity'] = {'@id': work['@id']}
                    page['about'] = {'@id': person['@id']}
                    preview = {'@type': 'ImageObject', '@id': canonical + '#preview',
                               'contentUrl': share_image, 'url': share_image,
                               'caption': share_alt}
                    graph.append(preview)
                    page['primaryImageOfPage'] = {'@id': preview['@id']}
                    work['image'] = share_image
                schema = element('script', type='application/ld+json')
                schema.text = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False).replace('<', '\\u003c')
                head.append(schema)
                name = tree.xpath('//*[@id="profileName"]')[0]
                name.text = '谢秋实' if language == 'zh' else 'Qiushi Xie'
                name.append(element('span', 'Qiushi Xie' if language == 'zh' else '谢秋实', **{'class': 'profile-name-latin'}))
                switch = tree.xpath('//*[contains(concat(" ",@class," ")," language-switch ")]')[0]
                switch.clear()
                switch.set('class', 'language-switch')
                switch.set('aria-label', 'Language / 语言')
                for lang, label in [('zh', '中文'), ('en', 'EN')]:
                    target_prefix = path_prefix + ('' if lang == default_lang else lang + '/')
                    a = element('a', label, href=route_url(target_prefix, route), lang='zh-CN' if lang == 'zh' else 'en')
                    if lang == language:
                        a.set('class', 'is-active'); a.set('aria-current', 'page')
                    switch.append(a)
                nav = tree.xpath('//*[contains(concat(" ",@class," ")," work-category-nav ")]')[0]
                nav.clear(); nav.set('class', 'work-category-nav'); nav.set('aria-label', '作品分类' if language == 'zh' else 'Work categories')
                for path, zh, en in [('', '全部', 'All Work'), ('papers', '论文', 'Papers'), ('competitions', '比赛', 'Competitions'), ('projects', '小项目', 'Side Projects'), ('about', '关于我', 'About')]:
                    a = element('a', zh if language == 'zh' else en, href=route_url(local_base, path))
                    if language == 'en' and path in ('', 'competitions', 'projects'):
                        a.text = None
                        a.set('aria-label', en)
                        a.append(element('span', en, aria_hidden='true', **{'class':'nav-label-wide'}))
                        short_label = {'':'All Works', 'competitions':'Contests', 'projects':'Projects'}[path]
                        a.append(element('span', short_label, aria_hidden='true', **{'class':'nav-label-compact'}))
                    else:
                        label = a.text
                        a.text = None
                        a.append(element('span', label, **{'class':'nav-label'}))
                    active = route == path or (path and route.startswith(path + '/'))
                    a.set('class', 'work-category-tab' + (' is-active' if active else ''))
                    if route == path: a.set('aria-current', 'page')
                    nav.append(a)
                if route == 'about':
                    biography = element('section', aria_label='个人介绍' if language == 'zh' else 'Biography', **{'class':'biography'})
                    for paragraph in author_paragraphs(language):
                        biography.append(paragraph)
                    biography.append(element('h2', '代表论文与项目' if language == 'zh' else 'Selected papers and projects'))
                    works = element('ul')
                    for path, zh, en in [
                        ('papers/vasemuseum', 'VaseMuseum · arXiv 预印本，共同第一作者', 'VaseMuseum · arXiv preprint, co-first author'),
                        ('papers/battery-rul', '锂离子电池剩余寿命预测 · SPIE 2026，独立第一作者', 'Battery remaining-useful-life estimation · SPIE 2026, sole author'),
                        ('competitions/intelcup-2026', '英特尔杯无人机地面站 · 全国二等奖，前7.83%', 'Intel Cup drone ground station · National Second Prize, top 7.83%'),
                        ('competitions/nuedc-c', '数字钥匙实验系统 · 湖北赛区一等奖', 'Digital-key system · First Prize, Hubei division')]:
                        item = element('li'); item.append(element('a', zh if language == 'zh' else en, href=route_url(local_base, path))); works.append(item)
                    biography.append(works)
                    biography.append(element('h2', '个人主页与学术资料' if language == 'zh' else 'Personal and academic profiles'))
                    links = element('div', **{'class':'author-links'})
                    for href, label in [(AUTHOR['scholar'], 'Google Scholar'), (AUTHOR['github'], 'GitHub'), (CN, '中文主页'), (GH, 'English homepage')]:
                        links.append(element('a', label, href=href))
                    biography.append(links)
                    heading.getparent().addnext(biography)
                if route == 'about':
                    tree.xpath('//section[@class="profile-section"]')[0].set('data-profile-page', 'about')
                elif route:
                    profile = tree.xpath('//section[@class="profile-section"]')[0]
                    profile.getparent().remove(profile)
                for card in tree.xpath('//article[@data-work-category]'):
                    path = DETAILS[card.get('id')]
                    title_link = card.xpath('.//a[contains(concat(" ",@class," ")," title-link ")]')[0]
                    title_link.set('href', route_url(local_base, path))
                    title_link.attrib.pop('target', None)
                for photo in tree.xpath('//img[@class="profile-photo"]'):
                    photo.set('src', portrait_url())
                if origin == 'cn':
                    for image in tree.xpath('//*[@id="eecsCoverTrigger"]/img[@class="paper-preview-image"]'):
                        preview = element('video', **{'class':'paper-preview-video', 'muted':'', 'loop':'',
                            'playsinline':'', 'preload':'none', 'poster':image.get('src'),
                            'data-src':'assets/portfolio-cover/eecs-2026/method-preview.mp4',
                            'data-preview-auto':'', 'aria-label':'Battery RUL animated method preview'})
                        image.getparent().replace(image, preview)
                for e in tree.iter():
                    if not isinstance(e.tag, str): continue
                    for attr in ('src', 'href', 'poster', 'data-src', 'data-contact-src'):
                        value = e.get(attr)
                        if value and value.startswith('assets/'):
                            e.set(attr, asset_prefix + value[len('assets/'):])
                    if origin == 'github' and e.get('href') in EXTERNAL_PROJECTS:
                        e.set('href', EXTERNAL_PROJECTS[e.get('href')])
                    if origin == 'github' and e.get('href') in (CN + 'cv', CN + 'cv/'):
                        e.set('href', GH + 'cv/')
                    if e.tag == 'img' and e.get('class') not in ('profile-photo', 'profile-qq-logo'):
                        e.set('loading', 'lazy'); e.set('decoding', 'async')
                    if e.tag == 'video':
                        e.set('preload', 'none')
                        e.attrib.pop('autoplay', None)
                        if 'data-preview-auto' not in e.attrib:
                            e.set('controls', '')
                main = tree.xpath('//*[contains(concat(" ",@class," ")," page ")]')[0]
                main.set('id', 'main-content')
                if route == '' or category:
                    for copy in tree.xpath('//article[@data-work-category]//div[contains(concat(" ",@class," ")," paper-copy ") or contains(concat(" ",@class," ")," work-copy ")]'):
                        details = element('div', **{'class':'work-reading-details'})
                        for child in list(copy):
                            if child.tag != 'h2': details.append(child)
                        copy.append(details)
                for video in tree.xpath('//article[@data-work-category]/button/video[@data-preview-auto]'):
                    button = video.getparent()
                    preview_id = button.get('id') + '-animation'
                    name = {'coverTrigger':f'intelcup-2026-{language}',
                            'nuedcCoverTrigger':f'nuedc-c-{language}',
                            'eecsCoverTrigger':'battery-method'}[button.get('id')]
                    sequence = json.loads((SOURCE / 'preview-frames' / name / 'sequence.json').read_text())
                    canvas = element('canvas', **{'id':preview_id,'data-preview-auto':'',
                        'data-preview-sequence':f'/assets/preview-frames/{name}/sequence.json?v={VERSION}',
                        'aria-label':video.get('aria-label'),'role':'img',
                        'width':str(sequence['width']),'height':str(sequence['height'])})
                    poster_src = video.get('poster')
                    button.replace(video, canvas)
                    wrapper = element('div', **{'class':button.get('class', '') + ' preview-media',
                                                'data-preview-motion':'','data-preview-state':'poster',
                                                'style':f'--preview-ratio:{sequence["width"]}/{sequence["height"]}'})
                    button.addprevious(wrapper)
                    wrapper.append(button)
                    button.set('class', 'preview-open')
                    poster = element('img', src=poster_src, alt='', **{'class':'preview-poster', 'aria-hidden':'true'})
                    button.insert(button.index(canvas)+1, poster)
                    control = element('button', type='button', aria_label='播放动画' if language == 'zh' else 'Play animation',
                                      aria_controls=preview_id, **{'class':'preview-play-control','data-preview-play':''})
                    control.append(element('span', '▶', **{'class':'preview-play-icon','aria-hidden':'true'}))
                    control.append(element('span', '播放' if language == 'zh' else 'Play', **{'class':'preview-play-label'}))
                    wrapper.append(control)
                    # Clicking the original thumbnail still opens its full gallery.
                    # A separate control avoids nested buttons and accidental opens.
                    overlay_id = button.get('aria-controls')
                    overlay = tree.xpath('//*[@id=$id]', id=overlay_id) if overlay_id else []
                    if overlay:
                        featured = deepcopy(wrapper)
                        featured.set('class', 'preview-media gallery-preview-media')
                        featured.set('data-preview-popup', '')
                        featured_button = featured.find('button')
                        # Gallery playback is not another gallery-open button.
                        featured_button.tag = 'div'
                        featured_button.attrib.clear()
                        featured_button.set('class', 'preview-open')
                        featured_canvas = featured_button.find('canvas')
                        featured_canvas.set('id', preview_id + '-expanded')
                        featured_canvas.set('data-preview-popup', '')
                        featured_control = featured.find('button')
                        featured_control.set('aria-controls', preview_id + '-expanded')
                        for zoom_hint in featured.xpath('.//*[contains(concat(" ",@class," ")," cover-zoom-hint ")]'):
                            zoom_hint.getparent().remove(zoom_hint)
                        overlay[0][0].addnext(featured)
                        original = element('details', **{'class':'preview-original'})
                        original.append(element('summary', '播放原视频' if language == 'zh' else 'Play original video'))
                        original.append(element('video', **{'src':video.get('data-src'),'poster':poster_src,
                            'controls':'','playsinline':'','preload':'none','aria-label':video.get('aria-label')}))
                        featured.addnext(original)
                    if button.get('id') == 'eecsCoverTrigger':
                        wrapper.remove(control)
                        wrapper.set('class', wrapper.get('class') + ' no-preview-control')
                sizes = json.loads((SOURCE / 'work-media-sizes.json').read_text())
                for media in tree.xpath('//article[@data-work-category]/button//img | //article[@data-work-category]/button/video | //div[@data-preview-motion]//img | //div[@data-preview-motion]//video'):
                    src = (media.get('src') or media.get('data-src') or '').lstrip('/')
                    dimensions = sizes.get(src)
                    if media.tag == 'video' and dimensions is None:
                        dimensions = [1920,1080]
                    if dimensions:
                        media.set('width', str(dimensions[0])); media.set('height', str(dimensions[1]))
                        if media.tag == 'video' and 'data-preview-auto' in media.attrib:
                            media.getparent().getparent().set('style', f'--preview-ratio:{dimensions[0]}/{dimensions[1]}')
                if route == '' or category:
                    collection = element('section', **{'class':'work-collection', 'data-work-view':'overview', 'aria-label':'作品' if language == 'zh' else 'Works'})
                    works_head = tree.xpath('//*[@class="works-head"]')[0]
                    main.insert(main.index(works_head), collection)
                    collection.append(works_head)
                    readingbar = element('div', **{'class':'work-readingbar'})
                    works_head.insert(0, readingbar)
                    readingbar.append(heading)
                    controls = element('fieldset', **{'class':'work-view-controls'})
                    controls.append(element('legend', '作品阅读方式' if language == 'zh' else 'Work reading view'))
                    for value, label, icon in [('overview', '紧凑总览' if language == 'zh' else 'Overview', '<rect x="2" y="3" width="7" height="14" rx="1"/><path d="M12 4h6M12 8h6M12 12h6M12 16h6"/>'), ('large', '大图浏览' if language == 'zh' else 'Large view', '<rect x="2" y="2" width="16" height="9" rx="1"/><path d="M2 14h16M2 18h12"/>')]:
                        option = element('label', **{'class':'work-view-option'})
                        radio = element('input', type='radio', name='work-view', value=value)
                        if value == 'overview': radio.set('checked', '')
                        option.append(radio)
                        content = element('span')
                        content.append(html.fromstring('<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">'+icon+'</svg>'))
                        content.append(element('span', label))
                        option.append(content)
                        controls.append(option)
                    readingbar.append(controls)
                    works_head.find('p').set('class', 'work-list-description')
                    works_head.append(element('p', '点「大图浏览」，放大图片与文字。' if language == 'zh' else 'Switch to Large view for bigger images and text.', **{'class':'work-view-hint'}))
                    for card in list(main):
                        if (card.tag == 'article' and card.get('data-work-category')) or card.get('class') == 'homepage-project-context':
                            collection.append(card)
                skip = element('a', '跳到作品' if language == 'zh' else 'Skip to content', href='#main-content', **{'class':'skip-link'})
                body.insert(0, skip)
                footer = element('footer', **{'class':'site-footer'})
                footer.append(element('p', '国内入口 / China: qiushi0919.cn · International: GitHub Pages' if language == 'zh' else 'China: qiushi0919.cn · International: GitHub Pages'))
                for href, label in [(route_url(CN, route), '国内 · cn'), (route_url(GH, route), 'International · GitHub'), (route_url(local_base, 'about'), '个人介绍' if language == 'zh' else 'About'), (AUTHOR['scholar'], 'Google Scholar'), (route_url(local_base, 'papers'), '论文 / Papers'), (route_url(local_base, 'competitions'), '竞赛 / Competitions')]:
                    footer.append(element('a', label, href=href))
                if origin == 'cn' and VERIFICATION.get('icp_website'):
                    filing = element('p')
                    filing.append(element('a', VERIFICATION['icp_website'], href='https://beian.miit.gov.cn/', target='_blank', rel='noopener noreferrer'))
                    footer.append(filing)
                main.append(footer)
                body.append(element('script', src=asset_prefix + 'js/portfolio-runtime.js?v=' + VERSION))
                # Refresh covers and their video opening frames together even
                # when a visitor has the prior release in the media cache.
                for media in tree.iter():
                    for attribute in ('src', 'data-src', 'poster'):
                        value = media.get(attribute, '')
                        if re.search(r'/portfolio-cover/(intelcup-2026|nuedc-c|embedded-2025)/(cover-(zh|en)\.jpg|preview-with-cover-(zh|en)\.mp4)$', value):
                            media.set(attribute, value + '?v=' + VERSION)
                target = destination / lang_prefix / route / 'index.html'
                write(target, '<!doctype html>\n' + etree.tostring(tree, encoding='unicode', method='html') + '\n')
        # The standalone paper project has its own repository for the international site.
        if origin == 'cn':
            for source_file in (SOURCE / 'project-sites/battery-rul').rglob('*'):
                if source_file.is_file():
                    target = destination / 'battery-rul' / source_file.relative_to(SOURCE / 'project-sites/battery-rul')
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(source_file.read_bytes())
        # Keep the exact public ownership files issued by the search platforms.
        verification = ROOT / 'verification'
        if verification.exists():
            for p in verification.iterdir():
                if p.is_file(): write(destination / p.name, p.read_text())
        legacy_tools = 'Disallow: /Qiushi-Portfolio/tools/\n' if origin == 'github' else ''
        blocked_paths = f'Disallow: {path_prefix}analytics/\nDisallow: {path_prefix}cost-per-day/api/\nDisallow: {path_prefix}tools/\n{legacy_tools}'
        # Specific bot groups do not inherit wildcard restrictions.
        ai_agents = ('OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User',
                     'Google-Extended', 'PerplexityBot', 'Perplexity-User')
        named_agents = ''.join(f'User-agent: {agent}\n' for agent in ai_agents)
        # The wildcard also covers providers without a published crawler token.
        write(destination / 'robots.txt', f'{named_agents}{blocked_paths}Allow: /\n\nUser-agent: *\n{blocked_paths}Allow: /\nSitemap: {base}sitemap.xml\n')
        sitemap = etree.Element('urlset', nsmap={None:'http://www.sitemaps.org/schemas/sitemap/0.9', 'xhtml':'http://www.w3.org/1999/xhtml'})
        for route in ROUTES:
            url = etree.SubElement(sitemap, 'url')
            etree.SubElement(url, 'loc').text = route_url(base, route)
            for lang, alt in [('zh-CN', CN), ('en', GH), ('x-default', GH)]:
                etree.SubElement(url, '{http://www.w3.org/1999/xhtml}link', rel='alternate', hreflang=lang, href=route_url(alt, route))
        if origin == 'cn':
            project_url = etree.SubElement(sitemap, 'url')
            etree.SubElement(project_url, 'loc').text = CN + 'battery-rul/'
        write(destination / 'sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n' + etree.tostring(sitemap, encoding='unicode', pretty_print=True))
        alias = f'<!doctype html><html lang="{default_lang}"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url={base}"><link rel="canonical" href="{base}"><title>Qiushi Xie / 谢秋实</title></head><body><a href="{base}">Qiushi Xie / 谢秋实 · Homepage</a></body></html>\n'
        write(destination / 'portfolio-cover.html', alias)
        write(destination / '404.html', f'<!doctype html><html lang="{default_lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 · Qiushi Xie</title><link rel="stylesheet" href="/assets/css/site-typography.css"><style>body{{font-size:16px;max-width:600px;margin:12vh auto;padding:24px;line-height:1.8}}a{{color:#1772d0}}</style></head><body><h1>404</h1><p>页面不存在 / Page not found.</p><a href="{path_prefix}">返回主页 / Homepage</a></body></html>\n')
        manifest['origins'][origin] = {str(p.relative_to(destination)): hashlib.sha256(p.read_bytes()).hexdigest() for p in destination.rglob('*') if p.is_file()}
    # Preserve each existing project URL while moving the portfolio to the root.
    legacy = BUILD / 'github-legacy'
    for language in ('en', 'zh'):
        prefix = '' if language == 'en' else 'zh/'
        for route in ROUTES:
            if route == 'about': continue  # No biography route existed on the legacy site.
            target = route_url(GH + prefix, route)
            canonical = route_url(GH if language == 'en' else CN, route)
            page = f'<!doctype html><html lang="{language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url={target}"><link rel="canonical" href="{canonical}"><title>Qiushi Xie / 谢秋实 · Homepage</title></head><body><a href="{target}">Qiushi Xie / 谢秋实 · Homepage</a></body></html>\n'
            write(legacy / prefix / route / 'index.html', page)
    for path in ('cv', 'nav'):
        target = GH + path + '/'
        write(legacy / path / 'index.html', f'<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url={target}"><link rel="canonical" href="{target}"><title>Qiushi Xie</title></head><body><a href="{target}">Continue</a></body></html>\n')
    write(legacy / 'portfolio-cover.html', (BUILD / 'github/portfolio-cover.html').read_text())
    write(legacy / '404.html', (BUILD / 'github/404.html').read_text())
    # The old sitemap allows crawlers to discover the old pages' redirects.
    old_sitemap = etree.Element('urlset', nsmap={None:'http://www.sitemaps.org/schemas/sitemap/0.9'})
    for route in ROUTES:
        if route == 'about': continue
        url = etree.SubElement(old_sitemap, 'url')
        etree.SubElement(url, 'loc').text = route_url(LEGACY_GH, route)
    write(legacy / 'sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n' + etree.tostring(old_sitemap, encoding='unicode', pretty_print=True))
    write(legacy / 'robots.txt', 'User-agent: *\nDisallow: /Qiushi-Portfolio/tools/\nSitemap: ' + LEGACY_GH + 'sitemap.xml\n')
    manifest['legacy_github'] = {str(p.relative_to(legacy)): hashlib.sha256(p.read_bytes()).hexdigest() for p in legacy.rglob('*') if p.is_file()}
    write(BUILD / 'manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status':'built','pages_per_origin':len(ROUTES)*2,'version':VERSION}))


if __name__ == '__main__':
    build()
