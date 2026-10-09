# 谢秋实 / Qiushi Xie — Research & Projects

- 中文主页：https://qiushi0919.cn/
- English homepage: https://qiushi0919.github.io/
- Google Scholar: https://scholar.google.com/citations?user=TkPyZ-UAAAAJ
- 维护仓库：https://github.com/Qiushi0919/Qiushi0919.github.io

两站共用作品集内容。国内入口默认中文，GitHub Pages 默认英文，保留语言与域名切换，不按 IP 跳转。修改前先读 `AGENTS.md` 和 `docs/maintenance-preferences.md`；用户最新要求优先。

## 维护内容

`source/portfolio.html` 是作品内容来源，`source/translations.json` 提供英文文本；`source/author-profile.json` 管理双语简介、姓名和身份。中文首页标题为“浙江大学2027级直博生-谢秋实（Qiushi Xie）”；英文也把 Zhejiang University 与 Incoming PhD Student (2027) 放在姓名前，明确目前为华中科技大学本科生、拟于 2027 年入学。

个人介绍于 2026-10-09 按用户提供的三段更新，首页和关于我共用双语正文；大学链接到官网，赵纪伟研究员链接到教师主页。团队指导老师括号及对应英文已移除，联系方式不再显示微信公众号入口，其余 8 个图标连续排列。

论文卡片依次显示标题、作者、期刊／会议与月份、简介和资源链接。作者标记为 † 共同第一作者、‡ 项目负责人、* 通讯作者／竞赛指导教师，均为上标。VaseMuseum 作者顺序及贡献按用户提供的当前稿件；电池论文作者与 DOI 10.1117/12.3122481 一致。竞赛不显示引用／BibTeX，论文保留复制、下载和无 JavaScript 的 `.bib` 入口。

电脑端个人介绍正文于 2026-10-09 增大 2px：首页中文 16px、英文 14px，关于我正文 17px；桌面覆盖仅写入首页和关于我，手机／平板字号沿用原值。

桌面图文并排，文字区与缩略图画面居中对齐，不把播放键计入对齐高度。手机保留现有 980px 画布及显示比例，概览／大图视图共用项目内容。`source/work-view.*`、`source/work-media-sizes.json` 维护视图；`source/site-typography.css` 使用 Times New Roman 与 Microsoft YaHei 及系统回退，不分发商业字体。作品与页脚分割线为 0.8px、#333333。

EECS 与 NCS（VaseMuseum）使用完整合成素材，HTML 不再拼接独立标志栏。EECS 的 `method-preview-cover.png` 和最终 `method-preview.mp4` 每一帧均含华科标志；NCS 的 `vasemuseum/thumbnail-integrated.svg` 自包含五个组织标志与两幅研究示意图，没有额外图像请求。华科按 Intel 杯头图统一尺寸与左边距并保留横版；其余四个机构用圆标，北大取原标志圆徽，La Trobe 用用户 2026-10-09 提供的完整圆形 PNG，中科院沿用用户提供的中国科学院圆标。图标整排居左、间隔紧凑统一，两幅示意图的左侧外边线与华科校徽左缘对齐；封面地址按内容哈希刷新。整体同比缩放，放大和下载共用完整版本。`source/paper-preview-integrated.css` 仅调整放大提示位置；视频编码／合成过程文件不放入维护源码。

放大窗口标题与关闭键固定顶部，内部独立滚动，底层页面锁定并在关闭后恢复位置。手机图片自然比例、单列展示，小型界面截图限制视觉宽度，深色模式适配标题、副标题与关闭键。`source/gallery-readability.css`、`source/gallery-scroll.js` 维护相关规则。

`source/modal-history.js` 为图片详情、联系／二维码及引用弹窗加入一次临时浏览历史。系统返回先关闭当前弹窗，之后正常返回上一网页；关闭按钮、Escape 与背景关闭也移除该临时步骤，前进可恢复弹窗，切换窗口不积累历史。

## 动画只保留最终结果

当前结果是 EECS 的 `source/publication-figures/eecs-2026/method-preview.mp4`、Intel／C 题的 `source/project-previews/<项目>/preview-with-cover-{zh,en}.mp4`，以及中英文首图 JPG。`source/preview-videos.json` 保存尺寸、时长、回放起点与 EECS 后续循环延长量；EECS 时间记录另见 `source/publication-figures/eecs-2026/preview-timing.json`。

- 下载顺序为 EECS → Intel 杯 → C 题，每项完整下载后继续下一项。缩略图、放大播放器和右键下载共用同一 MP4 Blob／对象 URL。
- 放在 Canvas 后方的静音内联视频解码器向 Canvas 输出画面，避免手机原生播放器抢占缩略图点击。EECS 可见后自动循环，无列表重播键；Intel／C 题点击 ▶ 播放才开始，从封面后的第一幅演示播放，结束回到首图。下载完成重新判断可见性，手机拒绝 EECS 自动播放后，在下一次真实触摸／点击／按键中重试缓存视频，保留减少动态设置及其他项目手动播放规则。
- 离屏、后台或被弹窗遮挡时暂停。放大播放器有播放／暂停、可拖动进度条、时间显示；右键或 Shift+F10 下载复用缓存，不重新请求。
- 不显示加载文字、倒计时或转圈。缩略图顶边的 3px 矩形条按实际接收字节推进，绝对定位、不增加行高；完成或失败隐藏。详情图片／视频等待缩略图队列完成或失败后加载。
- EECS 首轮总览 1.5 秒、后续 2.7 秒；ALA–VMD 3.125 秒、输入整理 1.8 秒、BiTCN＋Attention 2.4 秒、结果 2.5 秒，过渡各 0.55 秒。编码首轮约 13.533333 秒，后续约 14.733333 秒。
- Intel 六段为 2.8、2.3、1.5、2.5、约 1.958333、2 秒；C 题三段各 2 秒。保留既有封面与交叠，实际文件约 12.041667／6.5 秒。

运行代码保留在 `source/preview-load-queue.js`、`source/preview-video-player.js`、`source/preview-playback.js` 和 `source/preview-download.js`。旧帧播放器、WebP 帧表、过期 MP4、一次性动画渲染与拼接脚本已停用并清理，不再进入维护源码和当前部署。可复用且不可重建的原始素材保留本地；成批渲染帧、缓存、临时提取和构建目录不长期保存。

## 凌云睿通

用户禁止公开 PPT 及原导出幻灯片。只允许已指定的波束转向、波束追踪、模拟移相器结构三图、对应标志、获奖证书，以及 2026-10-08 授权的波束追踪动画效果。

缩略图和放大头图使用最终 `source/project-previews/low-altitude-communication/cover-motion-{zh,en}.svg`。中间图复用原 WPS 插图：波束转动 50°、无人机沿原轨迹同步运动，2 秒单程，往返循环。所有所需图形嵌入这一结果文件，不请求额外视频，不触发手机原生播放器；系统要求减少动态时显示静态画面。两侧图、白底排版、名单和标志沿用确认版。分享预览仍使用静态 `cover-{zh,en}.jpg`，放大窗口先头图、后证书。

`source/public-media-policy.json` 为此项目设置发布白名单，构建会清除输出中的非白名单残留。PPT 原件保持原私有位置；任何新导出页面、PPT 或原始输入不得因全目录复制而公开。`source/project-previews/inputs/lowcom/sources.json` 只记录授权、素材哈希和效果参数；Git 历史未重写。

## 小项目与简历

个人照片于 2026-10-09 恢复为此前的 900×1200 原图；恢复原件在 `docs/profile-photo-20261005/previous-photo.jpg`，当前维护源为 `source/contact/profile-photo.jpg`。更换前照片及本次发布记录保存在 `docs/profile-photo-restore-20261009/`，照片地址按内容哈希更新以刷新缓存。

“全部”固定只显示论文与比赛，不显示四个小项目。小项目分类和详情在密码解锁后可见，界面白底、简约，表单上方只有一行“暂不开放，输入密码后查看”，不显示有效期说明。成功验证后同浏览器／域名保留 180 天；受保护内容在公开 HTML 内采用 AES-GCM 加密，过期重新验证。密码构建配置只在本地 `.private/side-project-access.json`，不得上传。小项目受保护页面 noindex、不进入地图；此前公开的独立仓库／项目站不因此变为私有。

`source/cv/qiushi-xie-cv.pdf` 保留用户提供的原 PDF，不重新排版；`source/cv/qiushi-xie-cv.webp` 是第一页面的移动端预览（pypdfium2，2.5 倍，WebP 92）。当前简历更新于 2026-10-08。生成后的 `/cv/` 可预览、打开和下载。

## 构建、检查和定向发布

需要 Python 3、`requirements.txt` 的 lxml／cryptography，以及 Node.js 运行浏览器逻辑测试。命令从本目录执行；GitHub 仓库中对应目录为 `tools/search/`。

```sh
python3 -B build_site.py
python3 -B check_site.py
node tests/preview-video-player.cjs
node tests/preview-playback.cjs
node tests/preview-progress.cjs
node tests/preview-download.cjs
node tests/modal-history.cjs
python3 -B tests/public-media-policy.py
```

生成目录为 `build/cn/`、`build/github/` 和旧入口跳转用的 `build/github-legacy/`。这些是临时可重建结果，不加入维护源码。两站默认语言与资源前缀不同，不能把 GitHub 根 HTML 直接覆盖国内站。

`publish_scoped.py` 接受显式文件清单：`cn.files`／`github.files` 是“远端路径→本目录相对文件路径”的映射，`remove` 为确认停用的远端文件列表。清单示例与最新发布记录在 `docs/lowcom-motion-cleanup-20261008/`。先准备、查看 `plan.json` 的旧／新哈希，再发布：

```sh
python3 -B publish_scoped.py --spec docs/lowcom-motion-cleanup-20261008/scope.json --prepare
python3 -B publish_scoped.py --spec docs/lowcom-motion-cleanup-20261008/scope.json --publish
```

国内站通过现有 SSH 发布到 `/opt/portfolio`，`deploy_scoped.py` 先核对远端旧值、备份到 `/opt/backups/`，原子替换并在失败时恢复。GitHub 使用已有 `gh` 登录创建 Git Data 提交，核对 main，禁止强制覆盖。所有发布仅包含本次清单，不上传 `.private/`、原始 PPT、过程文件，不覆盖其他对话正在维护的 Nginx、robots、站长验证、导航或独立项目。公开 URL 哈希验证完成后清理本地临时构建与 staging；简短发布／检查记录保留，旧过程文件移到废纸篓，可恢复。

## 搜索与托管

GitHub Pages 从 `main` 根目录提供英文站，保留 `.nojekyll`。CN 使用 Nginx 静态目录页面与实际 404，旧根别名保持 301。英文首选 URL 为 GitHub，中文为 CN；同语言备用页面用 canonical 指向首选，双语 hreflang 与地图由构建生成。受保护小项目不进地图。`source/github-project-sites.json` 记录五个独立 GitHub 项目站，国际地图包含其入口。

旧 `/Qiushi-Portfolio/` 只负责对应页面跳转，不再提交为首选首页。`/intelcup-2026/` 永久跳转到正式 IntelCup-2026 项目站，与作品集的 `/competitions/intelcup-2026/` 不同；搜索报告把前者列为“网页会自动重定向”属于正常排除。电池独立研究站为 CN `/battery-rul/` 与 GitHub `/ALA-VMD-BiTCN-AM/`，模型／数据／实验源码保留在研究仓库，不属于动画过程文件清理范围。

站点名称和用户提供的插画 favicon 保持稳定。Google 需要自行抓取并处理图标；请求受理、抓取成功、实际索引和姓名搜索排名必须分开记录，不反复提交未变化的地图／网址。

站长验证源文件保留在 `verification/`，同名文件按 `cn/` 与 `github/` 区分，不互相覆盖。Bing／360／搜狗／神马公开验证标签由 `source/search-verification.json` 与页面配置维护，ICP备案为鄂ICP备2026007908号-1。神马 HTTP 验证例外只适用于其公开 token 文件，其余 HTTP 请求继续跳 HTTPS。

两站 robots 的 wildcard 允许公开页面，保留 analytics、cost-tracker API、tools 的排除。已确认的 OAI-SearchBot、ChatGPT-User、Claude-SearchBot、Claude-User、Google-Extended、PerplexityBot、Perplexity-User 分组保留同样规则；命名组不会继承 wildcard。允许抓取不代表搜索收录或模型引用，Google-Extended 也不控制 Google Search 排名。若以后引入 CDN／WAF，按提供方正式 IP 范围核对，不能单凭可伪造的 User-Agent 放行。

搜索状态和后续检查保留在 `docs/` 的带日期 JSON 中；历史截图、旧 checkout、发布压缩包和一次性脚本不是当前维护入口。IndexNow 只在确有内容更新需要通知时提交，200／202 仅表示受理。原人物照片的用户指定恢复原件仍保留在 `docs/profile-photo-20261005/previous-photo.jpg`。
