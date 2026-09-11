/**
 * auto-palette-panel.js — แผงสร้างชุดสีอัตโนมัติจากสีตั้งต้นสีเดียว
 *
 * ผู้ใช้ใส่รหัสสี จิ้มวงล้อ หรือกดสุ่ม แล้วได้ชุดสีสำเร็จรูปเจ็ดแบบทันที
 * กด "ใช้ชุดนี้" แล้วสีจะไหลเข้า palette ของระบบผ่าน store ตัวเดียวกับทุกเครื่องมือ
 */

import {
  buildAutoPalettes, toPaletteSeed,
} from '../utils/auto-palette.js';
import {
  hexToHsl, hslToHex, readableTextOn, contrastRatio,
  rgbHueToRybHue, rybHueToRgbHue,
} from '../utils/color-utils.js';
import { parseHexList } from '../utils/palette-tokens.js';
import { saveToLibrary, MAX_LIBRARY_ENTRIES } from '../utils/palette-library-store.js';

/**
 * วงล้อนี้เลือกได้สองค่าพร้อมกัน — มุมคือเนื้อสี ระยะจากจุดกึ่งกลางคือความอิ่มสี
 * กลางวงคือสีจืดสนิท ขอบวงคืออิ่มเต็มที่ จึงจิ้มที่ไหนก็ได้ ไม่ใช่แค่ขอบ
 */
const MAX_MARKER_RADIUS = 46;

function markerPosition(wheelAngle, saturation) {
  const radians = ((wheelAngle - 90) * Math.PI) / 180;
  const radius = (saturation / 100) * MAX_MARKER_RADIUS;
  return {
    x: 50 + radius * Math.cos(radians),
    y: 50 + radius * Math.sin(radians),
  };
}

const SAVED_FEEDBACK_MS = 2200;

/** แถบแจ้งผลลอยมุมล่าง — ใช้ตัวเดียวตลอดหน้า ถ้ามีอันเก่าค้างอยู่ให้แทนที่ */
function showToast(message, colors) {
  document.querySelector('.ground-toast')?.remove();

  const toast = document.createElement('div');
  toast.className = 'ground-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <svg class="icon" aria-hidden="true"><use href="#i-check-circle"/></svg>
    <span class="ground-toast__text">${message}</span>
    <span class="ground-toast__strip" aria-hidden="true">
      ${colors.map((hex) => `<span style="background:${hex}"></span>`).join('')}
    </span>
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-in'));

  window.setTimeout(() => {
    toast.classList.remove('is-in');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, SAVED_FEEDBACK_MS);
}

/** ปุ่มกับการ์ดต้องตอบทันทีที่กด ไม่ให้ผู้ใช้ต้องไปมองข้อความท้ายหน้าเพื่อรู้ว่ากดติดหรือยัง */
function markSaved(card, button, set, name, stored) {
  const label = button.querySelector('[data-label]');
  const original = label.textContent;

  button.classList.add('is-saved');
  button.disabled = true;
  label.textContent = 'บันทึกแล้ว';
  card.classList.add('is-saved');

  showToast(
    stored ? `บันทึกชุด ${set.name} แล้ว` : `ใช้ชุด ${set.name} แล้ว (บันทึกลงเครื่องไม่ได้)`,
    set.colors,
  );

  window.setTimeout(() => {
    button.classList.remove('is-saved');
    button.disabled = false;
    label.textContent = original;
    card.classList.remove('is-saved');
  }, SAVED_FEEDBACK_MS);
}

export function initAutoPalettePanel(store) {
  const root = document.querySelector('#auto-palette');
  if (!root) return;

  const wheel = root.querySelector('#auto-wheel');
  const marker = root.querySelector('#auto-wheel-marker');
  const input = root.querySelector('#auto-hex');
  const preview = root.querySelector('#auto-seed-preview');
  const results = root.querySelector('#auto-results');
  const status = root.querySelector('#auto-status');
  const lightRange = root.querySelector('#auto-light');
  const lightValue = root.querySelector('#auto-light-value');

  let seed = store?.getPalette().primary ?? '#845ec2';

  const renderSeed = () => {
    const hsl = hexToHsl(seed);
    const angle = rgbHueToRybHue(hsl.h);
    const { x, y } = markerPosition(angle, hsl.s);

    // ทั้งจานสว่างหรือมืดตามค่าที่กำลังเลือก ผู้ใช้จึงเห็นว่าที่ความสว่างนี้ เนื้อสีอื่นจะออกมาแบบไหน
    wheel.style.setProperty('--wheel-l', `${Math.round(hsl.l)}%`);
    marker.style.insetInlineStart = `${x}%`;
    marker.style.insetBlockStart = `${y}%`;
    marker.style.backgroundColor = seed;

    preview.style.backgroundColor = seed;
    preview.style.color = readableTextOn(seed);
    preview.textContent = seed.toUpperCase();

    if (document.activeElement !== input) input.value = seed.toUpperCase();
    if (lightRange && document.activeElement !== lightRange) {
      lightRange.value = String(Math.round(hsl.l));
    }
    if (lightValue) lightValue.textContent = `${Math.round(hsl.l)}%`;

    wheel.setAttribute('aria-valuenow', String(Math.round(angle)));
    wheel.setAttribute('aria-valuetext', `ตำแหน่งบนวงล้อ ${Math.round(angle)} องศา`);
  };

  const renderResults = () => {
    const sets = buildAutoPalettes(seed);

    results.replaceChildren();

    sets.forEach((set) => {
      const card = document.createElement('article');
      card.className = 'auto-card';

      const swatches = set.colors.map((hex) => {
        const ratio = contrastRatio(hex, '#ffffff');
        const label = ratio >= 3 ? 'วางตัวอักษรขาวได้' : 'ต้องใช้ตัวอักษรเข้ม';
        return `
          <button type="button" class="auto-card__swatch" data-hex="${hex}"
                  style="background:${hex};color:${readableTextOn(hex)}"
                  title="${hex.toUpperCase()} · ${label} · คลิกเพื่อคัดลอก">
            <span>${hex.toUpperCase()}</span>
          </button>`;
      }).join('');

      card.innerHTML = `
        <div class="auto-card__head">
          <div>
            <h3 class="auto-card__name">${set.name}</h3>
            <p class="auto-card__thai">${set.thai}</p>
          </div>
          <div class="auto-card__actions">
            <button type="button" class="btn btn--sm btn--icon" title="ส่งออกเป็นโค้ด"
                    aria-label="ส่งออกชุด ${set.name} เป็นโค้ด"
                    data-export-set="${set.colors.join(',')}"
                    data-export-primary="${set.primaryHex}"
                    data-export-name="${set.name}">
              <svg class="icon" aria-hidden="true"><use href="#i-code"/></svg>
            </button>
            <button type="button" class="btn btn--sm btn--primary auto-card__save" data-apply="${set.id}">
              <svg class="icon" aria-hidden="true"><use href="#i-tag"/></svg>
              <span data-label>บันทึกชุดสี</span>
            </button>
          </div>
        </div>
        <div class="auto-card__row">${swatches}</div>
        <p class="auto-card__note">${set.note}</p>
      `;

      card.querySelector('[data-apply]').addEventListener('click', (event) => {
        const button = event.currentTarget;
        const { primary, accents } = toPaletteSeed(set.colors, set.primaryHex);
        const palette = { ...store.getPalette(), primary, accents };

        // ชื่อประกอบจากสูตรกับสีแบรนด์ เพื่อให้คลังค้นเจอโดยไม่ต้องพิมพ์ชื่อเอง
        const name = `${set.name} · ${primary.toUpperCase()}`;
        const result = saveToLibrary(name, palette);

        if (!result.ok && result.reason === 'full') {
          status.textContent = `คลังเต็มแล้ว (${MAX_LIBRARY_ENTRIES} ชุด) — ลบชุดที่ไม่ใช้ออกก่อนได้ที่หน้า Component Style หรือ Layout`;
          return;
        }

        window.dispatchEvent(new CustomEvent('palette-library-changed'));

        // บันทึกแล้วตั้งเป็นชุดที่ใช้งานอยู่ด้วย — หน้า Component Style และเครื่องมืออื่น
        // อ่านจาก store ตัวเดียวกัน ชุดที่เพิ่งบันทึกจึงถูกใช้ได้ทันทีโดยไม่ต้องไปเลือกซ้ำในคลัง
        store.applyPalette(palette);

        markSaved(card, button, set, name, result.ok);

        status.textContent = result.ok
          ? `บันทึก "${name}" แล้ว และตั้งเป็นชุดสีที่ใช้อยู่ — ใช้ได้ทันทีในหน้า Component Style และเครื่องมืออื่น`
          : `ตั้ง "${name}" เป็นชุดสีที่ใช้อยู่แล้ว แต่เบราว์เซอร์ไม่ให้บันทึกลงเครื่อง — ปิดหน้านี้แล้วชุดจะหาย`;
      });

      results.appendChild(card);
    });
  };

  const render = () => {
    renderSeed();
    renderResults();
  };

  const setSeed = (hex, message) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
    seed = hex.toLowerCase();
    render();
    if (message) status.textContent = message;
  };

  /* --- วงล้อ --- */
  let dragging = false;

  /** คืนทั้งเนื้อสีและความอิ่มจากตำแหน่งที่จิ้ม — มุมให้เนื้อสี ระยะให้ความอิ่ม */
  const colorFromPointer = (event) => {
    const rect = wheel.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    const degrees = (Math.atan2(y, x) * 180) / Math.PI + 90;
    const distance = Math.sqrt(x * x + y * y) / (rect.width / 2);

    return {
      h: rybHueToRgbHue((degrees + 360) % 360),
      s: Math.round(Math.min(1, distance / (MAX_MARKER_RADIUS / 50)) * 100),
    };
  };

  const applyPointer = (event) => {
    const current = hexToHsl(seed);
    const { h, s } = colorFromPointer(event);
    seed = hslToHex({ h, s, l: current.l });
    render();
  };

  wheel.addEventListener('pointerdown', (event) => {
    dragging = true;
    wheel.setPointerCapture(event.pointerId);
    applyPointer(event);
  });

  wheel.addEventListener('pointermove', (event) => {
    if (dragging) applyPointer(event);
  });

  wheel.addEventListener('pointerup', () => { dragging = false; });
  wheel.addEventListener('pointercancel', () => { dragging = false; });

  wheel.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 15 : 5;
    const current = hexToHsl(seed);
    const angle = rgbHueToRybHue(current.h);
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      seed = hslToHex({ ...current, h: rybHueToRgbHue(angle + step) });
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      seed = hslToHex({ ...current, h: rybHueToRgbHue(angle - step) });
    } else return;
    event.preventDefault();
    render();
  });

  /* --- ช่องรหัสสี --- */
  input.addEventListener('input', () => {
    const value = input.value.trim();
    const found = parseHexList(value);
    if (found.length > 0) setSeed(found[0]);
  });

  input.addEventListener('blur', renderSeed);

  lightRange?.addEventListener('input', () => {
    const current = hexToHsl(seed);
    seed = hslToHex({ ...current, l: Number(lightRange.value) });
    render();
  });

  // คลิกที่ช่องสีในผลลัพธ์เพื่อคัดลอกรหัส — เร็วกว่าการพิมพ์ตาม
  results.addEventListener('click', async (event) => {
    const swatch = event.target.closest('[data-hex]');
    if (!swatch) return;
    try {
      await navigator.clipboard.writeText(swatch.dataset.hex);
      status.textContent = `คัดลอก ${swatch.dataset.hex.toUpperCase()} แล้ว`;
    } catch {
      status.textContent = 'เบราว์เซอร์ไม่ให้คัดลอกอัตโนมัติ';
    }
  });

  render();
}
