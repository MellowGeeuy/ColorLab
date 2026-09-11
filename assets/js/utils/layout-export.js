/**
 * layout-export.js — แปลงผังบนกริดเป็นไฟล์ที่เอาไปวางในโปรเจกต์จริงได้ (pure)
 *
 * ผลลัพธ์เป็น CSS Grid ตรง ๆ ไม่ใช่ absolute position เพราะผังที่วาดไว้ต้องยังยืดหดตามจอได้
 * ตัวเลข grid-column / grid-row จึงเป็นสิ่งเดียวกับที่ผู้ใช้เห็นบนแคนวาส
 *
 * ผังหลายหน้าจอออกไปเป็น section ซ้อนกันในไฟล์เดียว สลับด้วยคลาส is-active
 * เพื่อให้เปิดไฟล์เดียวแล้วกดไล่ดูทั้งงานได้ โดยไม่ต้องมีเซิร์ฟเวอร์หรือ router
 */

const indent = (text, spaces) => text.split('\n')
  .map((line) => (line.trim() ? ' '.repeat(spaces) + line : line))
  .join('\n');

const escapeAttr = (text) => String(text)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const screensOf = (layout) => (Array.isArray(layout.screens) ? layout.screens : []);

/**
 * ของที่ถูกซ่อนไว้ในแผงเลเยอร์ไม่ออกไปกับไฟล์ ไม่งั้นหลัก "ที่เห็นบนผังคือที่ได้ในไฟล์" จะพัง
 * ส่วนการล็อกเป็นเรื่องของโปรแกรมแก้ไขล้วน ไม่มีผลกับไฟล์ที่ได้เลย
 */
const shownItems = (screen) => {
  const groups = Array.isArray(screen.groups) ? screen.groups : [];
  const hiddenByGroup = new Set(groups.filter((group) => group.hidden).flatMap((group) => group.members));
  return (screen.items ?? []).filter((item) => item.hidden !== true && !hiddenByGroup.has(item.id));
};

const hasFlow = (layout) => screensOf(layout).length > 1;

/** ชิ้นที่มีปุ่มที่ไหนสักแห่งเรียกให้เปิดเป็นหน้าต่างซ้อน — ต้องซ่อนไว้ก่อนในไฟล์ที่ส่งออก */
function modalTargets(layout) {
  const targets = new Set();
  screensOf(layout).forEach((screen) => screen.items.forEach((item) => {
    Object.values(item.parts ?? {}).forEach((props) => {
      if (props.action?.type === 'modal' && props.action.target) targets.add(props.action.target);
    });
  }));
  return targets;
}

/** ลิงก์ทั้งหมดในผัง ใช้ทั้งตอนสรุปและตอนวาดแผนภาพโฟลว์ */
export function flowLinks(layout) {
  return screensOf(layout).flatMap((screen) => screen.items.flatMap((item) => {
    const entries = Object.entries(item.links ?? {}).map(([part, target]) => ({
      from: screen.id, itemId: item.id, slug: item.slug, part, to: target,
    }));
    if (item.link) {
      entries.unshift({ from: screen.id, itemId: item.id, slug: item.slug, part: null, to: item.link });
    }
    return entries;
  }));
}

/**
 * ผังยุบตัวเป็นขั้น ไม่ใช่กระโดดจากสิบสองคอลัมน์ไปเหลือคอลัมน์เดียวในทีเดียว
 *
 * ขั้นกลางที่ 1024 และ 720 มาจากขนาดแท็บเล็ตที่มีอยู่ในตัวเลือกของผังเอง
 * ไม่ใช่ตัวเลขที่ตั้งขึ้นมาลอย ๆ — ของที่ออกแบบไว้ให้ดูบนแท็บเล็ตจะได้ยุบตรงกับที่เคยเห็นตอนวาด
 *
 * ความกว้างที่ผู้ใช้ตั้งเป็นเพดานบน ถ้าออกแบบไว้แคบกว่าขั้นไหน ขั้นนั้นก็ไม่ต้องมี
 */
function responsiveRules(layout) {
  const designed = Number(layout.width) || 1920;
  const half = Math.max(2, Math.round(layout.cols / 2));

  const steps = [
    {
      at: 1024,
      body: `  .layout { grid-template-columns: repeat(${half}, minmax(0, 1fr)); }
  .layout__item { grid-column: span ${half} / auto; grid-row: auto; }`,
      note: 'แท็บเล็ตแนวนอน: ครึ่งหนึ่งของคอลัมน์เดิม ของที่เคยอยู่ข้างกันจึงยังอยู่ข้างกัน',
    },
    {
      at: 720,
      body: `  .layout { grid-template-columns: minmax(0, 1fr); grid-auto-rows: auto; }
  .layout__item { grid-column: 1 / -1 !important; grid-row: auto !important; }`,
      note: 'มือถือกับแท็บเล็ตแนวตั้ง: กริดหลายคอลัมน์อ่านไม่ออก ยุบเป็นคอลัมน์เดียวเรียงลงมา',
    },
  ];

  return steps
    .filter((step) => designed > step.at)
    .map((step) => `/* ${step.note} */\n@media (max-width: ${step.at}px) {\n${step.body}\n}`)
    .join('\n\n');
}

export function buildLayoutCss(layout) {
  const areas = screensOf(layout).flatMap((screen) => shownItems(screen).map((item) => `
.layout__item[data-id="${item.id}"] {
  grid-column: ${item.col} / span ${item.w};
  grid-row: ${item.row} / span ${item.h};
}`.trim())).join('\n\n');

  // ความกว้างที่ตั้งไว้เป็น "ความกว้างที่ออกแบบเผื่อ" จึงออกไปเป็น max-width ไม่ใช่ width
  // ผังที่ได้จึงยังหดตามจอที่แคบกว่านั้นได้เอง
  const widthRule = layout.width && layout.width !== 'auto'
    ? `  max-width: ${layout.width}px;\n  margin-inline: auto;\n`
    : '';

  // หน้าที่ไม่ได้เปิดอยู่ต้องถูกถอดออกจากผังจริง ๆ ด้วย display:none
  // ถ้าใช้แค่ opacity หรือ visibility ของที่ซ่อนจะยังกินพื้นที่และยังโดน Tab เข้าถึงได้
  const flowRule = hasFlow(layout) ? `
/* ไหลข้ามหน้า — ทีละหน้า สลับด้วยคลาส is-active */
.screen { display: none; }
.screen.is-active { display: block; }

[data-goto] { cursor: pointer; }
` : '';

  return `/* ผังหน้า — สร้างจาก ColorLab Layout */
.layout {
  display: grid;
  grid-template-columns: repeat(${layout.cols}, minmax(0, 1fr));
  grid-auto-rows: ${layout.rowHeight}px;
  gap: ${layout.gap}px;
  padding: ${layout.gap}px;
${widthRule}  background-color: var(--color-bg);
}

.layout__item { min-width: 0; }
${flowRule}
/* สิ่งที่แต่งไว้รายส่วน — สีอ่านจาก --part-tone ที่ติดมากับ markup ซึ่งชี้ไปที่ token ของชุดสี
   เปลี่ยนชุดสีที่ tokens ข้างบนทีเดียว ทุกส่วนที่แต่งไว้ก็เปลี่ยนตาม ไม่มีค่าสีดิบค้างในไฟล์ */
[data-tone] { --cs-btn-bg: var(--part-tone); --cs-btn-fg: var(--part-on); }

[data-tone].ui-btn,
[data-tone].ui-badge,
[data-tone].ui-chip {
  background-color: var(--part-tone);
  color: var(--part-on);
  border-color: transparent;
}

[data-tone].ui-badge .ui-badge__dot { background-color: currentColor; }

[data-tone].ui-navbar__link,
[data-tone].ui-sidenav__item,
[data-tone].ui-crumb__link,
[data-tone].ui-footer__link,
[data-tone].ui-tab { color: var(--part-tone); }

/* ขนาดเป็นระดับที่ผูกกับ token ของ component ไม่ใช่พิกเซลที่ผังตั้งขึ้นเอง */
[data-size="sm"] { font-size: var(--cs-text-xs); }
[data-size="lg"] { font-size: var(--cs-text-base); }
[data-size="sm"].ui-btn, [data-size="sm"].ui-chip { height: var(--cs-h-sm); }
[data-size="lg"].ui-btn, [data-size="lg"].ui-chip { height: var(--cs-h-lg); padding-inline: 20px; }

/* หน้าต่างซ้อน — ซ่อนไว้จนกว่าปุ่มที่ผูก data-action="modal" จะเรียก */
.layout__modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background-color: rgb(15 23 42 / 0.45);
}

.layout__modal[hidden] { display: none; }

.layout__modal-panel {
  width: min(560px, 100%);
  max-height: 90vh;
  overflow: auto;
  border-radius: 12px;
}

/* การกระทำที่ต้องมีหลังบ้านจริงยังทำไม่ได้ในไฟล์นี้ — บอกไว้ว่าปุ่มนั้นตั้งใจทำอะไร
   ให้คนที่เอาไปต่อรู้ว่าต้องผูกอะไรตรงไหน */
.layout__toast {
  position: fixed;
  inset-block-end: 24px;
  inset-inline: 0;
  z-index: 60;
  margin-inline: auto;
  width: fit-content;
  max-width: calc(100% - 48px);
  padding: 10px 16px;
  border-radius: 999px;
  background-color: rgb(15 23 42 / 0.92);
  color: #fff;
  font-size: 13px;
  line-height: 20px;
}

${responsiveRules(layout)}

${areas}
`;
}

/**
 * ผูกปลายทางรายส่วนลงใน markup ตรง ๆ ด้วยการเติม data-goto ต่อท้าย data-part ที่ตรงกัน
 * ทำแบบแทนที่ข้อความได้เพราะ markup มาจากไฟล์ในโปรเจกต์เอง ไม่ใช่ของที่ผู้ใช้พิมพ์เข้ามา
 */
function withPartLinks(markup, links) {
  const linked = Object.entries(links ?? {}).reduce((text, [part, target]) => (
    text.split(`data-part="${part}"`).join(`data-part="${part}" data-goto="${escapeAttr(target)}"`)
  ), markup);

  // ส่วนที่ไม่ได้ผูกปลายทางไม่ต้องติดธงออกไปด้วย โค้ดที่ได้จะได้ไม่มีของที่ไม่ได้ใช้
  return linked.replace(/\s*data-part="[^"]*"(?!\s+data-goto)/g, '');
}

function screenHtml(layout, screen, markupBySlug, wrapped, markupByItem = {}) {
  const modals = modalTargets(layout);

  const body = shownItems(screen).map((item) => {
    // ชิ้นที่ผู้ใช้แก้รายส่วนมี markup เฉพาะตัวเตรียมมาให้แล้ว ที่เหลือใช้ของกลางตาม slug
    const raw = markupByItem[item.id] ?? markupBySlug[item.slug]
      ?? `<!-- ไม่พบ markup ของ ${item.slug} -->`;
    const markup = withPartLinks(raw, item.links);
    const goto = item.link ? ` data-goto="${escapeAttr(item.link)}"` : '';

    // ชิ้นที่มีปุ่มอื่นเรียกให้เปิด ต้องเริ่มต้นด้วยการซ่อน แล้วลอยขึ้นมากลางจอตอนถูกเรียก
    // ไม่ใช่นอนอยู่ในผังตลอดเวลาอย่างที่เห็นตอนแก้ผัง
    if (modals.has(item.id)) {
      return `  <div class="layout__modal" id="modal-${escapeAttr(item.id)}" hidden>\n`
        + `    <div class="layout__modal-panel">\n${indent(markup, 6)}\n    </div>\n  </div>`;
    }

    return `  <div class="layout__item" data-id="${item.id}"${goto}>\n${indent(markup, 4)}\n  </div>`;
  }).join('\n\n');

  const grid = `<div class="layout">\n${body}\n</div>\n`;
  if (!wrapped) return grid;

  const active = screen.id === (layout.start ?? screen.id) ? ' is-active' : '';
  return `<section class="screen${active}" id="${escapeAttr(screen.id)}" aria-label="${escapeAttr(screen.name)}">
${indent(grid, 2)}</section>
`;
}

export function buildLayoutHtml(layout, markupBySlug, markupByItem = {}) {
  const screens = screensOf(layout);
  if (screens.length === 0) return '<div class="layout"></div>\n';
  if (!hasFlow(layout)) return screenHtml(layout, screens[0], markupBySlug, false, markupByItem);
  return screens
    .map((screen) => screenHtml(layout, screen, markupBySlug, true, markupByItem))
    .join('\n');
}

/**
 * สคริปต์ไหลข้ามหน้า — สั้นที่สุดเท่าที่ยังถูกต้อง ตั้งใจให้อ่านจบแล้วเขียนใหม่เองได้
 * ปุ่มย้อนกลับของเบราว์เซอร์ใช้ได้ด้วยเพราะทุกการเปลี่ยนหน้าเขียน hash ไว้
 */
export function buildLayoutJs(layout) {
  const flow = hasFlow(layout);
  const hasActions = screensOf(layout).some((screen) => screen.items.some((item) => (
    Object.values(item.parts ?? {}).some((props) => props.action?.type)
  )));

  if (!flow && !hasActions) return '';

  const flowPart = flow ? `
const screens = [...document.querySelectorAll('.screen')];

function show(id) {
  const target = screens.find((screen) => screen.id === id) ?? screens[0];
  screens.forEach((screen) => screen.classList.toggle('is-active', screen === target));
  target.scrollIntoView({ block: 'start' });
}

document.addEventListener('click', (event) => {
  const hotspot = event.target.closest('[data-goto]');
  if (!hotspot) return;
  event.preventDefault();
  location.hash = hotspot.dataset.goto;
});

window.addEventListener('hashchange', () => show(location.hash.slice(1)));

show(location.hash.slice(1) || '${layout.start ?? screensOf(layout)[0].id}');
` : '';

  // การกระทำที่เดินอยู่ในหน้าเองทำได้จริงตั้งแต่ไฟล์นี้ ที่เหลือรอต่อหลังบ้าน
  // จึงขึ้นข้อความบอกไว้ก่อน ไม่ใช่กดแล้วเงียบจนคนทดสอบไม่รู้ว่าปุ่มพัง
  const actionPart = hasActions ? `
function closeModals() {
  document.querySelectorAll('.layout__modal').forEach((modal) => { modal.hidden = true; });
}

function openModal(id) {
  const modal = document.getElementById('modal-' + id);
  if (!modal) return;
  closeModals();
  modal.hidden = false;
}

let toastTimer = 0;

function say(text) {
  if (!text) return;
  document.querySelector('.layout__toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'layout__toast';
  toast.setAttribute('role', 'status');
  toast.textContent = text;
  document.body.appendChild(toast);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.remove(), 2600);
}

document.addEventListener('click', (event) => {
  const hot = event.target.closest('[data-action]');
  if (!hot) return;

  const type = hot.dataset.action;
  event.preventDefault();

  // การไปหน้าอื่นมีตัวจัดการของมันเองที่ data-goto แล้ว ไม่ต้องประกาศซ้ำว่ากำลังไปไหน
  if (type === 'goto') return;

  if (type === 'modal') { openModal(hot.dataset.actionTarget); return; }
  if (type === 'close') { closeModals(); return; }
  if (type === 'back') { history.back(); return; }
  if (type === 'external') { window.open(hot.dataset.actionUrl, '_blank', 'noopener'); return; }

  say(hot.dataset.actionNote || 'ปุ่มนี้ต้องต่อกับหลังบ้านก่อนจึงจะทำงานจริง');
});

document.addEventListener('click', (event) => {
  if (event.target.classList.contains('layout__modal')) closeModals();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModals();
});
` : '';

  return `/* พฤติกรรมของผัง — สร้างจาก ColorLab Layout */
${flowPart}${actionPart}`;
}

/** ไฟล์เดียวจบ: วางในไฟล์ .html เปล่าแล้วเห็นผลทันที */
export function buildLayoutBundle(layout, markupBySlug, tokensCss, catalogCss, markupByItem = {}) {
  const js = buildLayoutJs(layout);
  const script = js ? `<script>\n${js}</script>\n` : '';

  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ผังหน้าจาก ColorLab</title>
<style>
${tokensCss}

${catalogCss}

${buildLayoutCss(layout)}
</style>
</head>
<body>
${buildLayoutHtml(layout, markupBySlug, markupByItem)}
${script}</body>
</html>
`;
}

/** สรุปผังเป็นตัวเลขให้อ่านก่อนส่งออก — กี่ชิ้น ใช้กี่แถว มีลิงก์ไปหน้าอื่นกี่เส้น */
export function summarizeLayout(layout, screenId) {
  const screens = screensOf(layout);
  const target = screenId
    ? screens.find((screen) => screen.id === screenId)
    : screens.find((screen) => screen.id === layout.activeScreen) ?? screens[0];
  const items = target?.items ?? [];

  const rows = items.reduce((max, item) => Math.max(max, item.row + item.h - 1), 0);
  const bySlug = items.reduce((acc, item) => {
    acc[item.slug] = (acc[item.slug] ?? 0) + 1;
    return acc;
  }, {});

  const links = flowLinks(layout).length;
  // ของที่ซ่อนไว้ไม่ออกไปกับไฟล์ ต้องบอกจำนวนไว้ ไม่งั้นกลายเป็นของหายเงียบตอนเปิดไฟล์ที่ได้
  const hidden = screens.reduce((sum, screen) => (
    sum + (screen.items?.length ?? 0) - shownItems(screen).length
  ), 0);

  return { count: items.length, rows, bySlug, screens: screens.length, links, hidden };
}
