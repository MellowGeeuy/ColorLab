/**
 * scale-inspector.js — ตารางค่าจริงของสเกล 11 ขั้นในตอนที่ 07
 *
 * ไม่ได้คำนวณสเกลเอง แต่ "อ่านสีที่เบราว์เซอร์วาดจริง" ออกมาจาก .steps__cell
 * ด้วย getComputedStyle แล้วค่อยคิดคอนทราสต์ต่อ — เพราะสูตรของสเกลนี้อยู่ใน
 * theory-figures.css (hsl ทีละขั้น) ถ้าเขียนสูตรซ้ำใน JS อีกชุด วันที่ใครแก้ CSS
 * ตารางจะบอกค่าที่ไม่ตรงกับแถบสีที่อยู่เหนือมันเองโดยไม่มีใครรู้
 *
 * ผลพลอยได้คือเปลี่ยนสีตั้งต้นด้วยปุ่มเดิมที่ทำด้วย :has() ล้วน ๆ ตารางก็ตามทันที
 * โดยที่ JS ไม่ต้องรู้เลยว่าปุ่มไหนแปลว่า hue เท่าไร
 */

import { contrastRatio, rgbToHex } from '../utils/color-utils.js';

/* ข้อความกำกับตรงกับที่เขียนไว้ใต้ภาพในตอนเดียวกัน — คนละที่ห้ามพูดคนละอย่าง */
const USAGE = {
  50: 'พื้นหลังอ่อน แถบไฮไลต์',
  100: 'พื้นของ callout พื้น hover',
  200: 'เส้นขอบ ตัวคั่น',
  300: 'พื้นของสถานะ disabled',
  400: 'ไอคอน placeholder',
  500: 'ของตกแต่ง',
  600: 'ปุ่มหลัก ลิงก์',
  700: 'ปุ่มตอนกด ลิงก์ที่เคยกด',
  800: 'ตัวหนังสือบนพื้นอ่อน',
  900: 'หัวข้อบนพื้นอ่อน',
  950: 'พื้นหลังของธีมมืด',
};

const STEPS = Object.keys(USAGE).map(Number);

function readHex(el) {
  const [r, g, b] = getComputedStyle(el).backgroundColor.match(/\d+/g).map(Number);
  return rgbToHex({ r, g, b });
}

export function initScaleInspector() {
  const root = document.querySelector('[data-scale-table]');
  const cells = [...document.querySelectorAll('.steps .steps__cell')];
  if (!root || cells.length !== STEPS.length) return;

  const body = root.querySelector('[data-scale-rows]');
  const note = root.querySelector('[data-scale-note]');

  const render = () => {
    const rows = cells.map((cell, i) => {
      const hex = readHex(cell);
      return {
        step: STEPS[i],
        hex,
        onWhite: contrastRatio(hex, '#ffffff'),
        onBlack: contrastRatio(hex, '#0f172a'),
      };
    });

    /* ขั้นแรกที่ตัวอักษรสีนั้นวางบนพื้นขาวแล้วผ่าน 4.5:1 — เป็นเลขที่ต้องรู้จริง
       เวลาตั้ง token ว่าลิงก์กับปุ่มต้องหยิบขั้นไหน ไม่ใช่เดาจากที่เห็นว่าเข้มพอ */
    const firstText = rows.find((r) => r.onWhite >= 4.5);
    const firstUi = rows.find((r) => r.onWhite >= 3);

    body.replaceChildren(...rows.map((r) => {
      const tr = document.createElement('tr');
      const pass = r.onWhite >= 4.5;
      tr.innerHTML = `
        <td class="u-num">${r.step}</td>
        <td><span class="scale-table__chip" style="background-color:${r.hex}"></span></td>
        <td><code>${r.hex.toUpperCase()}</code></td>
        <td class="u-num u-num-end${pass ? '' : ' scale-table__weak'}">${r.onWhite.toFixed(2)}</td>
        <td class="u-num u-num-end">${r.onBlack.toFixed(2)}</td>
        <td>${USAGE[r.step]}</td>`;
      return tr;
    }));

    if (note) {
      note.innerHTML = firstText
        ? `สีชุดนี้เอาไปทำ<b>ตัวหนังสือบนพื้นขาว</b>ได้ตั้งแต่ขั้น <b>${firstText.step}</b>
           (${firstText.onWhite.toFixed(2)}:1) และเอาไปทำ<b>ไอคอนหรือเส้นขอบ</b>ได้ตั้งแต่ขั้น
           <b>${firstUi.step}</b> (${firstUi.onWhite.toFixed(2)}:1)`
        : 'สีชุดนี้ไม่มีขั้นไหนผ่าน 4.5:1 บนพื้นขาวเลยสักขั้น';
    }
  };

  document.querySelectorAll('.ramp-picker__radio').forEach((radio) => {
    radio.addEventListener('change', render);
  });

  render();
}
