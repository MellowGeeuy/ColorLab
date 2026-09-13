/**
 * contrast-demo.js — เครื่องวัดคอนทราสต์ย่อของตอนที่ 08
 *
 * หน้า Colorground มี modules/contrast-checker.js ที่ผูกกับ palette ของผู้ใช้อยู่แล้ว
 * ตัวนี้เป็นคนละงาน — ไม่ต้องมี palette ไม่ต้องมี store ขอแค่คู่สีสองสีแล้วตอบว่า
 * ผ่านข้อไหนของ WCAG บ้าง พร้อมวางตัวอย่างจริงสี่ชิ้นที่เกณฑ์คนละข้อกันไว้ข้าง ๆ
 * ให้เห็นว่า "ผ่าน 3:1 แต่ไม่ผ่าน 4.5:1" หน้าตาเป็นอย่างไรในงานจริง
 *
 * เกณฑ์ทั้งสี่ข้ออ้างจาก WCAG 2.2 ระดับ AA/AAA โดยตรง ตัวเลขไม่ได้ตั้งเอง
 *   1.4.3 Contrast (Minimum)  ตัวอักษรปกติ 4.5:1 (AA) · 7:1 (AAA)
 *                             ตัวใหญ่ (24px ขึ้นไป หรือ 18.66px ตัวหนา) 3:1 (AA)
 *   1.4.11 Non-text Contrast  ไอคอน เส้นขอบ ตัวชี้โฟกัส 3:1
 */

import { contrastRatio, wcagResults } from '../utils/color-utils.js';

const LEVELS = [
  { key: 'normalAA', label: 'ข้อความปกติ · AA', sc: '1.4.3', need: '4.5:1' },
  { key: 'normalAAA', label: 'ข้อความปกติ · AAA', sc: '1.4.3', need: '7:1' },
  { key: 'largeAA', label: 'ข้อความตัวใหญ่ · AA', sc: '1.4.3', need: '3:1' },
  { key: 'uiComponent', label: 'ไอคอน / เส้นขอบ / โฟกัส', sc: '1.4.11', need: '3:1' },
];

export function initContrastDemo() {
  const root = document.querySelector('[data-wcag-demo]');
  if (!root) return;

  const fg = root.querySelector('[data-wcag-fg]');
  const bg = root.querySelector('[data-wcag-bg]');
  const fgHex = root.querySelector('[data-wcag-fg-hex]');
  const bgHex = root.querySelector('[data-wcag-bg-hex]');
  const swap = root.querySelector('[data-wcag-swap]');
  const ratioOut = root.querySelector('[data-wcag-ratio]');
  const verdictOut = root.querySelector('[data-wcag-verdict]');
  const levelsOut = root.querySelector('[data-wcag-levels]');
  const presets = [...root.querySelectorAll('[data-wcag-preset]')];
  if (!fg || !bg) return;

  const render = () => {
    const ratio = contrastRatio(fg.value, bg.value);
    const results = wcagResults(ratio);

    root.style.setProperty('--wcag-fg', fg.value);
    root.style.setProperty('--wcag-bg', bg.value);
    if (fgHex) fgHex.textContent = fg.value.toUpperCase();
    if (bgHex) bgHex.textContent = bg.value.toUpperCase();
    if (ratioOut) ratioOut.textContent = `${ratio.toFixed(2)}:1`;

    if (verdictOut) {
      /* สรุปเป็นประโยคเดียวว่าคู่สีนี้ "ใช้ทำอะไรได้" ไม่ใช่แค่ผ่าน/ไม่ผ่าน
         เพราะคู่สีที่ตกตัวอักษรปกติมักยังใช้เป็นหัวข้อใหญ่หรือเส้นขอบได้อยู่ */
      const text = results.normalAAA ? 'ใช้ได้ทุกขนาด ผ่านถึงระดับ AAA'
        : results.normalAA ? 'ใช้กับข้อความได้ทุกขนาด ผ่าน AA'
        : results.largeAA ? 'ใช้ได้เฉพาะตัวใหญ่ ไอคอน และเส้นขอบ'
        : 'คู่นี้ยังใช้กับข้อความหรือของที่ต้องมองเห็นไม่ได้';
      /* เขียวเฉพาะตอนที่ใช้กับตัวอักษรได้ทุกขนาดจริง ๆ — คู่สีที่ผ่านแค่ 3:1
         ยังตกเกณฑ์ข้อความปกติอยู่ ให้ป้ายเป็นกลางไว้ ไม่งั้นจะอ่านว่า "ผ่านแล้ว" */
      verdictOut.textContent = text;
      verdictOut.className = `badge wcag-demo__verdict badge--${
        results.normalAA ? 'pass' : results.largeAA ? 'neutral' : 'fail'}`;
    }

    if (levelsOut) {
      levelsOut.replaceChildren(...LEVELS.map(({ key, label, sc, need }) => {
        const row = document.createElement('li');
        row.className = 'wcag-demo__level';
        row.innerHTML = `
          <span class="wcag-demo__level-name">${label}
            <small>SC ${sc} · ต้อง ${need}</small></span>
          <span class="badge badge--${results[key] ? 'pass' : 'fail'}">${results[key] ? 'ผ่าน' : 'ไม่ผ่าน'}</span>`;
        return row;
      }));
    }
  };

  fg.addEventListener('input', render);
  bg.addEventListener('input', render);

  swap?.addEventListener('click', () => {
    const keep = fg.value;
    fg.value = bg.value;
    bg.value = keep;
    render();
  });

  presets.forEach((btn) => {
    btn.addEventListener('click', () => {
      const [presetFg, presetBg] = btn.dataset.wcagPreset.split('|');
      fg.value = presetFg;
      bg.value = presetBg;
      render();
    });
  });

  render();
}
