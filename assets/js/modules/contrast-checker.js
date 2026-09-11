/**
 * contrast-checker.js — คำนวณ contrast ratio ตาม WCAG 2.2 แบบเรียลไทม์
 */

import { contrastRatio, wcagResults } from '../utils/color-utils.js';
import { buildPaletteTokens } from '../utils/palette-tokens.js';

const LEVELS = [
  { key: 'normalAA', label: 'ตัวอักษรปกติ AA', requirement: '4.5:1' },
  { key: 'normalAAA', label: 'ตัวอักษรปกติ AAA', requirement: '7:1' },
  { key: 'largeAA', label: 'ตัวอักษรใหญ่ AA', requirement: '3:1' },
  { key: 'uiComponent', label: 'UI / ไอคอน', requirement: '3:1' },
];

/**
 * @param {object} [store] ถ้าส่งมา จะมีปุ่มลัดหยิบคู่สีจริงจาก palette ที่กำลังแก้มาตรวจ
 */
export function initContrastChecker(store) {
  const preview = document.querySelector('#contrast-preview');
  const bgPicker = document.querySelector('#contrast-bg');
  const fgPicker = document.querySelector('#contrast-fg');
  const bgHex = document.querySelector('#contrast-bg-hex');
  const fgHex = document.querySelector('#contrast-fg-hex');
  const ratioOut = document.querySelector('#contrast-ratio');
  const verdictOut = document.querySelector('#contrast-verdict');
  const levelsOut = document.querySelector('#contrast-levels');
  const swapBtn = document.querySelector('#contrast-swap');
  if (!preview || !bgPicker || !fgPicker) return;

  const render = () => {
    const bg = bgPicker.value;
    const fg = fgPicker.value;
    const ratio = contrastRatio(bg, fg);
    const results = wcagResults(ratio);

    preview.style.backgroundColor = bg;
    preview.style.color = fg;

    if (bgHex) bgHex.value = bg.toUpperCase();
    if (fgHex) fgHex.value = fg.toUpperCase();
    if (ratioOut) ratioOut.textContent = `${ratio.toFixed(2)}:1`;

    if (verdictOut) {
      if (results.normalAAA) {
        verdictOut.textContent = 'ยอดเยี่ยม — ผ่าน AAA';
        verdictOut.className = 'badge badge--pass';
      } else if (results.normalAA) {
        verdictOut.textContent = 'ใช้ได้ — ผ่าน AA';
        verdictOut.className = 'badge badge--pass';
      } else if (results.largeAA) {
        verdictOut.textContent = 'ใช้ได้เฉพาะตัวใหญ่';
        verdictOut.className = 'badge badge--neutral';
      } else {
        verdictOut.textContent = 'ไม่ผ่านเกณฑ์';
        verdictOut.className = 'badge badge--fail';
      }
    }

    if (levelsOut) {
      levelsOut.replaceChildren();
      LEVELS.forEach(({ key, label, requirement }) => {
        const row = document.createElement('div');
        row.className = 'contrast__level';

        const name = document.createElement('span');
        name.textContent = `${label} (${requirement})`;

        const status = document.createElement('span');
        status.className = results[key] ? 'badge badge--pass' : 'badge badge--fail';
        status.textContent = results[key] ? 'ผ่าน' : 'ไม่ผ่าน';

        row.append(name, status);
        levelsOut.appendChild(row);
      });
    }
  };

  const bindHexInput = (input, picker) => {
    input?.addEventListener('change', () => {
      const value = input.value.trim();
      const normalized = value.startsWith('#') ? value : `#${value}`;
      if (!/^#[0-9a-f]{6}$/i.test(normalized)) {
        input.value = picker.value.toUpperCase();
        return;
      }
      picker.value = normalized;
      render();
    });
  };

  bgPicker.addEventListener('input', render);
  fgPicker.addEventListener('input', render);
  bindHexInput(bgHex, bgPicker);
  bindHexInput(fgHex, fgPicker);

  swapBtn?.addEventListener('click', () => {
    const temp = bgPicker.value;
    bgPicker.value = fgPicker.value;
    fgPicker.value = temp;
    render();
  });

  const presetHost = document.querySelector('#contrast-presets');
  if (store && presetHost) {
    const PAIRS = [
      { label: 'ตัวอักษร / พื้นหน้า', fg: '--pv-text', bg: '--pv-bg' },
      { label: 'ตัวอักษร / การ์ด', fg: '--pv-text', bg: '--pv-surface' },
      { label: 'ตัวอักษร / ปุ่มหลัก', fg: '--pv-on-primary', bg: '--pv-primary' },
      { label: 'ลิงก์แบรนด์ / การ์ด', fg: '--pv-primary-text', bg: '--pv-surface' },
      { label: 'ตัวอักษรรอง / การ์ด', fg: '--pv-text-muted', bg: '--pv-surface' },
    ];

    const renderPresets = (palette, theme) => {
      const { tokens } = buildPaletteTokens(palette, theme);
      presetHost.replaceChildren();

      PAIRS.forEach((pair) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chip';
        button.textContent = pair.label;
        button.addEventListener('click', () => {
          bgPicker.value = tokens[pair.bg];
          fgPicker.value = tokens[pair.fg];
          render();
        });
        presetHost.appendChild(button);
      });
    };

    store.subscribe(renderPresets);
  }

  render();
}
