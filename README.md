# 谢秋实 / Qiushi Xie — Research & Projects

- 国内中文主页：https://qiushi0919.cn/
- International English homepage: https://qiushi0919.github.io/
- Source repository: https://github.com/Qiushi0919/Qiushi0919.github.io

Two public entrances serve the same portfolio. The CN origin defaults to Chinese;
GitHub Pages defaults to English. Both offer a language switch and an origin
switch. There is no IP-based redirect.

## Search-friendly static pages

Each language has a homepage, three category pages, and ten project pages. All
text and navigation links exist in HTML without JavaScript. JavaScript adds
contact dialogs, project previews, and image carousels; it does not hide the
portfolio while waiting for images.

Preferred Chinese URLs live on `qiushi0919.cn`; preferred English URLs live on
GitHub Pages. Same-language alternate copies point to those preferred URLs with
canonical links. Reciprocal `zh-CN`, `en`, and `x-default` hreflang links describe
the language alternatives. Each origin's sitemap lists its 14 preferred pages.
Page titles, descriptions, Open Graph tags, and Person/WebPage structured data
are generated from the existing portfolio content. Publication claims are not
inferred or added by the generator.

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

Portrait phones retain the original 980px canvas, scaled to fit the screen, so
project covers and descriptions keep their compact horizontal card layout. The
early head script changes the viewport before CSS loads and allows pinch zoom.
Desktop and landscape browsers keep their normal viewport. Portrait phone close
buttons compensate for that page scale and retain a 48px physical touch target.
Content renders
immediately; the removed loading screen is not restored. Off-screen images load
lazily, and preview videos do not preload.

Profile contact links use labelled SVG icons with hover and keyboard-focus
tooltips in this order: CV, email, GitHub, Google Scholar name search, personal
WeChat, WeChat official account, QQ, Chinese website, and English website. The original three
QR dialogs and both website destinations are preserved. Other narrow embedded contexts use three rows of three 44px controls; the phone
portrait canvas retains the desktop icon row as part of the scaled page. Add the English tooltip translation when updating labels.

Portfolio controls keep the normal arrow cursor. Contact icons show a shadow on
hover/focus and cover previews light their magnifier-plus badge. Multi-image
paper previews use flex panels with absolutely contained images and a 10px
inner margin, avoiding percentage-height grid overflow in mobile browsers.
The QQ penguin uses the user's supplied black-and-white artwork, preserved
unchanged under `tools/search/source/contact/qq-logo.png`; CSS frames it at icon
size. The generator copies those contact assets onto both origins.

## Build and update

The editable source is `tools/search/source/portfolio.html`, with English text in
`tools/search/source/translations.json`. Requires Python 3 and `lxml`.

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

Both origin-root `robots.txt` files explicitly allow OAI-SearchBot to fetch
public pages and advertise their own sitemaps. The bot's group repeats the
analytics, cost-tracker API, and tools exclusions because a specific group does
not inherit wildcard rules. GitHub also excludes the legacy portfolio tools
directory. The generator preserves these rules on subsequent releases.
GPTBot's existing policy is unchanged; OpenAI Search and model-training crawler
settings are independent. Allowing Search makes pages eligible for discovery,
without guaranteeing indexing, ranking, or a citation in a ChatGPT answer.
See [OpenAI's crawler documentation](https://developers.openai.com/api/docs/bots).

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
