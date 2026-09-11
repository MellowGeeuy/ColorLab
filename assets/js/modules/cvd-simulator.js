/**
 * cvd-simulator.js — จำลองว่าชุดสีถูกมองเห็นอย่างไรเมื่อผู้ใช้ตาบอดสี
 */

import { simulateCvd, CVD_LABELS } from '../utils/color-utils.js';

const CVD_TYPES = ['normal', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];

const CVD_NOTES = {
  normal: 'ประชากรส่วนใหญ่',
  protanopia: '~1% ของผู้ชาย',
  deuteranopia: '~6% ของผู้ชาย',
  tritanopia: 'พบได้น้อยมาก',
  achromatopsia: 'พบได้น้อยมาก',
};

/**
 * @param {object} [store] ถ้าส่งมา จะดึงสีจาก palette ที่กำลังแก้อยู่มาจำลองให้อัตโนมัติ
 */
export function initCvdSimulator(store) {
  const grid = document.querySelector('#cvd-grid');
  const input = document.querySelector('#cvd-colors');
  if (!grid || !input) return;

  const render = () => {
    const palette = input.value
      .split(',')
      .map((value) => value.trim())
      .filter((value) => /^#?[0-9a-f]{6}$/i.test(value))
      .map((value) => (value.startsWith('#') ? value : `#${value}`))
      .slice(0, 5);

    if (palette.length === 0) return;

    grid.replaceChildren();

    CVD_TYPES.forEach((type) => {
      const card = document.createElement('div');
      card.className = 'cvd-card';

      const bars = document.createElement('div');
      bars.className = 'cvd-card__bars';
      bars.style.gridTemplateColumns = `repeat(${palette.length}, 1fr)`;

      palette.forEach((hex) => {
        const bar = document.createElement('span');
        bar.style.backgroundColor = simulateCvd(hex, type);
        bars.appendChild(bar);
      });

      const label = document.createElement('div');
      label.className = 'cvd-card__label';
      label.textContent = CVD_LABELS[type];

      const note = document.createElement('div');
      note.className = 'cvd-card__note';
      note.textContent = CVD_NOTES[type];

      card.append(bars, label, note);
      grid.appendChild(card);
    });
  };

  input.addEventListener('input', render);

  if (store) {
    store.subscribe((palette) => {
      // ไม่แย่งช่องตอนผู้ใช้กำลังพิมพ์ทดลองสีอื่นอยู่
      if (document.activeElement === input) return;
      input.value = [palette.primary, ...palette.accents].slice(0, 5).join(', ');
      render();
    });
    return;
  }

  render();
}
