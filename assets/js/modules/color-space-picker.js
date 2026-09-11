/**
 * color-space-picker.js — เลือกสีเองบนระนาบ Saturation × Value พร้อมอ่าน/พิมพ์ค่าได้ทุก color space
 * (HEX / RGB / HSL / HSV) ดูดสีจากหน้าจอด้วย EyeDropper และเก็บสีที่เจอไว้เป็นชุดก่อนส่งเข้า palette
 */

import {
  hexToHsv, hsvToHex, hexToRgb, rgbToHex, hexToHsl, formatHsl, formatRgb,
  contrastRatio, readableTextOn, clamp,
} from '../utils/color-utils.js';
import { ROLES, ROLE_LABELS, MAX_ACCENTS } from '../utils/palette-tokens.js';

const PLANE_W = 300;
const PLANE_H = 200;

function paintPlane(canvas, hue) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = `hsl(${hue} 100% 50%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const white = ctx.createLinearGradient(0, 0, canvas.width, 0);
  white.addColorStop(0, 'rgba(255,255,255,1)');
  white.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = white;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const black = ctx.createLinearGradient(0, 0, 0, canvas.height);
  black.addColorStop(0, 'rgba(0,0,0,0)');
  black.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = black;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function initColorSpacePicker(store) {
  const plane = document.querySelector('#cs-plane');
  const canvas = document.querySelector('#cs-canvas');
  const marker = document.querySelector('#cs-marker');
  const hueInput = document.querySelector('#cs-hue');
  if (!plane || !canvas || !marker || !hueInput) return;

  const swatch = document.querySelector('#cs-swatch');
  const hexInput = document.querySelector('#cs-hex');
  const rgbInput = document.querySelector('#cs-rgb');
  const hslInput = document.querySelector('#cs-hsl');
  const hsvOut = document.querySelector('#cs-hsv');
  const onWhite = document.querySelector('#cs-on-white');
  const onBlack = document.querySelector('#cs-on-black');
  const status = document.querySelector('#cs-status');
  const eyedropBtn = document.querySelector('#cs-eyedropper');
  const roleTargets = document.querySelector('#cs-role-targets');
  const accentBtn = document.querySelector('#cs-add-accent');
  const capturedList = document.querySelector('#cs-captured');
  const capturedCount = document.querySelector('#cs-captured-count');

  canvas.width = PLANE_W;
  canvas.height = PLANE_H;

  // HSV เป็น state หลัก ไม่ใช่ hex — เพราะที่ v=0 ทุกค่า h/s ให้ hex เดียวกัน (ดำสนิท)
  // ถ้าเก็บ hex เป็นหลัก marker จะกระโดดกลับมุมทุกครั้งที่ลากผ่านขอบมืด
  let hsv = hexToHsv('#4f46e5');
  let captured = [];

  const currentHex = () => hsvToHex(hsv);

  const announce = (message) => {
    if (status && message) status.textContent = message;
  };

  const renderCaptured = () => {
    if (!capturedList) return;
    capturedList.replaceChildren();

    captured.forEach((hex, index) => {
      const item = document.createElement('div');
      item.className = 'captured__item';

      const pick = document.createElement('button');
      pick.type = 'button';
      pick.className = 'captured__swatch';
      pick.style.backgroundColor = hex;
      pick.title = `${hex.toUpperCase()} — คลิกเพื่อกลับไปแก้สีนี้`;
      pick.setAttribute('aria-label', `เลือกสีที่เก็บไว้ ${hex}`);
      pick.addEventListener('click', () => setFromHex(hex, `กลับมาที่ ${hex.toUpperCase()}`));

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'captured__remove';
      remove.style.color = readableTextOn(hex);
      remove.title = 'เอาสีนี้ออก';
      remove.setAttribute('aria-label', `เอาสี ${hex} ออกจากที่เก็บ`);
      remove.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-x"/></svg>';
      remove.addEventListener('click', () => {
        captured = captured.filter((_, i) => i !== index);
        renderCaptured();
        announce(`เอา ${hex.toUpperCase()} ออกแล้ว เหลือ ${captured.length} สี`);
      });

      item.append(pick, remove);
      capturedList.appendChild(item);
    });

    if (capturedCount) capturedCount.textContent = `${captured.length} สี`;
  };

  const render = (message) => {
    const hex = currentHex();
    const rgb = hexToRgb(hex);
    const hsl = hexToHsl(hex);

    paintPlane(canvas, hsv.h);
    marker.style.left = `${hsv.s}%`;
    marker.style.top = `${100 - hsv.v}%`;
    marker.style.backgroundColor = hex;

    hueInput.value = String(Math.round(hsv.h));
    plane.setAttribute('aria-label',
      `ระนาบความอิ่มสีและความสว่าง — ตอนนี้ ${hex.toUpperCase()} `
      + `อิ่มสี ${Math.round(hsv.s)}% สว่าง ${Math.round(hsv.v)}% กดปุ่มลูกศรเพื่อปรับทีละขั้น`);

    if (swatch) {
      swatch.style.backgroundColor = hex;
      swatch.style.color = readableTextOn(hex);
    }
    // ไม่เขียนทับช่องที่ผู้ใช้กำลังพิมพ์อยู่ ไม่งั้นเคอร์เซอร์จะเด้งกลางคำ
    if (hexInput && document.activeElement !== hexInput) hexInput.value = hex.toUpperCase();
    if (rgbInput && document.activeElement !== rgbInput) rgbInput.value = formatRgb(rgb);
    if (hslInput && document.activeElement !== hslInput) hslInput.value = formatHsl(hsl);
    if (hsvOut) hsvOut.value = `hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%)`;

    const white = contrastRatio(hex, '#ffffff');
    const black = contrastRatio(hex, '#000000');
    if (onWhite) {
      onWhite.textContent = `${white.toFixed(2)}:1`;
      onWhite.className = `badge ${white >= 4.5 ? 'badge--success' : white >= 3 ? 'badge--warn' : 'badge--danger'}`;
    }
    if (onBlack) {
      onBlack.textContent = `${black.toFixed(2)}:1`;
      onBlack.className = `badge ${black >= 4.5 ? 'badge--success' : black >= 3 ? 'badge--warn' : 'badge--danger'}`;
    }

    announce(message);
  };

  function setFromHex(hex, message) {
    const next = hexToHsv(hex);
    if (!next) return false;
    hsv = next;
    render(message);
    return true;
  }

  /* ── ลากบนระนาบ ── */
  const applyPointer = (event) => {
    const rect = plane.getBoundingClientRect();
    hsv = {
      ...hsv,
      s: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      v: clamp((1 - (event.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
    render();
  };

  plane.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    // อัปเดตสีก่อนจับ pointer เสมอ — setPointerCapture โยน NotFoundError ได้ถ้า pointer
    // ไม่ active แล้ว ถ้าเรียกก่อนจะทำให้คลิกธรรมดาไม่มีผลอะไรเลย
    applyPointer(event);
    plane.classList.add('is-dragging');
    try {
      plane.setPointerCapture(event.pointerId);
    } catch { /* ลากต่อไม่ได้ แต่คลิกเลือกสีทำงานแล้ว */ }
  });

  plane.addEventListener('pointermove', (event) => {
    if (plane.hasPointerCapture(event.pointerId)) applyPointer(event);
  });

  const endDrag = (event) => {
    if (plane.hasPointerCapture(event.pointerId)) plane.releasePointerCapture(event.pointerId);
    plane.classList.remove('is-dragging');
  };
  plane.addEventListener('pointerup', endDrag);
  plane.addEventListener('pointercancel', endDrag);

  plane.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 10 : 1;
    const moves = {
      ArrowRight: { s: step }, ArrowLeft: { s: -step },
      ArrowUp: { v: step }, ArrowDown: { v: -step },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    hsv = {
      ...hsv,
      s: clamp(hsv.s + (move.s ?? 0), 0, 100),
      v: clamp(hsv.v + (move.v ?? 0), 0, 100),
    };
    render();
  });

  hueInput.addEventListener('input', () => {
    hsv = { ...hsv, h: Number(hueInput.value) };
    render();
  });

  /* ── พิมพ์ค่าเองได้ทุก space ── */
  hexInput?.addEventListener('change', () => {
    const raw = hexInput.value.trim();
    const value = raw.startsWith('#') ? raw : `#${raw}`;
    if (!setFromHex(value, `ตั้งค่าเป็น ${value.toUpperCase()}`)) {
      hexInput.value = currentHex().toUpperCase();
      announce('รหัสสีไม่ถูกต้อง — ต้องเป็นรูปแบบ #RRGGBB');
    }
  });

  rgbInput?.addEventListener('change', () => {
    const nums = rgbInput.value.match(/\d+/g)?.map(Number) ?? [];
    if (nums.length < 3 || nums.slice(0, 3).some((n) => n > 255)) {
      render('ค่า RGB ไม่ถูกต้อง — ต้องเป็นตัวเลข 0–255 สามค่า');
      return;
    }
    const [r, g, b] = nums;
    setFromHex(rgbToHex({ r, g, b }), `ตั้งค่าเป็น rgb(${r}, ${g}, ${b})`);
  });

  hslInput?.addEventListener('change', () => {
    const nums = hslInput.value.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    if (nums.length < 3) {
      render('ค่า HSL ไม่ถูกต้อง — ต้องเป็นตัวเลขสามค่า เช่น hsl(243, 75%, 59%)');
      return;
    }
    const [h, s, l] = nums;
    // ให้ browser แปลง hsl → rgb เอง แม่นกว่าเขียนสูตรซ้ำ และรับค่านอกช่วงได้ด้วย
    const probe = document.createElement('canvas').getContext('2d');
    probe.fillStyle = `hsl(${h} ${clamp(s, 0, 100)}% ${clamp(l, 0, 100)}%)`;
    setFromHex(probe.fillStyle, `ตั้งค่าเป็น hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`);
  });

  /* ── ดูดสีจากหน้าจอ ── */
  if (eyedropBtn) {
    if (typeof window.EyeDropper === 'function') {
      eyedropBtn.addEventListener('click', async () => {
        try {
          const result = await new window.EyeDropper().open();
          setFromHex(result.sRGBHex, `ดูดสี ${result.sRGBHex.toUpperCase()} มาแล้ว`);
        } catch { /* ผู้ใช้กด Esc ยกเลิก — ไม่ต้องแจ้งอะไร */ }
      });
    } else {
      eyedropBtn.hidden = true;
    }
  }

  /* ── ส่งสีเข้า palette ── */
  if (roleTargets) {
    roleTargets.replaceChildren();
    ROLES.forEach((role) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip';
      button.textContent = ROLE_LABELS[role];
      button.addEventListener('click', () => {
        const hex = currentHex();
        store.setRole(role, hex);
        announce(`ตั้ง ${ROLE_LABELS[role]} เป็น ${hex.toUpperCase()} แล้ว`);
      });
      roleTargets.appendChild(button);
    });
  }

  accentBtn?.addEventListener('click', () => {
    const hex = currentHex();
    if (store.addAccent(hex)) announce(`เพิ่ม ${hex.toUpperCase()} เข้าชุดสี accent แล้ว`);
    else announce(`ชุด accent เต็มแล้ว (สูงสุด ${MAX_ACCENTS} สี)`);
  });

  document.querySelector('#cs-capture')?.addEventListener('click', () => {
    const hex = currentHex();
    if (captured.includes(hex)) {
      announce(`${hex.toUpperCase()} เก็บไว้อยู่แล้ว`);
      return;
    }
    captured = [...captured, hex];
    renderCaptured();
    announce(`เก็บ ${hex.toUpperCase()} ไว้แล้ว รวม ${captured.length} สี`);
  });

  document.querySelector('#cs-captured-apply')?.addEventListener('click', () => {
    if (captured.length === 0) {
      announce('ยังไม่มีสีที่เก็บไว้ — กด "เก็บสีนี้" ก่อน');
      return;
    }
    store.applyHexList(captured);
    announce(`ใช้สีที่เก็บไว้ ${captured.length} สีเป็น palette แล้ว (สีแรกเป็นสีแบรนด์)`);
  });

  document.querySelector('#cs-captured-clear')?.addEventListener('click', () => {
    captured = [];
    renderCaptured();
    announce('ล้างสีที่เก็บไว้แล้ว');
  });

  document.querySelector('#cs-sync')?.addEventListener('click', () => {
    const hex = store.getPalette().primary;
    setFromHex(hex, `ดึงสีแบรนด์ปัจจุบัน ${hex.toUpperCase()} มาแก้`);
  });

  // เริ่มที่สีแบรนด์ปัจจุบัน แต่ไม่ subscribe ต่อ — ระนาบนี้เป็นพื้นที่ทดลองของผู้ใช้
  // ถ้าให้วิ่งตาม palette ตลอด สีที่กำลังเล็งอยู่จะถูกเขียนทับทุกครั้งที่แก้ค่าอื่น
  setFromHex(store.getPalette().primary);
  renderCaptured();
}
