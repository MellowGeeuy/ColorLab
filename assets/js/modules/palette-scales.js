/**
 * palette-scales.js — กางสเกล 50–950 ของทุกบทบาทใน palette ปัจจุบัน
 * และบอกว่าขั้นไหนใช้เป็นตัวอักษร/เส้นขอบบนพื้นของธีมนั้นได้จริง
 */

import { buildPaletteTokens, ROLES, ROLE_LABELS } from '../utils/palette-tokens.js';
import { contrastRatio } from '../utils/color-utils.js';

export function initPaletteScales(store) {
  const container = document.querySelector('#scales-grid');
  if (!container) return;

  const note = document.querySelector('#scales-note');
  const status = document.querySelector('#scales-status');

  const copy = async (hex, label) => {
    try {
      await navigator.clipboard.writeText(hex);
      if (status) status.textContent = `คัดลอก ${hex.toUpperCase()} (${label}) แล้ว`;
    } catch {
      if (status) status.textContent = `เบราว์เซอร์บล็อกการคัดลอก — รหัสสีคือ ${hex.toUpperCase()}`;
    }
  };

  const render = (palette, theme) => {
    const { tokens, scales } = buildPaletteTokens(palette, theme);
    const surface = tokens['--pv-surface'];
    container.replaceChildren();

    ROLES.forEach((role) => {
      const block = document.createElement('section');
      block.className = 'scale-block';

      const head = document.createElement('div');
      head.className = 'scale-block__head';

      const title = document.createElement('h3');
      title.className = 'scale-block__title';
      title.textContent = ROLE_LABELS[role];

      const base = document.createElement('span');
      base.className = 'badge badge--neutral';
      base.textContent = palette[role].toUpperCase();

      head.append(title, base);

      const strip = document.createElement('div');
      strip.className = 'scale-strip';

      scales[role].forEach((entry) => {
        const ratio = contrastRatio(entry.hex, surface);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = entry.isBase ? 'scale-strip__cell is-base' : 'scale-strip__cell';
        cell.style.backgroundColor = entry.hex;
        cell.style.color = entry.onColor;
        cell.title = `${ROLE_LABELS[role]} ${entry.step} · ${entry.hex.toUpperCase()} · ${ratio.toFixed(2)}:1 บนพื้นการ์ด — คลิกเพื่อคัดลอก`;
        cell.setAttribute('aria-label',
          `${ROLE_LABELS[role]} ขั้น ${entry.step} รหัส ${entry.hex} คอนทราสต์ ${ratio.toFixed(2)} ต่อ 1 คลิกเพื่อคัดลอก`);

        const step = document.createElement('span');
        step.className = 'scale-strip__step';
        step.textContent = entry.step;

        const value = document.createElement('span');
        value.className = 'scale-strip__ratio';
        // ติดดาวเฉพาะขั้นที่ใช้เป็นตัวอักษรได้ — เป็นข้อมูลที่ต้องรู้ตอนหยิบไปใช้จริง
        value.textContent = ratio >= 4.5 ? `${ratio.toFixed(1)} ★` : ratio.toFixed(1);

        cell.append(step, value);
        cell.addEventListener('click', () => copy(entry.hex, `${ROLE_LABELS[role]} ${entry.step}`));
        strip.appendChild(cell);
      });

      block.append(head, strip);
      container.appendChild(block);
    });

    if (note) {
      const usable = scales.primary
        .filter((entry) => contrastRatio(entry.hex, surface) >= 4.5)
        .map((entry) => entry.step);

      note.textContent = usable.length
        ? `ธีม${theme === 'dark' ? 'มืด' : 'สว่าง'} — สีแบรนด์ขั้น ${usable.join(', ')} ใช้เป็นสีตัวอักษรบนการ์ดได้ (★ = ผ่าน 4.5:1)`
        : `ธีม${theme === 'dark' ? 'มืด' : 'สว่าง'} — ยังไม่มีขั้นไหนของสีแบรนด์ที่ใช้เป็นตัวอักษรบนการ์ดได้ ลองปรับสีแบรนด์ให้เข้มขึ้น`;
    }
  };

  store.subscribe(render);
}
