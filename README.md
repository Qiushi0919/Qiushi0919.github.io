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

The mobile layout uses the actual device width. Below 760px the profile and
project cards stack vertically. Content renders immediately, off-screen images
load lazily, and preview videos do not preload.

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

The CN `robots.txt` advertises its sitemap. GitHub project-level `robots.txt`
cannot control the host-wide `/robots.txt`; submit the GitHub sitemap directly
in Search Console. Sitemaps and submission help discovery but do not guarantee
indexing or search ranking.

## CV assets

`cv/index.html` previews the original PDF and offers open/download links. Update
`cv/qiushi-xie-cv.pdf` without renaming it. Render its first page to
`cv/qiushi-xie-cv.webp` with `pypdfium2` (2.5x scale, WebP quality 92) for mobile
compatibility. The current document is the user's original September 2026 PDF;
do not typeset a replacement when updating the website.
