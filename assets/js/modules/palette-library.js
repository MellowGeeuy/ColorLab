/**
 * palette-library.js — คลังชุดสีของผู้ใช้: บันทึกชุดที่กำลังทำไว้หลายชุด เรียกกลับมาใช้
 * และย้ายข้ามเครื่องด้วยไฟล์ JSON
 */

import { normalizePalette, ROLES } from '../utils/palette-tokens.js';
import {
  readLibrary, writeLibrary, MAX_LIBRARY_ENTRIES as MAX_ENTRIES,
} from '../utils/palette-library-store.js';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function initPaletteLibrary(store) {
  const list = document.querySelector('#library-list');
  if (!list) return;

  const nameInput = document.querySelector('#library-name');
  const saveBtn = document.querySelector('#library-save');
  const emptyNote = document.querySelector('#library-empty');
  const countLabel = document.querySelector('#library-count');
  const status = document.querySelector('#library-status');
  const exportBtn = document.querySelector('#library-export');
  const importInput = document.querySelector('#library-import');

  let entries = readLibrary();

  const announce = (message) => {
    if (status) status.textContent = message;
  };

  const persist = () => {
    if (!writeLibrary(entries)) {
      announce('บันทึกลงเครื่องไม่ได้ (เบราว์เซอร์ปิดพื้นที่จัดเก็บ) — ใช้ปุ่มดาวน์โหลดไฟล์แทนได้');
    }
  };

  const render = () => {
    list.replaceChildren();

    entries.forEach((entry, index) => {
      const card = document.createElement('article');
      card.className = 'library-card';

      const strip = document.createElement('div');
      strip.className = 'library-card__strip';
      strip.setAttribute('aria-hidden', 'true');
      [entry.palette.primary, ...ROLES.slice(1).map((role) => entry.palette[role]),
        ...entry.palette.accents.slice(0, 4)].forEach((hex) => {
        const chip = document.createElement('span');
        chip.style.backgroundColor = hex;
        strip.appendChild(chip);
      });

      const body = document.createElement('div');
      body.className = 'library-card__body';

      const title = document.createElement('h3');
      title.className = 'library-card__title';
      title.textContent = entry.name;

      const meta = document.createElement('p');
      meta.className = 'library-card__meta';
      meta.textContent = `${entry.palette.accents.length} สี accent · ${formatDate(entry.savedAt)}`;

      const actions = document.createElement('div');
      actions.className = 'library-card__actions';

      const load = document.createElement('button');
      load.type = 'button';
      load.className = 'btn btn--primary btn--sm';
      load.textContent = 'ใช้ชุดนี้';
      load.addEventListener('click', () => {
        store.applyPalette(entry.palette);
        announce(`โหลดชุด "${entry.name}" มาใช้แล้ว`);
      });

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn--sm btn--danger-ghost';
      remove.textContent = 'ลบ';
      remove.addEventListener('click', () => {
        entries = entries.filter((_, i) => i !== index);
        persist();
        render();
        announce(`ลบชุด "${entry.name}" แล้ว`);
      });

      actions.append(load, remove);
      body.append(title, meta, actions);
      card.append(strip, body);
      list.appendChild(card);
    });

    if (emptyNote) emptyNote.hidden = entries.length > 0;
    if (countLabel) countLabel.textContent = `${entries.length} / ${MAX_ENTRIES}`;
  };

  saveBtn?.addEventListener('click', () => {
    if (entries.length >= MAX_ENTRIES) {
      announce(`คลังเต็มแล้ว (${MAX_ENTRIES} ชุด) — ลบชุดเก่าออกก่อน`);
      return;
    }

    const fallback = `ชุดสีที่ ${entries.length + 1}`;
    const name = (nameInput?.value ?? '').trim() || fallback;

    entries = [{
      name,
      savedAt: new Date().toISOString(),
      palette: store.getPalette(),
    }, ...entries];

    persist();
    render();
    if (nameInput) nameInput.value = '';
    announce(`บันทึกชุด "${name}" แล้ว`);
  });

  nameInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveBtn?.click();
    }
  });

  exportBtn?.addEventListener('click', () => {
    if (entries.length === 0) {
      announce('ยังไม่มีชุดสีในคลัง');
      return;
    }
    const text = `${JSON.stringify({ version: 1, entries }, null, 2)}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'palette-library.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce(`ดาวน์โหลดคลัง ${entries.length} ชุดแล้ว`);
  });

  importInput?.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      const incoming = Array.isArray(parsed) ? parsed : parsed.entries;
      if (!Array.isArray(incoming)) throw new Error('รูปแบบไฟล์ไม่ถูกต้อง');

      const cleaned = incoming
        .filter((item) => item && item.palette)
        .map((item) => ({
          name: String(item.name ?? 'ชุดที่นำเข้า'),
          savedAt: item.savedAt ?? new Date().toISOString(),
          palette: normalizePalette(item.palette),
        }));

      if (cleaned.length === 0) throw new Error('ไม่พบชุดสีในไฟล์');

      entries = [...cleaned, ...entries].slice(0, MAX_ENTRIES);
      persist();
      render();
      announce(`นำเข้า ${cleaned.length} ชุดแล้ว`);
    } catch (error) {
      announce(`นำเข้าไม่สำเร็จ — ${error.message}`);
    } finally {
      importInput.value = ''; // ให้เลือกไฟล์เดิมซ้ำได้
    }
  });

  // แผงสร้างชุดสีอัตโนมัติเขียนคลังเดียวกัน จึงต้องอ่านใหม่เมื่อมันบันทึก
  // ไม่งั้นคลังในหน้านี้จะค้างอยู่กับข้อมูลชุดเก่าจนกว่าจะรีเฟรชหน้า
  window.addEventListener('palette-library-changed', () => {
    entries = readLibrary();
    render();
  });

  render();
}
