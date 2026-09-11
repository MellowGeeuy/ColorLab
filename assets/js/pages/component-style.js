/**
 * component-style.js — หน้า Component Style
 *
 * แคตตาล็อกการ์ดสามคอลัมน์ กดเข้าไปเป็นหน้าเนื้อหาของ component ตัวนั้น
 * สีทั้งหมดมาจาก palette ที่ผู้ใช้ตั้งไว้ใน Colorground ผ่าน palette-store ตัวเดียวกัน
 */

import { loadIconSprite } from '../modules/icon-sprite.js';
import { initThemeToggle } from '../modules/theme-toggle.js';
import { initOrbitDock } from '../modules/orbit-dock.js';
import { createPaletteStore } from '../modules/palette-store.js';
import { readLibrary } from '../utils/palette-library-store.js';
import { buildPaletteTokens } from '../utils/palette-tokens.js';
import {
  COMPONENTS, GROUPS, bySlug, loadMarkup, loadComponentCss, collectColorTokens,
} from '../modules/component-catalog.js';
import { createCodeBlock } from '../modules/code-block.js';
import { renderStateMatrix } from '../modules/state-matrix.js';

const store = createPaletteStore();

let tokens = {};
let publicTokens = {};
let codeMode = 'vars';
let currentSlug = '';
let currentBlock = null;

const el = {};

/** component ที่แต่ละรูปแบบกว้างไม่ถึงครึ่งจอ วางเรียงข้างกันได้ ที่เหลือกินเต็มแถว */
const INLINE_VARIANTS = new Set(['button', 'badge', 'field', 'skeleton', 'pagination', 'toolbar']);

const icon = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

/** ชื่อภายในของหน้า (--pv-) กับชื่อที่ผู้ใช้จะได้ไปใช้ (--color-) ต้องแปลงที่เดียวเท่านั้น */
const toPublic = (name) => name.replace('--pv-', '--color-');

function refreshTokens() {
  const { tokens: built } = buildPaletteTokens(store.getPalette(), store.getTheme());
  tokens = built;
  publicTokens = {};
  Object.entries(built).forEach(([name, value]) => {
    if (name === '--pv-accent-count') return;
    publicTokens[toPublic(name)] = value;
  });
  // สเกลของสีแบรนด์ไม่มี hover สำเร็จรูปฝั่ง danger — คำนวณจากสเกลเดียวกันเพื่อให้ปุ่มอันตรายมีสถานะชี้
  if (!publicTokens['--color-danger-hover']) {
    publicTokens['--color-danger-hover'] = built['--pv-danger-hover'] ?? built['--pv-danger'];
  }
}

/** เขียน token ลงเฉพาะกล่องพรีวิว ไม่ใช่ :root — ไม่งั้น UI ของเครื่องมือจะเปลี่ยนสีตาม palette ไปด้วย */
function applyPreviewTokens(scope) {
  Object.entries(publicTokens).forEach(([name, value]) => scope.style.setProperty(name, value));
  // ชื่อ data-theme-mode ไม่ใช่ data-preview-theme เพราะชื่อหลังเป็นของปุ่มสลับธีม
  // ถ้าใช้ชื่อเดียวกัน selector ของปุ่มจะจับกล่องพรีวิวติดมาด้วยทุกกล่อง
  scope.dataset.themeMode = store.getTheme();
}

/* ส่วนตรวจคอนทราสต์ถูกถอดออกชั่วคราวตามที่ G สั่ง (2026-09-09) จะกลับมาทำทีหลัง
   metadata `audit` ของแต่ละ component ยังอยู่ใน component-catalog.js ไม่ได้ลบทิ้ง */

/* --------------------------------------------------------------------------
   หน้าแคตตาล็อก
   -------------------------------------------------------------------------- */

async function renderCatalog() {
  el.detail.hidden = true;
  el.catalogView.hidden = false;
  document.title = 'Component Style — ColorLab';

  if (el.catalog.dataset.ready === 'true') {
    refreshCatalogState();
    return;
  }

  const groups = GROUPS.map((group) => {
    const items = COMPONENTS.filter((item) => item.group === group.id);
    if (items.length === 0) return '';
    // หมวดเปิดมาหุบไว้ทั้งหมด ผู้ใช้กางเฉพาะหมวดที่กำลังหา — details จัดการคีย์บอร์ดให้เอง
    return `
      <details class="cs-group">
        <summary class="cs-group__title">
          <span class="cs-group__name">${group.label}</span>
          <span class="cs-group__count">${items.length} ตัว</span>
          <svg class="icon cs-group__chevron" aria-hidden="true"><use href="#i-chevron-down"/></svg>
        </summary>
        <div class="cs-grid">
          ${items.map((item) => `
            <a class="cs-card" href="#${item.slug}" data-slug="${item.slug}">
              <span class="cs-card__stage" data-preview-scope>
                <span class="cs-card__stage-inner" data-slot="preview"></span>
              </span>
              <span class="cs-card__body">
                <span class="cs-card__title">${item.name}</span>
                <span class="cs-card__text">${item.summary}</span>
                <span class="cs-card__foot">
                  <span class="cs-card__tags">${item.matrix.variants.length} รูปแบบ · ${item.anatomy.length} ส่วนประกอบ</span>
                  <span class="cs-card__go">ดูรายละเอียด ${icon('i-chevron-right')}</span>
                </span>
              </span>
            </a>`).join('')}
        </div>
      </details>`;
  }).join('');

  el.catalog.innerHTML = groups;

  await Promise.all(COMPONENTS.map(async (meta) => {
    const card = el.catalog.querySelector(`[data-slug="${meta.slug}"]`);
    const { card: cardMarkup } = await loadMarkup(meta.slug);
    card.querySelector('[data-slot="preview"]').innerHTML = cardMarkup;
    // พรีวิวในการ์ดเป็นภาพ ไม่ใช่ของที่กดได้ ลิงก์ของการ์ดเป็นตัวรับการกดแทน
    card.querySelectorAll('button, input, select, a').forEach((node) => {
      node.tabIndex = -1;
      node.setAttribute('aria-hidden', 'true');
    });
  }));

  el.catalog.dataset.ready = 'true';
  refreshCatalogState();
}

function refreshCatalogState() {
  el.catalog.querySelectorAll('[data-preview-scope]').forEach(applyPreviewTokens);
}

/* --------------------------------------------------------------------------
   หน้าเนื้อหาของ component
   -------------------------------------------------------------------------- */

function tokenBlock(names, theme) {
  const source = theme === store.getTheme()
    ? publicTokens
    : Object.fromEntries(
      Object.entries(buildPaletteTokens(store.getPalette(), theme).tokens)
        .filter(([name]) => name !== '--pv-accent-count')
        .map(([name, value]) => [toPublic(name), value]),
    );

  return names
    .filter((name) => source[name])
    .map((name) => `  ${name}: ${source[name]};`)
    .join('\n');
}

/**
 * แทน var(--color-…) ด้วยค่าสีจริง
 *
 * ต้องวนซ้ำเพราะบาง rule เขียน fallback ซ้อนกัน เช่น var(--color-accent-4-soft, var(--color-info-soft))
 * รอบแรกแทนตัวในสุดได้ รอบถัดไปจึงจะแทนตัวนอกได้ และถ้า token ไม่มีค่าจริง
 * (เช่น accent ตัวที่ 4 เมื่อชุดสีมี accent แค่สามสี) ให้ตกไปใช้ fallback ที่เขียนไว้แทน
 */
function flatten(css) {
  const pattern = /var\(\s*(--color-[a-z0-9-]+)\s*(?:,\s*([^()]*))?\)/gi;
  let out = css;

  for (let pass = 0; pass < 4; pass += 1) {
    const next = out.replace(pattern, (match, name, fallback) => {
      if (publicTokens[name]) return publicTokens[name];
      return fallback ? fallback.trim() : match;
    });
    if (next === out) break;
    out = next;
  }

  return out;
}

async function renderDetail(slug) {
  const meta = bySlug(slug);
  if (!meta) {
    window.location.hash = '';
    return;
  }

  el.catalogView.hidden = true;
  el.detail.hidden = false;
  currentSlug = meta.slug;
  document.title = `${meta.name} — Component Style`;

  const [{ preview, variants }, css] = await Promise.all([
    loadMarkup(meta.slug),
    loadComponentCss(meta.slug),
  ]);

  el.detail.innerHTML = `
    <a class="cs-back" href="#">${icon('i-arrow-left')} กลับไปที่แคตตาล็อก</a>

    <header class="cs-detail__head">
      <h1 class="cs-detail__title">${meta.name}</h1>
      <p class="cs-detail__summary">${meta.summary}</p>
    </header>

    <div class="cs-usage">
      <div class="card">
        <h3 class="card__title">${icon('i-check-circle')} ใช้เมื่อ</h3>
        <ul class="cs-bullets">${meta.useWhen.map((line) => `<li>${line}</li>`).join('')}</ul>
      </div>
      <div class="card">
        <h3 class="card__title">${icon('i-ban')} เลี่ยงเมื่อ</h3>
        <ul class="cs-bullets">${meta.avoidWhen.map((line) => `<li>${line}</li>`).join('')}</ul>
      </div>
    </div>

    <div class="cs-section">
      <h3 class="cs-section__title">ตัวอย่างการใช้งาน</h3>
      <div class="cs-stage" data-preview-scope data-slot="preview"></div>
    </div>

    <div class="cs-section">
      <h3 class="cs-section__title">ส่วนประกอบและ token ที่แต่ละส่วนใช้</h3>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>ส่วนประกอบ</th><th>Token</th><th>เหตุผล</th></tr></thead>
          <tbody>
            ${meta.anatomy.map((row) => `
              <tr>
                <td>${row.part}</td>
                <td><code class="u-mono">${row.token}</code></td>
                <td class="u-muted">${row.note}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="cs-section">
      <h3 class="cs-section__title">รูปแบบทั้งหมด</h3>
      <div class="cs-variants${INLINE_VARIANTS.has(meta.slug) ? ' cs-variants--inline' : ''}" data-preview-scope data-slot="variants"></div>
    </div>

    <div class="cs-section">
      <h3 class="cs-section__title">ทุกสถานะ</h3>
      <p class="cs-section__hint">
        ตารางนี้วาดสถานะจริงทุกช่องพร้อมกัน จึงตรวจสีของสถานะชี้และปิดใช้งานได้โดยไม่ต้องเอาเมาส์ไปชี้
      </p>
      <div class="cs-stage" data-preview-scope data-slot="matrix"></div>
    </div>

    <div class="cs-section">
      <h3 class="cs-section__title">โค้ด</h3>
      <div class="cs-codemode" role="group" aria-label="รูปแบบสีในโค้ด">
        <button type="button" class="cs-codemode__btn is-active" data-mode="vars">ใช้ตัวแปร</button>
        <button type="button" class="cs-codemode__btn" data-mode="flat">ใส่ค่าสีจริง</button>
      </div>
      <p class="cs-section__hint" data-slot="modehint"></p>
      <div data-slot="code"></div>
    </div>
  `;

  const previewScope = el.detail.querySelector('[data-slot="preview"]');
  previewScope.innerHTML = preview;

  const variantScope = el.detail.querySelector('[data-slot="variants"]');
  variantScope.innerHTML = variants;
  variantScope.querySelectorAll('.cs-variant').forEach((node) => {
    const label = document.createElement('span');
    label.className = 'cs-variant__label';
    label.textContent = node.dataset.variantLabel ?? '';
    node.prepend(label);
  });

  el.detail.querySelector('[data-slot="matrix"]').appendChild(renderStateMatrix(meta));

  const fullCss = `${css.base}\n\n${css.own}`;
  const tokenNames = collectColorTokens(fullCss);

  // data-part เป็นธงภายในของหน้า Layout ไว้ผูกโฟลว์ ไม่ใช่ของที่ผู้ใช้ต้องเอาไปด้วย
  const getHtml = () => stripParts(preview);
  const getCss = () => (codeMode === 'vars' ? fullCss : flatten(fullCss));
  const getTokens = () => (codeMode === 'flat'
    ? 'โหมด "ใส่ค่าสีจริง" ไม่ต้องใช้ไฟล์ token — ค่าสีถูกเขียนลงในแท็บ CSS แล้ว'
    : `/* ${meta.name} — token ที่ component นี้ใช้จริง ${tokenNames.length} ตัว */\n`
      + `:root {\n${tokenBlock(tokenNames, 'light')}\n}\n\n`
      + `[data-theme="dark"] {\n${tokenBlock(tokenNames, 'dark')}\n}\n`);

  const getAll = () => {
    const parts = [
      `<!-- ${meta.name} — สร้างจาก ColorLab -->`,
      '<style>',
      codeMode === 'vars' ? getTokens() : '',
      getCss(),
      '</style>',
      '',
      getHtml(),
    ];
    return parts.filter((part) => part !== '').join('\n');
  };

  const block = createCodeBlock([
    { id: 'html', label: 'HTML', getText: getHtml },
    { id: 'css', label: 'CSS', getText: getCss },
    { id: 'tokens', label: 'Tokens', getText: getTokens },
  ], {
    copyAllLabel: 'คัดลอกทั้งชิ้น',
    getCopyAllText: getAll,
  });

  currentBlock = block;
  el.detail.querySelector('[data-slot="code"]').appendChild(block.element);

  const hint = el.detail.querySelector('[data-slot="modehint"]');
  const updateHint = () => {
    hint.textContent = codeMode === 'vars'
      ? 'โค้ดอ้าง --color-* ซึ่งเป็นชื่อชุดเดียวกับไฟล์ที่ Token Export ให้ เปลี่ยนธีมทีหลังได้'
      : 'ค่าสีถูกเขียนตรงลงใน CSS วางแล้วเห็นผลทันที แต่เปลี่ยนธีมทีหลังต้องไล่แก้เอง';
  };
  updateHint();

  el.detail.querySelector('.cs-codemode').addEventListener('click', (event) => {
    const button = event.target.closest('[data-mode]');
    if (!button) return;
    codeMode = button.dataset.mode;
    el.detail.querySelectorAll('.cs-codemode__btn').forEach((node) => {
      node.classList.toggle('is-active', node.dataset.mode === codeMode);
    });
    updateHint();
    block.refresh();
  });

  el.detail.querySelectorAll('[data-preview-scope]').forEach(applyPreviewTokens);
  el.page?.scrollTo({ top: 0, behavior: 'auto' });
}

/* --------------------------------------------------------------------------
   แถบคุม palette + การนำทาง
   -------------------------------------------------------------------------- */

/**
 * สีที่ "ชุดสี" กำหนดจริงคือสีแบรนด์กับ accent — สีสถานะ (success/warning/danger/info)
 * เป็นของระบบที่ติดมากับ palette เสมอ ไม่ได้มาจากชุดที่ผู้ใช้เลือก
 * เม็ดสีจึงมีเท่าที่ชุดนั้นกำหนดจริง ไม่ใช่หกเม็ดตายตัว
 */
function paletteSwatches(palette) {
  return [
    { hex: palette.primary, label: 'สีแบรนด์' },
    ...palette.accents.map((hex, index) => ({ hex, label: `Accent ${index + 1}` })),
  ];
}

function renderPaletteBar() {
  const palette = store.getPalette();
  const theme = store.getTheme();

  el.swatches.innerHTML = paletteSwatches(palette)
    .map(({ hex, label }) => `<span class="cs-swatch" style="background:${hex}" title="${label} ${hex}"></span>`)
    .join('');

  el.themeBtns.forEach((button) => {
    const active = button.dataset.previewTheme === theme;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  if (!el.modal.hidden) renderPaletteList();
}

/* --------------------------------------------------------------------------
   Modal เลือกชุดสีจากคลังที่บันทึกไว้ใน Colorground
   -------------------------------------------------------------------------- */

const stripParts = (markup) => markup.replace(/\s*data-part="[^"]*"/g, '');

const sameHex = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

function renderPaletteList() {
  const entries = readLibrary();
  const current = store.getPalette();

  el.paletteEmpty.hidden = entries.length > 0;
  el.paletteList.replaceChildren();

  entries.forEach((entry) => {
    const { palette } = entry;
    const isCurrent = sameHex(palette.primary, current.primary)
      && palette.accents.length === current.accents.length
      && palette.accents.every((hex, index) => sameHex(hex, current.accents[index]));

    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'cs-palette-item';
    if (isCurrent) item.setAttribute('aria-current', 'true');

    const strip = paletteSwatches(palette)
      .map(({ hex }) => `<span style="background:${hex}"></span>`).join('');

    const saved = new Date(entry.savedAt).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });

    item.innerHTML = `
      <span class="cs-palette-item__strip" aria-hidden="true">${strip}</span>
      <span class="cs-palette-item__body">
        <span class="cs-palette-item__name">${entry.name}</span>
        <span class="cs-palette-item__meta">${palette.accents.length} สี accent · ${saved}</span>
      </span>
      ${isCurrent ? '<span class="cs-palette-item__now">ใช้อยู่</span>' : ''}
    `;

    item.addEventListener('click', () => store.applyPalette(palette));
    el.paletteList.appendChild(item);
  });
}

function onModalKeydown(event) {
  if (event.key === 'Escape') closePaletteModal();
}

function openPaletteModal() {
  renderPaletteList();
  el.modal.hidden = false;
  el.modal.querySelector('[data-close]')?.focus();
  document.addEventListener('keydown', onModalKeydown);
}

function closePaletteModal() {
  el.modal.hidden = true;
  document.removeEventListener('keydown', onModalKeydown);
  el.pill.focus();
}

function route() {
  const slug = window.location.hash.replace('#', '');
  if (slug && bySlug(slug)) {
    renderDetail(slug);
  } else {
    currentSlug = '';
    currentBlock = null;
    renderCatalog();
  }
}

/**
 * palette เปลี่ยนแล้วอัปเดตเฉพาะสิ่งที่ขึ้นกับสี ไม่ประกอบหน้าใหม่ทั้งหน้า
 * เพราะการ render ใหม่จะทำให้หน้าเด้งกลับขึ้นบนและแท็บโค้ดที่เลือกไว้หาย
 */
function syncColors() {
  if (!el.detail.hidden && currentSlug) {
    el.detail.querySelectorAll('[data-preview-scope]').forEach(applyPreviewTokens);
    currentBlock?.refresh();
    return;
  }
  if (el.catalog.dataset.ready === 'true') refreshCatalogState();
}

async function init() {
  await loadIconSprite();
  initThemeToggle();

  el.page = document.querySelector('.cs-page');
  el.catalog = document.querySelector('#catalog');
  el.catalogView = document.querySelector('#catalog-view');
  el.detail = document.querySelector('#detail');
  el.swatches = document.querySelector('#palette-swatches');
  el.pill = document.querySelector('#palette-pill');
  el.modal = document.querySelector('#palette-modal');
  el.paletteList = document.querySelector('#palette-list');
  el.paletteEmpty = document.querySelector('#palette-empty');

  el.pill.addEventListener('click', openPaletteModal);
  el.modal.querySelectorAll('[data-close]').forEach((node) => {
    node.addEventListener('click', closePaletteModal);
  });
  el.themeBtns = Array.from(document.querySelectorAll('[data-preview-theme]'));

  el.themeBtns.forEach((button) => {
    button.addEventListener('click', () => store.setTheme(button.dataset.previewTheme));
  });

  store.subscribe(() => {
    refreshTokens();
    renderPaletteBar();
    syncColors();
  });

  // แถบบนยุบเป็นวงกลมตอนเลื่อนลงเหมือนหน้า Color Theory — พื้นที่ที่เลื่อนคือ main ไม่ใช่ window
  initOrbitDock(el.page);

  window.addEventListener('hashchange', route);
  route();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
