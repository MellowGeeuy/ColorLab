/**
 * sidebar-nav.js — scroll spy, mobile drawer, reading progress
 */

const MOBILE_BREAKPOINT = 900;
const COLLAPSE_STORAGE_KEY = 'uxui-theory-sidebar-collapsed';

function initScrollSpy(links, sections) {
  const byId = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));

  const setActive = (id) => {
    links.forEach((link) => link.classList.remove('is-active'));
    const active = byId.get(id);
    if (!active) return;
    active.classList.add('is-active');
    active.scrollIntoView({ block: 'nearest' });
  };

  // rootMargin ดันเส้นตัดสินขึ้นไปใกล้ยอดจอ เพื่อให้ section ที่กำลังอ่านอยู่ถูกเลือก
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (visible) setActive(visible.target.id);
  }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });

  sections.forEach((section) => observer.observe(section));
}

function initDrawer(sidebar, toggle, scrim, links) {
  const close = () => {
    sidebar.classList.remove('is-open');
    scrim.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('is-open');
    scrim.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  scrim.addEventListener('click', close);
  links.forEach((link) => link.addEventListener('click', () => {
    if (window.innerWidth <= MOBILE_BREAKPOINT) close();
  }));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}

function initCollapse(layout, toggle) {
  if (!layout || !toggle) return;

  let collapsed = false;
  try {
    collapsed = localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1';
  } catch { /* private mode: เริ่มแบบขยายเสมอ */ }

  const apply = () => {
    layout.classList.toggle('is-sidebar-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', collapsed ? 'ขยายเมนู' : 'ย่อเมนู');
  };

  apply();

  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    apply();
    try {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? '1' : '0');
    } catch { /* เขียนไม่ได้ก็ยังใช้งานได้ในหน้านี้ */ }
  });
}

function initProgress(bar) {
  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    bar.style.width = `${Math.min(ratio, 1) * 100}%`;
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

export function initSidebarNav() {
  const sidebar = document.querySelector('#sidebar');
  const layout = document.querySelector('.layout');
  const toggle = document.querySelector('#sidebar-toggle');
  const collapseToggle = document.querySelector('#sidebar-collapse');
  const scrim = document.querySelector('#sidebar-scrim');
  const progressBar = document.querySelector('#progress-bar');
  const links = Array.from(document.querySelectorAll('.sidebar__link'));
  const sections = Array.from(document.querySelectorAll('.section'));

  if (!sidebar || links.length === 0) return;

  // scroll spy สนใจเฉพาะลิงก์ในหน้าเดียวกัน ลิงก์ข้ามหน้าไม่เกี่ยว
  const anchorLinks = links.filter((link) => link.getAttribute('href').startsWith('#'));

  initScrollSpy(anchorLinks, sections);
  if (toggle && scrim) initDrawer(sidebar, toggle, scrim, links);
  initCollapse(layout, collapseToggle);
  if (progressBar) initProgress(progressBar);
}
