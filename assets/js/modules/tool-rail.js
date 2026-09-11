/**
 * tool-rail.js — สลับเครื่องมือใน Workspace
 * เครื่องมือที่เลือกอยู่เก็บไว้ใน URL hash เพื่อให้ refresh แล้วยังอยู่ที่เดิม
 * และแชร์ลิงก์ตรงไปยังเครื่องมือได้
 */

const STORAGE_KEY = 'colorlab-last-tool';

export function initToolRail() {
  const rail = document.querySelector('#tool-rail');
  const stage = document.querySelector('#stage');
  if (!rail || !stage) return null;

  const tabs = Array.from(rail.querySelectorAll('[data-tool]'));
  const views = Array.from(stage.querySelectorAll('[data-view]'));
  const names = tabs.map((tab) => tab.dataset.tool);
  const listeners = new Set();

  const show = (name, { push = true, focusPanel = false } = {}) => {
    if (!names.includes(name)) return;

    tabs.forEach((tab) => {
      const on = tab.dataset.tool === name;
      tab.setAttribute('aria-selected', String(on));
      // roving tabindex: มีแค่แท็บที่เลือกอยู่เท่านั้นที่รับ Tab จากภายนอก
      tab.tabIndex = on ? 0 : -1;
    });

    views.forEach((view) => {
      const on = view.dataset.view === name;
      view.classList.toggle('is-active', on);
      view.hidden = !on;
    });

    stage.scrollTop = 0;
    if (push && window.location.hash.slice(1) !== name) {
      history.replaceState(null, '', `#${name}`);
    }
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch { /* โหมดส่วนตัว: ไม่ต้องจำก็ได้ */ }

    if (focusPanel) views.find((view) => view.dataset.view === name)?.focus();
    listeners.forEach((listener) => listener(name));
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => show(tab.dataset.tool));
  });

  // ลูกศรขึ้น/ลงเดินใน rail ตามรูปแบบ tablist แนวตั้งของ WAI-ARIA
  rail.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;

    const moves = {
      ArrowDown: index + 1, ArrowUp: index - 1,
      Home: 0, End: tabs.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;

    event.preventDefault();
    const target = tabs[(next + tabs.length) % tabs.length];
    target.focus();
    show(target.dataset.tool);
  });

  window.addEventListener('hashchange', () => {
    const name = window.location.hash.slice(1);
    if (names.includes(name)) show(name, { push: false });
  });

  // ลำดับความสำคัญ: ลิงก์ที่เปิดมา > เครื่องมือที่ใช้ล่าสุด > ตัวแรก
  let start = window.location.hash.slice(1);
  if (!names.includes(start)) {
    try {
      start = localStorage.getItem(STORAGE_KEY) ?? '';
    } catch { start = ''; }
  }
  show(names.includes(start) ? start : names[0], { push: false });

  return {
    show,
    getCurrent: () => tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.dataset.tool,
    onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    tools: tabs.map((tab) => ({
      name: tab.dataset.tool,
      label: tab.querySelector('.rail__tip')?.textContent?.trim() ?? tab.dataset.tool,
      icon: tab.querySelector('use')?.getAttribute('href') ?? '#i-wrench',
      number: tab.querySelector('.rail__num')?.textContent?.trim() ?? '',
    })),
  };
}
