// popup.js — 开关读写 + 向 content script 获取已汉化计数
"use strict";

const toggle = document.getElementById("toggle");
const docsToggle = document.getElementById("docsToggle");
const countEl = document.getElementById("count");

function currentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs[0]));
  });
}

function isGitHub(url) {
  return /^https:\/\/(gist\.)?github\.com\//.test(url || "") ||
    /^https:\/\/docs\.github\.com\//.test(url || "");
}

async function refresh() {
  const cfg = await chrome.storage.local.get({ enabled: true, docsAutoZh: true });
  toggle.checked = !!cfg.enabled;
  docsToggle.checked = !!cfg.docsAutoZh;

  const tab = await currentTab();
  if (!tab || !isGitHub(tab.url)) {
    countEl.textContent = "—";
    return;
  }
  try {
    const resp = await chrome.tabs.sendMessage(tab.id, { type: "GET_STATUS" });
    countEl.textContent = resp ? String(resp.count) : "0";
  } catch (e) {
    // content script 尚未注入（扩展安装前已打开的页面）
    countEl.textContent = "0";
  }
}

toggle.addEventListener("change", async () => {
  const enabled = toggle.checked;
  await chrome.storage.local.set({ enabled });

  const tab = await currentTab();
  if (tab && isGitHub(tab.url)) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "SET_ENABLED", enabled });
    } catch (e) {
      /* 忽略：提示刷新页面即可生效 */
    }
  }
  // 关闭时页面会重载；启用时即时替换。稍后刷新计数。
  setTimeout(refresh, 250);
});

docsToggle.addEventListener("change", async () => {
  await chrome.storage.local.set({ docsAutoZh: docsToggle.checked });
});

refresh();
