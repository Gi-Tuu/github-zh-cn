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
    const out = DICT.lookup(raw);
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

  function start() {
    if (active) return;
    active = true;

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
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // SPA 导航（新版 turbo / 遗留 pjax）
    [
      "turbo:render", "turbo:load", "turbo:frame-render",
      "pjax:end", "pjax:success"
    ].forEach((ev) => document.addEventListener(ev, () => schedule(document.body)));
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
