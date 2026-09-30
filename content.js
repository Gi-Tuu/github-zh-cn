// ============================================================================
// content.js — 在 GitHub 页面执行界面汉化
// 策略：遍历文本节点 → 命中离线词典且不在「排除区」→ 整词替换为中文。
// 幂等：译文为中文，再次查询返回 null，不会重复替换或死循环。
// ============================================================================
(function () {
  "use strict";

  const DICT = window.__GH_UI_DICT__;
  if (!DICT) return;

  // —— 绝不翻译的区域（代码 / 正文 / 评论 / 标题 / 路径 / 用户名 / 可编辑区）——
  const EXCLUDE_SEL = [
    // 代码与差异
    "pre", "code", ".highlight", ".blob-code", ".blob-wrapper", ".blob-expanded",
    ".diff-view", ".file-diff", ".file-diff-split", ".js-file-line-container",
    ".CodeMirror", ".cm-editor", ".monaco-editor", ".code-search-results", ".code-list",
    // Markdown 正文与评论
    ".markdown-body", ".markdown-format", ".comment-body", ".js-comment-body",
    ".edit-content", ".wiki-body",
    // 用户内容标题
    ".js-issue-title", ".bd-title", ".commit-title", ".commit-desc", ".commit-tease",
    // 文件路径 / 面包屑 / 文件树
    ".breadcrumb", ".file-info", ".blob-path", ".js-path", ".file-tree",
    ".js-repo-navigation-menu",
    '#ref-picker-repos-header-ref-selector',
    '[class*="prc-Token-IssueLabel"]',
    '.markdown-title',
    '[data-component="BranchName"]',
    '.feed-item-content',
    '[data-testid$="-filter-link"]',
    '[data-testid="listitem-title-link"]',
    '[data-testid="list-row-assignees"]',
    '[data-testid="created-at"]',
    '[data-testid="list-row-repo-name-and-number"]',
    '[data-testid="issue-pr-title-link"]',
    ".react-directory-commit-message",
    ".react-directory-filename-cell",
    // 用户名 / 作者 / 仓库链接（名字）
    "a[data-hovercard-type='user']", "a[data-hovercard-type='repository']",
    ".commit-author", ".author",
    // 可编辑区 / 输入 / 时间 / 表情
    "[contenteditable]", "textarea", "input", "relative-time", "time",
    ".emoji", ".g-emoji", ".js-slash-command",
    ".notranslate", '[translate="no"]'
  ].join(",");

  let active = false;
  let count = 0;
  let observer = null;

  function isExcluded(node) {
    const el = node && node.parentElement;
    if (!el) return false;
    return !!el.closest(EXCLUDE_SEL);
  }

  function replaceNode(node) {
    const raw = node.nodeValue;
    let out = DICT.lookup(raw);
    if (!out) {
      // 回退：短信国家码下拉的「国名 +区号」——译国名、保留区号
      const m = raw.match(/^(\s*)(.*?)\s*\+(\d+)(\s*)$/);
      if (m) {
        const head = DICT.lookup(m[2]);
        if (head) out = head + " +" + m[3];
      }
    }
    if (!out) return 0;
    const lead = (raw.match(/^\s*/) || [""])[0];
    const trail = (raw.match(/\s*$/) || [""])[0];
    node.nodeValue = lead + out + trail;
    return 1;
  }

  // 翻译一棵子树内所有合格文本节点
  function translateSubtree(root) {
    if (!root) return 0;
    // 根本身是文本节点（characterData / 单个 added 文本节点）
    if (root.nodeType === Node.TEXT_NODE) {
      if (isExcluded(root)) return 0;
      return replaceNode(root);
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      return 0;
    }
    let n = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!DICT.normalize(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        if (isExcluded(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node;
    while ((node = walker.nextNode())) {
      n += replaceNode(node);
    }
    n += translateAttributes(root);
    return n;
  }

  // —— 属性翻译：title / aria-label / aria-description / placeholder（图标按钮 tooltip） ——
  const ATTR_NAMES = ["title", "aria-label", "aria-description", "placeholder"];
  const ATTR_SEL = ATTR_NAMES.map(a => "[" + a + "]").join(",");
  // 属性翻译只排除代码/正文内容区；input/textarea 的 placeholder 与控件 aria-label 属于界面外壳，予以翻译
  const ATTR_EXCLUDE_SEL = [
    "pre", "code", ".highlight", ".blob-code", ".blob-wrapper", ".blob-expanded",
    ".diff-view", ".file-diff", ".CodeMirror", ".cm-editor", ".monaco-editor",
    ".code-search-results", ".markdown-body", ".markdown-format",
    ".comment-body", ".js-comment-body", ".wiki-body", ".feed-item-content"
  ].join(",");
  function isAttrExcluded(el) {
    return !!(el && el.closest && el.closest(ATTR_EXCLUDE_SEL));
  }
  function translateAttributes(root) {
    if (!root || !root.querySelectorAll) return 0;
    let n = 0;
    const list = Array.from(root.querySelectorAll(ATTR_SEL));
    if (root.matches && root.matches(ATTR_SEL)) list.unshift(root);
    for (const el of list) {
      if (isAttrExcluded(el)) continue;
      for (const attr of ATTR_NAMES) {
        const v = el.getAttribute(attr);
        if (!v) continue;
        const t = DICT.lookup(v);
        if (t && t !== v) { el.setAttribute(attr, t); n++; }
      }
    }
    return n;
  }

  // —— 增量处理：rAF 合并同一帧内的所有变动，按根去重 ——
  let scheduled = false;
  const pendingRoots = new Set();

  function flush() {
    scheduled = false;
    const roots = Array.from(pendingRoots);
    pendingRoots.clear();
    let n = 0;
    for (const r of roots) n += translateSubtree(r);
    count += n;
  }

  function schedule(root) {
    pendingRoots.add(root || document.body);
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  }

  // —— SPA 导航感知：History API hook + URL 轮询兜底 + 阶梯延迟全量重扫 ——
  // 解决 GitHub React 版客户端路由（pushState）后 turbo 事件不触发、
  // 以及 React 异步/分片渲染晚于首屏扫描导致的大面积漏翻（设置页尤甚）。
  let navHooksInstalled = false;
  const stagedDelays = [150, 450, 1100, 2400];
  let stagedTimers = [];
  let navRafPending = false;
  let lastUrl = location.href;

  function clearStaged() {
    for (const t of stagedTimers) clearTimeout(t);
    stagedTimers = [];
  }

  // 导航/渲染后：下一帧先扫一次 + 阶梯延迟多次全量扫描，覆盖 React 异步提交
  function requestStagedRescan() {
    if (!navRafPending) {
      navRafPending = true;
      requestAnimationFrame(function () {
        navRafPending = false;
        count += translateSubtree(document.body);
      });
    }
    clearStaged();
    for (const d of stagedDelays) {
      stagedTimers.push(setTimeout(function () {
        count += translateSubtree(document.body);
      }, d));
    }
  }

  function onLocationMaybeChanged() {
    const url = location.href;
    if (url === lastUrl) return;
    lastUrl = url;
    requestStagedRescan();
  }

  function installNavigationHooks() {
    if (navHooksInstalled) return;
    navHooksInstalled = true;

    // Hook history.pushState / replaceState（React Router 等客户端路由）
    const origPush = history.pushState;
    history.pushState = function () {
      const r = origPush.apply(this, arguments);
      onLocationMaybeChanged();
      return r;
    };
    const origReplace = history.replaceState;
    history.replaceState = function () {
      const r = origReplace.apply(this, arguments);
      onLocationMaybeChanged();
      return r;
    };
    window.addEventListener("popstate", onLocationMaybeChanged);

    // 兜底：轻量 URL 轮询（仅比较字符串，开销可忽略），捕获未覆盖的导航
    setInterval(onLocationMaybeChanged, 500);
  }

  // docs.github.com：若该页存在官方简体中文版（顶部横幅链接），自动跳转，正文 100% 中文化
  function maybeRedirectDocsZh() {
    if (location.hostname !== "docs.github.com") return;
    if (/^\/zh(\/|$)/.test(location.pathname)) return;
    const link = document.querySelector('a[href^="/zh/"]');
    if (!link) return;
    const href = link.getAttribute("href");
    try {
      chrome.storage.local.get({ docsAutoZh: true }, (cfg) => {
        if (cfg.docsAutoZh && href) location.replace(href);
      });
    } catch (e) { /* storage 不可用时不跳转 */ }
  }

  function start() {
    if (active) return;
    active = true;

    // 文档站：自动转官方简体中文（在翻译前跳转，避免英文闪烁）
    maybeRedirectDocsZh();

    // 首屏全量
    count += translateSubtree(document.body);

    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "childList") {
          m.addedNodes.forEach((child) => {
            if (child.nodeType === Node.ELEMENT_NODE) {
              schedule(child);
            } else if (child.nodeType === Node.TEXT_NODE) {
              if (!isExcluded(child)) count += replaceNode(child);
            }
          });
        } else if (m.type === "characterData") {
          schedule(m.target);
        } else if (m.type === "attributes") {
          // 图标按钮 tooltip / placeholder 被动态更新（React 重渲染）
          if (m.target && m.target.nodeType === Node.ELEMENT_NODE) schedule(m.target);
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTR_NAMES
    });

    // SPA 导航（新版 turbo / 遗留 pjax）
    [
      "turbo:render", "turbo:load", "turbo:frame-render",
      "pjax:end", "pjax:success"
    ].forEach((ev) => document.addEventListener(ev, requestStagedRescan));

    // History API hook + URL 轮询兜底（React 客户端路由，设置页关键）
    installNavigationHooks();

    // 首屏兜底：React 异步/分片渲染可能晚于上面的首屏全量，做阶梯重扫
    requestStagedRescan();
  }

  // —— 与 popup 通信 ——
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || !msg.type) return false;
    if (msg.type === "GET_STATUS") {
      sendResponse({ enabled: active, count });
      return false;
    }
    if (msg.type === "SET_ENABLED") {
      if (msg.enabled) {
        start();
        sendResponse({ enabled: true, count });
      } else {
        // 关闭：刷新页面以恢复英文；storage 已由 popup 写为 false，重载后不再替换
        sendResponse({ enabled: false, count });
        location.reload();
      }
      return false;
    }
    return false;
  });

  // —— 启动：读取开关（默认开）——
  chrome.storage.local.get({ enabled: true }).then((res) => {
    if (res.enabled) start();
  }).catch(() => start());
})();
