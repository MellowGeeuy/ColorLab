/**
 * workshop.js — page init ของห้องแล็บสี
 * ทุกเครื่องมือในหน้านี้แชร์ palette store ตัวเดียวกัน แก้ที่ไหนก็ไหลไปทุกหัวข้อ
 */

import { loadIconSprite } from '../modules/icon-sprite.js';
import { initThemeToggle } from '../modules/theme-toggle.js';
import { initSidebarNav } from '../modules/sidebar-nav.js';
import { createPaletteStore } from '../modules/palette-store.js';
import { initWorkshopShell } from '../modules/workshop-shell.js';
import { initColorSpacePicker } from '../modules/color-space-picker.js';
import { initPaletteEditor } from '../modules/palette-editor.js';
import { initHarmonyGenerator } from '../modules/harmony-generator.js';
import { initPaletteScales } from '../modules/palette-scales.js';
import { initContrastChecker } from '../modules/contrast-checker.js';
import { initContrastAudit } from '../modules/contrast-audit.js';
import { initCvdSimulator } from '../modules/cvd-simulator.js';
import { initThemePreview } from '../modules/theme-preview.js';
import { initLiveCodeEditor } from '../modules/live-code-editor.js';
import { initCodeAutocomplete } from '../modules/code-autocomplete.js';
import { initPaletteLibrary } from '../modules/palette-library.js';
import { initPaletteExport } from '../modules/palette-export.js';

async function init() {
  await loadIconSprite();
  initThemeToggle();
  initSidebarNav();

  const store = createPaletteStore();

  // ตัวตรวจต้องติดตั้งก่อน initThemePreview เพราะ theme preview ยิงอีเวนต์ชุดแรก
  // ทันทีที่ subscribe — ถ้าติดตั้งทีหลังจะพลาดรอบแรกไป
  initContrastAudit();
  initThemePreview(store);

  initWorkshopShell(store);
  initColorSpacePicker(store);
  initPaletteEditor(store);
  initHarmonyGenerator(store);
  initPaletteScales(store);
  initContrastChecker(store);
  initCvdSimulator(store);
  initPaletteLibrary(store);
  initPaletteExport(store);

  initLiveCodeEditor({ createCompletion: initCodeAutocomplete });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
