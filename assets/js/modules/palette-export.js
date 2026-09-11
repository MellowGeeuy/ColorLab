/**
 * palette-export.js — หน้าจอส่งออก palette ปัจจุบันเป็นโค้ดที่เอาไปใช้ต่อได้จริง
 * ตัวแปลงอยู่ที่ utils/palette-code.js เพราะแผงสร้างชุดสีอัตโนมัติใช้ตัวเดียวกัน
 */

import { ROLES, ROLE_LABELS } from '../utils/palette-tokens.js';
import { BUILDERS, FORMAT_META, filenameFor } from '../utils/palette-code.js';

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

export function initPaletteExport(store) {
  const output = document.querySelector('#export-output');
  const tabs = Array.from(document.querySelectorAll('[data-export-format]'));
  if (!output || tabs.length === 0) return;

  const copyBtn = document.querySelector('#export-copy');
  const downloadBtn = document.querySelector('#export-download');
  const status = document.querySelector('#export-status');
  const summary = document.querySelector('#export-summary');

  let format = 'css';

  const render = () => {
    const palette = store.getPalette();
    output.value = BUILDERS[format](palette);

    tabs.forEach((tab) => {
      const active = tab.dataset.exportFormat === format;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    if (summary) {
      const lines = output.value.split('\n').length;
      summary.textContent = `${FORMAT_META[format].label} · ${lines} บรรทัด · ${palette.accents.length} สี accent`;
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      format = tab.dataset.exportFormat;
      render();
      if (status) status.textContent = `สลับเป็นรูปแบบ ${FORMAT_META[format].label} แล้ว`;
    });
  });

  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      if (status) status.textContent = `คัดลอก ${FORMAT_META[format].label} แล้ว`;
    } catch {
      output.select();
      if (status) status.textContent = 'เบราว์เซอร์ไม่ให้คัดลอกอัตโนมัติ — เลือกข้อความไว้ให้แล้ว กด Ctrl+C';
    }
  });

  downloadBtn?.addEventListener('click', () => {
    const meta = FORMAT_META[format];
    const filename = filenameFor(format);
    download(output.value, filename, meta.mime);
    if (status) status.textContent = `ดาวน์โหลด ${filename} แล้ว`;
  });

  // รายชื่อบทบาทช่วยให้ตรวจได้เร็วว่าไฟล์ที่ได้ครอบคลุมสีไหนบ้าง
  const roleHint = document.querySelector('#export-roles');
  if (roleHint) roleHint.textContent = ROLES.map((role) => ROLE_LABELS[role]).join(' · ');

  store.subscribe(render);
}
