/**
 * color-theory.js — page init script
 */

import { loadIconSprite } from '../modules/icon-sprite.js';
import { initSidebarNav } from '../modules/sidebar-nav.js';
import { initThemeToggle } from '../modules/theme-toggle.js';
import { initHslPlayground } from '../modules/hsl-playground.js';
import { initHarmonyGenerator } from '../modules/harmony-generator.js';
import { initScaleGenerator } from '../modules/scale-generator.js';
import { initContrastChecker } from '../modules/contrast-checker.js';
import { initCvdSimulator } from '../modules/cvd-simulator.js';
import { initChecklist } from '../modules/checklist.js';

async function init() {
  await loadIconSprite();
  initThemeToggle();
  initSidebarNav();
  initHslPlayground();
  initHarmonyGenerator();
  initScaleGenerator();
  initContrastChecker();
  initCvdSimulator();
  initChecklist();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
