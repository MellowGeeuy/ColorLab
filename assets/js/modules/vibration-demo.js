/**
 * vibration-demo.js — ตัวอย่าง "ขอบสีสั่น" ของตอนที่ 04
 *
 * ตอนนั้นเตือนไว้แล้วว่าคู่ตรงข้ามที่ความสว่างเท่ากันจะสั่นตา แต่เดิมมีแต่ข้อความ
 * ไฟล์นี้ทำให้ผู้อ่านเลื่อนหาจุดนั้นเองได้ พร้อมอ่านค่า contrast ที่วัดจริงไปด้วย
 * จึงเห็นพร้อมกันว่า "ตาบอกว่าสั่น" กับ "ตัวเลขบอกว่า 1.1:1" เป็นเรื่องเดียวกัน
 *
 * สีคู่นี้จงใจใช้ hue ตรงข้ามกันจริง (350° กับ 170°) และตรึงความสดไว้สูงทั้งคู่
 * เพราะปรากฏการณ์นี้ต้องการทั้งสองเงื่อนไข — ลดความสดลงเมื่อไรขอบก็นิ่งเอง
 */

import { contrastRatio, hslToHex } from '../utils/color-utils.js';

const BASE = { h: 350, s: 85, l: 50 };
const PAIR_HUE = 170;

export function initVibrationDemo() {
  const root = document.querySelector('[data-vibe]');
  if (!root) return;

  const range = root.querySelector('[data-vibe-range]');
  const band = root.querySelector('[data-vibe-band]');
  const divider = root.querySelector('[data-vibe-divider]');
  const ratioOut = root.querySelector('[data-vibe-ratio]');
  const verdictOut = root.querySelector('[data-vibe-verdict]');
  const hexOut = root.querySelector('[data-vibe-hex]');
  if (!range || !band) return;

  const baseHex = hslToHex(BASE);

  const render = () => {
    const l = Number(range.value);
    const pairHex = hslToHex({ h: PAIR_HUE, s: BASE.s, l });
    const ratio = contrastRatio(baseHex, pairHex);

    root.style.setProperty('--vibe-a', baseHex);
    root.style.setProperty('--vibe-b', pairHex);
    band.classList.toggle('is-split', Boolean(divider?.checked));

    if (ratioOut) ratioOut.textContent = `${ratio.toFixed(2)}:1`;
    if (hexOut) hexOut.textContent = pairHex.toUpperCase();

    if (verdictOut) {
      /* เส้นแบ่งสองเส้นนี้คือเกณฑ์ WCAG ตรง ๆ — 3:1 คือขั้นต่ำของ non-text (1.4.11)
         และ 4.5:1 คือขั้นต่ำของตัวอักษรปกติ (1.4.3) ไม่ใช่ค่าที่ตั้งเอาเอง */
      const state = ratio < 1.6 ? 'bad' : ratio < 3 ? 'warn' : 'good';
      const label = {
        bad: 'ขอบสั่น เพราะสองสีสว่างเกือบเท่ากัน ตาเลยจับเส้นแบ่งไม่นิ่ง',
        warn: 'ดีขึ้นแต่ยังไม่พอ ยังต่ำกว่า 3:1 เอาไปทำขอบหรือไอคอนไม่ได้',
        good: 'ขอบนิ่งแล้ว ผ่านเกณฑ์ 3:1 ของ non-text',
      }[state];

      verdictOut.textContent = label;
      verdictOut.className = `badge vibe__verdict badge--${state === 'good' ? 'pass' : 'fail'}`;
    }
  };

  range.addEventListener('input', render);
  divider?.addEventListener('change', render);
  render();
}
