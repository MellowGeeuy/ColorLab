/**
 * toc-nav.js — สารบัญของโหมด Theory: ไฮไลต์หัวข้อที่กำลังอ่าน, แถบความคืบหน้า,
 * และ drawer บนจอแคบ
 *
 * ต่างจาก sidebar เดิมตรงที่หน้าไม่ได้ scroll ทั้งหน้าแล้ว — เนื้อหาเลื่อนอยู่ใน
 * .reader__main จึงต้องผูกทุกอย่างกับ container ตัวนั้นแทน window
 *
 * ตั้งแต่แยกเนื้อหาเป็น 11 หน้า สารบัญมีลิงก์สองชนิดปนกัน — ลิงก์ข้ามหน้า
 * (`../harmony/`) กับลิงก์ในหน้า (`#core`) ทุกอย่างที่เกี่ยวกับการเลื่อนและ
 * การไฮไลต์จึงต้องคัดเฉพาะชนิดหลังก่อนเสมอ ไม่งั้น querySelector จะได้
 * selector ที่ไม่ถูกต้องแล้วโยน error ทิ้งทั้งฟังก์ชัน
 */

/* อ่านค่าจาก assets/css/breakpoints.css แทนการฮาร์ดโค้ด — CSS กับ JS จะได้ไม่หลุดจากกัน
   (custom property ใช้ใน @media ไม่ได้ตามสเปก โทเคนจึงมีไว้ให้ฝั่ง JS อ่านโดยเฉพาะ) */
const readBp = (name, fallback) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--bp-${name}`);
  return parseInt(raw, 10) || fallback;
};

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

  /* matchMedia แทน window.innerWidth ที่อ่านค่า ณ ตอนคลิกเท่านั้น
     แท็บเล็ตหมุนจอบ่อย (768 <-> 1024 ข้ามเส้นพอดี) ถ้าเปิด drawer ค้างไว้ตอนแนวตั้ง
     แล้วหมุนเป็นแนวนอน ของเดิมจะค้างในสถานะที่ไม่ถูกจนกว่าจะคลิกลิงก์ครั้งถัดไป */
  const isDrawerMode = window.matchMedia(`(max-width: ${readBp('lg', 1024) - 1}px)`);

  links.forEach((link) => link.addEventListener('click', () => {
    if (isDrawerMode.matches) close();
  }));

  /* กว้างพอจนสารบัญกลับไปเป็นคอลัมน์ถาวรแล้ว drawer ไม่ควรเปิดค้าง */
  isDrawerMode.addEventListener('change', (event) => {
    if (!event.matches) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}

export function initTocNav() {
  const scroller = document.querySelector('#reader-main');
  const toc = document.querySelector('#toc');
  if (!scroller || !toc) return;

  const links = Array.from(toc.querySelectorAll('.toc__link'));
  const inPageLinks = links.filter((link) => link.getAttribute('href')?.startsWith('#'));
  const sections = Array.from(scroller.querySelectorAll('.section'));
  const bar = document.querySelector('#progress-bar');
  const status = document.querySelector('#read-status');
  const toggle = document.querySelector('#toc-toggle');
  const scrim = document.querySelector('#toc-scrim');

  if (inPageLinks.length > 0) {
    initScrollSpy(scroller, inPageLinks, sections, (id, link) => {
      if (!status) return;
      const index = inPageLinks.indexOf(link) + 1;
      status.textContent = `${index} / ${inPageLinks.length} ในตอนนี้`;
    });
  } else if (status) {
    /* หน้าสารบัญไม่มีหัวข้อย่อยให้ไล่ ปล่อยช่องสถานะว่างไว้ดีกว่าโชว์เลขที่ไม่มีความหมาย */
    status.textContent = '';
  }

  if (bar) initProgress(scroller, bar);
  if (toggle && scrim) initDrawer(toc, toggle, scrim, links);

  // เนื้อหาอยู่ใน container ที่ scroll เอง ลิงก์ #id ของเบราว์เซอร์จึงพาไปไม่ถูกที่
  // ส่วนลิงก์ข้ามหน้าปล่อยให้เบราว์เซอร์จัดการเองตามปกติ
  inPageLinks.forEach((link) => {
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
