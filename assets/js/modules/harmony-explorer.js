/**
 * harmony-explorer.js — วงล้อสีในหน้า Color Theory หัวข้อ 4
 *
 * ให้ผู้อ่านลากเลือกสีตั้งต้นแล้วสลับสูตร harmony ดูผลได้จริงตามที่หัวข้อบอกไว้
 * เป็นวงล้อศิลปะ (RYB) เหมือนกับ Colorground — คู่ตรงข้ามของม่วงจึงเป็นเหลือง
 * ตัวคำนวณทั้งหมดอยู่ที่ color-utils.js ไม่มีสูตรซ้ำที่นี่
 */

import {
  buildHarmony, hslToHex, readableTextOn, rgbHueToRybHue, rybHueToRgbHue,
  HARMONY_LABELS, HARMONY_HINTS,
} from '../utils/color-utils.js';

const TYPES = [
  'complementary', 'analogous', 'triadic',
  'split-complementary', 'tetradic', 'square', 'monochromatic',
];

const MARKER_RADIUS_PERCENT = 38;

function positionOf(wheelAngle) {
  const radians = ((wheelAngle - 90) * Math.PI) / 180;
  return {
    x: 50 + MARKER_RADIUS_PERCENT * Math.cos(radians),
    y: 50 + MARKER_RADIUS_PERCENT * Math.sin(radians),
  };
}

export function initHarmonyExplorer() {
  const root = document.querySelector('#harmony-explorer');
  if (!root) return;

  const disc = root.querySelector('#harmony-explorer-disc');
  const chips = Array.from(root.querySelectorAll('[data-harmony]'));
  const setBox = root.querySelector('#harmony-explorer-set');
  const hint = root.querySelector('#harmony-explorer-hint');
  const preview = root.querySelector('#harmony-explorer-preview');

  const state = { hue: 225, type: 'complementary' };

  const render = () => {
    const base = { h: state.hue, s: 72, l: 55 };
    const colors = buildHarmony(base, state.type);

    disc.querySelectorAll('.harmony-explorer__pin').forEach((node) => node.remove());

    const pins = state.type === 'monochromatic' ? [base] : colors;
    pins.forEach((hsl, index) => {
      const pin = document.createElement('span');
      pin.className = index === 0
        ? 'harmony-explorer__pin harmony-explorer__pin--main'
        : 'harmony-explorer__pin';
      const { x, y } = positionOf(rgbHueToRybHue(hsl.h));
      pin.style.insetInlineStart = `${x}%`;
      pin.style.insetBlockStart = `${y}%`;
      pin.style.backgroundColor = hslToHex(hsl);
      disc.appendChild(pin);
    });

    setBox.replaceChildren();
    colors.forEach((hsl) => {
      const hex = hslToHex(hsl);
      const chip = document.createElement('span');
      chip.className = 'harmony-explorer__swatch';
      chip.style.backgroundColor = hex;
      chip.style.color = readableTextOn(hex);
      chip.textContent = hex.toUpperCase();
      setBox.appendChild(chip);
    });

    if (hint) hint.textContent = HARMONY_HINTS[state.type] ?? '';

    if (preview) {
      const primary = hslToHex(colors[0]);
      const accent = hslToHex(colors[colors.length - 1]);
      const surface = hslToHex({ h: colors[0].h, s: 24, l: 96 });
      preview.style.backgroundColor = surface;
      preview.style.color = readableTextOn(surface);
      preview.querySelector('[data-role="primary"]').style.backgroundColor = primary;
      preview.querySelector('[data-role="primary"]').style.color = readableTextOn(primary);
      preview.querySelector('[data-role="accent"]').style.borderColor = accent;
      preview.querySelector('[data-role="accent"]').style.color = readableTextOn(surface);
    }

    const angle = Math.round(rgbHueToRybHue(state.hue));
    disc.setAttribute('aria-valuenow', String(angle));
    disc.setAttribute('aria-valuetext', `ตำแหน่งบนวงล้อ ${angle} องศา`);

    chips.forEach((chip) => {
      const active = chip.dataset.harmony === state.type;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
  };

  const hueFromPointer = (event) => {
    const rect = disc.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    const degrees = (Math.atan2(y, x) * 180) / Math.PI + 90;
    return rybHueToRgbHue((degrees + 360) % 360);
  };

  let dragging = false;

  disc.addEventListener('pointerdown', (event) => {
    dragging = true;
    disc.setPointerCapture(event.pointerId);
    state.hue = hueFromPointer(event);
    render();
  });

  disc.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    state.hue = hueFromPointer(event);
    render();
  });

  disc.addEventListener('pointerup', () => { dragging = false; });
  disc.addEventListener('pointercancel', () => { dragging = false; });

  disc.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 15 : 5;
    const angle = rgbHueToRybHue(state.hue);
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') state.hue = rybHueToRgbHue(angle + step);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') state.hue = rybHueToRgbHue(angle - step);
    else return;
    event.preventDefault();
    render();
  });

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      state.type = chip.dataset.harmony;
      render();
    });
  });

  render();
}

export { TYPES as HARMONY_TYPES, HARMONY_LABELS };
