/**
 * layout.js — หน้า Layout: ประกอบผังหน้าจาก component ที่มี แล้วส่งออกเป็นไฟล์
 *
 * component ทุกตัวมาจาก assets/components/*.html และ component-catalog.css ชุดเดียวกับ
 * หน้า Component Style สีมาจาก palette store ตัวเดียวกับ Colorground
 * หน้านี้จึงไม่ได้สร้างของใหม่เลย แต่เอาของที่มีอยู่มาวางบนกริดแล้วบอกว่าหน้าตาจะออกมาแบบไหน
 */

import { loadIconSprite } from '../modules/icon-sprite.js';
import { initThemeToggle } from '../modules/theme-toggle.js';
import { initMobileTabbar } from '../modules/mobile-tabbar.js';
import { initGuideModal } from '../modules/guide-modal.js';
import { createSavedPaletteList } from '../modules/saved-palette-list.js';
import { askConfirm } from '../modules/confirm-dialog.js';
import { initOrbitDock } from '../modules/orbit-dock.js';
import { createPaletteStore } from '../modules/palette-store.js';
import { buildPaletteTokens } from '../utils/palette-tokens.js';
import { COMPONENTS, GROUPS, bySlug, loadMarkup, loadCatalogCss } from '../modules/component-catalog.js';
import { createCodeBlock } from '../modules/code-block.js';
import { createLayoutCanvas } from '../modules/layout-canvas.js';
import { createLayoutBoard } from '../modules/layout-board.js';
import { createLayerPanel } from '../modules/layer-panel.js';
import {
  GRID, CANVAS_PRESETS, COL_CHOICES, ROW_HEIGHTS, GAP_CHOICES,
  createLayout, createHistory, addItem, updateItem, removeItem,
  moveItemToEnd, resizeGrid, foldRow, readLayout, writeLayout,
  itemsOf, allItems, activeScreen, screenById,
  addScreen, renameScreen, removeScreen, setActiveScreen, setStartScreen,
  ensureBoardPositions, resolveBoardOverlaps, arrangeBoard, setScreenPosition, boardWidth, boardHeight,
  setPartLink, setPartProp, partProps, addPartClone, dropPart, restorePart, movePart,
  groupsOf, layerState, hiddenCountOf, readingOrderIssues, renameItem, setItemFlags,
  groupItems, ungroup, updateGroup, setItemOrder, nudgeOrder, moveOrderToEdge, sortItemsByPosition,
} from '../utils/layout-model.js';
import { TONES, SIZES, partKind, suggestTone, toneVars } from '../utils/part-styles.js';
import {
  ACTION_GROUPS, actionById, describeAction, isLiveAction,
} from '../utils/part-actions.js';
import {
  buildLayoutCss, buildLayoutHtml, buildLayoutJs, buildLayoutBundle, summarizeLayout, flowLinks,
} from '../utils/layout-export.js';

const store = createPaletteStore();
const history = createHistory(readLayout() ?? createLayout());

const markupCache = new Map();
let publicTokens = {};
let canvas = null;
let zoom = 1;
const el = {};

/** โหมดทดลอง: ผังหยุดเป็นของที่แก้ได้ แล้วทำตัวเหมือนหน้าเว็บจริงชั่วคราว */

let board = null;
let layers = null;
let libraryFilter = '';

// ต่ำสุด 25% เพื่อให้ผังกว้าง 1920 ยังอยู่ในพื้นที่ทำงานได้ทั้งผืน
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 1.6;
const ZOOM_STEP = 0.1;

const icon = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const toPublic = (name) => name.replace('--pv-', '--color-');

/* --------------------------------------------------------------------------
   สีจาก palette — ใส่ลงเฉพาะพื้นที่ผัง ไม่ให้เครื่องมือเปลี่ยนสีตาม
   -------------------------------------------------------------------------- */

function refreshTokens() {
  const { tokens } = buildPaletteTokens(store.getPalette(), store.getTheme());
  publicTokens = {};
  Object.entries(tokens).forEach(([name, value]) => {
    if (name !== '--pv-accent-count') publicTokens[toPublic(name)] = value;
  });
  if (!publicTokens['--color-danger-hover']) {
    publicTokens['--color-danger-hover'] = tokens['--pv-danger-hover'] ?? tokens['--pv-danger'];
  }
}

function applyTokens(scope) {
  if (!scope) return;
  Object.entries(publicTokens).forEach(([name, value]) => scope.style.setProperty(name, value));
}

function tokensCssBlock() {
  const line = ([name, value]) => `  ${name}: ${value};`;
  const light = Object.entries(publicTokens).map(line).join('\n');

  const darkTokens = buildPaletteTokens(store.getPalette(), 'dark').tokens;
  const dark = Object.entries(darkTokens)
    .filter(([name]) => name !== '--pv-accent-count')
    .map(([name, value]) => line([toPublic(name), value]))
    .join('\n');

  return `:root {\n${light}\n}\n\n[data-theme="dark"] {\n${dark}\n}`;
}

/* --------------------------------------------------------------------------
   คลัง component ทางซ้าย
   -------------------------------------------------------------------------- */

async function markupOf(slug) {
  if (!markupCache.has(slug)) {
    const { card, preview } = await loadMarkup(slug);
    markupCache.set(slug, { card, preview });
  }
  return markupCache.get(slug);
}

async function renderPalette() {
  el.palette.replaceChildren();

  const needle = libraryFilter.trim().toLowerCase();
  const matches = (meta) => !needle
    || meta.name.toLowerCase().includes(needle)
    || meta.slug.includes(needle)
    || (meta.summary ?? '').toLowerCase().includes(needle);

  for (const group of GROUPS) {
    const items = COMPONENTS.filter((item) => item.group === group.id && matches(item));
    if (items.length === 0) continue;

    const section = document.createElement('section');
    section.className = 'lay-lib__group';
    section.innerHTML = `<h3 class="lay-lib__title">${group.label}</h3>`;

    const list = document.createElement('div');
    list.className = 'lay-lib__items';

    items.forEach((meta) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'lay-lib__item';
      chip.draggable = true;
      chip.dataset.slug = meta.slug;
      chip.innerHTML = `
        ${icon('i-grid', 'icon lay-lib__icon')}
        <span class="lay-lib__name">${meta.name}</span>
        <span class="lay-lib__add">${icon('i-plus')}</span>
      `;

      chip.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', meta.slug);
        event.dataTransfer.effectAllowed = 'copy';
      });

      // กดก็วางได้ ไม่ต้องลากอย่างเดียว — ผู้ใช้คีย์บอร์ดกับทัชสกรีนต้องใช้ได้ด้วย
      chip.addEventListener('click', () => place(meta.slug));

      list.appendChild(chip);
    });

    section.appendChild(list);
    el.palette.appendChild(section);
  }
}

/* --------------------------------------------------------------------------
   แคนวาส
   -------------------------------------------------------------------------- */

async function renderItemContent(item, stage) {
  const cached = markupCache.get(item.slug);
  const meta = bySlug(item.slug);
  const variants = meta?.matrix?.variants ?? [];

  // ใช้ markup ชุดเดียวกับที่ส่งออกเสมอ (preview) ไม่ใช่ชุดย่อของการ์ดในคาตาล็อก
  // สองชุดนี้มีธง data-part คนละชุด ถ้าวาดคนละชุดกัน คำที่แก้กับ action ที่ผูกไว้บนผัง
  // จะไปตกคนละที่ในไฟล์ที่ส่งออก โดยไม่มีอะไรฟ้องจนกว่าจะเปิดไฟล์ดู
  if (cached) {
    stage.innerHTML = item.variant > 0 && variants[item.variant]
      ? renderVariant(meta, item.variant)
      : cached.preview;
    applyTokens(stage);
  } else {
    const markup = await markupOf(item.slug);
    stage.innerHTML = markup.preview;
    applyTokens(stage);
  }

  // ยืดกล่องแล้วของข้างในต้องยืดตามจริง ไม่ใช่ค้างขนาดเดิมแล้วเหลือที่ว่าง
  stage.dataset.fill = meta?.fill ? 'true' : 'false';

  stage.querySelectorAll('button, input, select, a, textarea').forEach((node) => {
    node.tabIndex = -1;
    node.setAttribute('aria-hidden', 'true');
  });

  applyPartOverrides(item, stage);
}

/**
 * เขียนสิ่งที่ผู้ใช้แก้รายส่วนทับลงบน markup ที่เพิ่งวาด
 *
 * ทำหลังวาดทุกครั้งแทนการเก็บ HTML ที่แก้แล้ว เพราะต้นฉบับยังเป็นเจ้าของโครงสร้างอยู่
 * แก้ไฟล์ component แล้วผังเก่าต้องได้ของใหม่ตามไปด้วย เหลือแค่คำ สี ขนาด ที่ทับไว้
 */
function applyPartOverrides(item, stage) {
  const parts = item.parts ?? {};

  applyListEdits(item, stage);

  stage.querySelectorAll('[data-part]').forEach((node) => {
    const props = parts[node.dataset.part];
    if (!props) return;

    if (props.text) setPartText(node, props.text);

    if (props.tone) {
      node.dataset.tone = props.tone;
      const vars = toneVars(props.tone);
      if (vars) Object.entries(vars).forEach(([name, value]) => node.style.setProperty(name, value));
    }

    if (props.size) node.dataset.size = props.size;

    const action = props.action;
    if (action && action.type !== 'none') {
      node.dataset.action = action.type;
      if (action.target) node.dataset.actionTarget = action.target;
      if (action.url) node.dataset.actionUrl = action.url;

      // ประโยคบอกผลติดไปกับ markup ด้วย ไฟล์ที่ส่งออกจึงอธิบายตัวเองได้โดยไม่ต้องเปิดผังดู
      const note = describeAction(action, {
        screenName: screenById(history.get(), action.target)?.name,
        modalName: modalsInLayout(history.get()).find((entry) => entry.id === action.target)?.name,
      });
      if (note) node.dataset.actionNote = note;
    }
  });
}

/**
 * รายการที่ผู้ใช้เพิ่ม ลบ หรือสลับลำดับ
 *
 * ตัวที่เพิ่มเป็นสำเนาของรายการต้นแบบ จึงได้โครงสร้างเดิมมาครบ ทั้งไอคอน ตัวนับ และคลาส
 * แล้วเปลี่ยนแค่ธง data-part กับข้อความ — เมนูที่เพิ่มเองจึงหน้าตาเหมือนของที่มากับ component
 */
function applyListEdits(item, stage) {
  (item.dropped ?? []).forEach((part) => {
    const node = stage.querySelector(`[data-part="${part}"]`);
    if (!node) return;
    // ลบทั้งหน่วยที่ซ้ำ ไม่ใช่เฉพาะตัวที่ติดธง — ไม่งั้นเหลือ <li> ว่างค้างเป็นช่องโหว่ในเมนู
    const group = siblingGroup(node);
    (group ? repeatUnit(node, group.host) : node).remove();
  });

  (item.extras ?? []).forEach((extra) => {
    // ต้นแบบอาจถูกลบไปแล้ว ให้ไปเกาะพี่น้องตัวสุดท้ายในกลุ่มเดียวกันแทน
    // ไม่งั้นรายการที่ผู้ใช้เพิ่มเองจะหายไปเงียบ ๆ พร้อมกับการลบตัวที่มันเคยโคลนมา
    const anchor = stage.querySelector(`[data-part="${extra.from}"]`)
      ?? (extra.cls ? [...stage.querySelectorAll(`[data-part].${extra.cls}`)].pop() : null);
    if (!anchor) return;

    const group = siblingGroup(anchor);
    const source = group ? repeatUnit(anchor, group.host) : anchor;

    const clone = source.cloneNode(true);
    const flag = clone.matches('[data-part]') ? clone : clone.querySelector('[data-part]');
    if (!flag) return;

    flag.dataset.part = extra.id;
    flag.removeAttribute('aria-current');
    flag.removeAttribute('data-tone');
    flag.removeAttribute('data-size');
    flag.removeAttribute('data-action');
    flag.classList.remove('is-active');
    flag.setAttribute('aria-selected', 'false');
    if (extra.text) setPartText(flag, extra.text);

    // ตัวนับที่ติดมากับต้นแบบเป็นตัวเลขของรายการนั้น ไม่ใช่ของรายการใหม่
    flag.querySelector('.ui-sidenav__count, .ui-tab__count, .ui-badge')?.remove();

    source.parentElement.insertBefore(clone, source.nextSibling);
  });

  Object.entries(item.order ?? {}).forEach(([, members]) => {
    const first = stage.querySelector(`[data-part="${members[0]}"]`);
    if (!first) return;

    const group = siblingGroup(first);
    const host = group?.host ?? first.parentElement;
    if (!host) return;

    members.forEach((part) => {
      const node = stage.querySelector(`[data-part="${part}"]`);
      if (node) host.appendChild(repeatUnit(node, host));
    });
  });
}

/**
 * เปลี่ยนเฉพาะคำ ไม่ใช่ทั้งก้อน — ปุ่มที่มีไอคอนอยู่ข้างในต้องเหลือไอคอนไว้
 * ถ้าเขียนทับด้วย textContent ไอคอนจะหายไปพร้อมกับความหมายของปุ่ม
 */
function setPartText(node, text) {
  const holder = [...node.childNodes].find((child) => child.nodeType === Node.TEXT_NODE
    && child.textContent.trim());

  if (holder) { holder.textContent = text; return; }

  const label = node.querySelector('.ui-cell__title, .ui-list__title, .ui-stat__label');
  if (label) { label.textContent = text; return; }

  node.insertBefore(document.createTextNode(text), node.firstChild);
}

/** รูปแบบอื่นของ component ตัวเดียวกัน ใช้ตัวสร้างชุดเดียวกับตารางสถานะในหน้า Component Style */
function renderVariant(meta, index) {
  const variant = meta.matrix.variants[index];
  return meta.matrix.render(variant.cls, 'default');
}

function commit(next, addToHistory = true) {
  history.set(next, addToHistory);
  writeLayout(history.get());
  if (isBoard()) { board.render(); syncBoardSize(); } else { canvas.render(); }
  renderInspector();
  renderSummary();
  renderScreens();
  renderHud();
  renderLayers();
  updateHistoryButtons();
}

/**
 * ตำแหน่งที่ผู้ใช้คลิกไว้ล่าสุดบนที่ว่างของแคนวาส
 * กดของจากคลังแล้วจะไปลงตรงนั้น ไม่ใช่ไหลไปต่อท้ายผังเสมอ
 */
let dropPoint = null;

function place(slug, position) {
  const target = position ?? dropPoint ?? undefined;
  commit(addItem(history.get(), slug, target));
  const items = itemsOf(history.get());
  const placed = items[items.length - 1];
  canvas.select(placed.id);
  // เลื่อนให้เห็นของที่เพิ่งวาง ไม่งั้นวางต่อท้ายผังยาว ๆ แล้วเหมือนไม่มีอะไรเกิดขึ้น
  canvas.focusItem(placed.id);
  dropPoint = null;

  el.status.textContent = target
    ? `วาง ${bySlug(slug)?.name ?? slug} ที่คอลัมน์ ${placed.col} แถว ${placed.row}`
    : `วาง ${bySlug(slug)?.name ?? slug} ต่อท้ายผัง — คลิกที่ว่างบนผังก่อนกดของ เพื่อเลือกจุดวางเอง`;
}

/* --------------------------------------------------------------------------
   มุมมองบอร์ด — เห็นทุกหน้าพร้อมกันและเห็นเส้นที่พาไปหากัน
   -------------------------------------------------------------------------- */

/** วาดของบนหน้าหนึ่งลงในกรอบของบอร์ด ใช้ markup ชุดเดียวกับแคนวาส จึงไม่มีทางเพี้ยนจากกัน */
function renderScreenPreview(screen, host) {
  const grid = document.createElement('div');
  grid.className = 'lay-frame__grid';
  applyTokens(grid);

  // บอร์ดคือภาพรวมของงานจริง ของที่ซ่อนไว้จึงต้องไม่โผล่ที่นี่เหมือนกับที่ไม่โผล่บนผัง
  screen.items.filter((item) => !layerState(screen, item).hidden).forEach((item) => {
    const box = document.createElement('div');
    box.className = 'lay-frame__item';
    box.dataset.id = item.id;
    if (item.link) box.dataset.link = item.link;
    box.style.gridColumn = `${item.col} / span ${item.w}`;
    box.style.gridRow = `${item.row} / span ${item.h}`;

    const meta = bySlug(item.slug);
    const cached = markupCache.get(item.slug);
    box.innerHTML = item.variant > 0 && meta?.matrix?.variants?.[item.variant]
      ? renderVariant(meta, item.variant)
      : (cached?.preview ?? '');

    box.dataset.fill = meta?.fill ? 'true' : 'false';
    // บอร์ดต้องเห็นสิ่งที่แต่งไว้ด้วย ไม่งั้นภาพรวมทั้งงานจะเป็นคนละเรื่องกับหน้าที่เปิดแก้อยู่
    applyPartOverrides(item, box);

    box.querySelectorAll('button, input, select, a, textarea').forEach((node) => {
      node.tabIndex = -1;
      node.setAttribute('aria-hidden', 'true');
    });

    grid.appendChild(box);
  });

  host.replaceChildren(grid);
}

function isBoard() {
  return history.get().view === 'board';
}

function setView(view) {
  const next = resolveBoardOverlaps(ensureBoardPositions({ ...history.get(), view }));
  commit(next, false);

  el.boardwrap.hidden = view !== 'board';
  el.canvasFrame.hidden = view === 'board';
  el.shell.classList.toggle('is-board', view === 'board');
  // ปุ่มจัดเรียงมีความหมายเฉพาะบนบอร์ด แถบเครื่องมือจึงไม่ต้องแบกปุ่มจาง ๆ ไว้ตลอดเวลา
  el.arrange.hidden = view !== 'board';

  document.querySelectorAll('[data-view]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.view === view);
  });

  if (view === 'board') {
    board.render();
    syncBoardSize();
    zoomToFitBoard();
    el.status.textContent = 'มุมมองบอร์ด — ลากป้ายชื่อเพื่อจัดตำแหน่ง กด "แก้หน้านี้" หรือดับเบิลคลิกเพื่อเข้าไปแก้';
  } else {
    canvas.render();
    setZoom(1, false);
    el.status.textContent = 'มุมมองแก้ผัง';
  }

  renderHud();
}

/** กรอบนอกของบอร์ดต้องจองพื้นที่เท่าขนาดหลังย่อ เหตุผลเดียวกับแคนวาส */
function syncBoardSize() {
  el.boardwrap.style.setProperty('--board-w', el.board.style.width || '0px');
  el.boardwrap.style.setProperty('--board-h', el.board.style.height || '0px');
}

/** เก็บตำแหน่งกรอบหลังลากเสร็จ แล้ววาดกรอบนอกใหม่ให้พื้นที่เลื่อนพอดีของที่ย้ายไป */
function afterBoardMove(id, x, y) {
  commit(setScreenPosition(history.get(), id, x, y), false);
  syncBoardSize();
}

/* --------------------------------------------------------------------------
   ส่วนที่กดได้ข้างในคอมโพเนนต์
   -------------------------------------------------------------------------- */

/**
 * อ่านจาก DOM ที่วาดจริง ไม่ใช่จากสตริง markup
 * เพราะรูปแบบที่ผู้ใช้เลือกเปลี่ยนของข้างในได้ ส่วนที่มีจึงต่างกันไปตามรูปแบบ
 */
const partLabelCache = new Map();

/**
 * ชื่อของส่วนย่อยสำหรับชิ้นที่ไม่ได้อยู่บนหน้าที่เปิดอยู่ — อ่านจาก markup ที่แคชไว้
 * แผนภาพโฟลว์ต้องบอกว่า "กดปุ่มไหน" ไม่ใช่ "กด p2" ซึ่งไม่มีความหมายกับคนอ่าน
 */
function partLabels(slug) {
  if (!partLabelCache.has(slug)) {
    const holder = document.createElement('div');
    holder.innerHTML = markupCache.get(slug)?.preview ?? '';
    const map = {};
    holder.querySelectorAll('[data-part]').forEach((node) => {
      map[node.dataset.part] = (node.getAttribute('aria-label') || node.textContent || '')
        .replace(/\s+/g, ' ').trim().slice(0, 26);
    });
    partLabelCache.set(slug, map);
  }
  return partLabelCache.get(slug);
}

function partsOf(itemId) {
  const stage = el.canvas.querySelector(`.lay-item[data-id="${itemId}"] .lay-item__stage`);
  if (!stage) return [];

  return [...stage.querySelectorAll('[data-part]')].map((node) => ({
    id: node.dataset.part,
    label: (node.getAttribute('aria-label') || node.textContent || '')
      .replace(/\s+/g, ' ').trim().slice(0, 26) || node.className.toString().split(' ')[0],
  }));
}

/* --------------------------------------------------------------------------
   แถบคำสั่งลอยของชิ้นที่เลือก
   -------------------------------------------------------------------------- */

/**
 * คำสั่งที่ใช้บ่อยที่สุดควรอยู่ตรงที่มือกำลังทำงาน ไม่ใช่ให้สายตาวิ่งไปมุมจอ
 * และต้องโผล่ตอนเลือกของเท่านั้น แถบที่เต็มไปด้วยปุ่มจาง ๆ ตลอดเวลาคือขยะสายตา
 */
function renderHud() {
  const id = canvas?.getSelected();
  const layout = history.get();
  const item = itemsOf(layout).find((entry) => entry.id === id);
  const box = id ? el.canvas.querySelector(`.lay-item[data-id="${id}"]`) : null;

  if (!item || !box || isBoard()) {
    el.hud.hidden = true;
    return;
  }

  const meta = bySlug(item.slug);
  const variants = meta?.matrix?.variants ?? [];
  const others = layout.screens.filter((screen) => screen.id !== layout.activeScreen);

  el.hud.innerHTML = `
    <span class="lay-hud__name">${meta?.name ?? item.slug}</span>
    <span class="lay-hud__sep" aria-hidden="true"></span>

    <div class="lay-hud__group" role="group" aria-label="ความกว้าง">
      ${[3, 4, 6, 8, 12].map((w) => `
        <button type="button" class="lay-hud__chip${item.w === w ? ' is-active' : ''}"
                data-hud-width="${w}" title="กว้าง ${w} ช่อง">
          ${w === 12 ? 'เต็ม' : w}
        </button>`).join('')}
    </div>

    ${variants.length > 1 ? `
      <span class="lay-hud__sep" aria-hidden="true"></span>
      <select class="lay-hud__select" id="lay-hud-variant" aria-label="รูปแบบ">
        ${variants.map((variant, index) => `
          <option value="${index}"${index === item.variant ? ' selected' : ''}>${variant.label}</option>`).join('')}
      </select>` : ''}

    ${others.length > 0 ? `
      <span class="lay-hud__sep" aria-hidden="true"></span>
      <label class="lay-hud__link">
        ${icon('i-link')}
        <select class="lay-hud__select" id="lay-hud-link" aria-label="กดแล้วไปหน้า">
          <option value=""${item.link ? '' : ' selected'}>ไม่ผูก</option>
          ${others.map((screen) => `
            <option value="${screen.id}"${item.link === screen.id ? ' selected' : ''}>${screen.name}</option>`).join('')}
        </select>
      </label>` : ''}

    <span class="lay-hud__sep" aria-hidden="true"></span>
    <button type="button" class="lay-hud__btn" data-hud="duplicate" aria-label="ทำสำเนา" title="ทำสำเนา (Ctrl+D)">
      ${icon('i-copy')}
    </button>
    <button type="button" class="lay-hud__btn lay-hud__btn--danger" data-hud="remove" aria-label="ลบ" title="ลบ (Delete)">
      ${icon('i-trash')}
    </button>
  `;

  el.hud.hidden = false;
  positionHud(box);

  el.hud.querySelectorAll('[data-hud-width]').forEach((button) => {
    button.addEventListener('click', () => {
      commit(updateItem(history.get(), item.id, { w: Number(button.dataset.hudWidth) }));
    });
  });

  el.hud.querySelector('#lay-hud-variant')?.addEventListener('change', (event) => {
    commit(updateItem(history.get(), item.id, { variant: Number(event.target.value) }));
  });

  el.hud.querySelector('#lay-hud-link')?.addEventListener('change', (event) => {
    const target = event.target.value || null;
    commit(updateItem(history.get(), item.id, { link: target }));
    el.status.textContent = target
      ? `ผูก ${meta?.name ?? item.slug} ให้ไปหน้า ${screenById(history.get(), target)?.name}`
      : 'ยกเลิกลิงก์ของชิ้นนี้แล้ว';
  });

  el.hud.querySelector('[data-hud="duplicate"]')?.addEventListener('click', duplicateSelected);

  el.hud.querySelector('[data-hud="remove"]')?.addEventListener('click', () => {
    commit(removeItem(history.get(), item.id));
    canvas.select(null);
    el.status.textContent = 'ลบชิ้นที่เลือกแล้ว — กด Ctrl+Z เพื่อเอากลับ';
  });
}

/** วางแถบไว้เหนือชิ้นงาน ถ้าชนขอบบนของเวทีให้ย้ายลงมาอยู่ใต้แทน */
function positionHud(box) {
  const rect = box.getBoundingClientRect();
  const stage = el.stage.getBoundingClientRect();

  const left = rect.left - stage.left + el.stage.scrollLeft;
  const above = rect.top - stage.top + el.stage.scrollTop - 44;
  const below = rect.bottom - stage.top + el.stage.scrollTop + 10;

  el.hud.style.left = `${Math.max(el.stage.scrollLeft + 8, left)}px`;
  el.hud.style.top = `${above < el.stage.scrollTop + 4 ? below : above}px`;
}

/* --------------------------------------------------------------------------
   โฟลว์ทั้งระบบ
   -------------------------------------------------------------------------- */

/**
 * อ่านจากผังจริงทุกครั้งที่เปิด ไม่เก็บสำเนาไว้
 * แผนภาพที่ไม่ตรงกับของจริงอันตรายกว่าไม่มีแผนภาพ เพราะคนจะเชื่อมันแล้วตัดสินใจผิด
 */
function renderFlowView() {
  const layout = history.get();
  const links = flowLinks(layout);
  const nameOf = (id) => screenById(layout, id)?.name ?? '(หน้าที่ถูกลบไปแล้ว)';

  const dangling = layout.screens.filter((screen) => (
    screen.id !== layout.start && !links.some((link) => link.to === screen.id)
  ));

  el.flowBody.innerHTML = `
    <div class="lay-flow__stats">
      <span><strong>${layout.screens.length}</strong> หน้า</span>
      <span><strong>${links.length}</strong> ลิงก์</span>
      <span>เริ่มที่ <strong>${nameOf(layout.start)}</strong></span>
    </div>

    ${layout.screens.map((screen) => {
      const out = links.filter((link) => link.from === screen.id);
      return `
        <section class="lay-flow__screen">
          <h3 class="lay-flow__name">
            ${screen.id === layout.start ? icon('i-play', 'icon lay-flow__start') : ''}
            ${screen.name}
            <span class="lay-flow__badge">${out.length} ทาง</span>
          </h3>
          ${out.length === 0 ? `
            <p class="lay-flow__dead">หน้านี้ยังไม่มีทางออก — เข้ามาแล้วออกไปไหนต่อไม่ได้</p>
          ` : `
            <ul class="lay-flow__list">
              ${out.map((link) => `
                <li class="lay-flow__row">
                  <span class="lay-flow__from">${bySlug(link.slug)?.name ?? link.slug}${link.part ? ` · ${partLabels(link.slug)[link.part] ?? link.part}` : ' (ทั้งชิ้น)'}</span>
                  ${icon('i-chevron-right', 'icon lay-flow__arrow')}
                  <span class="lay-flow__to">${nameOf(link.to)}</span>
                </li>`).join('')}
            </ul>
          `}
        </section>`;
    }).join('')}

    ${dangling.length > 0 ? `
      <p class="lay-flow__warn">
        ${icon('i-alert-triangle')}
        มีหน้าที่ไม่มีทางเข้า ${dangling.length} หน้า (${dangling.map((screen) => screen.name).join(' · ')})
        — เปิดในโหมดทดลองไม่เจอ ถ้าไม่ผูกลิงก์เข้ามา
      </p>` : ''}
  `;
}

function openFlowView() {
  renderFlowView();
  el.flowModal.hidden = false;
  el.flowModal.querySelector('[data-close]')?.focus();
}

/* --------------------------------------------------------------------------
   เพิ่มของด้วยการพิมพ์
   -------------------------------------------------------------------------- */

function openQuickAdd(point) {
  dropPoint = point ?? dropPoint;
  el.quick.hidden = false;
  el.quickInput.value = '';
  renderQuickList('');
  el.quickInput.focus();
}

function closeQuickAdd() {
  el.quick.hidden = true;
  el.quickInput.blur();
}

function quickMatches(text) {
  const needle = text.trim().toLowerCase();
  const all = needle
    ? COMPONENTS.filter((meta) => meta.name.toLowerCase().includes(needle) || meta.slug.includes(needle))
    : COMPONENTS;
  return all.slice(0, 6);
}

function renderQuickList(text) {
  const found = quickMatches(text);
  el.quickList.innerHTML = found.map((meta, index) => `
    <button type="button" class="lay-quick__item${index === 0 ? ' is-active' : ''}" data-slug="${meta.slug}">
      <span class="lay-quick__label">${meta.name}</span>
      <span class="lay-quick__group">${GROUPS.find((group) => group.id === meta.group)?.label ?? ''}</span>
    </button>`).join('') || '<p class="lay-quick__empty">ไม่พบคอมโพเนนต์ที่ตรงกับคำนี้</p>';

  el.quickList.querySelectorAll('[data-slug]').forEach((button) => {
    button.addEventListener('click', () => {
      place(button.dataset.slug);
      closeQuickAdd();
    });
  });
}

/* --------------------------------------------------------------------------
   แผงคุณสมบัติทางขวา
   -------------------------------------------------------------------------- */

/** ไม่ได้เลือกชิ้นไหนอยู่ = พื้นที่นี้ว่าง จึงให้เป็นที่ตั้งค่าของตัวผังเองแทนข้อความเปล่า */
function renderCanvasSettings() {
  const layout = history.get();
  const current = activeScreen(layout);
  const isStart = current?.id === layout.start;

  el.inspector.innerHTML = `
    <div>
      <h3 class="lay-insp__title">ขนาดผัง</h3>
      <p class="lay-insp__sub">ค่าเหล่านี้ออกไปกับไฟล์ที่ส่งออกด้วย</p>
    </div>

    ${[...new Set(CANVAS_PRESETS.map((choice) => choice.group))].map((group) => `
      <div class="lay-insp__quick">
        <span class="lay-insp__label">${group}</span>
        <div class="lay-insp__chips">
          ${CANVAS_PRESETS.filter((choice) => choice.group === group).map((choice) => `
            <button type="button"
                    class="lay-chip${(layout.width ?? 'auto') === (choice.px ?? 'auto') ? ' is-active' : ''}"
                    data-preset="${choice.id}" title="${choice.note}">
              ${choice.label}${choice.px ? ` <span class="lay-chip__px">${choice.px}</span>` : ''}
            </button>`).join('')}
        </div>
      </div>`).join('')}

    <div class="lay-insp__quick">
      <span class="lay-insp__label">จำนวนคอลัมน์</span>
      <div class="lay-insp__chips">
        ${COL_CHOICES.map((cols) => `
          <button type="button" class="lay-chip${layout.cols === cols ? ' is-active' : ''}" data-grid-cols="${cols}">
            ${cols}
          </button>`).join('')}
      </div>
    </div>

    <div class="lay-insp__quick">
      <span class="lay-insp__label">ความสูงต่อแถว</span>
      <div class="lay-insp__chips">
        ${ROW_HEIGHTS.map((h) => `
          <button type="button" class="lay-chip${layout.rowHeight === h ? ' is-active' : ''}" data-row-height="${h}">
            ${h}px
          </button>`).join('')}
      </div>
    </div>

    <div class="lay-insp__quick">
      <span class="lay-insp__label">ช่องไฟระหว่างชิ้น</span>
      <div class="lay-insp__chips">
        ${GAP_CHOICES.map((g) => `
          <button type="button" class="lay-chip${layout.gap === g ? ' is-active' : ''}" data-grid-gap="${g}">
            ${g}px
          </button>`).join('')}
      </div>
    </div>

    <div class="lay-insp__row">
      <span class="lay-insp__label">ขนาดจริงตอนนี้</span>
      <span class="lay-insp__value u-mono" id="lay-canvas-size"></span>
    </div>

    <div class="lay-insp__quick">
      <span class="lay-insp__label">หน้าจอนี้</span>
      <div class="field">
        <label class="field__label" for="lay-screen-name">ชื่อหน้า</label>
        <input class="input" id="lay-screen-name" type="text" value="${current?.name ?? ''}" maxlength="40">
      </div>
      <div class="lay-insp__chips">
        <button type="button" class="lay-chip${isStart ? ' is-active' : ''}" data-act="start"
                title="หน้าที่โหมดทดลองเริ่มต้น">
          ${icon('i-home')} หน้าเริ่มต้น
        </button>
        <button type="button" class="lay-chip lay-chip--danger" data-act="drop-screen"
                ${layout.screens.length <= 1 ? 'disabled' : ''}
                title="${layout.screens.length <= 1 ? 'ต้องเหลืออย่างน้อยหนึ่งหน้า' : 'ลบหน้านี้'}">
          ${icon('i-trash')} ลบหน้านี้
        </button>
      </div>
    </div>

    <p class="lay-empty-note">
      เลือกของบนผังเพื่อปรับตำแหน่งและขนาดของชิ้นนั้น
    </p>
  `;

  const size = el.inspector.querySelector('#lay-canvas-size');
  if (size) {
    const rect = el.canvas.getBoundingClientRect();
    const fold = foldRow(layout);
    size.textContent = fold
      ? `${Math.round(rect.width / zoom)} px · พับที่แถว ${fold}`
      : `${Math.round(rect.width / zoom)} px กว้าง`;
  }

  el.inspector.querySelectorAll('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      const choice = CANVAS_PRESETS.find((entry) => entry.id === button.dataset.preset);
      if (!choice) return;

      commit(resolveBoardOverlaps(resizeGrid(history.get(), {
        width: choice.px ?? 'auto',
        height: choice.height ?? null,
      })));
      applyCanvasWidth();
      // ผังกว้างเท่าขนาดจริงเสมอ ถ้ากว้างเกินพื้นที่ก็ย่อให้เห็นทั้งผืนทันที ไม่ต้องให้ผู้ใช้ไปกดเอง
      zoomToFit();

      el.status.textContent = choice.px
        ? `ตั้งผังเป็นขนาด ${choice.label} ${choice.px} × ${choice.height} px (${choice.note})`
        : 'ผังกว้างเต็มพื้นที่';
    });
  });

  el.inspector.querySelectorAll('[data-grid-cols]').forEach((button) => {
    button.addEventListener('click', () => {
      commit(resizeGrid(history.get(), { cols: Number(button.dataset.gridCols) }));
      el.status.textContent = `เปลี่ยนเป็นกริด ${button.dataset.gridCols} คอลัมน์ — ของที่กว้างเกินถูกหดให้พอดีแล้ว`;
    });
  });

  el.inspector.querySelectorAll('[data-row-height]').forEach((button) => {
    button.addEventListener('click', () => {
      commit(resizeGrid(history.get(), { rowHeight: Number(button.dataset.rowHeight) }));
    });
  });

  el.inspector.querySelector('#lay-screen-name')?.addEventListener('change', (event) => {
    const name = event.target.value.trim() || 'หน้าไม่มีชื่อ';
    commit(renameScreen(history.get(), current.id, name));
  });

  el.inspector.querySelector('[data-act="start"]')?.addEventListener('click', () => {
    commit(setStartScreen(history.get(), current.id));
    el.status.textContent = `ตั้ง ${current.name} เป็นหน้าเริ่มต้นของโหมดทดลอง`;
  });

  el.inspector.querySelector('[data-act="drop-screen"]')?.addEventListener('click', () => {
    const next = removeScreen(history.get(), current.id);
    if (next === history.get()) return;
    commit(next);
    canvas.select(null);
    el.status.textContent = `ลบหน้า ${current.name} แล้ว — ลิงก์ที่ชี้มาหน้านี้ถูกล้างให้ด้วย`;
  });

  el.inspector.querySelectorAll('[data-grid-gap]').forEach((button) => {
    button.addEventListener('click', () => {
      commit(resizeGrid(history.get(), { gap: Number(button.dataset.gridGap) }));
    });
  });
}

function applyCanvasWidth() {
  const layout = history.get();
  const fixed = Boolean(layout.width && layout.width !== 'auto');
  const value = fixed ? `${layout.width}px` : '100%';
  el.canvasWrap.style.setProperty('--canvas-w', value);
  el.canvasFrame.style.setProperty('--canvas-w', value);

  // โหมดเต็มพื้นที่ไม่มีความกว้างตายตัวให้คูณ ต้องคิดกลับทางแทน
  // ไม่งั้นผังโดนย่อสองชั้น (frame ย่อครั้ง แล้ว wrap ย่อซ้ำ) จนไม่เต็มพื้นที่
  el.canvasFrame.classList.toggle('is-fluid', !fixed);

  // เส้นบอกรอยพับ: แถวที่พ้นจากนี้คือส่วนที่ผู้ใช้ต้องเลื่อนถึงจะเห็น
  const fold = foldRow(layout);
  el.canvas.style.setProperty('--fold-row', fold ?? 0);
  el.canvas.classList.toggle('has-fold', Boolean(fold));
}

function renderInspector() {
  const id = canvas?.getSelected();
  const layout = history.get();
  const item = itemsOf(layout).find((entry) => entry.id === id);

  if (!item) {
    renderCanvasSettings();
    return;
  }

  const part = canvas?.getSelectedPart?.();
  if (part) {
    renderPartInspector(item, part, layout);
    return;
  }

  const meta = bySlug(item.slug);
  const variants = meta?.matrix?.variants ?? [];

  el.inspector.innerHTML = `
    <div class="lay-insp__head">
      <div>
        <h3 class="lay-insp__title">${meta?.name ?? item.slug}</h3>
        <p class="lay-insp__sub">${item.w} × ${item.h} ช่อง · คอลัมน์ ${item.col} แถว ${item.row}</p>
      </div>
      <button type="button" class="btn btn--sm btn--danger-ghost" data-act="remove">
        ${icon('i-trash')} ลบ
      </button>
    </div>

    <div class="lay-insp__grid">
      ${numberField('col', 'คอลัมน์เริ่ม', item.col, 1, layout.cols)}
      ${numberField('row', 'แถวเริ่ม', item.row, 1, 60)}
      ${numberField('w', 'กว้าง (ช่อง)', item.w, 1, layout.cols)}
      ${numberField('h', 'สูง (ช่อง)', item.h, 1, 40)}
    </div>

    <div class="lay-insp__row">
      <span class="lay-insp__label">ขนาดจริง</span>
      <span class="lay-insp__value u-mono" id="lay-real-size"></span>
    </div>

    ${variants.length > 1 ? `
      <div class="field">
        <label class="field__label" for="lay-variant">รูปแบบ</label>
        <select class="select" id="lay-variant">
          <option value="0"${item.variant === 0 ? ' selected' : ''}>เต็มบล็อก (แก้รายส่วนได้)</option>
          ${variants.slice(1).map((variant, index) => `
            <option value="${index + 1}"${index + 1 === item.variant ? ' selected' : ''}>
              ${variant.label}
            </option>`).join('')}
        </select>
        ${item.variant > 0 ? `<span class="field__helper">
          รูปแบบย่อยเป็นตัวอย่างชิ้นเดียว ไม่มีส่วนย่อยให้เจาะเข้าไปแก้ — กลับไปเต็มบล็อกถ้าต้องแก้คำหรือสีรายส่วน
        </span>` : ''}
      </div>` : ''}

    <div class="lay-insp__quick">
      <span class="lay-insp__label">ความกว้างสำเร็จรูป</span>
      <div class="lay-insp__chips">
        ${[3, 4, 6, 8, 12].map((w) => `
          <button type="button" class="lay-chip${item.w === w ? ' is-active' : ''}" data-width="${w}">
            ${w === 12 ? 'เต็มแถว' : `${w}/12`}
          </button>`).join('')}
      </div>
    </div>

    <div class="field lay-insp__link">
      <label class="field__label" for="lay-link">
        ${icon('i-link')} กดทั้งชิ้นแล้วไปหน้า
      </label>
      <select class="select" id="lay-link">
        <option value=""${item.link ? '' : ' selected'}>ไม่ทำอะไร</option>
        ${layout.screens.filter((screen) => screen.id !== layout.activeScreen).map((screen) => `
          <option value="${screen.id}"${item.link === screen.id ? ' selected' : ''}>
            ${screen.name}
          </option>`).join('')}
      </select>
      <span class="field__helper">
        ใช้เมื่อทั้งชิ้นพาไปที่เดียว ถ้าข้างในมีหลายปุ่มให้ผูกรายส่วนด้านล่างแทน
      </span>
    </div>

    <div class="lay-parts" id="lay-parts"></div>
  `;

  const realSize = el.inspector.querySelector('#lay-real-size');
  if (realSize) {
    const width = el.canvas.clientWidth - GRID.gap * 2;
    const colWidth = (width - GRID.gap * (layout.cols - 1)) / layout.cols;
    const px = Math.round(colWidth * item.w + GRID.gap * (item.w - 1));
    const py = item.h * layout.rowHeight + GRID.gap * (item.h - 1);
    realSize.textContent = `${px} × ${py} px`;
  }

  el.inspector.querySelector('[data-act="remove"]')?.addEventListener('click', () => {
    commit(removeItem(history.get(), item.id));
    canvas.select(null);
    el.status.textContent = 'ลบชิ้นที่เลือกออกจากผังแล้ว';
  });

  el.inspector.querySelectorAll('[data-field]').forEach((input) => {
    input.addEventListener('change', () => {
      commit(updateItem(history.get(), item.id, { [input.dataset.field]: Number(input.value) }));
    });
  });

  el.inspector.querySelector('#lay-variant')?.addEventListener('change', (event) => {
    commit(updateItem(history.get(), item.id, { variant: Number(event.target.value) }));
  });

  el.inspector.querySelectorAll('[data-width]').forEach((button) => {
    button.addEventListener('click', () => {
      commit(updateItem(history.get(), item.id, { w: Number(button.dataset.width) }));
    });
  });

  renderPartLinks(item, layout);

  el.inspector.querySelector('#lay-link')?.addEventListener('change', (event) => {
    const target = event.target.value || null;
    commit(updateItem(history.get(), item.id, { link: target }));
    el.status.textContent = target
      ? `ผูก ${meta?.name ?? item.slug} ให้ไปหน้า ${screenById(history.get(), target)?.name}`
      : 'ยกเลิกลิงก์ของชิ้นนี้แล้ว';
  });
}

/** รายการส่วนที่กดได้ของชิ้นนี้ พร้อมช่องเลือกปลายทางของแต่ละส่วน */
/* --------------------------------------------------------------------------
   แผงของส่วนย่อย — เจาะเข้าไปแก้ปุ่มทีละปุ่ม ป้ายทีละป้าย
   -------------------------------------------------------------------------- */

/** node จริงบนแคนวาสของส่วนที่เลือก ใช้ดูชนิดกับข้อความต้นฉบับ */
function partNodeOf(itemId, partId) {
  return el.canvas.querySelector(`.lay-item[data-id="${itemId}"] [data-part="${partId}"]`);
}

/** ข้อความที่ผู้ใช้เห็นอยู่จริง ไม่รวมไอคอนกับตัวเลขนับที่ซ้อนอยู่ข้างใน */
function partOwnText(node) {
  if (!node) return '';
  const own = [...node.childNodes]
    .filter((child) => child.nodeType === Node.TEXT_NODE)
    .map((child) => child.textContent.trim())
    .join(' ')
    .trim();
  if (own) return own;

  const label = node.querySelector('.ui-cell__title, .ui-list__title, .ui-stat__label');
  return label ? label.textContent.trim() : '';
}

function renderPartInspector(item, partId, layout) {
  const node = partNodeOf(item.id, partId);
  const meta = bySlug(item.slug);
  const props = partProps(item, partId);
  const kind = partKind(node);
  const original = partOwnText(node);
  const label = (node?.getAttribute('aria-label') || original || partId).slice(0, 26);
  const advice = suggestTone(kind, props.text || original || label);
  const KIND_FALLBACK = KIND_LABELS[kind] ?? 'ส่วนย่อย';
  const others = layout.screens.filter((screen) => screen.id !== layout.activeScreen);

  el.inspector.innerHTML = `
    <div class="lay-insp__head">
      <div>
        <button type="button" class="lay-part__back" data-act="up">
          ${icon('i-chevron-left')} ${meta?.name ?? item.slug}
        </button>
        <h3 class="lay-insp__title">${label}</h3>
        <p class="lay-insp__sub">${KIND_FALLBACK} · ${partId}</p>
      </div>
    </div>

    <div class="field">
      <label class="field__label" for="lay-part-text">คำบนส่วนนี้</label>
      <input class="input" id="lay-part-text" type="text" value="${escapeHtml(props.text ?? original)}"
             placeholder="${escapeHtml(original)}">
      <span class="field__helper">เว้นว่างเพื่อกลับไปใช้คำเดิมของคอมโพเนนต์</span>
    </div>

    <div class="lay-part__block">
      <span class="lay-insp__label">สีจากชุดที่ใช้อยู่</span>
      <div class="lay-dots" role="radiogroup" aria-label="สีของส่วนนี้">
        <button type="button" class="lay-dot lay-dot--off${props.tone ? '' : ' is-active'}"
                data-tone="" role="radio" aria-checked="${props.tone ? 'false' : 'true'}"
                title="ใช้สีเดิมของคอมโพเนนต์">${icon('i-x')}</button>
        ${TONES.map((tone) => `
          <button type="button" class="lay-dot${props.tone === tone.id ? ' is-active' : ''}"
                  data-tone="${tone.id}" role="radio" aria-checked="${props.tone === tone.id}"
                  style="--dot: var(${tone.token})" title="${tone.label}">
            ${tone.id === advice.tone ? '<span class="lay-dot__star" aria-hidden="true"></span>' : ''}
          </button>`).join('')}
      </div>
      <p class="lay-part__advice">
        ${icon('i-lightbulb')}
        <span><strong>แนะนำ ${TONES.find((t) => t.id === advice.tone)?.label}</strong> — ${advice.why}</span>
      </p>
    </div>

    <div class="lay-part__block">
      <span class="lay-insp__label">ขนาด</span>
      <div class="lay-insp__chips">
        <button type="button" class="lay-chip${props.size ? '' : ' is-active'}" data-size="">เดิม</button>
        ${SIZES.map((size) => `
          <button type="button" class="lay-chip${props.size === size.id ? ' is-active' : ''}"
                  data-size="${size.id}">${size.label}</button>`).join('')}
      </div>
    </div>

    ${actionFieldsHtml(item, partId, layout)}
    ${listFieldsHtml(item, partId, node)}
  `;

  // แผงขวาอยู่นอกพื้นที่ผัง จึงไม่ได้รับ token ของผู้ใช้มาเอง — ต้องเขียนลงให้เฉพาะแถววงกลมสี
  // ไม่งั้นผู้ใช้จะเลือกจากสีของธีมเว็บ แล้วได้สีจริงคนละตัวกับที่จิ้ม
  applyTokens(el.inspector.querySelector('.lay-dots'));

  el.inspector.querySelector('[data-act="up"]')?.addEventListener('click', () => {
    canvas.select(item.id, null);
  });

  const textInput = el.inspector.querySelector('#lay-part-text');
  textInput?.addEventListener('change', () => {
    const value = textInput.value.trim();
    commitPart(item.id, partId, { text: value && value !== original ? value : null });
  });

  el.inspector.querySelectorAll('[data-tone]').forEach((button) => {
    button.addEventListener('click', () => {
      commitPart(item.id, partId, { tone: button.dataset.tone || null });
    });
  });

  el.inspector.querySelectorAll('[data-size]').forEach((button) => {
    button.addEventListener('click', () => {
      commitPart(item.id, partId, { size: button.dataset.size || null });
    });
  });

  bindActionFields(item, partId, label);
  bindListFields(item, partId, node, label);
}

/* --- รายการที่ซ้ำกัน: เพิ่ม ลบ สลับลำดับ --- */

/**
 * พี่น้องของส่วนนี้ — ตัวที่อยู่ในกล่องเดียวกันและใช้คลาสหลักตัวเดียวกัน
 * เกณฑ์เป็นคลาส ไม่ใช่แค่ "ลูกของพ่อคนเดียวกัน" เพราะแถบนำทางมีทั้งลิงก์เมนูและปุ่มอยู่ในแถวเดียวกัน
 * ปุ่มลงมือจึงไม่ควรถูกนับเป็นรายการหนึ่งของเมนู
 */
function siblingGroup(node) {
  if (!node?.parentElement) return null;

  const key = [...node.classList].find((name) => name.startsWith('ui-')) ?? null;
  if (!key) return null;

  // ไต่ขึ้นทีละชั้นจนเจอกล่องที่มีสมาชิกมากกว่าหนึ่ง — รายการจริงมักถูกห่อด้วย <li> อีกชั้น
  // ถ้าดูแค่พี่น้องระดับเดียวกัน เมนูที่อยู่ใน <ul><li> จะกลายเป็นลูกโทนของ <li> ตัวเอง
  // แล้วปุ่มจัดการรายการจะไม่โผล่เลยทั้งที่มีเมนูเจ็ดอันเรียงอยู่ตรงหน้า
  let host = node.parentElement;
  while (host && !host.classList.contains('lay-item__stage')) {
    const members = [...host.querySelectorAll(`[data-part].${key}`)];
    if (members.length > 1) {
      return { key, members: members.map((entry) => entry.dataset.part), host };
    }
    host = host.parentElement;
  }

  return null;
}

/** หน่วยที่ซ้ำกันจริง — ตัวที่เป็นลูกโดยตรงของกล่อง อาจเป็น wrapper ที่ครอบ element ที่ติดธงไว้ */
function repeatUnit(node, host) {
  let unit = node;
  while (unit.parentElement && unit.parentElement !== host) unit = unit.parentElement;
  return unit;
}

function listFieldsHtml(item, partId, node) {
  const group = siblingGroup(node);
  const dropped = item.dropped ?? [];

  if (!group) {
    return dropped.length ? `
      <div class="lay-part__block">
        <span class="lay-insp__label">รายการที่ซ่อนไว้</span>
        <div class="lay-insp__chips">
          ${dropped.map((part) => `
            <button type="button" class="lay-chip" data-restore="${part}">${icon('i-plus')} คืน ${part}</button>`).join('')}
        </div>
      </div>` : '';
  }

  const index = group.members.indexOf(partId);

  return `
    <div class="lay-part__block">
      <span class="lay-insp__label">รายการในกลุ่มนี้ · ${group.members.length} อัน</span>
      <div class="lay-insp__chips">
        <button type="button" class="lay-chip" data-list="add">${icon('i-plus')} เพิ่มถัดจากนี้</button>
        <button type="button" class="lay-chip" data-list="up"${index <= 0 ? ' disabled' : ''}>${icon('i-sort')} เลื่อนขึ้น</button>
        <button type="button" class="lay-chip" data-list="down"${index < 0 || index >= group.members.length - 1 ? ' disabled' : ''}>${icon('i-sort')} เลื่อนลง</button>
        <button type="button" class="lay-chip lay-chip--danger" data-list="drop">${icon('i-trash')} ลบรายการนี้</button>
      </div>
      ${dropped.length ? `
        <div class="lay-insp__chips lay-part__restore">
          ${dropped.map((part) => `
            <button type="button" class="lay-chip" data-restore="${part}">${icon('i-plus')} คืน ${part}</button>`).join('')}
        </div>` : ''}
    </div>`;
}

function bindListFields(item, partId, node, label) {
  const group = siblingGroup(node);

  el.inspector.querySelectorAll('[data-restore]').forEach((button) => {
    button.addEventListener('click', () => {
      commit(restorePart(history.get(), item.id, button.dataset.restore));
      canvas.select(item.id, partId);
      el.status.textContent = 'คืนรายการที่ซ่อนไว้แล้ว';
    });
  });

  if (!group) return;

  el.inspector.querySelectorAll('[data-list]').forEach((button) => {
    button.addEventListener('click', () => {
      const act = button.dataset.list;

      if (act === 'add') {
        const next = addPartClone(history.get(), item.id, partId, `${label} ใหม่`, group.key);
        commit(next);
        // เลือกตัวที่เพิ่งเพิ่มต่อทันที ผู้ใช้จะได้พิมพ์ชื่อจริงได้เลยโดยไม่ต้องไปหาเอง
        const added = itemsOf(next).find((entry) => entry.id === item.id)?.extras?.slice(-1)[0];
        canvas.select(item.id, added?.id ?? partId);
        el.status.textContent = `เพิ่มรายการต่อจาก ${label} แล้ว`;
        return;
      }

      if (act === 'drop') {
        commit(dropPart(history.get(), item.id, partId));
        canvas.select(item.id, null);
        el.status.textContent = `ลบ ${label} ออกจากรายการแล้ว — กด Ctrl+Z ถ้าอยากได้คืน`;
        return;
      }

      commit(movePart(history.get(), item.id, group, partId, act === 'up' ? -1 : 1));
      canvas.select(item.id, partId);
      el.status.textContent = `ย้าย ${label} ${act === 'up' ? 'ขึ้น' : 'ลง'}หนึ่งตำแหน่ง`;
    });
  });
}

/* --- การกระทำของส่วนย่อย --- */

/** หน้าต่างซ้อนทุกตัวที่มีอยู่ในผัง ไม่ว่าจะวางไว้หน้าไหน — ปุ่มบนหน้าหนึ่งเรียกของอีกหน้าได้ */
function modalsInLayout(layout) {
  return allItems(layout)
    .filter((entry) => entry.slug === 'modal')
    .map((entry, index) => ({ id: entry.id, name: `หน้าต่างซ้อน ${index + 1}` }));
}

function actionFieldsHtml(item, partId, layout) {
  const props = partProps(item, partId);
  const linked = item.links?.[partId] ?? null;
  // ปลายทางที่ผูกไว้แบบเดิมคือการกระทำชนิด "ไปหน้าอื่น" — อ่านให้เป็นเรื่องเดียวกัน
  const action = props.action ?? (linked ? { type: 'goto', target: linked } : { type: 'none' });
  const spec = actionById(action.type);
  const others = layout.screens.filter((screen) => screen.id !== layout.activeScreen);
  const modals = modalsInLayout(layout).filter((entry) => entry.id !== item.id);

  const needs = spec?.needs;
  const preview = describeAction(action, {
    screenName: screenById(layout, action.target)?.name,
    modalName: modals.find((entry) => entry.id === action.target)?.name,
  });

  return `
    <div class="lay-part__block">
      <label class="field__label" for="lay-part-action">${icon('i-zap')} กดแล้วเกิดอะไร</label>
      <select class="select" id="lay-part-action">
        <option value="none"${action.type === 'none' ? ' selected' : ''}>ไม่ทำอะไร</option>
        ${ACTION_GROUPS.map((group) => `
          <optgroup label="${group.label}">
            ${group.actions.map((entry) => `
              <option value="${entry.id}"${action.type === entry.id ? ' selected' : ''}>
                ${entry.label}
              </option>`).join('')}
          </optgroup>`).join('')}
      </select>

      ${needs === 'screen' ? `
        <select class="select lay-part__arg" id="lay-part-target" aria-label="หน้าปลายทาง">
          <option value="">— เลือกหน้าปลายทาง —</option>
          ${others.map((screen) => `
            <option value="${screen.id}"${action.target === screen.id ? ' selected' : ''}>
              ${screen.name}
            </option>`).join('')}
        </select>
        ${others.length === 0 ? '<span class="field__helper">มีหน้าเดียวในผัง เพิ่มหน้าก่อนจึงจะผูกปลายทางได้</span>' : ''}` : ''}

      ${needs === 'modal' ? `
        <select class="select lay-part__arg" id="lay-part-target" aria-label="หน้าต่างซ้อนที่จะเปิด">
          <option value="">— เลือกหน้าต่างซ้อน —</option>
          ${modals.map((entry) => `
            <option value="${entry.id}"${action.target === entry.id ? ' selected' : ''}>
              ${entry.name}
            </option>`).join('')}
        </select>
        ${modals.length === 0 ? '<span class="field__helper">ยังไม่มี Modal ในผัง ลากจากคลังมาวางก่อนหนึ่งตัว</span>' : ''}` : ''}

      ${needs === 'subject' ? `
        <input class="input lay-part__arg" id="lay-part-subject" type="text"
               value="${escapeHtml(action.subject ?? '')}" placeholder="ทำกับอะไร เช่น รายการที่เลือก"
               aria-label="สิ่งที่การกระทำนี้ทำด้วย">` : ''}

      ${needs === 'url' ? `
        <input class="input lay-part__arg" id="lay-part-url" type="url"
               value="${escapeHtml(action.url ?? '')}" placeholder="https://" aria-label="ลิงก์ปลายทาง">` : ''}

      ${preview ? `<p class="lay-part__advice lay-part__advice--action">
        ${icon('i-play')}<span>${preview}</span>
      </p>` : ''}
      ${spec && !spec.live ? `<span class="field__helper">
        ผังไม่มีหลังบ้าน ตอนกดในโหมดทดลองจะบอกผลที่จะเกิดแทน แล้วติด data-action ไปกับไฟล์ที่ส่งออก
      </span>` : ''}
    </div>`;
}

function bindActionFields(item, partId, label) {
  const typeSelect = el.inspector.querySelector('#lay-part-action');
  if (!typeSelect) return;

  const readArgs = () => ({
    target: el.inspector.querySelector('#lay-part-target')?.value || null,
    subject: el.inspector.querySelector('#lay-part-subject')?.value.trim() || null,
    url: el.inspector.querySelector('#lay-part-url')?.value.trim() || null,
  });

  const save = (type) => {
    const args = readArgs();
    const next = type === 'none' ? null : { type, ...args };

    // "ไปหน้าอื่น" ยังเก็บที่ links เหมือนเดิม แผนภาพโฟลว์กับโหมดทดลองจึงอ่านที่เดิมได้ทั้งหมด
    const linkTarget = type === 'goto' ? args.target : null;
    let layout = setPartLink(history.get(), item.id, partId, linkTarget);
    layout = setPartProp(layout, item.id, partId, { action: next });

    commit(layout);
    canvas.select(item.id, partId);

    const spec = actionById(type);
    el.status.textContent = spec
      ? `${label}: ${describeAction({ type, ...args }, {
        screenName: screenById(history.get(), args.target)?.name,
        modalName: modalsInLayout(history.get()).find((entry) => entry.id === args.target)?.name,
      }) || spec.label}`
      : `ยกเลิกการกระทำของ ${label}`;
  };

  typeSelect.addEventListener('change', () => save(typeSelect.value));

  el.inspector.querySelectorAll('.lay-part__arg').forEach((field) => {
    field.addEventListener('change', () => save(typeSelect.value));
  });
}

const KIND_LABELS = {
  button: 'ปุ่มหลัก',
  'button-secondary': 'ปุ่มรอง',
  badge: 'ป้ายสถานะ',
  chip: 'ชิปตัวกรอง',
  tab: 'แท็บ',
  navlink: 'ลิงก์ในเมนู',
  page: 'เลขหน้า',
  other: 'ส่วนย่อย',
};

const escapeHtml = (text) => String(text ?? '')
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** แก้ค่าของส่วนย่อยแล้ววาดใหม่ โดยยังคาอยู่ที่ส่วนเดิม ไม่เด้งกลับไประดับชิ้น */
function commitPart(itemId, partId, patch) {
  commit(setPartProp(history.get(), itemId, partId, patch));
  canvas.select(itemId, partId);
}

function renderPartLinks(item, layout) {
  const host = el.inspector.querySelector('#lay-parts');
  if (!host) return;

  const parts = partsOf(item.id);
  const others = layout.screens.filter((screen) => screen.id !== layout.activeScreen);

  if (parts.length === 0) {
    host.innerHTML = '<p class="lay-parts__empty">คอมโพเนนต์นี้ไม่มีส่วนที่กดแยกได้</p>';
    return;
  }

  if (others.length === 0) {
    host.innerHTML = '<p class="lay-parts__empty">มีหน้าเดียวในผัง เพิ่มหน้าก่อนจึงจะผูกปลายทางได้</p>';
    return;
  }

  host.innerHTML = `
    <div class="lay-parts__head">
      ${icon('i-link')}
      <span>ผูกรายส่วน</span>
      <span class="lay-parts__count">${parts.length} ส่วน</span>
    </div>
    ${parts.map((part) => `
      <label class="lay-parts__row">
        <span class="lay-parts__label" title="${part.label}">${part.label}</span>
        <select class="lay-parts__select" data-part-link="${part.id}" aria-label="ปลายทางของ ${part.label}">
          <option value=""${item.links?.[part.id] ? '' : ' selected'}>—</option>
          ${others.map((screen) => `
            <option value="${screen.id}"${item.links?.[part.id] === screen.id ? ' selected' : ''}>
              ${screen.name}
            </option>`).join('')}
        </select>
      </label>`).join('')}
  `;

  host.querySelectorAll('[data-part-link]').forEach((select) => {
    select.addEventListener('change', () => {
      const target = select.value || null;
      commit(setPartLink(history.get(), item.id, select.dataset.partLink, target));
      const part = parts.find((entry) => entry.id === select.dataset.partLink);
      el.status.textContent = target
        ? `ผูก "${part?.label}" ให้ไปหน้า ${screenById(history.get(), target)?.name}`
        : `ยกเลิกลิงก์ของ "${part?.label}"`;
    });
  });
}

function numberField(field, label, value, min, max) {
  return `
    <div class="field">
      <label class="field__label" for="lay-${field}">${label}</label>
      <input class="input" id="lay-${field}" type="number" inputmode="numeric"
             data-field="${field}" value="${value}" min="${min}" max="${max}">
    </div>`;
}

/* --------------------------------------------------------------------------
   เลเยอร์ — ลำดับเนื้อหาของหน้าที่กำลังแก้

   ลำดับในลิสต์นี้คือลำดับ DOM ของไฟล์ที่ส่งออก จึงเป็นลำดับ Tab ของงานจริงด้วย
   -------------------------------------------------------------------------- */

/** ไอคอนประจำชนิดของ component — ช่วยกวาดตาหาของในลิสต์ยาว ๆ โดยไม่ต้องอ่านชื่อทีละแถว */
const LAYER_ICON = {
  table: 'i-table', toolbar: 'i-sliders', pagination: 'i-more', list: 'i-list',
  badge: 'i-tag', button: 'i-target', field: 'i-form', empty: 'i-inbox', skeleton: 'i-more',
  navbar: 'i-menu', sidebar: 'i-layout', breadcrumb: 'i-chevron-right', tabs: 'i-folder',
  hero: 'i-zap', 'section-head': 'i-menu', card: 'i-grid', stat: 'i-calculator',
  accordion: 'i-list', footer: 'i-layout', alert: 'i-alert-triangle', modal: 'i-inbox',
};

const layerLabel = (item) => item.name ?? bySlug(item.slug)?.name ?? item.slug;

const selectedIds = () => canvas?.getSelectedIds() ?? [];

function renderLayers() {
  if (!layers) return;
  layers.render();
  updateLayerTools();
  updateOrderNote();
}

/** ปุ่มไหนกดได้ตอนนี้ ขึ้นกับว่าเลือกอะไรอยู่ — ปุ่มที่กดแล้วไม่เกิดอะไรคือปุ่มที่โกหก */
function updateLayerTools() {
  const ids = selectedIds();
  const screen = activeScreen(history.get());
  const groups = groupsOf(screen).filter((group) => group.members.some((id) => ids.includes(id)));

  el.layerUp.disabled = ids.length === 0;
  el.layerDown.disabled = ids.length === 0;
  el.layerGroup.disabled = ids.length < 2;
  el.layerUngroup.disabled = groups.length === 0;
  el.layerSort.disabled = itemsOf(history.get()).length < 2;
}

/**
 * ป้ายเตือนเมื่อลำดับ DOM ไม่ตรงกับลำดับที่ตาอ่าน
 * เป็นเรื่องที่มองไม่เห็นบนผัง แต่ไปโผล่เป็น Tab กระโดดมั่วในไฟล์ที่ผู้ใช้เอาไปใช้จริง
 */
function updateOrderNote() {
  const off = readingOrderIssues(activeScreen(history.get()));
  el.layerNote.hidden = off === 0;
  if (off === 0) return;
  el.layerNote.innerHTML = `${icon('i-alert-triangle')}<span>ลำดับเนื้อหาไม่ตรงกับที่ตาอ่าน ${off} ชิ้น — ไฟล์ที่ส่งออกจะกด Tab ไล่ไม่ตามสายตา กด "เรียงตามผัง" เพื่อแก้</span>`;
}

function setLibTab(tab) {
  el.libTabs.forEach((btn) => {
    const on = btn.dataset.libtab === tab;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
    btn.tabIndex = on ? 0 : -1;
  });
  el.libPanes.forEach((pane) => { pane.hidden = pane.id !== `lay-pane-${tab}`; });
  if (tab === 'layers') renderLayers();
}

/** เลื่อนชั้นของชิ้นที่เลือก — delta คือทีละขั้น ส่วน edge คือไปสุดทางเลย */
function moveLayer(delta, edge = null) {
  const ids = selectedIds();
  if (ids.length === 0) return;

  const next = edge
    ? moveOrderToEdge(history.get(), ids, edge)
    : nudgeOrder(history.get(), ids, delta);

  if (next === history.get()) {
    el.status.textContent = delta > 0 || edge === 'front' ? 'อยู่ชั้นบนสุดแล้ว' : 'อยู่ชั้นล่างสุดแล้ว';
    return;
  }

  commit(next);
  el.status.textContent = edge
    ? `ส่ง ${ids.length} ชิ้นไป${edge === 'front' ? 'หน้าสุด' : 'หลังสุด'}แล้ว`
    : `เลื่อน ${ids.length} ชิ้น${delta > 0 ? 'ขึ้น' : 'ลง'}หนึ่งชั้น`;
}

function groupSelected() {
  const ids = selectedIds();
  if (ids.length < 2) {
    el.status.textContent = 'เลือกอย่างน้อยสองชิ้นก่อนจัดกลุ่ม (Ctrl หรือ Shift คลิก)';
    return;
  }
  commit(groupItems(history.get(), ids));
  setLibTab('layers');
  el.status.textContent = `จัดกลุ่ม ${ids.length} ชิ้นแล้ว — กลุ่มมีไว้เลือกและซ่อนพร้อมกัน ไม่ออกไปกับไฟล์`;
}

function ungroupSelected() {
  const ids = selectedIds();
  const screen = activeScreen(history.get());
  const hit = groupsOf(screen).filter((group) => group.members.some((id) => ids.includes(id)));
  if (hit.length === 0) return;

  let next = history.get();
  hit.forEach((group) => { next = ungroup(next, group.id); });
  commit(next);
  el.status.textContent = `แยกกลุ่มแล้ว ${hit.length} กลุ่ม`;
}

/** ซ่อนหรือล็อกทั้งชุดที่เลือก — ถ้ามีตัวที่ยังไม่ติดธง ให้ติดทั้งชุดก่อน แล้วครั้งถัดไปจึงปลด */
function toggleFlag(key) {
  const ids = selectedIds();
  if (ids.length === 0) return;

  const items = itemsOf(history.get()).filter((item) => ids.includes(item.id));
  const value = !items.every((item) => item[key] === true);
  commit(setItemFlags(history.get(), ids, { [key]: value }));

  const label = key === 'hidden' ? ['ซ่อน', 'แสดง'] : ['ล็อก', 'ปลดล็อก'];
  el.status.textContent = `${value ? label[0] : label[1]} ${ids.length} ชิ้นแล้ว`;
}

/* --------------------------------------------------------------------------
   สรุปผัง ประวัติ และการส่งออก
   -------------------------------------------------------------------------- */

function renderSummary() {
  const { count, rows, screens, links } = summarizeLayout(history.get());
  const flow = screens > 1 ? ` · ${screens} หน้า · ${links} ลิงก์` : '';
  el.summary.textContent = count === 0
    ? `ผังหน้านี้ยังว่าง${flow}`
    : `${count} ชิ้น · ${rows} แถว${flow}`;
}

/* --------------------------------------------------------------------------
   หน้าจอและการไหลข้ามหน้า
   -------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
   เมนูคลิกขวาของหน้าจอ — ใช้ชุดเดียวกันทั้งบนแถบหน้าและบนบอร์ด
   คำสั่งเดียวกันต้องอยู่ที่เดียวกัน ไม่งั้นสองที่จะค่อย ๆ ทำได้ไม่เท่ากันโดยไม่มีใครสังเกต
   -------------------------------------------------------------------------- */

function closeScreenMenu() {
  document.querySelector('#lay-screen-menu')?.remove();
}

function openScreenMenu(screenId, x, y) {
  closeScreenMenu();

  const layout = history.get();
  const screen = screenById(layout, screenId);
  if (!screen) return;

  const only = layout.screens.length <= 1;
  const isStart = layout.start === screen.id;

  const menu = document.createElement('div');
  menu.className = 'lay-menu';
  menu.id = 'lay-screen-menu';
  menu.setAttribute('role', 'menu');
  menu.innerHTML = `
    <span class="lay-menu__head">${screen.name}</span>
    <button type="button" class="lay-menu__item" data-act="open" role="menuitem">
      ${icon('i-edit')} เปิดหน้านี้
    </button>
    <button type="button" class="lay-menu__item" data-act="rename" role="menuitem">
      ${icon('i-edit')} เปลี่ยนชื่อ
    </button>
    <button type="button" class="lay-menu__item" data-act="start" role="menuitem"${isStart ? ' disabled' : ''}>
      ${icon('i-home')} ${isStart ? 'เป็นหน้าเริ่มต้นอยู่แล้ว' : 'ตั้งเป็นหน้าเริ่มต้น'}
    </button>
    <span class="lay-menu__divider" aria-hidden="true"></span>
    <button type="button" class="lay-menu__item lay-menu__item--danger" data-act="drop" role="menuitem"${only ? ' disabled' : ''}>
      ${icon('i-trash')} ${only ? 'ต้องเหลืออย่างน้อยหนึ่งหน้า' : 'ลบหน้านี้'}
    </button>
  `;

  document.body.appendChild(menu);

  // กันเมนูล้นขอบจอ — วัดหลังใส่ใน DOM แล้วเท่านั้นจึงจะรู้ขนาดจริง
  const box = menu.getBoundingClientRect();
  menu.style.left = `${Math.min(x, window.innerWidth - box.width - 8)}px`;
  menu.style.top = `${Math.min(y, window.innerHeight - box.height - 8)}px`;

  menu.querySelector('[data-act="open"]').addEventListener('click', () => {
    closeScreenMenu();
    if (isBoard()) setView('edit');
    switchScreen(screen.id);
  });

  menu.querySelector('[data-act="rename"]').addEventListener('click', () => {
    closeScreenMenu();
    startScreenRename(screen.id);
  });

  menu.querySelector('[data-act="start"]').addEventListener('click', () => {
    closeScreenMenu();
    commit(setStartScreen(history.get(), screen.id));
    el.status.textContent = `ตั้ง ${screen.name} เป็นหน้าเริ่มต้นของการทดลองแล้ว`;
  });

  menu.querySelector('[data-act="drop"]').addEventListener('click', () => {
    closeScreenMenu();
    dropScreen(screen.id);
  });

  menu.querySelector('.lay-menu__item:not([disabled])')?.focus();
}

/**
 * ลบหน้า — ถามก่อนเฉพาะตอนที่มีของจะหายไปจริง
 * หน้าเปล่าไม่มีอะไรให้เสีย การถามทุกครั้งจะสอนให้ผู้ใช้กดยืนยันโดยไม่อ่าน
 */
function dropScreen(id) {
  const layout = history.get();
  const screen = screenById(layout, id);
  if (!screen) return;

  const count = screen.items.length;
  if (count > 0 && !window.confirm(`ลบ ${screen.name} พร้อมของ ${count} ชิ้นในหน้านี้`)) return;

  const next = removeScreen(layout, id);
  if (next === layout) return;

  commit(next);
  canvas.select(null);
  if (isBoard()) { board.render(); syncBoardSize(); }
  el.status.textContent = `ลบหน้า ${screen.name} แล้ว — ลิงก์ที่ชี้มาหน้านี้ถูกล้างให้ด้วย`;
}

/** เปลี่ยนชื่อที่ตัวแท็บเลย ไม่ต้องเด้งกล่องถาม — พิมพ์ตรงที่ชื่ออยู่คือที่ที่ผู้ใช้กำลังมองอยู่ */
function startScreenRename(id) {
  if (isBoard()) setView('edit');
  switchScreen(id);

  const tab = el.screens.querySelector(`[data-screen="${id}"] .lay-screen__name`);
  if (!tab) return;

  tab.contentEditable = 'true';
  tab.classList.add('is-editing');
  tab.focus();
  getSelection()?.selectAllChildren(tab);

  const finish = (save) => {
    tab.contentEditable = 'false';
    tab.classList.remove('is-editing');
    const value = tab.textContent.trim();
    if (save && value) {
      commit(renameScreen(history.get(), id, value));
      el.status.textContent = `เปลี่ยนชื่อหน้าเป็น ${value}`;
    } else {
      renderScreens();
    }
  };

  tab.addEventListener('blur', () => finish(true), { once: true });
  tab.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); tab.blur(); }
    if (event.key === 'Escape') { event.preventDefault(); finish(false); }
  });
}

function renderScreens() {
  const layout = history.get();

  el.screens.innerHTML = `
    ${layout.screens.map((screen) => `
      <button type="button"
              class="lay-screen${screen.id === layout.activeScreen ? ' is-active' : ''}"
              data-screen="${screen.id}"
              aria-current="${screen.id === layout.activeScreen ? 'page' : 'false'}">
        ${screen.id === layout.start ? icon('i-home', 'icon lay-screen__flag') : ''}
        <span class="lay-screen__name">${screen.name}</span>
        <span class="lay-screen__count">${screen.items.length}</span>
      </button>`).join('')}

    <button type="button" class="lay-screen lay-screen--add" id="lay-screen-add"
            title="เพิ่มหน้าจอใหม่">
      ${icon('i-plus')}
      เพิ่มหน้า
    </button>
  `;

  el.screens.querySelectorAll('[data-screen]').forEach((button) => {
    button.addEventListener('click', () => switchScreen(button.dataset.screen));
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      openScreenMenu(button.dataset.screen, event.clientX, event.clientY);
    });
    button.addEventListener('dblclick', () => startScreenRename(button.dataset.screen));
  });

  el.screens.querySelector('#lay-screen-add').addEventListener('click', () => {
    commit(addScreen(history.get()));
    canvas.select(null);
    el.status.textContent = 'เพิ่มหน้าจอใหม่แล้ว — วางของแล้วผูกปุ่มจากหน้าอื่นให้เข้ามาหน้านี้ได้';
  });
}

/**
 * สลับหน้าจอไม่ควรกินขั้นประวัติ ไม่งั้นกด Ctrl+Z หลังเดินดูหลายหน้า
 * จะได้แค่ย้อนการเดินดู ไม่ได้ย้อนการแก้ผังอย่างที่ตั้งใจ
 */
function switchScreen(id, addToHistory = false) {
  const layout = history.get();
  if (!screenById(layout, id) || layout.activeScreen === id) return;

  commit(setActiveScreen(layout, id), addToHistory);
  canvas.select(null);
  el.status.textContent = `เปิดหน้า ${screenById(history.get(), id).name}`;
}

/* --- โหมดทดลอง --- */

/**
 * ทดลองใช้ = เปิดหน้าจริงในหน้าต่างของตัวเอง
 *
 * ก่อนหน้านี้เป็นโหมดในหน้าเดียวกัน ผังยังนั่งอยู่ในกรอบที่มีแผงสองข้างกับแถบเครื่องมือล้อมอยู่
 * ซึ่งบอกไม่ได้จริงว่างานจะรู้สึกยังไงเมื่อเปิดเต็มจอ
 *
 * หน้าที่เปิดคือ **ไฟล์เดียวกับที่กดส่งออก** ไม่ใช่โหมดจำลอง สิ่งที่ทดสอบจึงเป็นของจริง
 * ทั้งการเดินข้ามหน้า หน้าต่างซ้อน และการกระทำที่ยังต้องรอหลังบ้าน
 */
/**
 * ใช้ iframe ไม่ใช่ window.open — หน้าต่างใหม่โดนบล็อกเป็น pop-up ได้ทุกเมื่อ
 * ขึ้นกับการตั้งค่าของแต่ละเครื่อง ปุ่มที่บางเครื่องกดแล้วไม่เกิดอะไรคือปุ่มที่พัง
 * iframe ให้ความแยกขาดเท่ากัน (CSS กับ JS ของผังไม่ปนกับหน้าเครื่องมือ) แต่เปิดได้แน่นอน
 */
async function openPreviewWindow() {
  closePreviewWindow();

  const shell = document.createElement('div');
  shell.className = 'lay-live';
  shell.id = 'lay-live';

  const bar = document.createElement('div');
  bar.className = 'lay-live__bar';
  bar.innerHTML = `
    <span class="lay-live__label">${icon('i-play')} กำลังทดลองใช้งานจริง</span>
    <span class="lay-live__hint">กด Esc เพื่อกลับไปแก้ผัง</span>
    <button type="button" class="lay-live__exit">${icon('i-x')} ปิด</button>`;
  bar.querySelector('.lay-live__exit').addEventListener('click', closePreviewWindow);

  const frame = document.createElement('iframe');
  frame.className = 'lay-live__frame';
  frame.title = 'หน้าทดลองใช้งาน';

  shell.append(bar, frame);
  document.body.appendChild(shell);

  // เต็มจอจริงถ้าเบราว์เซอร์ให้ ถ้าไม่ให้ก็ยังเต็มหน้าต่างอยู่ดี ไม่ใช่เงื่อนไขของการทำงาน
  shell.requestFullscreen?.().catch(() => { /* ผู้ใช้ปฏิเสธหรือเบราว์เซอร์ไม่รองรับ */ });

  const { layout, markupBySlug, markupByItem, catalogCss } = await exportBundle();
  const html = buildLayoutBundle(layout, markupBySlug, tokensCssBlock(), catalogCss, markupByItem);

  // ใช้ blob URL ไม่ใช่ srcdoc — srcdoc ทำให้หน้าอยู่ที่ about:srcdoc ซึ่งการเปลี่ยนหน้าด้วย hash
  // ไปสร้างประวัติบน URL ที่ไม่ใช่ของเราจริง ๆ ปุ่มย้อนกลับกับเครื่องมือตรวจจึงทำงานเพี้ยน
  // blob เป็น URL จริงที่อยู่ต้นทางเดียวกับหน้านี้ ทุกอย่างจึงทำตัวเหมือนเปิดไฟล์จริง
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  frame.src = previewUrl;

  el.status.textContent = 'กำลังทดลองใช้งานจริง — กด Esc เพื่อกลับมาแก้ผัง';
}

let previewUrl = null;

function closePreviewWindow() {
  const shell = document.querySelector('#lay-live');
  if (!shell) return;
  if (document.fullscreenElement === shell) document.exitFullscreen?.();
  shell.remove();

  if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
}

const isPreviewOpen = () => Boolean(document.querySelector('#lay-live'));

/* --------------------------------------------------------------------------
   ย่อ-ขยายผัง
   -------------------------------------------------------------------------- */

function setZoom(next, announce = true) {
  zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(next * 100) / 100));
  el.canvasWrap.style.setProperty('--zoom', zoom);
  el.canvasFrame.style.setProperty('--zoom', zoom);
  el.zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
  el.zoomIn.disabled = zoom >= ZOOM_MAX;
  el.zoomOut.disabled = zoom <= ZOOM_MIN;
  if (announce) el.status.textContent = `ย่อขยายผังเป็น ${Math.round(zoom * 100)}%`;
  el.boardwrap.style.setProperty('--zoom', zoom);
  el.board.style.setProperty('--zoom', zoom);
  if (isBoard()) board?.drawWires();
  renderInspector();
  renderHud();
}

/**
 * ย่อขยายโดยตรึงจุดใต้เคอร์เซอร์ไว้กับที่ — จุดที่กำลังมองจะไม่ไหลหนีไปไหน
 * เป็นพฤติกรรมเดียวกับเครื่องมือออกแบบทั่วไป ถ้าย่อจากกึ่งกลางเสมอ ผู้ใช้จะหลงตำแหน่งทันทีที่ผังใหญ่
 */
function zoomAtPoint(delta, clientX, clientY) {
  const before = zoom;
  const rect = el.canvas.getBoundingClientRect();
  const offsetX = clientX - rect.left;
  const offsetY = clientY - rect.top;

  setZoom(zoom + delta, false);
  if (zoom === before) return;

  const ratio = zoom / before;
  el.stage.scrollLeft += offsetX * (ratio - 1);
  el.stage.scrollTop += offsetY * (ratio - 1);
}

/**
 * พอดีจอ: ย่อให้ผังทั้งผืนอยู่ในพื้นที่ที่เห็น คิดทั้งความกว้างและความสูง
 * ไม่ขยายเกิน 100% เพราะการดูผังใหญ่กว่าขนาดจริงทำให้ตัดสินสัดส่วนผิด
 */
function zoomToFit() {
  if (isBoard()) { zoomToFitBoard(); return; }

  const layout = history.get();
  const rows = summarizeLayout(layout).rows || GRID.minRows;
  const neededH = rows * layout.rowHeight + (rows + 1) * layout.gap;
  const fixed = Boolean(layout.width && layout.width !== 'auto');

  const fitH = (el.stage.clientHeight - 96) / neededH;
  // โหมดเต็มพื้นที่กว้างเท่าพื้นที่อยู่แล้ว ไม่ต้องย่อตามความกว้าง
  const fitW = fixed ? (el.stage.clientWidth - 48) / layout.width : 1;

  // ปัดลงเสมอ ปัดขึ้นแม้เศษเดียวก็ทำให้ผังล้นขอบจนมีแถบเลื่อนแนวนอนโผล่
  setZoom(Math.floor(Math.min(1, fitH, fitW) * 100) / 100);
}

/** พอดีบอร์ด: ย่อให้เห็นทุกกรอบพร้อมกัน เพราะประโยชน์ของมุมมองนี้คือการเห็นทั้งงานทีเดียว */
function zoomToFitBoard() {
  const width = parseFloat(el.board.style.width) || 0;
  const height = parseFloat(el.board.style.height) || 0;
  if (!width || !height) return;

  const fitW = (el.stage.clientWidth - 48) / width;
  const fitH = (el.stage.clientHeight - 96) / height;
  setZoom(Math.floor(Math.min(1, fitW, fitH) * 100) / 100, false);
  syncBoardSize();
  el.stage.scrollTo(0, 0);
}

function updateHistoryButtons() {
  el.undo.disabled = !history.canUndo();
  el.redo.disabled = !history.canRedo();
}

async function exportBundle() {
  const layout = history.get();
  const markupBySlug = {};

  await Promise.all([...new Set(allItems(layout).map((item) => item.slug))].map(async (slug) => {
    const markup = await markupOf(slug);
    markupBySlug[slug] = markup.preview;
  }));

  const catalogCss = await loadCatalogCss();
  const markupByItem = {};
  allItems(layout).forEach((item) => {
    const overridden = markupWithOverrides(item, markupBySlug[item.slug]);
    if (overridden) markupByItem[item.id] = overridden;
  });

  return { layout, markupBySlug, markupByItem, catalogCss };
}

/**
 * markup ของชิ้นเดียวหลังใส่สิ่งที่ผู้ใช้แก้รายส่วน — ของที่ส่งออกต้องเหมือนที่เห็นบนผัง
 *
 * ทำที่นี่แทนใน layout-export.js เพราะการแก้ต้องเดินโครงสร้าง HTML จริง
 * (เปลี่ยนเฉพาะข้อความโดยไม่ทับไอคอน) ส่วนตัว export เองยังเป็นฟังก์ชันบริสุทธิ์ที่ต่อสตริงอย่างเดียว
 */
function markupWithOverrides(item, raw) {
  const meta = bySlug(item.slug);
  const variants = meta?.matrix?.variants ?? [];
  const usesVariant = item.variant > 0 && variants[item.variant];

  // รูปแบบที่ผู้ใช้เลือกไว้ต้องออกไปกับไฟล์ด้วย ไม่งั้นผังแสดงปุ่มสีจาง
  // แต่ไฟล์ที่ได้เป็นปุ่มสีทึบ ซึ่งเป็นคนละหน้าตากับที่ตกลงกันไว้
  const source = usesVariant ? renderVariant(meta, item.variant) : raw;
  if (!source) return null;

  const edited = item.parts && Object.keys(item.parts).length > 0;
  if (!usesVariant && !edited) return null;

  const holder = document.createElement('div');
  holder.innerHTML = source;
  applyPartOverrides(item, holder);
  return holder.innerHTML;
}

async function openExport() {
  const { layout, markupBySlug, markupByItem, catalogCss } = await exportBundle();
  const tokens = tokensCssBlock();

  el.exportBody.replaceChildren();

  const flowJs = buildLayoutJs(layout);

  const block = createCodeBlock([
    { id: 'html', label: 'HTML', getText: () => buildLayoutHtml(layout, markupBySlug, markupByItem) },
    { id: 'css', label: 'CSS', getText: () => buildLayoutCss(layout) },
    ...(flowJs ? [{ id: 'js', label: 'JS', getText: () => flowJs }] : []),
    { id: 'tokens', label: 'Tokens', getText: () => tokens },
  ], {
    copyAllLabel: 'คัดลอกทั้งไฟล์',
    getCopyAllText: () => buildLayoutBundle(layout, markupBySlug, tokens, catalogCss, markupByItem),
  });

  // ของที่ซ่อนไว้ไม่ออกไปกับไฟล์ ต้องบอกตรงนี้ ไม่งั้นเปิดไฟล์ที่ได้แล้วงงว่าทำไมของหาย
  const { hidden } = summarizeLayout(layout);
  if (hidden > 0) {
    const note = document.createElement('p');
    note.className = 'lay-export__note';
    note.innerHTML = `${icon('i-alert-triangle')}<span>มีของถูกซ่อนไว้ ${hidden} ชิ้น จะไม่ออกไปกับไฟล์นี้ — เปิดกลับได้ที่แท็บเลเยอร์</span>`;
    el.exportBody.appendChild(note);
  }

  el.exportBody.appendChild(block.element);
  el.exportModal.hidden = false;
  el.exportModal.querySelector('[data-close]')?.focus();
}

/* --------------------------------------------------------------------------
   init
   -------------------------------------------------------------------------- */

async function init() {
  await loadIconSprite();
  initThemeToggle();
  // ต้องหลัง loadIconSprite() เพราะแท็บอ้างไอคอนจาก sprite ด้วย <use href="#i-...">
  initMobileTabbar();
  initGuideModal();

  el.shell = document.querySelector('.lay');
  el.canvas = document.querySelector('#lay-canvas');
  el.canvasWrap = document.querySelector('#lay-canvas-wrap');
  el.canvasFrame = document.querySelector('#lay-canvas-frame');
  el.stage = document.querySelector('#lay-stage');
  el.palette = document.querySelector('#lay-library');
  el.inspector = document.querySelector('#lay-inspector');
  el.summary = document.querySelector('#lay-summary');
  el.status = document.querySelector('#lay-status');
  el.undo = document.querySelector('#lay-undo');
  el.redo = document.querySelector('#lay-redo');
  el.zoomIn = document.querySelector('#lay-zoom-in');
  el.zoomOut = document.querySelector('#lay-zoom-out');
  el.zoomLevel = document.querySelector('#lay-zoom-level');
  el.zoomFit = document.querySelector('#lay-zoom-fit');
  el.exportModal = document.querySelector('#lay-export-modal');
  el.exportBody = document.querySelector('#lay-export-body');
  el.shortcuts = document.querySelector('#lay-shortcuts');
  el.screens = document.querySelector('#lay-screens');
  el.play = document.querySelector('#lay-play');
  el.boardwrap = document.querySelector('#lay-boardwrap');
  el.board = document.querySelector('#lay-board');
  el.hud = document.querySelector('#lay-hud');
  el.quick = document.querySelector('#lay-quick');
  el.quickInput = document.querySelector('#lay-quick-input');
  el.quickList = document.querySelector('#lay-quick-list');
  el.librarySearch = document.querySelector('#lay-library-search');
  el.palettePill = document.querySelector('#lay-palette-pill');
  el.paletteModal = document.querySelector('#lay-palette-modal');
  el.paletteList = document.querySelector('#lay-palette-list');
  el.paletteEmpty = document.querySelector('#lay-palette-empty');
  renderPaletteList = createSavedPaletteList({
    list: el.paletteList,
    empty: el.paletteEmpty,
    store,
    confirm: askConfirm,
    onPick: (palette, entry) => {
      store.applyPalette(palette);
      // ปิดให้เลย ผู้ใช้เลือกชุดสีเพื่อดูผลบนผัง ไม่ใช่เพื่ออยู่ในหน้าต่างเลือกต่อ
      closePaletteModal();
      el.status.textContent = `เปลี่ยนเป็นชุดสี ${entry.name} — ทุกชิ้นบนผังเปลี่ยนตามแล้ว`;
    },
    onStatus: (message) => { el.status.textContent = message; },
  });
  el.themeBtns = [...document.querySelectorAll('[data-lay-theme]')];
  el.arrange = document.querySelector('#lay-arrange');
  el.flowModal = document.querySelector('#lay-flow-modal');
  el.flowBody = document.querySelector('#lay-flow-body');
  el.libTabs = [...document.querySelectorAll('[data-libtab]')];
  el.libPanes = [...document.querySelectorAll('.lay-lib__pane')];
  el.layerList = document.querySelector('#lay-layers');
  el.layerSearch = document.querySelector('#lay-layers-search');
  el.layerNote = document.querySelector('#lay-layer-note');
  el.layerUp = document.querySelector('#lay-layer-up');
  el.layerDown = document.querySelector('#lay-layer-down');
  el.layerGroup = document.querySelector('#lay-layer-group');
  el.layerUngroup = document.querySelector('#lay-layer-ungroup');
  el.layerSort = document.querySelector('#lay-layer-sort');

  refreshTokens();
  applyTokens(el.canvas);

  canvas = createLayoutCanvas({
    root: el.canvas,
    viewport: el.stage,
    getLayout: () => history.get(),
    getZoom: () => zoom,
    onPan: (event) => {
      if (event.type === 'zoom') zoomAtPoint(event.delta < 0 ? ZOOM_STEP : -ZOOM_STEP, event.x, event.y);
    },
    isPreview: () => false,
    onSelect: () => { renderInspector(); renderHud(); renderLayers(); },
    onLockedHit: () => {
      el.status.textContent = 'ชิ้นนี้ถูกล็อกไว้ — ปลดล็อกได้ที่แท็บเลเยอร์ หรือ Ctrl+Shift+L';
    },
    onDrop: (slug, position) => place(slug, position),
    onCanvasPoint: (point) => {
      dropPoint = point;
      el.status.textContent = `เลือกจุดวางไว้ที่คอลัมน์ ${point.col} แถว ${point.row} — กดของจากคลังเพื่อวางตรงนี้`;
    },
    renderItem: (item, stage) => { renderItemContent(item, stage); },
    onChange: (id, patch, addToHistory) => {
      const next = Object.keys(patch).length === 0
        ? moveItemToEnd(history.get(), id)
        : updateItem(history.get(), id, patch);
      commit(next, addToHistory);
    },
    // ลากหลายชิ้นพร้อมกันต้องลงเป็นขั้นเดียวของ undo ไม่ใช่ขั้นละชิ้น
    onChangeMany: (patches, addToHistory) => {
      let next = history.get();
      Object.entries(patches).forEach(([id, patch]) => { next = updateItem(next, id, patch); });
      commit(next, addToHistory);
    },
  });

  // เมนูคลิกขวาต้องหายทันทีที่ผู้ใช้ไปทำอย่างอื่น ไม่ใช่ค้างจนกว่าจะเลือกสักคำสั่ง
  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest?.('#lay-screen-menu')) closeScreenMenu();
  }, true);

  window.addEventListener('blur', closeScreenMenu);
  el.stage.addEventListener('scroll', closeScreenMenu, { passive: true });

  board = createLayoutBoard({
    root: el.board,
    viewport: el.stage,
    getLayout: () => history.get(),
    getZoom: () => zoom,
    renderScreen: renderScreenPreview,
    onOpen: (id) => { switchScreen(id); setView('edit'); },
    onSelectScreen: (id) => switchScreen(id),
    onMove: afterBoardMove,
    onPlay: () => openPreviewWindow(),
    onScreenMenu: (id, x, y) => openScreenMenu(id, x, y),
  });

  layers = createLayerPanel({
    root: el.layerList,
    search: el.layerSearch,
    getLayout: () => history.get(),
    getSelectedIds: () => selectedIds(),
    labelOf: layerLabel,
    iconOf: (item) => LAYER_ICON[item.slug] ?? 'i-layout',
    onSelect: (ids) => {
      canvas.selectMany(ids);
      renderInspector();
      renderHud();
      renderLayers();
    },
    onPeek: (id) => canvas.peek(id),
    onReorder: (order) => {
      commit(setItemOrder(history.get(), order));
      el.status.textContent = 'จัดลำดับเลเยอร์ใหม่แล้ว — ลำดับนี้คือลำดับของไฟล์ที่ส่งออก';
    },
    onRenameItem: (id, name) => commit(renameItem(history.get(), id, name)),
    onItemFlags: (ids, patch) => commit(setItemFlags(history.get(), ids, patch)),
    onGroupPatch: (groupId, patch) => commit(updateGroup(history.get(), groupId, patch)),
  });

  el.libTabs.forEach((btn) => {
    btn.addEventListener('click', () => setLibTab(btn.dataset.libtab));
  });

  el.layerUp.addEventListener('click', () => moveLayer(1));
  el.layerDown.addEventListener('click', () => moveLayer(-1));
  el.layerGroup.addEventListener('click', groupSelected);
  el.layerUngroup.addEventListener('click', ungroupSelected);
  el.layerSort.addEventListener('click', () => {
    commit(sortItemsByPosition(history.get()));
    el.status.textContent = 'เรียงลำดับเนื้อหาตามตำแหน่งบนผังแล้ว — ไฟล์ที่ส่งออกจะกด Tab ไล่ตามสายตา';
  });

  await Promise.all(COMPONENTS.map((meta) => markupOf(meta.slug)));
  await renderPalette();

  canvas.render();
  renderInspector();
  renderSummary();
  renderScreens();
  renderLayers();
  updateHistoryButtons();


  // ดับเบิลคลิกที่ว่างบนผัง = เพิ่มของตรงนั้นด้วยการพิมพ์ชื่อ
  el.canvas.addEventListener('dblclick', (event) => {
    if (event.target.closest('.lay-item')) return;
    openQuickAdd(dropPoint);
  });

  el.quickInput.addEventListener('input', () => renderQuickList(el.quickInput.value));

  el.quickInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); closeQuickAdd(); return; }
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const first = el.quickList.querySelector('[data-slug]');
    if (first) { place(first.dataset.slug); closeQuickAdd(); }
  });

  el.librarySearch.addEventListener('input', () => {
    libraryFilter = el.librarySearch.value;
    renderPalette();
  });

  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.view));
  });

  // แถบลอยต้องเกาะติดของตอนเลื่อนดูผัง ไม่ใช่ค้างอยู่กับที่
  el.stage.addEventListener('scroll', () => {
    if (el.hud.hidden) return;
    const box = el.canvas.querySelector('.lay-item.is-selected');
    if (box) positionHud(box);
  }, { passive: true });
  el.play.addEventListener('click', () => openPreviewWindow());

  el.undo.addEventListener('click', () => { history.undo(); afterHistory(); });
  el.redo.addEventListener('click', () => { history.redo(); afterHistory(); });

  el.zoomIn.addEventListener('click', () => setZoom(zoom + ZOOM_STEP));
  el.zoomOut.addEventListener('click', () => setZoom(zoom - ZOOM_STEP));
  el.zoomLevel.addEventListener('click', () => setZoom(1));
  el.zoomFit.addEventListener('click', zoomToFit);

  // พับแผงสองข้างเพื่อคืนพื้นที่ให้แคนวาส
  document.querySelectorAll('[data-panel]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.panel;
      const closed = el.shell.dataset[key] === 'closed';
      el.shell.dataset[key] = closed ? 'open' : 'closed';
      button.setAttribute('aria-expanded', String(closed));
      renderInspector();
    });
  });

  applyCanvasWidth();
  setZoom(1, false);
  setView(history.get().view === 'board' ? 'board' : 'edit');

  document.querySelector('#lay-clear').addEventListener('click', () => {
    const layout = history.get();
    const current = activeScreen(layout);
    commit({
      ...layout,
      screens: layout.screens.map((screen) => (
        screen.id === current.id ? { ...screen, items: [] } : screen
      )),
    });
    canvas.select(null);
    el.status.textContent = `ล้างของบนหน้า ${current.name} แล้ว — หน้าอื่นยังอยู่ครบ`;
  });

  el.hand = document.querySelector('#lay-hand');
  el.hand.addEventListener('click', () => toggleHand());

  document.querySelector('#lay-keys').addEventListener('click', () => {
    el.shortcuts.hidden = !el.shortcuts.hidden;
  });

  el.shortcuts.querySelector('[data-close-keys]').addEventListener('click', () => {
    el.shortcuts.hidden = true;
  });

  document.querySelector('#lay-flow').addEventListener('click', openFlowView);

  el.arrange.addEventListener('click', () => {
    commit(arrangeBoard(history.get()));
    syncBoardSize();
    el.status.textContent = 'จัดเรียงหน้าบนบอร์ดใหม่แล้ว — กด Ctrl+Z ถ้าอยากได้ตำแหน่งเดิมคืน';
  });

  el.flowModal.querySelectorAll('[data-close]').forEach((node) => {
    node.addEventListener('click', () => { el.flowModal.hidden = true; });
  });

  el.palettePill.addEventListener('click', openPaletteModal);

  el.paletteModal.querySelectorAll('[data-close]').forEach((node) => {
    node.addEventListener('click', closePaletteModal);
  });

  el.themeBtns.forEach((button) => {
    button.addEventListener('click', () => store.setTheme(button.dataset.layTheme));
  });

  document.querySelector('#lay-export').addEventListener('click', openExport);
  el.exportModal.querySelectorAll('[data-close]').forEach((node) => {
    node.addEventListener('click', () => { el.exportModal.hidden = true; });
  });

  document.addEventListener('keydown', onShortcut);

  store.subscribe(() => {
    refreshTokens();
    applyTokens(el.canvas);
    el.canvas.querySelectorAll('.lay-item__stage').forEach(applyTokens);
    el.board.querySelectorAll('.lay-frame__grid').forEach(applyTokens);
    renderSwatches();
  });

  window.addEventListener('resize', () => renderInspector());
  initOrbitDock(document.querySelector('.lay-main'));
}

/* --------------------------------------------------------------------------
   คีย์ลัดระดับหน้า — ชุดเดียวกับที่เครื่องมือออกแบบใช้กัน
   -------------------------------------------------------------------------- */

/** สลับโหมดมือ — ปุ่มในแถบกับคีย์ H ใช้ทางเดียวกัน สถานะจึงตรงกันเสมอ */
function toggleHand(force) {
  const on = canvas.toggleHand(force);
  el.hand.classList.toggle('is-active', on);
  el.hand.setAttribute('aria-pressed', String(on));
  el.status.textContent = on
    ? 'โหมดมือ — ลากเพื่อเลื่อนดูผัง กด H หรือ Esc เพื่อกลับไปเลือกของ'
    : 'กลับสู่โหมดเลือก — กด Space ค้างเพื่อเลื่อนชั่วคราวได้ตลอด';
  return on;
}

function selectedItem() {
  const id = canvas?.getSelected();
  return itemsOf(history.get()).find((entry) => entry.id === id) ?? null;
}

/** เลือกชิ้นถัดไป/ก่อนหน้าตามลำดับที่วาง — ใช้เดินดูทั้งผังโดยไม่ต้องเล็งเมาส์ */
function cycleSelection(step) {
  const screen = activeScreen(history.get());
  // ของที่ซ่อนไม่มีตัวตนบนผัง กด Tab ไปหยุดที่มันคือหยุดที่ของที่มองไม่เห็น
  const items = itemsOf(history.get()).filter((item) => !layerState(screen, item).hidden);
  if (items.length === 0) return;

  const current = items.findIndex((entry) => entry.id === canvas.getSelected());
  const next = items[(current + step + items.length) % items.length] ?? items[0];
  canvas.select(next.id);
  canvas.focusItem(next.id);
}

function duplicateSelected() {
  const item = selectedItem();
  if (!item) return;

  commit(addItem(history.get(), item.slug, {
    col: item.col, row: item.row + item.h, w: item.w, h: item.h,
  }));
  const items = itemsOf(history.get());
  const copy = items[items.length - 1];
  commit(updateItem(history.get(), copy.id, { variant: item.variant }), false);
  canvas.select(copy.id);
  el.status.textContent = 'ทำสำเนาชิ้นที่เลือกไว้ใต้ของเดิม';
}

function onShortcut(event) {
  // event.target เป็น document ได้เมื่ออีเวนต์ไม่ได้มาจาก element ใด จึงต้องกันก่อนเรียก matches
  const target = event.target;
  const typing = target instanceof Element && target.matches('input, textarea, select');
  const mod = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();

  if (event.key === 'Escape') {
    closeScreenMenu();
    // หน้าทดลองครอบทุกอย่างอยู่ ปิดมันก่อนเป็นอย่างแรก
    if (isPreviewOpen()) { event.preventDefault(); closePreviewWindow(); return; }
    el.exportModal.hidden = true;
    el.flowModal.hidden = true;
    el.shortcuts.hidden = true;
    closeQuickAdd();
    if (canvas?.isHandMode()) toggleHand(false);
    canvas?.select(null);
    return;
  }

  if (typing) return;

  if (key === 'p' && !mod) { event.preventDefault(); openPreviewWindow(); return; }
  if (key === 'b' && !mod) { event.preventDefault(); setView(isBoard() ? 'edit' : 'board'); return; }
  if (key === 'f' && !mod) { event.preventDefault(); openFlowView(); return; }
  if (key === '/' && !mod && !isBoard()) { event.preventDefault(); openQuickAdd(); return; }

  // ระหว่างทดลอง คีย์แก้ผังทั้งชุดต้องเงียบ ไม่งั้นกด Delete แล้วของหายทั้งที่กำลังดูอยู่

  if (mod && key === 'z') {
    event.preventDefault();
    if (event.shiftKey) history.redo(); else history.undo();
    afterHistory();
    return;
  }

  if (mod && key === 'd') { event.preventDefault(); duplicateSelected(); return; }

  // จัดชั้น: วงเล็บเหลี่ยมคือคู่ที่เครื่องมือออกแบบใช้ตรงกัน · เติม Shift = ไปสุดทาง
  if (mod && (key === ']' || key === '[')) {
    event.preventDefault();
    const up = key === ']';
    if (event.shiftKey) moveLayer(0, up ? 'front' : 'back');
    else moveLayer(up ? 1 : -1);
    return;
  }

  if (mod && key === 'g') {
    event.preventDefault();
    if (event.shiftKey) ungroupSelected(); else groupSelected();
    return;
  }

  if (mod && event.shiftKey && key === 'h') { event.preventDefault(); toggleFlag('hidden'); return; }
  if (mod && event.shiftKey && key === 'l') { event.preventDefault(); toggleFlag('locked'); return; }

  if (mod && key === 'a' && !isBoard()) {
    event.preventDefault();
    const screen = activeScreen(history.get());
    // ของที่ล็อกไว้ต้องไม่ติดมากับการเลือกทั้งหมด ไม่งั้นกด Delete ทีเดียวลบของที่ตั้งใจกันไว้
    const ids = itemsOf(history.get())
      .filter((item) => !layerState(screen, item).locked)
      .map((item) => item.id);
    canvas.selectMany(ids);
    renderInspector();
    renderHud();
    renderLayers();
    el.status.textContent = `เลือกแล้ว ${ids.length} ชิ้น`;
    return;
  }
  if (mod && key === '0') { event.preventDefault(); setZoom(1); return; }
  if (mod && key === '1') { event.preventDefault(); zoomToFit(); return; }
  if (mod && (key === '=' || key === '+')) { event.preventDefault(); setZoom(zoom + ZOOM_STEP); return; }
  if (mod && key === '-') { event.preventDefault(); setZoom(zoom - ZOOM_STEP); return; }

  if (event.key === 'Delete' || event.key === 'Backspace') {
    const ids = selectedIds();
    if (ids.length === 0) return;
    event.preventDefault();

    let next = history.get();
    ids.forEach((id) => { next = removeItem(next, id); });
    commit(next);
    canvas.select(null);
    el.status.textContent = ids.length > 1
      ? `ลบ ${ids.length} ชิ้นแล้ว — กด Ctrl+Z เพื่อเอากลับ`
      : 'ลบชิ้นที่เลือกแล้ว — กด Ctrl+Z เพื่อเอากลับ';
    return;
  }

  if (event.key === 'Tab' && itemsOf(history.get()).length > 0) {
    event.preventDefault();
    cycleSelection(event.shiftKey ? -1 : 1);
    return;
  }

  if (key === 'h') { event.preventDefault(); toggleHand(); return; }

  if (event.key === '?' || (event.shiftKey && key === '/')) {
    event.preventDefault();
    el.shortcuts.hidden = !el.shortcuts.hidden;
  }
}

function afterHistory() {
  writeLayout(history.get());
  if (isBoard()) { board.render(); syncBoardSize(); } else { canvas.render(); }
  renderInspector();
  renderSummary();
  renderScreens();
  renderHud();
  renderLayers();
  updateHistoryButtons();
}

/**
 * เม็ดสีมีเท่าที่ชุดนั้นกำหนดจริง ไม่ใช่จำนวนตายตัว
 * สีสถานะ (success/warning/danger) ติดมากับ palette เสมอ ไม่ได้มาจากชุดที่ผู้ใช้เลือก
 */
function swatchesOf(palette) {
  return [
    { hex: palette.primary, label: 'สีแบรนด์' },
    ...palette.accents.map((hex, index) => ({ hex, label: `Accent ${index + 1}` })),
  ];
}

function renderSwatches() {
  const host = document.querySelector('#lay-swatches');
  if (!host) return;
  host.innerHTML = swatchesOf(store.getPalette())
    .map(({ hex, label }) => `<span class="cs-swatch" style="background:${hex}" title="${label} ${hex}"></span>`)
    .join('');

  el.themeBtns?.forEach((button) => {
    const active = button.dataset.layTheme === store.getTheme();
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  if (el.paletteModal && !el.paletteModal.hidden) renderPaletteList();
}

/* --------------------------------------------------------------------------
   เลือกชุดสีจากคลังที่บันทึกไว้ใน Colorground
   -------------------------------------------------------------------------- */

// ตัวจริงถูกสร้างตอน init โดย createSavedPaletteList — ก่อนหน้านั้นไม่มีอะไรให้วาด
let renderPaletteList = () => {};

function onPaletteKeydown(event) {
  if (event.key === 'Escape') closePaletteModal();
}

function openPaletteModal() {
  renderPaletteList();
  el.paletteModal.hidden = false;
  el.paletteModal.querySelector('[data-close]')?.focus();
  document.addEventListener('keydown', onPaletteKeydown);
}

function closePaletteModal() {
  el.paletteModal.hidden = true;
  document.removeEventListener('keydown', onPaletteKeydown);
  el.palettePill.focus();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
