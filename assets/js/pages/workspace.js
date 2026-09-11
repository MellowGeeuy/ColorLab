/**
 * workspace.js — page init ของโหมด Workspace
 * ประกอบ shell (rail / palette bar / inspector / command palette) เข้ากับเครื่องมือทั้ง 9 ตัว
 * ที่ใช้ palette store ตัวเดียวกัน
 */

import { loadIconSprite } from '../modules/icon-sprite.js';
import { initThemeToggle } from '../modules/theme-toggle.js';
import { initGuideModal } from '../modules/guide-modal.js';
import { createPaletteStore } from '../modules/palette-store.js';
import { initToolRail } from '../modules/tool-rail.js';
import { initCommandPalette } from '../modules/command-palette.js';
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
import { initPaletteExportDialog } from '../modules/palette-export-dialog.js';
import { initAutoPalettePanel } from '../modules/auto-palette-panel.js';

/** บอกว่างานถูกเก็บลงเครื่องแล้ว — palette store เขียน localStorage ทุกครั้งที่มีการแก้ */
function initSaveStatus(store) {
  const out = document.querySelector('#save-status');
  if (!out) return;

  let first = true;
  store.subscribe(() => {
    if (first) {
      first = false;
      out.textContent = 'พร้อมใช้งาน';
      return;
    }
    const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    out.textContent = `บันทึกแล้ว ${time}`;
  });
}

async function init() {
  await loadIconSprite();
  initThemeToggle();
  initGuideModal();

  const store = createPaletteStore();

  // ตัวตรวจต้องพร้อมก่อน initThemePreview เพราะ theme preview ยิงอีเวนต์ชุดแรก
  // ทันทีที่ subscribe — ติดตั้งทีหลังจะพลาดรอบแรก
  initContrastAudit();
  initThemePreview(store);

  const rail = initToolRail();
  initSaveStatus(store);

  // ปุ่มคืนค่าย้ายมาอยู่ในแถบบนหลังเอาแถบชุดสีปัจจุบันออก
  document.querySelector('#palette-reset')?.addEventListener('click', () => store.reset());

  initAutoPalettePanel(store);
  initPaletteExportDialog(store);

  // เครื่องมือ 2 เป็นต้นไปถูกถอดออกจากหน้าไว้ก่อนตามที่ G สั่ง (2026-09-09) เพื่อรื้อทำใหม่ทีละตัว
  // โมดูลยังถูกเรียกไว้เหมือนเดิม ทุกตัวเช็ค element ก่อนทำงานอยู่แล้วจึงคืนค่าเงียบ ๆ เมื่อไม่มี view
  // พอเอา view กลับเข้ามาก็ทำงานต่อทันทีโดยไม่ต้องแก้ไฟล์นี้
  initColorSpacePicker(store);
  initPaletteEditor(store);
  initHarmonyGenerator(store);
  initPaletteScales(store);
  initContrastChecker(store);
  initCvdSimulator(store);
  initPaletteLibrary(store);
  initPaletteExport(store);

  initLiveCodeEditor({ createCompletion: initCodeAutocomplete });

  if (rail) {
    initCommandPalette([
      ...rail.tools.map((tool) => ({
        label: tool.label,
        keywords: `${tool.name} ${tool.number} เครื่องมือ tool`,
        icon: tool.icon,
        hint: `เครื่องมือ ${tool.number}`,
        run: () => rail.show(tool.name, { focusPanel: true }),
      })),
      {
        label: 'สลับไปโหมด Theory',
        keywords: 'theory ทฤษฎี อ่าน เนื้อหา mode',
        icon: '#i-book',
        hint: 'เปลี่ยนโหมด',
        run: () => { window.location.href = 'index.html'; },
      },
      {
        label: 'สลับธีมสว่าง / มืดของหน้าเว็บ',
        keywords: 'theme dark light ธีม มืด สว่าง',
        icon: '#i-moon',
        hint: 'มุมมอง',
        run: () => document.querySelector('#theme-toggle')?.click(),
      },
      {
        label: 'คืนค่าชุดสีเริ่มต้น',
        keywords: 'reset คืนค่า ล้าง palette',
        icon: '#i-ban',
        hint: 'ชุดสี',
        run: () => document.querySelector('#palette-reset')?.click(),
      },
    ]);
  }
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
