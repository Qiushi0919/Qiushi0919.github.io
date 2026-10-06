# 谢秋实 / Qiushi Xie — Research & Projects

- 国内中文主页：https://qiushi0919.cn/
- International English homepage: https://qiushi0919.github.io/
- Google Scholar: https://scholar.google.com/citations?user=TkPyZ-UAAAAJ
- Personal biography: https://qiushi0919.cn/about/ · https://qiushi0919.github.io/about/
- Source repository: https://github.com/Qiushi0919/Qiushi0919.github.io

Two public entrances serve the same portfolio. The CN origin defaults to Chinese;
GitHub Pages defaults to English. Both offer a language switch and an origin
switch. There is no IP-based redirect.

## Search-friendly static pages

Each language has a homepage, a biography page, three category pages, and ten project pages. All
text and navigation links exist in HTML without JavaScript. JavaScript adds
contact dialogs, project previews, and image carousels; it does not hide the
portfolio while waiting for images.

Preferred Chinese URLs live on `qiushi0919.cn`; preferred English URLs live on
GitHub Pages. Same-language alternate copies point to those preferred URLs with
canonical links. Reciprocal `zh-CN`, `en`, and `x-default` hreflang links describe
the language alternatives. Each origin's sitemap lists its 15 preferred pages.
Page titles, descriptions, Open Graph tags, and Person/WebPage structured data
are generated from the existing portfolio content. Publication claims are not
inferred or added by the generator.

Paper cards use an academic publication layout: title, ordered author list,
venue/month, a brief summary, and compact flat two-part resource labels. Qiushi
Xie is underlined in the author line; its dagger is outside the underlined name.
VaseMuseum's resource labels retain PDF, CODE, Website, Cite in that order; the battery paper has PDF and
Cite. Cite opens an accessible dialog with a readonly BibTeX field, copy feedback,
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

The battery-paper PDF button
retains the DOI publisher destination, with a labelled SPIE entrance; no public
direct PDF URL is invented. VaseMuseum retains the small pottery icon immediately to the left of its title.
The VaseMuseum author order follows the
user-supplied current manuscript: Qiushi Xie, Jiazi Wang, Nonghai Zhang, Zeyu
Zhang, Yang Zhao, Ling Shao, Hao Tang. The first four retain the manuscript's
co-first-author daggers. Its structured data uses that same visible author list;
No NMI submission status is shown in the paper entry. Battery RUL lists Qiushi Xie,
matching the publisher's Crossref record (DOI 10.1117/12.3122481).
The VaseMuseum card omits the former co-first-author/advisor explanatory row.
The battery card uses the single venue line "In Proc. SPIE, 2026.09 · EECS 2026",
omitting the former month/volume/article-number/DOI explanatory row. Author
superscripts remain visible, and the battery DOI is retained in its PDF link
and BibTeX.

Paper lists omit the independent date-badge/institution header. Publication month,
venue share one colored line without repeating the date (dark red for arXiv,
blue for SPIE). The left column is
30% of the row, displaying the existing museum interaction pipeline for VaseMuseum
and NASA B0005 prediction result for the battery paper at their original aspect
ratios. Thumbnails have no outer border or shadow and a muted zoom hint (27px on desktop, 18px physical size on portrait phones).
Clicking still opens all original full method/result figures. These cover images
are selected from existing assets, not cropped, redrawn, stretched, or overwritten.
The compact split resource tags use a gray label and a colored value; all existing
hrefs, citation behavior and ordering are retained. The paper entrance tags read
"arXiv | 2607.06374" and "SPIE | Vol. 14327"; the latter still resolves through
the original publisher DOI. The article identifier 143271X remains in BibTeX. Only Qiushi's author name is
emphasized; the other authors retain normal weight and their existing links.

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
previews use one responsive image with its natural proportions; full figures are
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
reduce their height. Contact icons retain their original 23px SVG, 20px CV mark,
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
