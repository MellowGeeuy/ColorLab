/**
 * model-lab.js — เทียบ "ความสว่างที่ตั้งไว้" กับ "ความสว่างที่ตาเห็น" ของตอนที่ 03
 *
 * ภาพนิ่งในตอนนั้นแสดงแถบ HSL กับ OKLCH ที่ถอดสีออกแล้วให้ดูอยู่แล้ว ไฟล์นี้เติม
 * ส่วนที่ภาพนิ่งทำไม่ได้ — ตัวเลข ผู้อ่านลากหาเนื้อสีเองแล้วเห็นว่าค่าความสว่าง
 * สัมพัทธ์ตามสูตร WCAG ของฝั่ง HSL วิ่งจาก 8.6% ถึง 75.1% ทั้งที่ตั้ง L ไว้ 55%
 * เท่ากันตลอด ส่วนฝั่ง OKLCH ขยับอยู่ในช่วง 22.2–25.5% เท่านั้น
 *
 * เลือก chroma 0.10 เพราะเป็นค่าสูงสุดที่ยังอยู่ใน sRGB ครบทั้ง 360 องศา
 * ถ้าดันขึ้นเป็น 0.11 จะมี 32 องศาที่หลุด gamut แล้วต้องถูกตัดค่า
 * ซึ่งจะทำให้ความสว่างเพี้ยนไปเอง — ตัวอย่างจะสอนผิดทันที
 */

import { hslToHex, oklchToHex, relativeLuminance, hexToRgb } from '../utils/color-utils.js';

const HSL = { s: 80, l: 55 };
const OK = { l: 0.62, c: 0.1 };

const lumPercent = (hex) => `${(relativeLuminance(hexToRgb(hex)) * 100).toFixed(1)}%`;

export function initModelLab() {
  const root = document.querySelector('[data-model-lab]');
  if (!root) return;

  const range = root.querySelector('[data-model-range]');
  const out = {
    hue: root.querySelector('[data-model-hue]'),
    hslHex: root.querySelector('[data-model-hsl-hex]'),
    hslLum: root.querySelector('[data-model-hsl-lum]'),
    okHex: root.querySelector('[data-model-ok-hex]'),
    okLum: root.querySelector('[data-model-ok-lum]'),
  };
  if (!range) return;

  const render = () => {
    const h = Number(range.value);
    const hslHex = hslToHex({ h, ...HSL });
    const okHex = oklchToHex({ ...OK, h });

    root.style.setProperty('--model-hsl', hslHex);
    root.style.setProperty('--model-ok', okHex);

    if (out.hue) out.hue.textContent = `${h}°`;
    if (out.hslHex) out.hslHex.textContent = hslHex.toUpperCase();
    if (out.okHex) out.okHex.textContent = okHex.toUpperCase();
    if (out.hslLum) out.hslLum.textContent = lumPercent(hslHex);
    if (out.okLum) out.okLum.textContent = lumPercent(okHex);
  };

  range.addEventListener('input', render);
  render();
}
