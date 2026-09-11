/**
 * harmony-generator.js — วงล้อสีแบบคลิก/ลากได้ + สร้างชุดสีตามหลัก harmony
 */

import {
  buildHarmony, hslToHex, hexToHsl, formatHsl, readableTextOn,
  HARMONY_LABELS, HARMONY_HINTS, rybHueToRgbHue, rgbHueToRybHue,
} from '../utils/color-utils.js';

const MARKER_RADIUS_PERCENT = 39;

/**
 * มุมบนวงล้อคือมุมของวงล้อศิลปะ (RYB) ไม่ใช่ hue ของ HSL
 * ทุกจุดที่แปลงระหว่างตำแหน่งกับสีจึงต้องผ่านตัวแปลงเสมอ ไม่งั้นหมุดจะไปตกผิดสี
 */
function angleToPosition(wheelAngle) {
  // conic-gradient เริ่มที่ 12 นาฬิกาแล้วหมุนตามเข็ม จึงลบ 90° ให้ตรงกับพิกัดคณิตศาสตร์
  const radians = ((wheelAngle - 90) * Math.PI) / 180;
  return {
    x: 50 + MARKER_RADIUS_PERCENT * Math.cos(radians),
    y: 50 + MARKER_RADIUS_PERCENT * Math.sin(radians),
  };
}

function positionToHue(event, wheel) {
  const rect = wheel.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;
  const degrees = (Math.atan2(y, x) * 180) / Math.PI + 90;
  return Math.round((degrees + 360) % 360);
}

/**
 * @param {object} [store] ถ้าส่งมา จะเริ่มจากสีแบรนด์ปัจจุบัน และส่งชุดสีที่ได้กลับเข้า palette ได้
 */
export function initHarmonyGenerator(store) {
  const wheel = document.querySelector('#color-wheel');
  const swatches = document.querySelector('#harmony-swatches');
  const typeSelect = document.querySelector('#harmony-type');
  const description = document.querySelector('#harmony-description');
  const preview = document.querySelector('#harmony-preview');
  if (!wheel || !swatches) return;

  const state = { hue: 220, saturation: 72, lightness: 52 };
  const satInput = document.querySelector('#harmony-sat');
  const satLabel = document.querySelector('#harmony-sat-value');

  const renderMarkers = (colors) => {
    wheel.querySelectorAll('.wheel__marker').forEach((node) => node.remove());

    colors.forEach((hsl, index) => {
      const marker = document.createElement('span');
      marker.className = index === 0 ? 'wheel__marker' : 'wheel__marker wheel__marker--sub';
      const { x, y } = angleToPosition(rgbHueToRybHue(hsl.h));
      marker.style.insetInlineStart = `${x}%`;
      marker.style.insetBlockStart = `${y}%`;
      marker.style.backgroundColor = hslToHex(hsl);
      wheel.appendChild(marker);
    });
  };

  const renderSwatches = (colors) => {
    swatches.replaceChildren();

    colors.forEach((hsl, index) => {
      const hex = hslToHex(hsl);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'harmony__chip';
      chip.style.backgroundColor = hex;
      chip.style.color = readableTextOn(hex);
      chip.textContent = hex.toUpperCase();
      chip.title = `${formatHsl(hsl)} — คลิกเพื่อคัดลอก`;
      chip.setAttribute('aria-label', `สีที่ ${index + 1} ${hex} คลิกเพื่อคัดลอก`);

      chip.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(hex);
          const original = chip.textContent;
          chip.textContent = 'คัดลอกแล้ว';
          setTimeout(() => { chip.textContent = original; }, 900);
        } catch { /* clipboard ถูกบล็อก: ไม่ต้องรบกวนผู้ใช้ */ }
      });

      swatches.appendChild(chip);
    });
  };

  const renderPreview = (colors) => {
    if (!preview) return;

    const primary = hslToHex(colors[0]);
    const accent = hslToHex(colors[colors.length - 1]);
    const surface = hslToHex({ h: colors[0].h, s: Math.min(colors[0].s, 30), l: 96 });

    preview.style.backgroundColor = surface;
    preview.style.color = readableTextOn(surface);
    preview.querySelector('#harmony-btn-primary').style.backgroundColor = primary;
    preview.querySelector('#harmony-btn-primary').style.color = readableTextOn(primary);
    preview.querySelector('#harmony-btn-accent').style.borderColor = accent;
    preview.querySelector('#harmony-btn-accent').style.color = readableTextOn(surface);
  };

  const render = () => {
    const base = { h: state.hue, s: state.saturation, l: state.lightness };
    const type = typeSelect?.value ?? 'complementary';
    const colors = buildHarmony(base, type);

    renderMarkers(type === 'monochromatic' ? [base] : colors);
    renderSwatches(colors);
    renderPreview(colors);

    const wheelAngle = Math.round(rgbHueToRybHue(state.hue));
    wheel.setAttribute('aria-valuenow', String(wheelAngle));
    wheel.setAttribute('aria-valuetext', `ตำแหน่งบนวงล้อ ${wheelAngle} องศา`);

    if (description) {
      const hint = HARMONY_HINTS[type] ? ` ${HARMONY_HINTS[type]}` : '';
      description.textContent = `${HARMONY_LABELS[type] ?? ''}${hint}`;
    }
    if (satLabel) satLabel.textContent = `${state.saturation}%`;
  };

  let isDragging = false;

  const updateFromPointer = (event) => {
    state.hue = rybHueToRgbHue(positionToHue(event, wheel));
    render();
  };

  wheel.addEventListener('pointerdown', (event) => {
    isDragging = true;
    wheel.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  });

  wheel.addEventListener('pointermove', (event) => {
    if (isDragging) updateFromPointer(event);
  });

  wheel.addEventListener('pointerup', () => { isDragging = false; });
  wheel.addEventListener('pointercancel', () => { isDragging = false; });

  wheel.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 15 : 5;
    const angle = rgbHueToRybHue(state.hue);
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') state.hue = rybHueToRgbHue(angle + step);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') state.hue = rybHueToRgbHue(angle - step);
    else return;
    event.preventDefault();
    render();
  });

  typeSelect?.addEventListener('change', render);
  satInput?.addEventListener('input', () => {
    state.saturation = Number(satInput.value);
    render();
  });

  if (store) {
    const applyBtn = document.querySelector('#harmony-apply');
    const syncBtn = document.querySelector('#harmony-sync');
    const status = document.querySelector('#harmony-status');

    const pullFromPalette = (announce) => {
      const hsl = hexToHsl(store.getPalette().primary);
      if (!hsl) return;
      state.hue = hsl.h;
      state.saturation = hsl.s;
      state.lightness = hsl.l;
      if (satInput) satInput.value = String(Math.round(hsl.s));
      render();
      if (announce && status) status.textContent = `ดึงสีแบรนด์ปัจจุบันมาเป็นจุดตั้งต้นแล้ว (${state.hue}°)`;
    };

    applyBtn?.addEventListener('click', () => {
      const type = typeSelect?.value ?? 'complementary';
      const colors = buildHarmony(
        { h: state.hue, s: state.saturation, l: state.lightness }, type,
      );
      store.applyHexList(colors.map(hslToHex));
      if (status) {
        status.textContent = `ส่ง ${colors.length} สีเข้า palette แล้ว — สีแรกเป็นสีแบรนด์ ที่เหลือเป็น accent`;
      }
    });

    syncBtn?.addEventListener('click', () => pullFromPalette(true));
    pullFromPalette(false);
    return;
  }

  render();
}
