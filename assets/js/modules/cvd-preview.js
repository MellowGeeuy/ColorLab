/**
 * cvd-preview.js — สลับ "ตาที่มอง" ให้ตัวอย่างในตอนที่ 01
 *
 * ต่างจาก modules/cvd-simulator.js ที่หน้า Colorground ใช้ — ตัวนั้นรับ palette
 * ทั้งชุดจากผู้ใช้แล้ววาดตารางเทียบห้าแบบพร้อมกัน ส่วนตัวนี้ทำกลับด้าน คือ
 * ตรึงตัวอย่างไว้ชุดเดียวแล้วเปลี่ยนสายตาทีละแบบ เพราะประเด็นที่กำลังสอนคือ
 * "ความหมายหายไปเมื่อผูกไว้กับสีอย่างเดียว" ไม่ใช่ "palette ชุดนี้ปลอดภัยหรือยัง"
 *
 * ค่าสีที่แสดงคำนวณสดจาก simulateCvd() ทุกครั้ง ไม่มี hex ของโหมดไหนฝังใน HTML
 * เลย — แก้สีตั้งต้นที่ data-cvd-color ที่เดียวแล้วทุกโหมดตามทันที
 */

import { simulateCvd, readableTextOn } from '../utils/color-utils.js';

/* ตัวเลขความชุกมาจากสถิติที่อ้างกันทั่วไปในงาน accessibility — กลุ่มแดง-เขียว
   รวมกันราว 1 ใน 12 ของผู้ชาย ส่วน tritanopia กับ achromatopsia พบน้อยมาก
   แต่ต้องมีในตัวอย่างเพราะเป็นกรณีที่ "สีหายทั้งระบบ" ซึ่งพิสูจน์กฎได้ชัดที่สุด */
const MODE_NOTES = {
  normal: 'สายตาคนส่วนใหญ่ แยกสามสถานะออกจากกันด้วยสีได้สบาย',
  deuteranopia: 'พบในผู้ชายราว 6% — “รอตรวจ” กับ “ล้มเหลว” กลายเป็นเขียวขี้ม้าเกือบเหมือนกัน',
  protanopia: 'พบในผู้ชายราว 1% — สีแดงหม่นลงจนดูเป็นสีเดียวกับส้ม',
  tritanopia: 'พบได้น้อยมาก — สีเขียวเลื่อนไปทางฟ้า ส่วนสีส้มเลื่อนไปทางแดง',
  achromatopsia: 'พบน้อยที่สุด แต่เหมือนกับตอนพิมพ์ขาวดำ หรือดูจอกลางแดด',
};

export function initCvdPreview() {
  const root = document.querySelector('[data-cvd-demo]');
  if (!root) return;

  const buttons = [...root.querySelectorAll('[data-cvd-mode]')];
  const swatches = [...root.querySelectorAll('[data-cvd-color]')];
  const readout = root.querySelector('[data-cvd-readout]');
  const note = root.querySelector('[data-cvd-note]');
  if (buttons.length === 0 || swatches.length === 0) return;

  const render = (mode) => {
    swatches.forEach((el) => {
      const base = el.dataset.cvdColor;
      const seen = simulateCvd(base, mode);
      el.style.setProperty('--cvd-color', seen);

      /* ป้ายที่มีตัวอักษรอยู่บนพื้นสีต้องเลือกสีตัวอักษรใหม่ทุกครั้งที่พื้นเปลี่ยน
         ไม่งั้นพอ achromatopsia ดันพื้นไปอยู่กลางสเกลเทา ตัวอักษรขาวจะอ่านไม่ออก
         — กลายเป็นว่าภาพสอนเรื่องคอนทราสต์แทนที่จะสอนเรื่องสีสื่อความหมาย */
      if (el.hasAttribute('data-cvd-on')) {
        el.style.setProperty('--cvd-on-color', readableTextOn(seen));
      }
    });

    buttons.forEach((btn) => {
      const active = btn.dataset.cvdMode === mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    if (readout) {
      readout.replaceChildren(
        ...swatches
          .filter((el) => el.dataset.cvdLabel)
          .map((el) => {
            const base = el.dataset.cvdColor;
            const seen = simulateCvd(base, mode);
            const item = document.createElement('span');
            item.className = 'cvd-demo__chip';
            item.style.setProperty('--cvd-color', seen);
            /* โหมดปกติไม่ต้องเขียนลูกศรชี้ไปหาค่าเดิม — บรรทัดนี้มีไว้บอก "เปลี่ยนไปเป็นอะไร"
               ถ้าไม่มีอะไรเปลี่ยนก็ควรอ่านเป็นค่าสีเฉย ๆ ไม่ใช่การแปลงที่ว่างเปล่า */
            const shift = seen.toLowerCase() === base.toLowerCase()
              ? `<code>${base.toUpperCase()}</code>`
              : `<code>${base.toUpperCase()}</code> → <code>${seen.toUpperCase()}</code>`;
            item.innerHTML = `<i class="cvd-demo__chip-dot" aria-hidden="true"></i>${el.dataset.cvdLabel} ${shift}`;
            return item;
          }),
      );
    }

    if (note) note.textContent = MODE_NOTES[mode] ?? '';
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => render(btn.dataset.cvdMode));
  });

  render('normal');
}
