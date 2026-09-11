/**
 * hsl-playground.js — สไลเดอร์ H / S / L พร้อมพรีวิวสีและค่า HEX
 */

import { hslToHex, formatHsl, readableTextOn } from '../utils/color-utils.js';

export function initHslPlayground() {
  const preview = document.querySelector('#hsl-preview');
  const hexOut = document.querySelector('#hsl-hex');
  const hslOut = document.querySelector('#hsl-value');
  if (!preview) return;

  const inputs = {
    h: document.querySelector('#hsl-hue'),
    s: document.querySelector('#hsl-sat'),
    l: document.querySelector('#hsl-light'),
  };

  const labels = {
    h: document.querySelector('#hsl-hue-value'),
    s: document.querySelector('#hsl-sat-value'),
    l: document.querySelector('#hsl-light-value'),
  };

  const render = () => {
    const hsl = {
      h: Number(inputs.h.value),
      s: Number(inputs.s.value),
      l: Number(inputs.l.value),
    };
    const hex = hslToHex(hsl);

    preview.style.backgroundColor = hex;
    preview.style.color = readableTextOn(hex);
    preview.textContent = hex.toUpperCase();

    labels.h.textContent = `${hsl.h}°`;
    labels.s.textContent = `${hsl.s}%`;
    labels.l.textContent = `${hsl.l}%`;

    // สไลเดอร์ S / L เปลี่ยน gradient ตาม hue ปัจจุบัน เพื่อให้เห็นผลก่อนลาก
    inputs.s.style.background =
      `linear-gradient(90deg, hsl(${hsl.h} 0% ${hsl.l}%), hsl(${hsl.h} 100% ${hsl.l}%))`;
    inputs.l.style.background =
      `linear-gradient(90deg, #000, hsl(${hsl.h} ${hsl.s}% 50%), #fff)`;

    if (hexOut) hexOut.textContent = hex.toUpperCase();
    if (hslOut) hslOut.textContent = formatHsl(hsl);
  };

  Object.values(inputs).forEach((input) => input.addEventListener('input', render));
  render();
}
