/**
 * toc-nav.js — สารบัญของโหมด Theory: ไฮไลต์หัวข้อที่กำลังอ่าน, แถบความคืบหน้า,
 * และ drawer บนจอแคบ
 *
 * ต่างจาก sidebar เดิมตรงที่หน้าไม่ได้ scroll ทั้งหน้าแล้ว — เนื้อหาเลื่อนอยู่ใน
 * .reader__main จึงต้องผูกทุกอย่างกับ container ตัวนั้นแทน window
 */

const MOBILE_BREAKPOINT = 900;

function initScrollSpy(scroller, links, sections, onChange) {
  const byId = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));

  const setActive = (id) => {
    links.forEach((link) => link.classList.remove('is-active'));
    const active = byId.get(id);
    if (!active) return;
    active.classList.add('is-active');
    active.scrollIntoView({ block: 'nearest' });
    onChange?.(id, active);
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (visible) setActive(visible.target.id);
  }, { root: scroller, rootMargin: '-10% 0px -70% 0px', threshold: 0 });

  sections.forEach((section) => observer.observe(section));
}

function initProgress(scroller, bar) {
  const update = () => {
    const scrollable = scroller.scrollHeight - scroller.clientHeight;
    const ratio = scrollable > 0 ? scroller.scrollTop / scrollable : 0;
    bar.style.width = `${Math.min(ratio, 1) * 100}%`;
  };

  scroller.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

function initDrawer(toc, toggle, scrim, links) {
  const close = () => {
    toc.classList.remove('is-open');
    scrim.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const open = toc.classList.toggle('is-open');
    scrim.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  scrim.addEventListener('click', close);
  links.forEach((link) => link.addEventListener('click', () => {
    if (window.innerWidth <= MOBILE_BREAKPOINT) close();
  }));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}

export function initTocNav() {
  const scroller = document.querySelector('#reader-main');
  const toc = document.querySelector('#toc');
  if (!scroller || !toc) return;

  const links = Array.from(toc.querySelectorAll('.toc__link'));
  const sections = Array.from(scroller.querySelectorAll('.section'));
  const bar = document.querySelector('#progress-bar');
  const status = document.querySelector('#read-status');
  const toggle = document.querySelector('#toc-toggle');
  const scrim = document.querySelector('#toc-scrim');

  initScrollSpy(scroller, links, sections, (id, link) => {
    if (!status) return;
    const index = links.indexOf(link) + 1;
    status.textContent = `หัวข้อ ${index} / ${links.length}`;
  });

  if (bar) initProgress(scroller, bar);
  if (toggle && scrim) initDrawer(toc, toggle, scrim, links);

  // เนื้อหาอยู่ใน container ที่ scroll เอง ลิงก์ #id ของเบราว์เซอร์จึงพาไปไม่ถูกที่
  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = scroller.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      scroller.scrollTo({ top: target.offsetTop - 16, behavior: 'smooth' });
      history.replaceState(null, '', link.getAttribute('href'));
    });
  });

  // เปิดหน้าด้วยลิงก์ที่มี #hash ต้องเลื่อนไปให้เองด้วยเหตุผลเดียวกัน
  const hash = window.location.hash.slice(1);
  if (hash) {
    const target = scroller.querySelector(`#${CSS.escape(hash)}`);
    if (target) requestAnimationFrame(() => { scroller.scrollTop = target.offsetTop - 16; });
  }
}
