/**
 * section-tabs.js — สลับมุมมองหลักของหน้า (ตัวอย่าง component / เขียนโค้ดสด / ตรวจคอนทราสต์)
 */

export function initSectionTabs() {
  const tabs = Array.from(document.querySelectorAll('[data-view-tab]'));
  const views = Array.from(document.querySelectorAll('[data-view]'));
  if (tabs.length === 0) return;

  const activate = (name) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.viewTab === name;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    views.forEach((view) => { view.hidden = view.dataset.view !== name; });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activate(tab.dataset.viewTab));
    tab.addEventListener('keydown', (event) => {
      const index = tabs.indexOf(tab);
      let next = null;
      if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
      else if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
      if (!next) return;
      event.preventDefault();
      next.focus();
      activate(next.dataset.viewTab);
    });
  });

  activate(tabs[0].dataset.viewTab);
}
