/**
 * orbit-dock.js — ยุบ top bar เป็นวงกลมลอยเมื่อผู้อ่านเลื่อนลง
 *
 * เมนูในวงโคจรถูกสร้างจากลิงก์ที่มีอยู่แล้วในแถบบน ไม่ประกาศซ้ำใน HTML ทุกหน้า
 * เพราะถ้าประกาศซ้ำ วันที่เพิ่มเมนูใหม่จะต้องไล่แก้ทุกไฟล์แล้วลืมไฟล์ใดไฟล์หนึ่งแน่นอน
 */

const DOCKED = 'is-nav-docked';

// กางครึ่งล่างของวงกลม — ครึ่งบนคือขอบจอ วางเมนูไม่ได้
// มุมบวกหมุนตามเข็มจึงไปทางซ้าย เรียงจากบวกไปลบเพื่อให้ลำดับเมนูอ่านจากซ้ายไปขวา
// ตรงกับลำดับเดิมในแถบบน
const ORBIT_ANGLES = [66, 22, -22, -66];

// ต่างกันพอให้ไม่สั่นไปมาตอนผู้อ่านหยุดค้างพอดีที่เส้นแบ่ง
const DOCK_AT = 96;
const UNDOCK_AT = 24;

function buildDock(hero, links) {
  const dock = document.createElement('div');
  dock.className = 'dock';

  const button = document.createElement('a');
  button.className = 'dock__hero';
  button.href = hero.getAttribute('href');
  button.setAttribute('aria-label', hero.getAttribute('aria-label') || 'Colorground');
  button.title = button.getAttribute('aria-label');
  if (hero.hasAttribute('aria-current')) button.setAttribute('aria-current', 'page');
  button.innerHTML = hero.querySelector('.icon').outerHTML;

  const orbit = document.createElement('nav');
  orbit.className = 'orbit';
  orbit.setAttribute('aria-label', 'เมนูหลัก');

  links.forEach((link, index) => {
    const item = document.createElement('a');
    item.className = 'orbit__item';
    item.href = link.getAttribute('href');
    item.style.setProperty('--orbit-a', `${ORBIT_ANGLES[index] ?? 0}deg`);

    const label = link.getAttribute('aria-label') || link.textContent.trim();
    item.setAttribute('aria-label', label);
    if (link.hasAttribute('aria-current')) item.setAttribute('aria-current', 'page');

    item.innerHTML = link.querySelector('.icon').outerHTML;
    const tip = document.createElement('span');
    tip.className = 'orbit__tip';
    tip.textContent = label;
    item.appendChild(tip);

    orbit.appendChild(item);
  });

  dock.append(orbit, button);
  return dock;
}

/**
 * เปิด/ปิดวงโคจรด้วย state แทน :hover ของ CSS เพราะตัว .dock ต้องเป็น pointer-events: none
 * (ไม่งั้นกล่องใสขนาดเท่าวงโคจรจะบังเนื้อหาที่อยู่ข้างหลัง) แล้ว :hover ของมันจึงไม่ทำงาน
 * การปิดถูกหน่วงไว้ เพราะระหว่างลากเมาส์จากวงกลมไปหาเมนู เมาส์ต้องผ่านพื้นที่ว่างที่ไม่รับ pointer
 */
function bindOrbitToggle(dock) {
  const OPEN = 'is-open';
  let closeTimer;

  const open = () => {
    clearTimeout(closeTimer);
    dock.classList.add(OPEN);
  };

  const scheduleClose = () => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => dock.classList.remove(OPEN), 180);
  };

  // เฉพาะเมาส์เท่านั้น — จอสัมผัสก็ยิง pointerover ตอนแตะ ถ้าปล่อยให้เปิดตรงนี้
  // เมนูจะกางทันก่อน click พอดี แล้วการแตะครั้งแรกจะกลายเป็นการกดลิงก์ไปเลย
  const byMouse = (event) => !event.pointerType || event.pointerType === 'mouse';

  document.addEventListener('pointerover', (event) => {
    if (byMouse(event) && event.target.closest?.('.dock')) open();
  });

  document.addEventListener('pointerout', (event) => {
    if (!byMouse(event)) return;
    if (event.target.closest?.('.dock') && !event.relatedTarget?.closest?.('.dock')) scheduleClose();
  });

  dock.addEventListener('focusin', open);
  dock.addEventListener('focusout', scheduleClose);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') dock.classList.remove(OPEN);
  });

  // จอสัมผัสไม่มีการเลื่อนเมาส์เข้าออก ทุกอย่างจึงต้องตัดสินจากการแตะอย่างเดียว
  let touching = false;

  document.addEventListener('pointerdown', (event) => {
    touching = event.pointerType !== 'mouse';
    if (event.target.closest?.('.dock')) return;
    // แตะที่อื่นบนหน้าจอแล้วต้องหุบเอง ไม่ใช่ค้างรอให้กดพื้นที่ว่างอีกที
    clearTimeout(closeTimer);
    dock.classList.remove(OPEN);
  });

  // กดเมนูแล้วต้องหุบทันที ไม่ต้องไปกดพื้นที่ว่างซ้ำ (G สั่ง 2026-09-11)
  // ปลายทางที่เป็นหน้าเดิมไม่ได้โหลดหน้าใหม่ วงโคจรจึงค้างกางอยู่ถ้าไม่สั่งปิดเอง
  dock.addEventListener('click', (event) => {
    const hero = event.target.closest('.dock__hero');

    // บนจอสัมผัส แตะปุ่มวงกลมครั้งแรกคือ "ขอดูเมนู" ไม่ใช่ "ไป Colorground"
    // ไม่งั้นเมนูสี่ตัวในวงโคจรจะเข้าไม่ถึงเลยบนอุปกรณ์สัมผัส
    if (hero && touching && !dock.classList.contains(OPEN)) {
      event.preventDefault();
      open();
      return;
    }

    if (!event.target.closest('.orbit__item') && !hero) return;
    clearTimeout(closeTimer);
    dock.classList.remove(OPEN);
  });
}

export function initOrbitDock(scrollRoot) {
  const topbar = document.querySelector('.topbar');
  const hero = topbar?.querySelector('.topnav__item--hero');
  if (!hero) return;

  // เมนูหลักเป็น .groundnav__item แล้ว แต่ยังเผื่อ .topnav__item ไว้เพื่อไม่ให้หน้าที่ยังไม่ย้ายพัง
  const links = [...topbar.querySelectorAll('.groundnav__item, .topnav__item:not(.topnav__item--hero)')];
  if (!links.length) return;

  const dock = buildDock(hero, links);
  document.body.appendChild(dock);
  bindOrbitToggle(dock);

  const root = scrollRoot || document.querySelector('.reader__main');
  const target = root || window;
  const readY = () => (root ? root.scrollTop : window.scrollY);

  let docked = false;
  let ticking = false;

  const apply = () => {
    ticking = false;
    const y = readY();
    if (!docked && y > DOCK_AT) {
      docked = true;
      document.body.classList.add(DOCKED);
    } else if (docked && y < UNDOCK_AT) {
      docked = false;
      document.body.classList.remove(DOCKED);
    }
  };

  target.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(apply);
  }, { passive: true });

  apply();
}
