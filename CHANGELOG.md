# 更新记录 · Changelog

### 1.8.0（补齐最后三处登录态界面：通知线程 / 设置页 / PR 评论卡）

**词典 401 → 575 条（+174）**：通知页 11、设置页 63、PR 与评论卡 75、评论框工具条 25。
全部来自真实登录态页面的 DOM 逐条采集（通知页 5 行线程、`/settings/profile` 110 项、
`/settings/admin` 103 项、一个自有 closed PR + 一个他人 open PR 各 200 项），未凭印象补词。

三处结构性改动：

- **通知线程标题结案（原「未验证项」）**：新版通知行的标题就落在
  `.markdown-title` 里，1.5.0 加的这条排除已经覆盖，实测 5 行全部命中，**不泄漏**。
  真正的缺口是行内的**原因标签** `mention` / `state change`——它们是界面词，本批已入词典。
  行内仓库名 `<p class="m-0 f6 flex-auto">xagentAI/xagt-plugin</p>` 同样不构成泄漏
  （整词匹配下 `owner/repo` 全串永远不等于词典里的裸键），故未加多余规则。
- **评论卡不再整块豁免**：删除 `.timeline-comment` / `.js-timeline-comment` 两条排除，
  正文改由 `.comment-body` / `.markdown-body` / `.edit-content` 兜底。审计证据：两张页面
  共 5 条评论卡，卡内**脱离排除区**的文本节点分别是 31 / 30 个，逐条看**全是界面词**
  （Author / Contributor / Owner / Bot / Hide / Quote reply / All reactions / edited /
  left a comment / Outdated / Spam / Choose a reason…）；另抽 8 段真实正文，100% 仍被排除。
  收益：这批词过去被整块吞掉，词典里有也翻不出来。
- **新增 `.notranslate` 与 `[translate="no"]` 豁免**：GitHub 自己标注「别翻」的区域。
  实测案例是 `/settings/admin` 删除账户时要求**原样键入**的确认短语
  `span.confirmation-phrase.notranslate` = `delete my account`——翻了会让人照着中文输入而验证失败。

术语一致性（把 1.7.0 没收干净的尾巴收了）：

- 词典既有风格是**审查**（10 处，0 处「审阅」），本批新词一律沿用；`saved reply` 沿用
  「常用回复」、`done` 沿用「完成」、`reactions` 沿用「表情回应」。
- **修掉一处 1.7.0 的漏网**：数字句式 RULE `N forks` 当时仍映射到「复刻」，
  与 EXACT 里 `fork = 派生` 直接矛盾——同一页面会同时出现两种译法。已改为「派生」。

仍然没做、或我这边做不到的：

- **合并按钮本体**（Merge pull request / Confirm merge / Squash and merge / Rebase and merge）：
  只有**你有推送权限的开放 PR** 才会渲染出来。`Gi-Tuu/AMBRACE` 当前是 0 个 open、10 个 closed，
  开 PR 属于写操作，我没有替你开。你开一个（或授权我开）之后我再补这一批。
  在别人的开放 PR 上能采到的合并区文字（Review required / Code owner review required…
  / All checks have passed / Ask admin for access / Merge info）本批已全部收录。
- **被内联元素切断的句子片段**：`To verify, type` + 短语 + `exactly as it appears:`、
  `requested a review from` + 用户名、`Type` + `/` + `to search`。整词替换只能翻片段，
  翻完语序错乱，一律不收录。
- **纯 `aria-label` 控件**（屏幕阅读器读到的那一份）：扩展只替换文本节点，属性不在处理范围。
  评论框工具条的按钮恰好同时带 sr-only 文本节点，所以本批的 Bold / Italic / Heading…
  能生效；要让 `aria-label` 也变中文得给 `content.js` 加属性翻译逻辑，那是新功能而不是补词。

### 1.6.0 / 1.7.0（登录态采集：控制台 + 通知页）

- **排除区新增 `.feed-item-content`**：控制台首页的动态流（别人的发布、星标、关注）
  整体属于用户内容。实测泄漏样本是别人仓库的发布标题 `EditHere 0.9.7`、`v6.0.6`
  ——它们以 `h3` 身份通过了原来的排除区。`Filter` 控件在流外，不受影响。
- 词典 354 → **401 条**：控制台 17 条（常用仓库 / 显示更多 / 少显示此类动态 / 动态 /
  筛选 / 公告 / 仓库活动 / 关注动态 / 大家在关注谁 / 推荐 / 恢复默认 / 发送反馈 /
  创建列表 / 热门仓库 / 为你推荐 / 聊天命令 / 编写代码…），通知页 30 条
  （收件箱 / 已关注的仓库 / 订阅 / 指派给我 / 我参与的 / 提及我的 / 团队被提及 /
  请求审查 / 未读 / 最新在前 / 分组 / 单点登录 / 全选 / 上一页…）。
- 侧栏的仓库名（`owner/repo` 全串）**不构成泄漏**：整词匹配下它永远不等于词典里的裸键，
  故未添加多余规则。
- **未验证项**：通知**列表线程**当时处于 loading / 空状态，那一类标题节点没采到，
  是否仍有泄漏未知。设置页、PR 合并按钮区同样尚未采集。
  （→ 1.8.0 已把这三处采完：线程标题确认不泄漏、设置页与 PR 评论卡已补齐，
  只有「你有推送权限的开放 PR」上的合并按钮仍待采。）

### 1.5.0（1.3.0–1.5.0 合并说明）

对 **PR 列表页**与 **PR 详情页**做了真实 DOM 采集，又抓出四类内容泄漏，并补入排除区
（每条都在页面上用 `closest()` 验过命中内容、不命中界面）：

| 排除 | 泄漏的是什么 |
|---|---|
| `[data-testid="listitem-title-link"]` | 列表里的议题 / PR 标题（与议题列表的 `issue-pr-title-link` 是**另一个** testid） |
| `[data-testid$="-filter-link"]` | 作者 / 标签 / 指派人 / 里程碑筛选链接，文本就是用户名等 |
| `[class*="prc-Token-IssueLabel"]` | 标签 chip（`help`、`blocked`、`needs-triage`…） |
| `.markdown-title` | **议题 / PR 详情页的主标题** |
| `[data-component="BranchName"]` | PR 页的分支名链接 |

- 词典 335 → **354 条**（PR 列表与详情页的界面词）。候选 49 条中 **20 条你已经有了**，
  实际只补 15 + 4 条；全部来自真实 DOM，未凭印象添加——中途我准备写
  `show 1 more item` 一类"看着像"的串，因无页面证据已删掉。
- 验证：详情页主标题、列表标题、用户名、标签、分支名全部落入排除区；
  `Sort by`、`New pull request`、`Labels` 等界面控件仍可翻译。
- 排除选择器 45 → **58**。

**已知未修的残留泄漏**：活动时间线里的交叉引用（如 `#14355`、
`kunchenguid/firstmate#4278`、被引用的另一条 PR 标题）没有稳定选择器可锚，
仍可能被整词命中。风险限于"恰好与界面词同名的引用"。

**未覆盖的范围**：本轮采集在**未登录**浏览器上进行。控制台、通知、设置页、
以及需要登录才渲染的控件（合并按钮区、评论框工具条等）尚未采集，
那里大概率还有同类失效选择器。

### 1.2.0

- **修复：议题 / 拉取请求标题此前未被排除**。React 版议题列表的标题节点是
  `[data-testid="issue-pr-title-link"]`，不在 `EXCLUDE_SEL` 里（旧的 `.js-issue-title`
  已失效）。词典里有 `Docs` / `Status` / `Name` / `More` 这类短词，而仓库里恰好把议题
  命名成 `Docs`、`Status` 的情况非常常见——标题会被整条翻掉。
- 一并补入排除区（均在真页面 `data-testid` / `id` 上验证）：
  `[data-testid="issue-pr-title-link"]`（标题）、
  `[data-testid="list-row-repo-name-and-number"]`（跨仓库列表的仓库名+编号）、
  `[data-testid="created-at"]`（"某某 opened on …" 含用户名）、
  `[data-testid="list-row-assignees"]`（指派人）、
  `#ref-picker-repos-header-ref-selector`（分支 / 标签名）。
- 验证口径：以上节点全部落入排除区，而 `Labels` 等筛选按钮**仍可翻译**——
  排除的是内容，不是界面。
- **术语统一到 GitHub 官方简体中文口径**，并修掉词典内部自相矛盾：
  `fork` / `forks` / `forks network` 原为「复刻」，而 `forked` 早已是「已派生」；
  现统一为「派生」。另 `history` 历史 → 历史记录、`report repository` 举报仓库 → 举报此仓库。
- 议题标签（label）经实测在当前 React 议题列表中**不渲染为行内 chip**，无泄漏点，
  故未添加投机选择器。

### 1.1.0

- **修复：文件树此前实际未被排除**。README 一直承诺「文件树 / 提交信息不翻译」，
  但 `EXCLUDE_SEL` 里的 `.js-path` / `.file-tree` / `.breadcrumb` 是 GitHub 旧版标记，
  对现在的 React 文件树不生效——实测采集时文件名（`docs`、`CNAME`、`Gemfile`）与
  提交信息都以「待翻译文本」的身份出现在候选里。若词典里恰好有 `Docs` / `Status` /
  `Name` 这类既是界面词又是常见文件名的条目，就会把**别人的文件名**翻掉。
  现补入三条稳定语义类：`.react-directory-filename-cell`、
  `.react-directory-commit-message`、`.js-repo-navigation-menu`。
  表头 `<th>`（名称 / 最后提交信息 / 最后提交日期）不在排除区内，仍可正常翻译。
- **词典 261 → 335 条**。新增的 74 条全部来自 `github.com` 真实 DOM 逐条采集
  （全站顶栏菜单与分组小标题、仓库页界面、页脚），不是凭印象编造——
  `EXACT` 是整词精确匹配，编错的字符串只会静默失效，所以先采集再补。
- 新增词条按分组写在 `EXACT` 顶部并带注释，不认同哪一组就整组删掉。
