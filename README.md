# 谢秋实 / Qiushi Xie — Research & Projects

- 国内中文主页：https://qiushi0919.cn/
- International English homepage: https://qiushi0919.github.io/
- Google Scholar: https://scholar.google.com/citations?user=TkPyZ-UAAAAJ
- Personal biography: https://qiushi0919.cn/about/ · https://qiushi0919.github.io/about/
- Source repository: https://github.com/Qiushi0919/Qiushi0919.github.io

Two public entrances serve the same portfolio. The CN origin defaults to Chinese;
GitHub Pages defaults to English. Both offer a language switch and an origin
switch. There is no IP-based redirect.

The portfolio toolbar stays at the top during scrolling, with an opaque white
background and a stacking order below project dialogs. Horizontal clipping does
not create an extra scrolling ancestor. Portrait-phone checks use the established
980px canvas and its physical display scale, rather than treating it as a narrow
desktop iframe.

## Search-friendly static pages

Each language has a homepage, a biography page, three category pages, and ten project pages. All
text and navigation links exist in HTML without JavaScript. JavaScript adds
contact dialogs, project previews, and image carousels; it does not hide the
portfolio while waiting for images.

Preferred Chinese URLs live on `qiushi0919.cn`; preferred English URLs live on
GitHub Pages. Same-language alternate copies point to those preferred URLs with
canonical links. Reciprocal `zh-CN`, `en`, and `x-default` hreflang links describe
the language alternatives. Each origin's sitemap lists its 15 preferred portfolio pages; the CN sitemap also lists the battery-paper project website.
Page titles, descriptions, Open Graph tags, and Person/WebPage structured data
are generated from the existing portfolio content. Publication claims are not
inferred or added by the generator.

Paper cards use an academic publication layout: title, ordered author list,
venue/month, a brief summary, and compact flat two-part resource labels. Qiushi
Xie is underlined in the author line; contribution markers sit outside the underlined name.
VaseMuseum provides paper, code, project website and citation tags in that order;
the battery paper provides paper, code, project website and citation tags. Cite opens an accessible dialog with a readonly BibTeX field, copy feedback,
and a `.bib` download. Escape, backdrop dismissal and the established close
control restore focus and the reading position. Direct `.bib` links remain
available when JavaScript is disabled. The BibTeX sources are maintained under
`tools/search/source/citations/`, and are copied unchanged to `/assets/citations/`.
VaseMuseum's entry follows the current manuscript author order provided by the
user and identifies the arXiv preprint. Submission status is omitted from the visible
entry at the user's request. The battery entry uses the publisher's DOI metadata.

Author-name links are verified against the [VaseMuseum project page](https://aigeeksgroup.github.io/VaseMuseum/):
Zeyu Zhang, Yang Zhao, Ling Shao and Hao Tang link to their personal homepages;
Qiushi Xie links to the local-language homepage. Jiazi Wang and Nonghai Zhang
remain plain names because the project does not supply personal homepages for
them. The displayed author order still follows the newer user-provided manuscript.
The single arXiv venue line reads "In arXiv, 2026.07" in English.

The battery-paper resource tag
retains the DOI publisher destination, with a PDF-labelled entrance; no public
direct PDF URL is invented. VaseMuseum omits the small pottery title icon at the
user's request; the original icon asset is preserved for later reuse.
The VaseMuseum author order follows the
user-supplied current manuscript: Qiushi Xie, Jiazi Wang, Nonghai Zhang, Zeyu
Zhang, Yang Zhao, Ling Shao, Hao Tang. The first four retain the manuscript's
co-first-author daggers. Its structured data uses that same visible author list;
No NMI submission status is shown in the paper entry. Battery RUL lists Qiushi Xie,
matching the publisher's Crossref record (DOI 10.1117/12.3122481).
The VaseMuseum card omits the former co-first-author/advisor explanatory row.
The battery card uses the single venue line "In Proc. SPIE, 2026.09",
omitting the former month/volume/article-number/DOI explanatory row. Author
superscripts remain visible, and the battery DOI is retained in its PDF link
and BibTeX.

Paper lists omit the independent date-badge/institution header. Publication month and
venue share one colored line without repeating the date (dark red for arXiv,
blue for SPIE). The left column is
34% of the row on the CN desktop site and 30% on the international site. The CN
desktop content area is centered at up to 1120px with at least 32px on either
side. Paper preview containers stretch to their text row; their media retain
their proportions and remain uncropped. VaseMuseum displays the existing museum interaction pipeline
and VaseAgent reliability framework as a compact vertical pair that uses the
full image column; the CN battery-paper thumbnail plays the method video as a silent loop; the international thumbnail retains the NASA B0005 prediction result. All images retain their original aspect ratios. The arXiv venue/month
line is bold; the SPIE venue line and colored resource-tag values are also bold. Venue names
retain italic styling with an explicit 700 weight. The current typeface stack
uses Times New Roman and Microsoft YaHei; the previous Lato asset and its SIL OFL
license remain archived for compatibility. Thumbnails have no outer border or shadow and a muted zoom hint (27px on desktop, 18px physical size on portrait phones).
Clicking still opens all original full method/result figures. These cover images
are selected from existing assets, not cropped, redrawn, stretched, or overwritten.
The compact split resource tags use a gray label and a colored value; all existing
hrefs, citation behavior and ordering are retained. The paper entrance tags read
"arXiv | 2607.06374" and "PDF | Vol. 14327"; the latter still resolves through
the original publisher DOI. The article identifier 143271X remains in BibTeX. Only Qiushi's author name is
emphasized; the other authors retain normal weight and their existing links.

Competition and personal-project entries now share the paper list's typography,
black titles, colored information lines, compact split resource tags, and image
column proportions. Their dates move into the text column below the role/award
line. Institutional marks, hardware cutouts, and app icons remain on the independent
detail pages; all original project descriptions and link destinations are retained.
The Intel Cup preview is a direct, naturally sized video rather than a square video
inside a fixed-height wrapper. At tablet widths up to 760px, each preview and its
text occupy explicit consecutive grid rows, preventing the former overlap. Portrait
phones retain their established canvas and paper-sized typography. The digital-key
and smoke-detector entries show an existing full-system photograph, with the complete
methods, interfaces, and results still available in their preview overlays.

The Intel Cup cover now arranges six existing public demonstration clips in two
rows and three columns. It preserves complete frames and source playback speed
with white letterboxing: 1080×480, 20fps, 12 seconds, silent MP4. Regenerate it
with `tools/search/render_intel_preview.py`; the six source URLs and hashes are
recorded beside the assets in `source/project-previews/intelcup-2026/sources.json`.
The former montage and all full demonstrations remain available.

## Mobile work reading and device preview

List pages in both languages reuse one set of project cards. Mobile readers can
select Overview or Large view in a works-only sticky toolbar. Overview keeps the
compact image/text pair; Large view presents title → image/video → author,
metadata, description, and resource links. The title-first order applies to all
papers, competitions, and small projects. Desktop and the personal introduction
retain their existing layout.

The original 980px portrait-phone viewport remains unchanged. Controls and large
view typography compensate only for its initial canvas scale, not user pinch
zoom. A stable card ID preserves the project during switching. A guarded
`sessionStorage` value retains the view and dismissed hint across refreshes and
category pages within the same tab/origin; a new session starts in Overview.

Maintain the shared behavior in `source/work-view.css`, `source/work-view.js`,
and `source/work-media-sizes.json`. The generator injects these into all list
pages. The local `/device-preview/` page offers tablet, phone, and desktop modes
using the actual site in one iframe. Its entry is added to the local `/nav/`
page, whose source was imported from the current public navigation rather than
the stale separate Android-project copy. Both preview pages are excluded from
the portfolio sitemap. Device simulation is not a real-device test.

The C-task cover uses the approved complete-system photograph; all original
figures remain in the overlay/detail page. See
`docs/mobile-work-views-20261006/README.md` for verification and local previews.
The October 6 release adds these mobile views, Intel 2×3 cover, sticky navigation,
and the device-preview navigation entry. Shared text uses Times New Roman for
Latin glyphs and Microsoft YaHei for Chinese glyphs, with system fallbacks on
devices where either font is unavailable. The project does not redistribute
proprietary font files. Maintain the stack in `source/site-typography.css`.
The tablet preview uses a 648 CSS-pixel viewport inferred from the supplied
1080px screenshot: the existing 132px portrait appears about 220px wide and the
20px content inset about 33px. This triggers the original responsive profile
layout; no extra tablet-profile CSS or device-specific DOM is added. Desktop
and the established portrait-phone profile layout remain unchanged.

The battery method overlay uses the locally exported 16:9 horizontal pipeline,
with the original Visio topology and Times New Roman labels. The method figure
spans the grid width and retains its natural aspect ratio. Its lossless WebP is
maintained in `source/publication-figures/eecs-2026/framework-landscape.webp` and
copied to both build origins. The original portrait asset remains available.

University/publisher marks appear only in the independent paper detail pages,
below the main paper content. VaseMuseum's horizontal marks retain the manuscript's
numbered affiliation order: HUST, Beijing Jiaotong, Peking, La Trobe, and UCAS.
The BJTU and
PKU horizontal originals are maintained under `tools/search/source/publication-logos/`
and copied to the public portfolio assets. They were downloaded unchanged from
[BJTU's official identity page](https://www.bjtu.edu.cn/xxgk/xxbz/index.htm) and
[PKU's official website](https://www.pku.edu.cn/IdentificationSystem.html).
The other three retain the existing horizontal assets. AIGeeksGroup is not a
university affiliation, so its logo is no longer part of this university row.

Independent detail-page introductions and share images are maintained in
`tools/search/source/project-pages.json`. Each detail heading has its own bilingual
one-sentence introduction. Open Graph, Twitter cards and the page/work structured
data use an existing project overview, result, system or application image;
the Person image and homepage/About share images retain the author portrait.
The project image URLs reference already published assets, without new artwork
or cropping. Image descriptions follow the [Open Graph protocol](https://ogp.me/).

The homepage title identifies the 2027 direct-entry PhD cohort at Zhejiang
University. Its English title says "Incoming PhD Student". The visible biography
and Person description retain the current HUST undergraduate affiliation and
state that PhD entry is planned for 2027; they do not claim a completed doctorate.
After enrollment, remove "Incoming" and update the biography and affiliation.

On the homepages, project cards are wrapped in `div data-nosnippet` so search
previews describe the author rather than picking one project's software summary.
The author's biography remains eligible for snippets. Category and individual
project pages retain unrestricted previews; their text is still independently
available for search and AI citations. Bing and Google support this selective
attribute, although the final search title and snippet remain engine-controlled.

The homepages allow `max-image-preview:large` and identify the existing portrait
as their primary image in structured data. These settings make an image preview
eligible; Bing and Google choose whether and where to display it. The Intel Cup
award is displayed as "National Second Prize · Top 7.83%" without the rank.

## Website icon

The latest user-supplied portrait artwork is preserved at
`tools/search/source/favicon/original.png`. Its full composition is centered in a
square, with narrow blue margins when needed to retain the original proportions, in the
192px PNG, 180px Apple touch icon, and ICO containing 16/32/48/96px sizes.
The generator publishes the same icons on both origins, including the root
`/favicon.ico`. The icon URLs are stable and crawlable; search engines may update
their displayed icons after recrawling. The old globe file is retained for any
legacy page that still references it.

To replace the artwork, update `original.png`, then run
`python3 tools/search/make_favicons.py` on macOS before building the site.
This uses the bundled `sips` format converter; it does not redraw the artwork.

Portrait phone paper cards use the same compact type scale as the original
project cards: 12px titles, 11px author/venue lines, and 12px summaries on the
980px canvas. Paper-card text size
adjustment is held at 100% to avoid mobile browser text inflation; pinch zoom
remains enabled. These overrides are scoped to `html.portrait-phone` and leave
desktop typography and citation dialogs intact.
The browser behavior is described in [MDN's text-size-adjust reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-size-adjust).

Portrait phones retain the original 980px canvas, scaled to fit the screen, so
project covers and descriptions keep their compact horizontal card layout. The
early head script changes the viewport before CSS loads and allows pinch zoom.
Desktop and landscape browsers keep their normal viewport. Portrait phone close
buttons compensate for that page scale and retain a 48px physical touch target.
On phones, the previous 22px close mark is scaled to one half (11px);
the circle, background, border and focus outline are removed. The transparent
area remains clickable. Desktop close controls retain their existing appearance.
The smaller mark also applies in narrow and touch layouts.
Content renders
immediately; the removed loading screen is not restored. Off-screen images load
lazily, and preview videos do not preload.

Profile contact links use labelled SVG icons with hover and keyboard-focus
tooltips in this order: CV, email, GitHub, Google Scholar author profile, personal
WeChat, WeChat official account, QQ, Chinese website, and English website. The original three
QR dialogs and both website destinations are preserved. Portrait phones keep
the compact nine-icon row at the page's original scale; do not compensate those
glyphs for the 980px canvas or expand them into a three-row grid. Contact preview
dialogs use 16px headings, 14px names and 40px identity images on the physical
phone screen, while their action buttons retain a 44px touch target. Project
cards retain their original horizontal layout.
Add the English tooltip translation when updating labels.

On phones, CV, email, GitHub, Scholar and both website icons first open a
labelled, dismissible preview dialog. Its content fits the phone width and
includes an explicit destination action. GitHub uses the account's public avatar
and biography; it does not embed the external GitHub website. Scholar links to the verified public author profile. CV previews the existing
first-page image, and email offers the existing mailto link. Original link hrefs
remain intact as a fallback without JavaScript. Desktop links retain their
normal behavior. Dialogs lock background scrolling, restore the reading position
and trigger focus on close, and support Escape and backdrop dismissal.

Portfolio controls keep the normal arrow cursor. Contact icons show a shadow on
hover/focus and cover previews light their magnifier-plus badge. Paper list
previews preserve natural image proportions, with a compact two-image stack for
VaseMuseum; full figures are
available in the existing overlays.
The QQ penguin uses the user's supplied black-and-white artwork, preserved
unchanged under `tools/search/source/contact/qq-logo.png`; CSS frames it at icon
size. The generator copies those contact assets onto both origins.

## Build and update

The current website portrait is maintained at
`tools/search/source/contact/profile-photo.jpg` and copied into both origins by
the build. Portrait URLs include a content-hash version so a photo change is
visible without a stale browser cache. Project-specific sharing images are
unaffected. The exact previous photo from before the 2026-10-05 waterfront photo
update is preserved locally in `docs/profile-photo-20261005/previous-photo.jpg`,
with its checksum and restoration instructions in that folder. To switch back,
copy that original over the maintained portrait source, rebuild, verify, and
publish both origins. Preserve this original photo; do not replace it when
making another photo update.

The editable source is `tools/search/source/portfolio.html`, with English text in
`tools/search/source/translations.json`. The bilingual biography and formal identity
links are maintained in `tools/search/source/author-profile.json`. Its `biography`
contains authored Chinese and English paragraphs with inline emphasis and the
advisor's official profile link. Homepages place the name, full biography,
contact icons and visitor count on the left, with the portrait on the right.
Portrait phones instead show the portrait on the left, with the name, concise
identity, contact icons and visitor count on the right; the full biography spans
the width below. `mobile_summary` in the author profile supplies those concise
identity lines. This uses CSS grid placement of the same biography and contact
elements, retaining the desktop arrangement and the existing phone work cards.
The English introductory paragraphs use 12px text with 1.55 line spacing to
reduce their height. Country/flag annotations in English biographies use full-width
parentheses, such as Zhejiang University（China 🇨🇳）, matching the Chinese format. Contact icons retain their original 23px SVG, 20px CV mark,
and 32px layout slots, including the compact nine-icon phone row. Category and
project pages start directly with their work, and `/about/` shows the full
biography and selected-work links. The category navigation sits in the top
toolbar beside the language switch on every page. On portrait phones, navigation
text compensates for the preserved 980px canvas to render at 9px on screen,
with a compact 20px navigation row comparable to the profile icon row. The
whole navigation, including language links, spans 78% of the viewport width,
with spacing distributed between items. Narrow layouts wrap when necessary.
The English phone home tab reads "All Works" in full. Phone category labels are
centered within their buttons so the active underline aligns with the text.
`description` supplies
search/social and Person descriptions,
so the welcome greeting never replaces the author's identity in search metadata.
The GitHub account's one-line bio and mobile preview use the same research areas.
`/about/` uses
ProfilePage markup and the same stable Person ID on both language versions.
Paper pages identify the real arXiv/DOI publication records. Requires Python 3 and `lxml`.

```sh
python3 tools/search/build_site.py
python3 tools/search/check_site.py
```

The generator writes `tools/search/build/cn/` and `tools/search/build/github/`.
Publish the contents of `build/github/` to the repository root, preserving the
existing `assets/`, `cv/`, and `nav/` files. Publish the contents of `build/cn/`
to the CN web root. **Do not copy GitHub's root HTML directly to CN:** their
default languages and asset prefixes differ.

The ownership verification files under `tools/search/verification/` must remain
published after verification. They include public Google/Baidu verification files
and an IndexNow ownership key file. The Bing `msvalidate.01` meta tag must also
remain on the homepage after verification succeeds.
Origin-specific 360, Sogou, and Shenma ownership tags are stored under
`platform_meta.cn`; the generator publishes them only on the CN homepages.
Shenma also uses `/shenma-site-verification.txt`. Its verification checker does
not follow the HTTP-to-HTTPS redirect, so Nginx serves only this public token file
directly over HTTP; all other HTTP routes continue to redirect to HTTPS. When
intentionally changing Nginx, pass the reviewed previous configuration to
`prepare_cn_release.py --expected-nginx` as well as the previous page manifest.
`tools/search/source/search-verification.json` holds the public Google meta token
and the CN website ICP number confirmed in Aliyun: 鄂ICP备2026007908号-1.
The CN footer links that number to the official MIIT query site.

After a successful release has been checked on the public URLs, notify IndexNow
once for each updated origin:

```sh
python3 tools/search/notify_indexnow.py --origin cn
python3 tools/search/notify_indexnow.py --origin github
```

The command verifies the hosted public key before submitting the 14 preferred
URLs. HTTP 200 or 202 confirms receipt, not crawling, indexing, or ranking.

## Hosting

The English portfolio now lives at the user-site root, `https://qiushi0919.github.io/`.
The former `Qiushi-Portfolio` project site retains immediate redirects for each
homepage, category, project, CV, and navigation URL. Its generated files are in
`build/github-legacy/`. Publish them to the old repository after the new root
site has been verified. The former Hexo blog is recoverable from the
`backup/hexo-before-portfolio-20261005` branch in this repository.

Chinese canonical URLs remain on `qiushi0919.cn`. English canonical URLs,
language alternates, profile links, and the GitHub sitemap use the new root.

GitHub Pages serves `main` from the repository root (`.nojekyll` retained).
CN uses Nginx with static directory pages, actual 404 responses, and 301 redirects
from the former root homepage aliases. Existing navigation, cost tracker, and
other service routes retain their own configuration.

Both origin-root `robots.txt` files explicitly allow all crawlers to fetch
public pages through `User-agent: *` and `Allow: /`, and advertise their own
sitemaps. This universal rule covers Grok, Doubao, DeepSeek, Qwen, Kimi, Yuanbao,
and other providers regardless of their crawler name or search supplier. It
also covers Googlebot, Bingbot, Bytespider, Baiduspider, and Sogou's crawlers;
do not invent model-specific bot names or claim that a provider has indexed
the site just because its requests are permitted.

A named group explicitly includes the documented OAI-SearchBot, ChatGPT-User,
Claude-SearchBot, Claude-User, Google-Extended, PerplexityBot, and Perplexity-User
tokens. Both the named and wildcard groups repeat the analytics, cost-tracker
API, and tools exclusions because a specific group does not inherit wildcard
rules. GitHub also excludes the legacy portfolio tools directory. The generator
preserves these rules on subsequent releases.

The broad allowance includes training crawlers such as GPTBot and ClaudeBot,
which were already allowed by the previous wildcard rule. Search and training
permissions can be separated where the provider exposes separate controls.
Google-Extended controls both Gemini training and certain grounding uses; it
is a robots control token rather than a separate HTTP user agent. It does not
control inclusion or ranking in Google Search. This release does not introduce
any new training restriction. Crawling permission does not guarantee indexing
or a citation in any model's answer.
References: [OpenAI](https://developers.openai.com/api/docs/bots),
[Claude](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler),
[Google](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended),
[Perplexity](https://docs.perplexity.ai/docs/resources/perplexity-crawlers).

CN serves directly from its Nginx origin, with no OAI-SearchBot user-agent or
source-IP denial in the reviewed Nginx and host firewall configuration. If a CDN,
WAF, or bot challenge is introduced later, review OpenAI's current published
search IP ranges at `https://openai.com/searchbot.json` and allow verified Search
requests through it. Do not bypass security solely on a spoofable user-agent.
GitHub Pages serves the English site's root rules. A project-level `robots.txt`
only applies when published at the host root. Submit each origin's sitemap in
Search Console. OpenAI says robots updates may take about 24 hours to be applied;
that timing does not promise search indexing.

## CV assets

`cv/index.html` previews the original PDF and offers open/download links. Update
`cv/qiushi-xie-cv.pdf` without renaming it. Render its first page to
`cv/qiushi-xie-cv.webp` with `pypdfium2` (2.5x scale, WebP quality 92) for mobile
compatibility. The current document is the user's original September 2026 PDF;
do not typeset a replacement when updating the website.

## Battery paper project website

The paper website is published at https://qiushi0919.cn/battery-rul/ and https://qiushi0919.github.io/ALA-VMD-BiTCN-AM/. Its public experiment repository is https://github.com/Qiushi0919/ALA-VMD-BiTCN-AM. The portfolio resource tag selects the CN website for the CN origin and the project GitHub Pages website for the international origin.

The maintained CN copy is in `tools/search/source/project-sites/battery-rul/` and is copied into the CN build. Its own project repository serves `docs/` on `main`. White background, Times New Roman, centered 860px content, sticky navigation, silent method video, and four full-width, zoomable figures are used on desktop and phones. The repo includes original saved model scripts, NASA/CALCE capacity and decomposition CSVs, ten prediction CSVs, and a standard-library evaluator; missing ALA source/logs and checkpoints are explicitly recorded.

The two paper website resource tags read `Website | Paper`. The CN video thumbnail loads when it enters the viewport, loops muted with inline playback, and pauses offscreen or while the page is hidden. A static result poster remains available before playback and when reduced motion is requested. `source/publication-figures/eecs-2026/method-preview.mp4` is copied unchanged from the approved paper method demonstration. The Chinese mobile summary omits the former `（拟入学）` suffix while retaining the 2027 year.

### Work reading type and About identity (2026-10-06)

Large-view type uses 15px titles, 12px author/meta text and 13px body text
(at the original phone canvas scale). The works toolbar uses a 14px heading,
11px option labels, 32px controls and 4px vertical padding. Resource tags use
10.5px lettering, 24px height and compact padding. These replace the oversized
44px view buttons and 36px resource tags following the user's visual review.
About pages reuse the homepage portrait, bilingual identity summary and all
nine contact links with the same contact dialog. The home biography and
device layouts remain unchanged. Source: `build_site.py`, `source/work-view.css`,
`check_site.py`.

### Competition sequences and teams (2026-10-06)

Intel Cup now plays six original demos sequentially in a silent 1080×720,
24fps video (32.5s). C-topic uses a silent 1280×960 video (10.5s): complete
hardware, unlock interface, then the original PDoA principle on the left and
program control loop on the right. Both use 0.5s crossfades, including the loop
boundary, with original aspect ratios retained. Posters remain visible before
playback and for reduced motion; the shared preview observer plays videos only
while visible. Expanded galleries retain all original figures and demos.

`render_competition_previews.py` rebuilds both sequences with ffmpeg/ffprobe.
Intel inputs live in `source/project-previews/intelcup-2026/inputs/`; their public
URLs and hashes are recorded in `docs/project-list-tablet-20261006/intel_input_sources.json`.
C inputs are the maintained originals under `../project-sites/nuedc-c/website/public/`.
Each sequence has a `sequence-sources.json` provenance record. The build excludes
input caches and copies only the output videos/posters and existing public assets.

Competition card and portfolio detail headers use the user-confirmed roster in
`source/competition-teams.json`, with ‡ for team leads and * for advisors; former
role lines are replaced by the roster; the event/date line now incorporates
the source-confirmed awards, following the user’s correction. Challenge Cup follows the
two supplied slides in order, led by Tianyang Lu. Embedded members are Qiushi Xie,
Yutong Bai and Jinghuan Xiao; Yujiang Zeng is their advisor. VaseMuseum uses † for
equal contribution, ‡ for project lead Zeyu Zhang and * for correspondence,
retaining the established author order. Detail pages explain the markers.

`source/competition-presentation.css` increases the expanded-gallery close
glyph by 50% on desktop, tablets and portrait phones, retaining its existing
48px touch target and leaving contact dialogs unchanged. Validation and release
records are in `docs/competition-sequences-teams-20261006/`.

### White competition covers and Large view playback (2026-10-06)

The final user-selected convention is † equal contribution, ‡ team/project lead,
* advisor/corresponding author. It applies to both languages, rosters, detail-page
legends and cover names. VaseMuseum preserves its existing author order.

`render_competition_covers.cjs` creates six white bilingual SVG/JPEG covers using
unchanged originals, with provenance/SHA-256 in
`source/project-previews/inputs/cover-sources.json`. Install `sharp` through npm if
unavailable, then run `node render_competition_covers.cjs`. The local renderer
uses Times New Roman and PingFang SC as the macOS fallback for Microsoft YaHei;
set `FONTCONFIG_FILE` if the renderer cannot discover installed fonts. C-topic
uses the complete integrated hardware and unchanged running interface selected
by the user. Embedded uses the supplied RA6M5 board photograph on the left and
the original prediction plot on the right. Students and advisors share one
cover-name line. The latest renderer uses a plain Arial ‡ and a small raised * mark. No demo values become metrics.

Run `python3 prepend_competition_covers.py` after rendering. It composes the
complete original Intel clips and C figures directly, with a 1.5-second cover
hold, 0.5-second crossfades and a fade back to the cover. After the user’s speed
revision, Intel scenes are 4/4/3/3/1.9583/3 seconds
(full clips retimed); C scenes are each 3.5 seconds. Including covers and
overlapping fades, total durations are 17.9583s and 11s. Embedded uses a still
cover; expanded galleries retain their original media.

`source/preview-playback.js` and `.css` control only list preview videos. In Large
view, each starts at zero after its first full appearance below the sticky bars,
then resumes normally when visible. Until qualification, an explicit poster
layer hides decoded frames even if Overview previously played that video.
Overview and desktop retain autoplay at 15% visibility. Reduced motion keeps a
poster, hidden tabs/offscreen previews pause, and an open gallery pauses the
background previews. Switching keeps the current project and waits for its
scroll restoration before checking visibility. No global viewport is modified.

Build and check with `python3 build_site.py` and `python3 check_site.py`.
Release, verification and preview records: `docs/large-preview-covers-20261006/`.

### One-shot previews, replay controls and expanded videos (2026-10-06)

All views, including desktop and Overview, now initially display their cover.
Each animated preview plays once after the whole video enters the viewport below
sticky navigation. Completion resets playback to zero and shows the static cover;
scrolling, reopening and view changes do not replay a completed preview. Each
preview has a separate, labeled Play/Replay button. Reduced motion requires
manual playback, and hidden tabs/offscreen previews pause.

The original thumbnail click still opens the gallery, which now starts with the
same full preview video and its independent Play/Replay control. All original
figures and experiments remain below. Background thumbnails pause during gallery
use. List and featured gallery previews share the one-shot controller; original
experiment videos retain their existing controls.

Competition covers now show the full existing work title and a single combined
student/advisor name line, without the small English event caption. Qiushi Xie is
underlined. Literal ‡ uses Arial to avoid Times New Roman's ornamental double
dagger; † remains equal contribution and * remains advisor/correspondence.
The page's English and Chinese font choices otherwise stay unchanged. Longer
full titles naturally wrap. Original images, sequence timings and fades remain.

Build and check: `python3 build_site.py`, `python3 check_site.py`, and
`node tests/preview-playback.cjs` (18 behavior scenarios). Rebuild covers first
with `render_competition_covers.cjs`, then compose the four videos with
`prepend_competition_covers.py`; Intel duration is 17.9583s and C-topic is 11s.
Current release, exact-byte checks and browser evidence:
`docs/preview-replay-covers-20261006/`.

### Unobtrusive controls and tablet gallery spacing (2026-10-06)

Play/Replay controls are borderless and translucent. They occupy a reserved
26px strip below each preview, so no cover text or image is covered. The strip
stays in place while playing; its button is hidden until the cover returns.
Controls remain separate from gallery-open buttons. The existing phone-canvas
scale is used only to keep this strip and control at their intended visual size.
Work-list separators use #333333 at 0.8px. At native widths from 601px to 1024px,
expanded galleries occupy 84% of the viewport width and at most 76% of its height,
leaving more space on every side. Desktop and phone dialog sizes stay unchanged.
Current release records: `docs/preview-controls-20261006/`.


### Canvas previews instead of native thumbnail videos (2026-10-06)

This supersedes the older video/autoplay behavior described above. All animated
thumbnail and featured gallery previews now use Canvas raster frames, not video
elements. This keeps phone browsers from activating native playback UI for these
previews. The featured animation is followed by a collapsed “Play original video” section.
Opening a gallery no longer starts any original experiment video;
those videos retain controls and play only when explicitly selected. Their media
files, still figures and links remain available below the featured animation.

The same first-full-visibility rule applies in every view. A sequence plays once,
returns to its original cover and requires Play/Replay to start again. Background,
offscreen and closed-gallery animation clocks pause; buffering does not skip
content. Reduced motion requires manual playback. The translucent borderless
button occupies its own slim strip below the image and disappears while playing.
The latest 0.8px #333333 separators and tablet dialog spacing are included.

`render_preview_frames.py` creates 12fps, 640px-wide WebP sprite sheets from the
unchanged original MP4s. Each sheet has at most 16 tiles, identical frames share a
tile, and the manifest keeps the original timeline and source hash. The player
loads on demand, holds at most the current/next decoded sheets while playing and
releases them when paused/finished. Manifest and sheet failures leave the static
cover and allow a manual retry. No autoplay permission or native playback API is
used. Intel remains 17.9583s, C-topic 11s and the battery method preview 16.2333s;
network buffering may extend wall-clock playback without omitting scenes.

Rebuild frames when their source videos change, then run `build_site.py` and
`check_site.py`. Run `node tests/preview-playback.cjs` (18 visibility/control
scenarios) and `node tests/preview-frame-player.cjs` (13 frame-player scenarios).
The current narrow release, asset inventory, verification and browser evidence
are in `docs/canvas-previews-20261006/`. Browser checks are simulated viewports,
not physical phone/tablet validation. Original sources and the current release
bundle are retained; rebuildable staging/cache directories go to recoverable
Trash after live verification.

### Preview pointer hit areas (2026-10-06)

The original cover CSS disables pointer events on all descendants. Once previews
were wrapped in a div, that rule also disabled the inner gallery-open and replay
buttons. Explicit pointer events on both direct buttons restore the entire image
click area and the replay icon/text/padding area. The replay button remains hidden
and noninteractive during playback. Keyboard and pointer activation both work;
clicking Replay does not open the gallery. Current patch release and actual hit
test/browser click evidence: `docs/canvas-replay-click-20261006/`.

Lead marks now share the equal-contribution `.72em` superscript position while
retaining the plain Arial double dagger. Covers and their opening/closing frames
are regenerated together. Work separators cover nested homepage cards, list and standalone detail
cards, the mobile reading toolbar, detail information/media rows and the list
footer, all #333333 at 0.8px; photo/glyph contents and unrelated site navigation remain.

The user reduced separators from 2px to 1.5px (the original was 1px), then requested 0.8px and 20% lighter than black
(#333333). The rule
uses descendant cards because the home-page generator adds project-context
wrappers; category/detail cards and footer/reading-toolbar lines also match.

The final 0.8px separator uses a fractional inset stroke, rather than a CSS
border that Chromium may round up to 1px. Every page footer is included, as
explicitly requested, and the reading toolbar uses the same bottom stroke.


The battery paper preview uses `framework-landscape.webp` as its static cover,
including its first display and finish/reset state. The original NASA result plot
remains in the detailed figure gallery. The 2400×1350 landscape source is retained
and its intrinsic dimensions are recorded in `source/work-media-sizes.json`.
Correction release and browser evidence: `docs/preview-timing-landscape-20261006/`.

The current Intel preview scene lengths are 2/2/1.5/2.5/original/2 seconds;
C-topic scenes are 2 seconds each. Shared timing constants in
`render_competition_previews.py` also feed `prepend_competition_covers.py`.
With the existing cover hold and 0.5-second overlapping fades, the displayed
cover sequences total about 10.96 seconds (Intel) and 6.5 seconds (C-topic).

Manual play/replay skips the introductory competition cover and begins at the
first fully visible demo frame (`replayStart=2`). Automatic playback retains the
existing opening cover. While a frame is loading the control immediately shows
Loading/加载中 and prevents repeated clicks from resetting the pending load.
Offscreen playback still releases decoded images; network/decode delays show
feedback instead of silently accepting repeated restarts.

The EECS list thumbnail has no play/replay button and no reserved control strip.
It still automatically plays once after full visibility and resets to the
landscape framework poster. Its expanded gallery retains manual replay.
Playback code also supports previews that intentionally have no control.
