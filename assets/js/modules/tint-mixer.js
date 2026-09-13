/**
 * tint-mixer.js — สร้าง Tint / Shade / Tone จากสีตั้งต้นสีเดียว (ตอนที่ 02)
 *
 * สามคำนี้ไม่ใช่ศัพท์ลอย ๆ แต่เป็นสูตรที่เขียนเป็นโค้ดได้ตรง ๆ ไฟล์นี้จึงคำนวณ
 * จากสีที่ผู้อ่านเลือกเองทุกครั้ง แทนที่จะโชว์ภาพตัวอย่างที่เตรียมไว้
 *
 *   Tint  = เพิ่ม Lightness เข้าหา 100%
 *   Shade = ลด Lightness ลงหา 0%
 *   Tone  = ลด Saturation โดยไม่แตะ Lightness
 *
 * แต่ละแถวแสดงคอนทราสต์กับตัวหนังสือที่อ่านง่ายที่สุดบนสีนั้นไปด้วย เพราะสีที่ได้
 * จากสูตรยังต้องผ่านเกณฑ์เดียวกับสีอื่นเสมอ ไม่ได้รับการยกเว้นเพราะมาจากสูตร
 */

import { hexToHsl, hslToHex, contrastRatio, readableTextOn } from '../utils/color-utils.js';

const ROWS = [
  { key: 'tint', label: 'Tint', hint: 'สว่างขึ้นทีละ 12%', steps: 4 },
  { key: 'shade', label: 'Shade', hint: 'เข้มลงทีละ 10%', steps: 4 },
  { key: 'tone', label: 'Tone', hint: 'สดลงทีละ 20%', steps: 4 },
];

function variant(hsl, kind, i) {
  const n = i + 1;
  if (kind === 'tint') return { ...hsl, l: Math.min(97, hsl.l + n * 12) };
  if (kind === 'shade') return { ...hsl, l: Math.max(6, hsl.l - n * 10) };
  return { ...hsl, s: Math.max(4, hsl.s - n * 20) };
}

export function initTintMixer() {
  const root = document.querySelector('[data-mixer]');
  if (!root) return;

  const input = root.querySelector('[data-mixer-base]');
  const hexOut = root.querySelector('[data-mixer-hex]');
  const rows = root.querySelector('[data-mixer-rows]');
  if (!input || !rows) return;

  const render = () => {
    const base = input.value;
    const hsl = hexToHsl(base);
    if (hexOut) hexOut.textContent = base.toUpperCase();

    rows.replaceChildren(...ROWS.map(({ key, label, hint, steps }) => {
      const row = document.createElement('div');
      row.className = 'mixer__row';

      const head = document.createElement('div');
      head.className = 'mixer__head';
      head.innerHTML = `<b>${label}</b><span>${hint}</span>`;

      const strip = document.createElement('div');
      strip.className = 'mixer__strip';

      /* ช่องแรกของทุกแถวคือสีตั้งต้น เพื่อให้เห็นจุดออกตัวเดียวกันทั้งสามแถว */
      [hsl, ...Array.from({ length: steps }, (_, i) => variant(hsl, key, i))]
        .forEach((cur, i) => {
          const hex = hslToHex(cur);
          const chip = document.createElement('span');
          chip.className = 'mixer__chip';
          chip.style.backgroundColor = hex;
          chip.style.color = readableTextOn(hex);
          chip.innerHTML = `<b>${i === 0 ? 'ตั้งต้น' : `+${i}`}</b>
            <code>${hex.toUpperCase()}</code>
            <i>${contrastRatio(hex, readableTextOn(hex)).toFixed(1)}:1</i>`;
          strip.append(chip);
        });

      row.append(head, strip);
      return row;
    }));
  };

  input.addEventListener('input', render);
  render();
}
