/**
 * theory.js — page init ของหน้า Color Theory
 *
 * ใช้ร่วมกันทั้ง 11 หน้าย่อยและหน้าสารบัญ — ทุก init ในนี้ออกแบบให้เช็ก element
 * ของตัวเองก่อนแล้ว return ถ้าไม่เจอ หน้าไหนไม่มีตัวอย่างนั้นจึงไม่เสียอะไร
 * และเพิ่มตัวอย่างใหม่ได้โดยไม่ต้องแตะไฟล์นี้ทีละหน้า
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
import { initCvdPreview } from '../modules/cvd-preview.js';
import { initModelLab } from '../modules/model-lab.js';
import { initScaleInspector } from '../modules/scale-inspector.js';
import { initAreaMeter } from '../modules/area-meter.js';
import { initGlareDemo } from '../modules/glare-demo.js';
import { initTintMixer } from '../modules/tint-mixer.js';
import { initRolePicker } from '../modules/role-picker.js';
import { initElevationLab } from '../modules/elevation-lab.js';
import { initVibrationDemo } from '../modules/vibration-demo.js';
import { initContrastDemo } from '../modules/contrast-demo.js';

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
  initCvdPreview();
  initModelLab();
  initScaleInspector();
  initAreaMeter();
  initGlareDemo();
  initTintMixer();
  initRolePicker();
  initElevationLab();
  initVibrationDemo();
  initContrastDemo();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
