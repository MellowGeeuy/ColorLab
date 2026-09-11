/**
 * scale-generator.js — สร้าง tonal scale 50–950 จากสีตั้งต้น พร้อมบอกว่าขั้นไหนใช้เป็นสีตัวอักษรได้
 */

import { buildScale, hexToHsl } from '../utils/color-utils.js';

export function initScaleGenerator() {
  const strip = document.querySelector('#scale-strip');
  const picker = document.querySelector('#scale-color');
  const hexInput = document.querySelector('#scale-hex');
  const note = document.querySelector('#scale-note');
  if (!strip || !picker) return;

  const render = (hex) => {
    const hsl = hexToHsl(hex);
    if (!hsl) return;

    const scale = buildScale(hsl);
    strip.replaceChildren();

    scale.forEach((entry) => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'scale-strip__cell';
      cell.style.backgroundColor = entry.hex;
      cell.style.color = entry.onColor;
      cell.title = `${entry.hex} — คลิกเพื่อคัดลอก`;

      const step = document.createElement('span');
      step.className = 'scale-strip__step';
      step.textContent = entry.step;

      const code = document.createElement('span');
      code.textContent = entry.hex.replace('#', '').toUpperCase();

      cell.append(step, code);
      cell.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(entry.hex);
          code.textContent = 'COPIED';
          setTimeout(() => { code.textContent = entry.hex.replace('#', '').toUpperCase(); }, 900);
        } catch { /* clipboard ถูกบล็อก */ }
      });

      strip.appendChild(cell);
    });

    if (note) {
      const textSafe = scale.filter((entry) => entry.contrastOnWhite >= 4.5).map((entry) => entry.step);
      const uiSafe = scale.filter((entry) => entry.contrastOnWhite >= 3).map((entry) => entry.step);
      note.textContent = textSafe.length
        ? `บนพื้นขาว: ขั้น ${textSafe.join(', ')} ใช้เป็นสีตัวอักษรได้ (≥4.5:1) · ขั้น ${uiSafe.join(', ')} ใช้กับเส้นขอบ/ไอคอนได้ (≥3:1)`
        : 'สีนี้ยังอ่อนเกินไปสำหรับตัวอักษรบนพื้นขาว — ลองเลือกสีที่เข้มขึ้น';
    }
  };

  picker.addEventListener('input', () => {
    if (hexInput) hexInput.value = picker.value.toUpperCase();
    render(picker.value);
  });

  hexInput?.addEventListener('change', () => {
    const value = hexInput.value.trim();
    if (!hexToHsl(value)) {
      hexInput.value = picker.value.toUpperCase();
      return;
    }
    picker.value = value.startsWith('#') ? value : `#${value}`;
    render(picker.value);
  });

  if (hexInput) hexInput.value = picker.value.toUpperCase();
  render(picker.value);
}
