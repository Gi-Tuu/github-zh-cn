# GitHub 界面汉化助手 · GitHub UI 简体中文汉化包

![UI strings](https://img.shields.io/badge/UI%20strings-676-brightgreen)
![version](https://img.shields.io/badge/version-1.9.0-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![offline](https://img.shields.io/badge/network-none-lightgrey)

> **非官方第三方项目**：与 GitHub, Inc. 无关联、无背书；GitHub 及各产品名称为其权利人的商标。
> 所有替换都在你自己的浏览器里用本地词典完成，扩展**不请求任何网络服务、不上传任何数据**。

**EN — TL;DR.** A Chrome / Edge extension that translates only GitHub's *UI chrome*
(menus, buttons, tabs, counters, tooltips) into Simplified Chinese, using a hand-collected
offline dictionary of **676** exact-match strings plus numeric patterns like `12 open`.
It deliberately never touches code, diffs, README/Wiki bodies, issue & PR titles, comment
bodies, file paths or usernames — those are held out by a **59-selector** blocklist, and
each selector was verified with `closest()` against the live logged-in DOM. No network,
no telemetry, no account data. To try it: `edge://extensions` → Developer mode →
"Load unpacked" → select this folder.

一个只汉化 **GitHub 界面外壳**（菜单、按钮、标签、计数）的浏览器扩展。
用一份离线静态词典做「整词精确替换」——不联网、零延迟、不乱翻，
并且**绝不触碰**代码、README、议题/拉取请求正文、评论、文件名与用户名。

> 为什么不用浏览器自带整页翻译 / 在线机翻？
> 它们会把代码、正文、变量名一起翻乱，且要联网、有延迟、译文不稳定。
> GitHub 的界面文案是**有限且固定**的，用人工整理的词典精确映射，质量更高、更干净。

---

## 特性

- **只翻界面**：顶部导航、仓库页标签（代码 / 议题 / 拉取请求 / 操作 …）、
  按钮、下拉菜单、议题与拉取请求控件、个人主页、设置等。
- **不碰内容**：代码、差异、README、Wiki 正文、议题/评论正文、提交标题、
  文件路径、用户名 / 仓库名一律保持原文。
- **离线运行**：内置词典，所有替换在本地完成；不请求任何网络服务。
- **零延迟**：页面元素出现即替换，动态加载（含 SPA 页面切换）也能跟上。
- **可随时开关**：点工具栏图标即可启用 / 停用，并显示「已汉化多少处」。
- **可自行增补词条**：改一个 JS 对象即可，无需懂扩展开发。

---

## 安装（Microsoft Edge / Google Chrome 通用，Chromium 内核）

1. 先拿到本仓库：`git clone https://github.com/Gi-Tuu/github-zh-cn.git`，
   或在仓库页 **Code → Download ZIP** 解压（解压后目录里直接有 `manifest.json`）。
2. 打开扩展管理页：
   - Edge：地址栏输入 `edge://extensions`
   - Chrome：地址栏输入 `chrome://extensions`
3. 打开 **「开发人员模式」**（Edge 在左下角，Chrome 在右上角）。
4. 点击 **「加载解压缩的扩展」**。
5. 选择本文件夹 **`github-zh-cn`**（包含 `manifest.json` 的那一层）。
6. 打开或刷新 <https://github.com>，界面即变为中文。

> 若扩展安装前 GitHub 页面已经打开，请**刷新一次页面**让其生效。
>
> 为什么不走扩展商店：商店要开发者账号与人工审核，而这类"只改本地显示文字"的包
> 用开发者模式加载已经是最低风险的装法。介意麻烦的可以开 issue，我把打包脚本补上。

---

## 使用

- 安装后默认开启，直接访问 GitHub 即可看到汉化。
- 点击浏览器工具栏的扩展图标：
  - 顶部开关：启用 / 停用界面汉化（停用会刷新页面恢复英文）。
  - 「N 处界面已汉化」：当前标签页的替换计数。

---

## 翻译范围

| 会翻译（界面外壳） | 不会翻译（项目内容） |
|---|---|
| 顶部导航、账户菜单 | 代码、语法高亮、差异视图 |
| 仓库页标签（代码/议题/…） | README、Wiki 正文 |
| 按钮、下拉菜单、菜单项 | 议题 / 拉取请求 / 评论正文 |
| 评论卡里的控件（引用回复 / 全部表情回应 / 已编辑 / 隐藏…） | GitHub 标注 `notranslate` 的原文（如需原样键入的确认短语） |
| 议题 / PR 控件与状态 | 提交信息、议题标题 |
| 计数（如 "12 Open"、"34 stars"） | 文件路径、面包屑、文件树 |
| 个人主页、设置页控件 | 用户名、作者名、仓库名 |

品牌 / 专有名词（如 Codespaces、Copilot、GitHub Desktop、Dependabot、SSH、ZIP、Wiki）
按惯例保留英文或半英文，不强行翻译。

---

## 如何增补 / 修改词条

1. 打开 `dict.js`。
2. 在 `EXACT` 对象里按下面格式加一行（注意英文短语用小写、整词）：

   ```js
   "english phrase": "中文译文",
   ```

   - 只支持「整词精确匹配」，不要写只包含半个词的条目。
   - 含数字的固定句式（如 "5 stars"）已由 `RULES` 自动处理，一般无需添加。
3. 保存后，回到 `edge://extensions` / `chrome://extensions`，
   点本扩展卡片上的 **「重新加载」**，再刷新 GitHub 页面。

### 收录标准（提 PR 前请先读）

- **必须来自真实页面 DOM**。每个候选词都要能指出在哪个页面看到的，不接受"感觉 GitHub 会这么写"。
- **只收整词界面文案，不收句子片段**。被内联元素切断的半句（如
  `To verify, type` + `delete my account` + `exactly as it appears:`、
  `requested a review from` + 用户名）一律不收录——整词替换只会把它们翻成各自半截，语序必乱。
- **同一页面里只能有一种译法**。现有口径：`review*` = **审查**（不是"审阅"）、
  `fork*` = **派生**（不是"复刻"，含 `N forks` 的数字句式）、`reactions` = **表情回应**、
  `saved reply` = **常用回复**、`done` = **完成**、`assignee(s)` = **指派者**。
  改口径要连 `EXACT` 与 `RULES` 一起改，只改一边会自相矛盾。
- **加词之前先查排除区**。界面上的词翻不出来，很多时候不是词典缺，而是
  `content.js` 的 `EXCLUDE_SEL` 把它所在的整块当成内容豁免了；用 `closest()` 逐条验。
- GitHub 自己标了 `notranslate` / `translate="no"` 的文字**永远保持原文**
  （典型例子：删除账户时要原样键入的确认短语）。

---

## 工作原理（简述）

- `dict.js`：内置英→中词典，暴露 `window.__GH_UI_DICT__.lookup()`。
- `content.js`：
  - 用 `TreeWalker` 遍历文本节点，对**不在排除区**且**整词命中词典**的节点替换为中文；
  - 用 `MutationObserver` 监听动态插入的内容，并用 `requestAnimationFrame` 合并、按根去重；
  - 监听 GitHub 的 `turbo:` / `pjax:` 页面切换事件，切换后重新翻译；
  - 译文为中文，再次查询不会命中，天然幂等、不会重复替换。

---

## 隐私

- 扩展不收集、不上传任何数据；不向任何第三方服务器发请求。
- 仅在本地对页面文本做词典替换。`storage` 权限只用于记住你的开关状态。

---

## 许可与免责

- 本项目为第三方、非官方扩展，与 GitHub / Microsoft 无任何关联，亦未获其背书。
- 不使用 GitHub 的商标图形（如 Octocat / Invertocat）。
- 项目以 **MIT License**（见 [LICENSE](LICENSE)）发布，可自由使用、修改与分发。

---

## 更新记录

完整版本历史见 [CHANGELOG.md](CHANGELOG.md)。
