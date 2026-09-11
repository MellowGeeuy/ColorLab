/**
 * placeholder.js — page init ของหน้าที่มีเมนูแล้วแต่ยังไม่มีเนื้อหา
 * ใช้ร่วมกันทุกหน้า placeholder เพราะยังไม่มี state ของตัวเอง —
 * เมื่อหน้าไหนมีเนื้อหาจริงให้แยกไปเป็น page script ของหน้านั้น
 */

import { loadIconSprite } from '../modules/icon-sprite.js';
import { initThemeToggle } from '../modules/theme-toggle.js';
import { initMobileTabbar } from '../modules/mobile-tabbar.js';
import { initOrbitDock } from '../modules/orbit-dock.js';

async function init() {
  await loadIconSprite();
  initThemeToggle();
  // ต้องหลัง loadIconSprite() เพราะแท็บอ้างไอคอนจาก sprite ด้วย <use href="#i-...">
  initMobileTabbar();
  // แถบบนยุบเป็นวงกลมเหมือนหน้าอื่น ๆ — หน้าที่เนื้อหายังสั้นจะไม่เลื่อนจนถึงจุดยุบ แต่กติกาเดียวกันทั้งเว็บ
  initOrbitDock(document.querySelector('main'));
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
