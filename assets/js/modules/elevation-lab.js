/**
 * elevation-lab.js — ยกระดับความสูงของพื้นผิวในธีมมืด (ตอนที่ 09)
 *
 * ธีมสว่างบอกความสูงด้วยเงา ธีมมืดทำแบบนั้นไม่ได้เพราะเงาคือการทำให้มืดลง
 * แต่พื้นก็มืดอยู่แล้ว จึงใช้วิธีตรงข้าม คือวางขาวโปร่งทับให้พื้นผิวสว่างขึ้นทีละนิด
 *
 * ค่าความทึบของแต่ละระดับอ้างจากตาราง elevation overlay ของ Material
 * (0dp 0% · 1dp 5% · 2dp 7% · 3dp 8% · 6dp 11% · 8dp 12%) ไม่ได้ตั้งเอง
 * และคำนวณสีผลลัพธ์แบบผสมสีปกติ ซึ่งเป็นสิ่งที่เบราว์เซอร์ทำจริงเมื่อวางขาวโปร่งทับ
 */

import { hexToRgb, rgbToHex, contrastRatio } from '../utils/color-utils.js';

const BASE = '#0f1729';
const TEXT = '#e2e8f0';
const OVERLAYS = [0, 0.05, 0.07, 0.08, 0.11, 0.12];

const NAMES = ['พื้นหน้าจอ', 'การ์ด', 'การ์ดที่ยกขึ้น', 'เมนูลอย', 'กล่องแจ้งเตือน', 'กล่องที่ลอยสูงสุด'];

function overlay(baseHex, alpha) {
  const b = hexToRgb(baseHex);
  return rgbToHex({
    r: b.r * (1 - alpha) + 255 * alpha,
    g: b.g * (1 - alpha) + 255 * alpha,
    b: b.b * (1 - alpha) + 255 * alpha,
  });
}

export function initElevationLab() {
  const root = document.querySelector('[data-elevlab]');
  if (!root) return;

  const range = root.querySelector('[data-elevlab-range]');
  const card = root.querySelector('[data-elevlab-card]');
  const out = {
    step: root.querySelector('[data-elevlab-step]'),
    overlay: root.querySelector('[data-elevlab-overlay]'),
    hex: root.querySelector('[data-elevlab-hex]'),
    ratio: root.querySelector('[data-elevlab-ratio]'),
  };
  if (!range || !card) return;

  const render = () => {
    const level = Number(range.value);
    const alpha = OVERLAYS[level];
    const hex = overlay(BASE, alpha);

    card.style.backgroundColor = hex;
    /* ยิ่งสูงยิ่งเยื้องเข้ามา ให้เห็นว่ามันวางซ้อนอยู่บนพื้น ไม่ใช่แค่เปลี่ยนสี */
    card.style.setProperty('--elev-inset', `${level * 6}px`);

    if (out.step) out.step.textContent = `ระดับ ${level} · ${NAMES[level]}`;
    if (out.overlay) out.overlay.textContent = `${Math.round(alpha * 100)}%`;
    if (out.hex) out.hex.textContent = hex.toUpperCase();
    if (out.ratio) out.ratio.textContent = `${contrastRatio(TEXT, hex).toFixed(2)}:1`;
  };

  range.addEventListener('input', render);
  render();
}
