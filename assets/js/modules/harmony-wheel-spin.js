/**
 * harmony-wheel-spin.js — หมุนชุดจุดบนวงล้อทั้ง 7 ใบในหัวข้อ 4 ของหน้า Color Theory
 *
 * สิ่งที่ภาพนี้ต้องสอนคือ "สูตร harmony เป็นรูปทรง ไม่ใช่ชุดสีตายตัว"
 * จุดจึงต้องเดินรอบวงล้อไปเรื่อย ๆ แล้วชิปสีใต้วงล้อเปลี่ยนตามตำแหน่งจริงทุกขณะ
 *
 * เนื้อสีคำนวณจากมุมด้วย rybHueToRgbHue เพราะวงล้อเป็นวงล้อศิลปะ (RYB)
 * ซึ่งมุมกับ hue ไม่ได้สัมพันธ์กันแบบเชิงเส้น — ไล่สีตามองศาตรง ๆ จุดจะตกคนละสีกับพื้นใต้มัน
 */

import { rybHueToRgbHue } from '../utils/color-utils.js';

const PERIOD_MS = 28000;

// ต่ำกว่านี้ตาแยกสีไม่ออกอยู่ดี แต่ประหยัดการเขียน style ลงได้ราวสามในสี่ของเฟรม
const HUE_STEP_DEG = 1.5;

function readCards(root) {
  return Array.from(root.querySelectorAll('.wheel-card')).map((card) => {
    const pins = Array.from(card.querySelectorAll('.wheel-card__pin'));
    const chips = Array.from(card.querySelectorAll('.wheel-card__chip'));
    const baseAngles = pins.map((pin) => parseFloat(pin.style.getPropertyValue('--pin-a')) || 0);

    // Monochromatic มีจุดเดียวแต่สามชิป (เนื้อสีเดียว ต่างกันที่ความสว่าง)
    // ชิปทุกใบจึงต้องอ่านเนื้อสีจากจุดแรกแทนการจับคู่ทีละตัว
    const chipSource = chips.map((_, index) => (index < pins.length ? index : 0));

    return { pins, chips, baseAngles, chipSource };
  });
}

function paint(cards, spin) {
  cards.forEach(({ pins, chips, baseAngles, chipSource }) => {
    const hues = baseAngles.map((angle) => rybHueToRgbHue(angle + spin).toFixed(1));
    pins.forEach((pin, index) => pin.style.setProperty('--pin-h0', hues[index]));
    chips.forEach((chip, index) => chip.style.setProperty('--pin-h0', hues[chipSource[index]]));
  });
}

export function initHarmonyWheelSpin() {
  const root = document.querySelector('.wheels');
  if (!root) return;

  const cards = readCards(root);
  if (!cards.length) return;

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ผู้ที่ขอลดการเคลื่อนไหวยังต้องได้ภาพที่ถูกต้อง แค่ไม่เดิน — วาดครั้งเดียวที่มุมตั้งต้น
  if (still.matches) {
    paint(cards, 0);
    return;
  }

  let frame = 0;
  let startedAt = 0;
  let spin = 0;
  let paintedAt = -Infinity;

  const tick = (now) => {
    if (!startedAt) startedAt = now;
    spin = (((now - startedAt) / PERIOD_MS) * 360) % 360;
    root.style.setProperty('--spin', `${spin.toFixed(2)}deg`);

    if (Math.abs(spin - paintedAt) >= HUE_STEP_DEG) {
      paint(cards, spin);
      paintedAt = spin;
    }

    frame = requestAnimationFrame(tick);
  };

  const start = () => {
    if (frame) return;
    // นับเวลาต่อจากมุมเดิม ไม่งั้นจุดจะกระโดดกลับไปตั้งต้นทุกครั้งที่เลื่อนกลับมาดู
    startedAt = performance.now() - (spin / 360) * PERIOD_MS;
    paintedAt = -Infinity;
    frame = requestAnimationFrame(tick);
  };

  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };

  paint(cards, 0);

  if (!('IntersectionObserver' in window)) {
    start();
    return;
  }

  new IntersectionObserver((entries) => {
    entries.forEach((entry) => (entry.isIntersecting && !document.hidden ? start() : stop()));
  }, { threshold: 0.12 }).observe(root);

  // แท็บที่ถูกซ่อนไม่ได้รับทั้ง rAF และ IntersectionObserver — พอกลับมาจึงต้องวัดตำแหน่งเอง
  // ไม่งั้นวงล้อจะนิ่งค้างจนกว่าผู้อ่านจะเลื่อนหน้าให้ observer ทำงานอีกรอบ
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stop(); return; }
    const box = root.getBoundingClientRect();
    if (box.bottom > 0 && box.top < window.innerHeight) start();
  });
}
