/**
 * theory.js — page init ของหน้า Color Theory
 *
 * หน้านี้เป็นหน้าอ่าน เครื่องมือ interactive ตัวเต็มอยู่ที่ Colorground แล้ว
 * เหลือไว้แค่ HSL playground ตัวเดียวเพราะเป็นการเล่นพื้นฐานที่สุดและกินที่น้อย
 */

import { loadIconSprite } from '../modules/icon-sprite.js';
import { initThemeToggle } from '../modules/theme-toggle.js';
import { initMobileTabbar } from '../modules/mobile-tabbar.js';
import { initGuideModal } from '../modules/guide-modal.js';
import { initTocNav } from '../modules/toc-nav.js';
import { initOrbitDock } from '../modules/orbit-dock.js';
import { initRevealOnView } from '../modules/reveal-on-view.js';
import { initCompareSliders } from '../modules/compare-slider.js';
import { initHslPlayground } from '../modules/hsl-playground.js';
import { initHarmonyExplorer } from '../modules/harmony-explorer.js';
import { initHarmonyWheelSpin } from '../modules/harmony-wheel-spin.js';

async function init() {
  await loadIconSprite();
  initThemeToggle();
  // ต้องหลัง loadIconSprite() เพราะแท็บอ้างไอคอนจาก sprite ด้วย <use href="#i-...">
  initMobileTabbar();
  initGuideModal();
  initTocNav();
  initOrbitDock(document.querySelector('.reader__main'));
  initRevealOnView();
  initCompareSliders();
  initHslPlayground();
  initHarmonyExplorer();
  initHarmonyWheelSpin();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
