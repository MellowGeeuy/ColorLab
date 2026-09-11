/**
 * mobile-tabbar.js — แถบนำทางติดก้นจอสำหรับมือถือ
 *
 * เมนูสร้างจากลิงก์ที่มีอยู่แล้วในแถบบน ด้วยเหตุผลเดียวกับที่ orbit-dock.js เขียนไว้:
 * ถ้าประกาศ markup ซ้ำใน 6 ไฟล์ HTML วันที่เพิ่มเมนูใหม่จะลืมไฟล์ใดไฟล์หนึ่งแน่นอน
 *
 * ทำไมต้องมี: ที่จอ 360px แถบบนแบ่งพื้นที่ให้เมนูได้ 166px แต่เมนูสามอันยาวรวม 332px
 * ผู้ใช้จึงเห็นแค่อันแรกแล้วต้องปัดในแถบแคบ ๆ ถึงจะเจอที่เหลือ
 * ปลายทางของเว็บนี้มีสี่จุดพอดี ซึ่งเป็นจำนวนที่เหมาะกับ tab bar ที่สุด — เห็นครบพร้อมกัน แตะเดียวถึง
 */

/* ป้ายในแถบบนยาวเกินช่องแท็บ (~90px ที่จอ 360px) เช่น "Component Style" กว้าง 134px
   จับคู่ด้วย id ของไอคอนเพราะเป็นสิ่งเดียวที่คงที่ทุกหน้า —
   ส่วน href เป็น relative path ที่ต่างกันไปตามหน้า ใช้เป็นกุญแจไม่ได้ */
const SHORT_LABELS = {
  '#i-book': 'ทฤษฎีสี',
  '#i-layers': 'คอมโพเนนต์',
  '#i-grid': 'ผัง',
  '#i-sliders': 'Colorground',
};

const ICON_COLORGROUND = '#i-sliders';

function iconIdOf(link) {
  return link.querySelector('use')?.getAttribute('href') ?? '';
}

function labelOf(link) {
  const full = link.getAttribute('aria-label') || link.textContent.trim();
  return SHORT_LABELS[iconIdOf(link)] ?? full;
}

function buildTab({ href, iconId, label, current }) {
  const tab = document.createElement('a');
  tab.className = 'tabbar__item';
  tab.href = href;
  if (current) tab.setAttribute('aria-current', 'page');

  /* ไอคอนอ้าง sprite ตัวเดียวกับที่ icon-sprite.js โหลดไว้แล้ว ไม่ได้ฝัง path ซ้ำ */
  tab.innerHTML =
    `<svg class="icon tabbar__icon" aria-hidden="true"><use href="${iconId}"/></svg>` +
    `<span class="tabbar__label"></span>`;
  /* ใส่ข้อความผ่าน textContent ไม่ใช่ innerHTML — ป้ายมาจาก DOM ของหน้า ไม่ควรตีความเป็น markup */
  tab.querySelector('.tabbar__label').textContent = label;
  return tab;
}

/**
 * รวบรวมปลายทางทั้งสี่จาก DOM
 *
 * สามอันแรกอยู่ใน .groundnav เหมือนกันทุกหน้า
 * อันที่สี่ (Colorground) เป็นปุ่ม hero ที่อยู่คนละกลุ่มใน DOM — และบนหน้า Workspace เอง
 * ปุ่มนั้นไม่มี เพราะผู้ใช้ยืนอยู่ที่นั่นแล้ว จึงต้องสร้างแท็บของตัวเองขึ้นมาแทน
 * ไม่งั้นแถบล่างจะมีสามช่องบนหน้าเดียวและสี่ช่องบนหน้าที่เหลือ
 */
function collectDestinations(topbar) {
  const links = [...topbar.querySelectorAll('.groundnav__item')];
  if (!links.length) return [];

  const items = links.map((link) => ({
    href: link.getAttribute('href'),
    iconId: iconIdOf(link),
    label: labelOf(link),
    current: link.hasAttribute('aria-current'),
  }));

  const hero = topbar.querySelector('.topnav__item--hero');
  if (hero) {
    items.push({
      href: hero.getAttribute('href'),
      iconId: iconIdOf(hero),
      label: labelOf(hero),
      current: hero.hasAttribute('aria-current'),
    });
  } else if (topbar.classList.contains('topbar--ground')) {
    /* .topbar--ground = กำลังอยู่ในโหมด Colorground — แท็บที่สี่คือหน้านี้เอง */
    items.push({
      href: './',
      iconId: ICON_COLORGROUND,
      label: SHORT_LABELS[ICON_COLORGROUND],
      current: true,
    });
  }

  return items;
}

export function initMobileTabbar() {
  const app = document.querySelector('.app');
  const topbar = app?.querySelector('.topbar');
  if (!topbar) return;

  if (app.querySelector('.tabbar')) return;   // กันเรียกซ้ำ

  const items = collectDestinations(topbar);
  /* ต่ำกว่าสามช่องแถบล่างไม่คุ้มพื้นที่ที่มันกิน — ปล่อยให้ใช้เมนูบนไป */
  if (items.length < 3) return;

  const bar = document.createElement('nav');
  bar.className = 'tabbar';
  bar.setAttribute('aria-label', 'เมนูหลัก');
  items.forEach((item) => bar.appendChild(buildTab(item)));

  /* ต่อเข้า .app ไม่ใช่ body — .app เป็น grid สูงเต็มจอ แถบจึงได้แถวของตัวเอง
     และไม่ต้องใช้ position: fixed ที่จะไปทับเนื้อหาส่วนล่างของทุกหน้า */
  app.appendChild(bar);
}
