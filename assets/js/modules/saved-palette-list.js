/**
 * saved-palette-list.js — รายการชุดสีที่บันทึกไว้ ใช้ร่วมกันระหว่างหน้า Component Style กับ Layout
 *
 * เดิมสองหน้าต่างเขียน render ของตัวเองที่เหมือนกันคนละชุด พอเพิ่มปุ่มลบจึงต้องแก้สองที่
 * ย้ายมารวมที่นี่เพื่อให้รายการชุดสีมีที่มาที่เดียว
 */

import { readLibrary, removeFromLibrary } from '../utils/palette-library-store.js';

const sameHex = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

function swatchesOf(palette) {
  return [palette.primary, ...palette.accents];
}

function isCurrent(palette, current) {
  return sameHex(palette.primary, current.primary)
    && palette.accents.length === current.accents.length
    && palette.accents.every((hex, index) => sameHex(hex, current.accents[index]));
}

function buildItem(entry, current, { onPick, onRemove }) {
  const { palette } = entry;
  const current_ = isCurrent(palette, current);

  const item = document.createElement('div');
  item.className = 'cs-palette-item';
  if (current_) item.setAttribute('aria-current', 'true');

  const pick = document.createElement('button');
  pick.type = 'button';
  pick.className = 'cs-palette-item__pick';

  const strip = swatchesOf(palette)
    .map((hex) => `<span style="background:${hex}"></span>`).join('');

  const saved = new Date(entry.savedAt).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  pick.innerHTML = `
    <span class="cs-palette-item__strip" aria-hidden="true">${strip}</span>
    <span class="cs-palette-item__body">
      <span class="cs-palette-item__name">${entry.name}</span>
      <span class="cs-palette-item__meta">${palette.accents.length} สี accent · ${saved}</span>
    </span>
    ${current_ ? '<span class="cs-palette-item__now">ใช้อยู่</span>' : ''}
  `;
  pick.addEventListener('click', () => onPick(palette));

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'cs-palette-item__remove';
  remove.setAttribute('aria-label', `ลบชุดสี ${entry.name}`);
  remove.title = 'ลบชุดสีนี้';
  remove.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-trash"/></svg>';
  remove.addEventListener('click', () => onRemove(entry));

  item.append(pick, remove);
  return item;
}

/**
 * วาดรายการชุดสีที่บันทึกไว้ลงใน list แล้วคืนฟังก์ชันสำหรับวาดใหม่
 * @param {object} options
 * @param {HTMLElement} options.list กล่องที่ใส่รายการ
 * @param {HTMLElement} [options.empty] ข้อความตอนคลังว่าง
 * @param {object} options.store palette store ของหน้านั้น
 * @param {(palette: object, entry: object) => void} [options.onPick] แทนพฤติกรรมตอนเลือกชุด
 *        (หน้า Layout ต้องปิดหน้าต่างและแจ้งสถานะเพิ่ม ไม่ใช่แค่ apply)
 * @param {(message: string) => void} [options.onStatus] แจ้งผลการลบให้หน้าจอเจ้าของจัดการเอง
 */
export function createSavedPaletteList({ list, empty, store, confirm, onPick, onStatus }) {
  const render = () => {
    const entries = readLibrary();
    const current = store.getPalette();

    if (empty) empty.hidden = entries.length > 0;
    list.replaceChildren();

    entries.forEach((entry) => {
      list.appendChild(buildItem(entry, current, {
        onPick: (palette) => {
          if (onPick) onPick(palette, entry);
          else store.applyPalette(palette);
        },
        onRemove: async (target) => {
          const ok = await confirm({
            title: `ลบชุดสี ${target.name}`,
            text: 'ชุดสีนี้จะหายจากคลังถาวร เอากลับคืนไม่ได้ — ชุดที่กำลังใช้อยู่บนหน้าจอไม่เปลี่ยน',
            confirmLabel: 'ลบชุดสี',
          });
          if (!ok) return;

          const result = removeFromLibrary(target.savedAt);
          render();
          onStatus?.(result.ok
            ? `ลบชุด ${target.name} แล้ว`
            : `ลบชุด ${target.name} ออกจากหน้าจอแล้ว แต่เบราว์เซอร์ไม่ให้บันทึกการเปลี่ยนแปลง`);
          window.dispatchEvent(new CustomEvent('palette-library-changed'));
        },
      }));
    });
  };

  render();
  return render;
}
