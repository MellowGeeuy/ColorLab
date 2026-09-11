/**
 * palette-preview.js — page init
 */

import { loadIconSprite } from '../modules/icon-sprite.js';
import { initThemeToggle } from '../modules/theme-toggle.js';
import { initEditorPanel } from '../modules/editor-panel.js';
import { createPaletteStore } from '../modules/palette-store.js';
import { initPaletteEditor } from '../modules/palette-editor.js';
import { initContrastAudit } from '../modules/contrast-audit.js';
import { initThemePreview } from '../modules/theme-preview.js';
import { initLiveCodeEditor } from '../modules/live-code-editor.js';
import { initCodeAutocomplete } from '../modules/code-autocomplete.js';
import { initSectionTabs } from '../modules/section-tabs.js';

async function init() {
  await loadIconSprite();
  initThemeToggle();
  initEditorPanel();

  const store = createPaletteStore();

  // ต้องติดตั้งตัวตรวจก่อน เพราะ initThemePreview ยิงอีเวนต์ชุดแรกทันทีที่ subscribe
  initContrastAudit();
  initThemePreview(store);
  initPaletteEditor(store);

  initSectionTabs();
  initLiveCodeEditor({ createCompletion: initCodeAutocomplete });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
