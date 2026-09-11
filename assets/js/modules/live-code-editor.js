/**
 * live-code-editor.js — เขียน HTML/CSS แล้วเห็นผลทันที
 *
 * พรีวิวใช้ Shadow DOM เพราะ:
 *  1. CSS ที่ผู้ใช้เขียนถูกจำกัดอยู่ในนั้น ไม่รั่วออกมาทำหน้าเว็บพัง
 *  2. CSS Custom Properties ทะลุ shadow boundary เข้าไปได้ ผู้ใช้จึงเรียก var(--pv-*) จาก palette ได้เลย
 *  3. ไม่ต้องโหลด iframe ใหม่ทุกครั้งที่พิมพ์ — อัปเดตทันทีและไม่กระพริบ
 */

import { normalizeInlineStyles } from '../utils/html-normalize.js';

const STORAGE_KEY = 'uxui-theory-livecode';
const RENDER_DELAY = 120;

const STARTER_HTML = `<div class="demo">
  <span class="tag">ตัวอย่าง</span>
  <h3>การ์ดที่ใช้สีจาก palette</h3>
  <p>แก้โค้ดฝั่งซ้ายแล้วดูผลทันที ทุกสีอ้างจาก token ของ palette</p>
  <div class="row">
    <button class="btn">ปุ่มหลัก</button>
    <button class="btn btn--ghost">ปุ่มรอง</button>
  </div>
</div>`;

const STARTER_CSS = `.demo {
  background: var(--pv-surface);
  border: 1px solid var(--pv-border);
  border-radius: 14px;
  padding: 24px;
  color: var(--pv-text);
  box-shadow: var(--pv-shadow);
}

.tag {
  display: inline-block;
  background: var(--pv-primary-soft);
  color: var(--pv-on-primary-soft);
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
}

h3 { margin: 12px 0 6px; }
p  { color: var(--pv-text-muted); margin: 0 0 16px; }

.row { display: flex; gap: 8px; }

.btn {
  background: var(--pv-primary);
  color: var(--pv-on-primary);
  border: 1px solid var(--pv-primary);
  border-radius: 10px;
  padding: 8px 16px;
  font: inherit;
  cursor: pointer;
}

.btn--ghost {
  background: transparent;
  color: var(--pv-primary-text);
}`;

const SNIPPETS = {
  card: {
    label: 'การ์ด',
    html: `<article class="c">
  <div class="c__cover"></div>
  <div class="c__body">
    <h4>หัวข้อการ์ด</h4>
    <p>คำอธิบายสั้น ๆ ของเนื้อหาในการ์ดใบนี้</p>
  </div>
</article>`,
    css: `.c { background: var(--pv-surface); border: 1px solid var(--pv-border); border-radius: 14px; overflow: hidden; color: var(--pv-text); }
.c__cover { height: 90px; background: linear-gradient(135deg, var(--pv-primary), var(--pv-accent-2, var(--pv-info))); }
.c__body { padding: 16px; }
.c h4 { margin: 0 0 6px; }
.c p { margin: 0; color: var(--pv-text-muted); font-size: 14px; }`,
  },
  alert: {
    label: 'แจ้งเตือน',
    html: `<div class="al al--success">บันทึกข้อมูลเรียบร้อยแล้ว</div>
<div class="al al--danger">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้</div>`,
    css: `.al { border-radius: 10px; padding: 12px 16px; margin-bottom: 8px; font-size: 14px; border-left: 3px solid; }
.al--success { background: var(--pv-success-soft); color: var(--pv-on-success-soft); border-color: var(--pv-success); }
.al--danger  { background: var(--pv-danger-soft);  color: var(--pv-on-danger-soft);  border-color: var(--pv-danger); }`,
  },
  form: {
    label: 'ฟอร์ม',
    html: `<form class="f" onsubmit="return false">
  <label class="f__label" for="demo-email">อีเมล</label>
  <input class="f__input" id="demo-email" type="email" placeholder="you@example.com">
  <button class="f__btn">ส่งข้อมูล</button>
</form>`,
    css: `.f { background: var(--pv-surface); border: 1px solid var(--pv-border); border-radius: 14px; padding: 20px; display: grid; gap: 8px; color: var(--pv-text); }
.f__label { font-size: 13px; color: var(--pv-text-muted); }
.f__input { padding: 10px 12px; border-radius: 10px; border: 1px solid var(--pv-border-strong); background: var(--pv-bg); color: var(--pv-text); font: inherit; }
.f__input:focus { outline: 2px solid var(--pv-primary-ring); outline-offset: 1px; }
.f__btn { margin-top: 8px; padding: 10px; border: none; border-radius: 10px; background: var(--pv-primary); color: var(--pv-on-primary); font: inherit; cursor: pointer; }`,
  },
  stats: {
    label: 'ตัวเลขสรุป',
    html: `<div class="st">
  <div class="st__item"><span>ผู้ใช้งาน</span><strong>12,480</strong></div>
  <div class="st__item"><span>รายได้</span><strong>฿1.2M</strong></div>
  <div class="st__item"><span>อัตราคงอยู่</span><strong>92%</strong></div>
</div>`,
    css: `.st { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.st__item { background: var(--pv-surface); border: 1px solid var(--pv-border); border-radius: 12px; padding: 16px; display: grid; gap: 4px; }
.st__item span { font-size: 12px; color: var(--pv-text-muted); }
.st__item strong { font-size: 22px; color: var(--pv-text); }`,
  },
};

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function insertAtCursor(textarea, text) {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  textarea.value = `${value.slice(0, start)}${text}${value.slice(end)}`;
  const caret = start + text.length;
  textarea.setSelectionRange(caret, caret);
  textarea.focus();
}

/**
 * ให้ปุ่ม Tab เพิ่มการเยื้องแทนการย้ายโฟกัส
 * ถ้ากล่องเติมคำเปิดอยู่ ให้ Tab เป็นการยืนยันคำแนะนำแทน — ตัวนั้นจัดการเอง
 */
function enableTabIndent(textarea, isCompletionOpen) {
  textarea.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || event.shiftKey || isCompletionOpen()) return;
    event.preventDefault();
    insertAtCursor(textarea, '  ');
    textarea.dispatchEvent(new Event('input'));
  });
}

/**
 * @param {{createCompletion?: Function}} deps
 *   createCompletion ถูกส่งเข้ามาจาก page script (ไม่ import module อื่นตรง ๆ ตามชั้นของโปรเจกต์)
 */
export function initLiveCodeEditor(deps = {}) {
  const htmlInput = document.querySelector('#code-html');
  const cssInput = document.querySelector('#code-css');
  const mount = document.querySelector('#code-preview');
  if (!htmlInput || !cssInput || !mount) return;

  const notice = document.querySelector('#code-notice');
  const resetBtn = document.querySelector('#code-reset');
  const snippetList = document.querySelector('#code-snippets');
  const resolutionBadge = document.querySelector('#preview-resolution');
  const codeLayout = document.querySelector('.code-layout');
  const insertToggle = document.querySelector('#code-insert-toggle');
  const insertMenu = document.querySelector('#code-insert-menu');
  const sizeToggle = document.querySelector('#preview-size-toggle');
  const sizeMenu = document.querySelector('#preview-size-menu');
  const sizeOptions = Array.from(document.querySelectorAll('.preview-size__option'));
  const tabButtons = Array.from(document.querySelectorAll('[data-code-tab]'));
  const panes = Array.from(document.querySelectorAll('[data-code-pane]'));

  const closeInsertMenu = () => {
    if (!insertMenu || insertMenu.hidden) return;
    insertMenu.hidden = true;
    insertToggle?.setAttribute('aria-expanded', 'false');
  };

  if (insertToggle && insertMenu) {
    insertToggle.addEventListener('click', () => {
      const willOpen = insertMenu.hidden;
      insertMenu.hidden = !willOpen;
      insertToggle.setAttribute('aria-expanded', String(willOpen));
    });
    document.addEventListener('click', (event) => {
      if (!insertMenu.hidden && !event.target.closest('.code-insert')) closeInsertMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !insertMenu.hidden) closeInsertMenu();
    });
  }

  // เมนูเลือกขนาดพรีวิว — ขนาดปกติ / เต็มพื้นที่ / ขนาดตายตัว (เช่น 1600×900) ที่เลื่อนดูได้ถ้าใหญ่กว่าจอ
  const closeSizeMenu = () => {
    if (!sizeMenu || sizeMenu.hidden) return;
    sizeMenu.hidden = true;
    sizeToggle?.setAttribute('aria-expanded', 'false');
  };

  if (sizeToggle && sizeMenu) {
    sizeToggle.addEventListener('click', () => {
      const willOpen = sizeMenu.hidden;
      sizeMenu.hidden = !willOpen;
      sizeToggle.setAttribute('aria-expanded', String(willOpen));
    });
    document.addEventListener('click', (event) => {
      if (!sizeMenu.hidden && !event.target.closest('.preview-size')) closeSizeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !sizeMenu.hidden) closeSizeMenu();
    });
  }

  sizeOptions.forEach((option) => {
    option.addEventListener('click', () => {
      sizeOptions.forEach((o) => o.classList.toggle('is-active', o === option));

      const { w, h, mode } = option.dataset;
      if (w && h) {
        mount.style.setProperty('--preview-size-w', `${w}px`);
        mount.style.setProperty('--preview-size-h', `${h}px`);
        mount.classList.add('is-fixed-size');
        codeLayout?.classList.add('is-preview-expanded');
      } else if (mode === 'fill') {
        mount.classList.remove('is-fixed-size');
        codeLayout?.classList.add('is-preview-expanded');
      } else {
        mount.classList.remove('is-fixed-size');
        codeLayout?.classList.remove('is-preview-expanded');
      }

      closeSizeMenu();
    });
  });

  // บอกขนาดจริงของพื้นที่พรีวิว เพราะความกว้างยืดตามแผงซึ่งไม่เท่าอุปกรณ์จริง
  // ผู้ใช้จะได้รู้ว่ากำลังทดสอบที่ resolution เท่าไร
  if (resolutionBadge && 'ResizeObserver' in window) {
    const updateResolution = () => {
      const { width, height } = mount.getBoundingClientRect();
      resolutionBadge.textContent = `${Math.round(width)} × ${Math.round(height)}`;
    };
    new ResizeObserver(updateResolution).observe(mount);
    updateResolution();
  }

  const stored = readStored();
  htmlInput.value = stored?.html ?? STARTER_HTML;
  cssInput.value = stored?.css ?? STARTER_CSS;

  const shadow = mount.shadowRoot ?? mount.attachShadow({ mode: 'open' });
  const styleEl = document.createElement('style');
  const bodyEl = document.createElement('div');
  bodyEl.className = 'live-root';
  shadow.replaceChildren(styleEl, bodyEl);

  const baseStyle = `
    :host { display: block; }
    .live-root {
      font-family: "IBM Plex Sans Thai", "Noto Sans Thai", system-ui, sans-serif;
      font-size: 15px;
      line-height: 1.7;
      color: var(--pv-text);
    }
    .live-root *, .live-root *::before, .live-root *::after { box-sizing: border-box; }
    .live-root img { max-width: 100%; }
  `;

  let timer = null;

  const render = () => {
    const { html, fixes } = normalizeInlineStyles(htmlInput.value);

    // innerHTML ไม่รัน <script> ที่ถูกแทรกเข้ามา พรีวิวจึงเป็น HTML/CSS ล้วน
    bodyEl.innerHTML = html;
    styleEl.textContent = `${baseStyle}\n${cssInput.value}`;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ html: htmlInput.value, css: cssInput.value }));
    } catch { /* บันทึกไม่ได้ก็ยังแก้โค้ดต่อได้ */ }

    if (notice) {
      notice.hidden = fixes.length === 0;
      if (fixes.length > 0) {
        const list = [...new Set(fixes)].slice(0, 3).join(', ');
        notice.textContent = `แสดงผลให้แล้วโดยอ่านเป็น color — style="${list}" ที่ถูกต้องคือ style="color: ${fixes[0]}"`;
      }
    }
  };

  const scheduleRender = () => {
    clearTimeout(timer);
    timer = setTimeout(render, RENDER_DELAY);
  };

  // ค่าของ token อ่านจาก :root ตอนที่ต้องใช้ เพื่อให้จุดสีในรายการตรงกับ palette ปัจจุบันเสมอ
  const getTokenValue = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  /** รหัสสีจริงของ palette ปัจจุบัน สำหรับเสนอเมื่อผู้ใช้พิมพ์ # */
  const getPaletteColors = () => {
    const entries = [
      ['--pv-primary', 'สีแบรนด์'],
      ['--pv-primary-600', 'แบรนด์ ขั้น 600'],
      ['--pv-primary-100', 'แบรนด์ ขั้น 100'],
      ['--pv-success', 'สีสำเร็จ'],
      ['--pv-warning', 'สีเตือน'],
      ['--pv-danger', 'สีอันตราย'],
      ['--pv-info', 'สีข้อมูล'],
      ['--pv-text', 'ตัวอักษรหลัก'],
      ['--pv-text-muted', 'ตัวอักษรรอง'],
      ['--pv-surface', 'พื้นการ์ด'],
      ['--pv-bg', 'พื้นหลังหน้า'],
      ['--pv-border', 'เส้นขอบ'],
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => [`--pv-accent-${n}`, `accent ${n}`]),
    ];

    const seen = new Set();
    return entries
      .map(([token, detail]) => ({ hex: getTokenValue(token), detail }))
      .filter(({ hex }) => /^#[0-9a-f]{6}$/i.test(hex) && !seen.has(hex) && seen.add(hex));
  };

  [[htmlInput, 'html'], [cssInput, 'css']].forEach(([input, language]) => {
    input.addEventListener('input', scheduleRender);
    const completion = deps.createCompletion?.(input, {
      language,
      getTokenValue,
      getPaletteColors,
      onAccept: render,
    });
    enableTabIndent(input, completion?.isOpen ?? (() => false));
  });

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.codeTab;
      tabButtons.forEach((b) => {
        const active = b === button;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      panes.forEach((pane) => { pane.hidden = pane.dataset.codePane !== target; });
    });
  });

  if (snippetList) {
    Object.entries(SNIPPETS).forEach(([key, snippet]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip';
      button.textContent = `+ ${snippet.label}`;
      button.title = `แทรกตัวอย่าง${snippet.label}`;
      button.dataset.snippet = key;
      button.addEventListener('click', () => {
        htmlInput.value = `${htmlInput.value.trimEnd()}\n\n${snippet.html}\n`;
        cssInput.value = `${cssInput.value.trimEnd()}\n\n${snippet.css}\n`;
        render();
        closeInsertMenu();
      });
      snippetList.appendChild(button);
    });
  }

  resetBtn?.addEventListener('click', () => {
    htmlInput.value = STARTER_HTML;
    cssInput.value = STARTER_CSS;
    render();
  });

  // คลิกชื่อ token เพื่อแทรกลงในช่อง CSS ที่ตำแหน่งเคอร์เซอร์
  document.querySelectorAll('[data-token]').forEach((chip) => {
    chip.addEventListener('click', () => {
      insertAtCursor(cssInput, `var(${chip.dataset.token})`);
      render();
      closeInsertMenu();
    });
  });

  render();
}
