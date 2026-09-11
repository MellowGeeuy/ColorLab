/**
 * palette-export-dialog.js — หน้าต่างส่งออกชุดสีเป็นโค้ดพร้อมใช้
 *
 * ดักคลิกที่ปุ่ม `[data-export-set]` แบบ delegation แทนการผูกกับปุ่มโดยตรง
 * เพราะการ์ดชุดสีถูกสร้างใหม่ทุกครั้งที่เปลี่ยนสีตั้งต้น ปุ่มจึงไม่ใช่ตัวเดิม
 */

import { toPaletteSeed } from '../utils/auto-palette.js';
import { BUILDERS, FORMAT_META, filenameFor } from '../utils/palette-code.js';

const FORMATS = ['css', 'scss', 'tailwind', 'json'];

function download(text, filename, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // ปล่อย object URL ทันทีไม่ได้ — Firefox ยังอ่านไม่เสร็จตอน click คืนค่า
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildDialog() {
  const root = document.createElement('div');
  root.className = 'xport';
  root.id = 'xport';
  root.hidden = true;
  root.innerHTML = `
    <div class="xport__scrim" data-xport-close></div>
    <div class="xport__panel" role="dialog" aria-modal="true" aria-labelledby="xport-title">
      <header class="xport__head">
        <div class="xport__heading">
          <h2 class="xport__title" id="xport-title">ส่งออกชุดสี</h2>
          <p class="xport__sub" id="xport-sub"></p>
        </div>
        <button type="button" class="btn btn--icon btn--sm" data-xport-close aria-label="ปิดหน้าต่างส่งออก">
          <svg class="icon" aria-hidden="true"><use href="#i-x"/></svg>
        </button>
      </header>

      <div class="xport__row" role="tablist" aria-label="รูปแบบโค้ด">
        ${FORMATS.map((format, index) => `
          <button type="button" class="xport__tab${index === 0 ? ' is-active' : ''}"
                  role="tab" data-xport-format="${format}"
                  aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}">
            ${FORMAT_META[format].label}
          </button>`).join('')}
      </div>

      <div class="xport__swatches" id="xport-swatches" aria-hidden="true"></div>

      <textarea class="xport__code u-mono" id="xport-code" readonly spellcheck="false"
                aria-label="โค้ดชุดสีที่ส่งออก"></textarea>

      <footer class="xport__foot">
        <p class="xport__status u-small u-muted" id="xport-status" role="status" aria-live="polite"></p>
        <div class="xport__actions">
          <button type="button" class="btn btn--sm" id="xport-download">
            <svg class="icon" aria-hidden="true"><use href="#i-arrow-down"/></svg> ดาวน์โหลดไฟล์
          </button>
          <button type="button" class="btn btn--sm btn--primary" id="xport-copy">
            <svg class="icon" aria-hidden="true"><use href="#i-copy"/></svg> คัดลอกโค้ด
          </button>
        </div>
      </footer>
    </div>
  `;

  document.body.appendChild(root);
  return root;
}

export function initPaletteExportDialog(store) {
  let root = null;
  let format = 'css';
  let palette = null;
  let setName = '';
  let lastFocused = null;

  const render = () => {
    const code = root.querySelector('#xport-code');
    const status = root.querySelector('#xport-status');

    code.value = BUILDERS[format](palette);

    root.querySelectorAll('[data-xport-format]').forEach((tab) => {
      const active = tab.dataset.xportFormat === format;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    const lines = code.value.split('\n').length;
    status.textContent = `${FORMAT_META[format].label} · ${lines} บรรทัด · ไฟล์ที่จะได้คือ ${filenameFor(format)}`;
  };

  const open = (colors, primaryHex, name) => {
    if (!root) {
      root = buildDialog();
      wire();
    }

    const seed = toPaletteSeed(colors, primaryHex);
    palette = { ...store.getPalette(), primary: seed.primary, accents: seed.accents };
    setName = name;
    format = 'css';

    root.querySelector('#xport-sub').textContent = `${name} · ส่งออกทั้งธีมสว่างและมืดในไฟล์เดียว`;
    root.querySelector('#xport-swatches').replaceChildren(...colors.map((hex) => {
      const chip = document.createElement('span');
      chip.className = 'xport__chip';
      chip.style.backgroundColor = hex;
      return chip;
    }));

    render();
    lastFocused = document.activeElement;
    root.hidden = false;
    document.body.style.overflow = 'hidden';
    root.querySelector('#xport-copy').focus();
  };

  const close = () => {
    root.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  };

  function wire() {
    const code = root.querySelector('#xport-code');
    const status = root.querySelector('#xport-status');

    root.addEventListener('click', (event) => {
      if (event.target.closest('[data-xport-close]')) {
        close();
        return;
      }

      const tab = event.target.closest('[data-xport-format]');
      if (tab) {
        format = tab.dataset.xportFormat;
        render();
      }
    });

    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    });

    root.querySelector('#xport-copy').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.value);
        status.textContent = `คัดลอก ${FORMAT_META[format].label} ของชุด ${setName} แล้ว`;
      } catch {
        code.select();
        status.textContent = 'เบราว์เซอร์ไม่ให้คัดลอกอัตโนมัติ — เลือกข้อความไว้ให้แล้ว กด Ctrl+C';
      }
    });

    root.querySelector('#xport-download').addEventListener('click', () => {
      const filename = filenameFor(format);
      download(code.value, filename, FORMAT_META[format].mime);
      status.textContent = `ดาวน์โหลด ${filename} แล้ว`;
    });
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-export-set]');
    if (!button) return;

    open(
      button.dataset.exportSet.split(','),
      button.dataset.exportPrimary,
      button.dataset.exportName,
    );
  });
}
