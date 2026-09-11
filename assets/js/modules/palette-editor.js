/**
 * palette-editor.js — แผงควบคุม palette: แก้สีตามบทบาท, เพิ่ม/ลบสี accent, พรีเซ็ต, นำเข้า/ส่งออก
 */

import {
  ROLES, ROLE_LABELS, MAX_ACCENTS, PRESETS, parseHexList, buildPaletteTokens,
} from '../utils/palette-tokens.js';
import { readableTextOn, contrastRatio } from '../utils/color-utils.js';

function flash(button, message) {
  const original = button.dataset.label ?? button.textContent.trim();
  button.dataset.label = original;
  button.textContent = message;
  setTimeout(() => { button.textContent = button.dataset.label; }, 1100);
}

function renderRoles(container, palette, store) {
  container.replaceChildren();

  ROLES.forEach((role) => {
    const row = document.createElement('div');
    row.className = 'swatch-row';

    const picker = document.createElement('input');
    picker.type = 'color';
    picker.className = 'input input--color';
    picker.value = palette[role];
    picker.id = `role-${role}`;

    const meta = document.createElement('div');
    meta.className = 'swatch-row__meta';

    const label = document.createElement('label');
    label.className = 'swatch-row__label';
    label.setAttribute('for', picker.id);
    label.textContent = ROLE_LABELS[role];

    const hex = document.createElement('input');
    hex.type = 'text';
    hex.className = 'input input--hex';
    hex.value = palette[role].toUpperCase();
    hex.spellcheck = false;
    hex.setAttribute('aria-label', `รหัสสีของ ${role}`);

    picker.addEventListener('input', () => store.setRole(role, picker.value));
    hex.addEventListener('change', () => {
      const value = hex.value.trim();
      const normalized = value.startsWith('#') ? value : `#${value}`;
      if (/^#[0-9a-f]{6}$/i.test(normalized)) store.setRole(role, normalized.toLowerCase());
      else hex.value = palette[role].toUpperCase();
    });

    meta.append(label, hex);
    row.append(picker, meta);
    container.appendChild(row);
  });
}

function renderAccents(container, palette, store, countLabel) {
  container.replaceChildren();

  palette.accents.forEach((hex, index) => {
    const item = document.createElement('div');
    item.className = 'accent-item';

    const picker = document.createElement('input');
    picker.type = 'color';
    picker.className = 'accent-item__picker';
    picker.value = hex;
    picker.setAttribute('aria-label', `สี accent ที่ ${index + 1}`);
    picker.addEventListener('input', () => store.setAccent(index, picker.value));

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'accent-item__remove';
    remove.title = 'เอาสีนี้ออก';
    remove.setAttribute('aria-label', `เอาสี accent ที่ ${index + 1} ออก`);
    remove.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-x"/></svg>';
    remove.style.color = readableTextOn(hex);
    remove.addEventListener('click', () => store.removeAccent(index));

    item.append(picker, remove);
    container.appendChild(item);
  });

  if (countLabel) countLabel.textContent = `${palette.accents.length} / ${MAX_ACCENTS}`;
}

function renderPresets(container, store) {
  container.replaceChildren();

  Object.entries(PRESETS).forEach(([key, preset]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset';
    button.title = preset.label;

    const strip = document.createElement('span');
    strip.className = 'preset__strip';
    [preset.palette.primary, ...preset.palette.accents.slice(0, 3)].forEach((hex) => {
      const chip = document.createElement('span');
      chip.style.backgroundColor = hex;
      strip.appendChild(chip);
    });

    const name = document.createElement('span');
    name.className = 'preset__name';
    name.textContent = preset.label;

    button.append(strip, name);
    button.addEventListener('click', () => store.applyPreset(key));
    container.appendChild(button);
  });
}

function tokensToCss(tokens, theme) {
  const lines = Object.entries(tokens)
    .filter(([name]) => name !== '--pv-accent-count')
    .map(([name, value]) => `  ${name.replace('--pv-', '--color-')}: ${value};`);

  return `/* Palette export — ธีม${theme === 'dark' ? 'มืด' : 'สว่าง'} */\n:root {\n${lines.join('\n')}\n}\n`;
}

export function initPaletteEditor(store) {
  const roleList = document.querySelector('#role-list');
  const accentList = document.querySelector('#accent-list');
  const accentCount = document.querySelector('#accent-count');
  const presetList = document.querySelector('#preset-list');
  if (!roleList) return;

  const addAccentBtn = document.querySelector('#accent-add');
  const addAccentColor = document.querySelector('#accent-new');
  const importInput = document.querySelector('#palette-import');
  const importBtn = document.querySelector('#palette-import-apply');
  const exportBtn = document.querySelector('#palette-export');
  const exportOut = document.querySelector('#palette-export-out');
  const resetBtn = document.querySelector('#palette-reset');
  // ต้องระบุ button — theme-preview.js เขียน data-preview-theme ลงบน #preview-stage ด้วย
  // ถ้า query กว้างกว่านี้ การคลิกในพื้นที่พรีวิวจะกลายเป็นการสลับธีมโดยไม่ตั้งใจ
  const themeButtons = Array.from(document.querySelectorAll('button[data-preview-theme]'));

  renderPresets(presetList, store);

  addAccentBtn?.addEventListener('click', () => {
    const added = store.addAccent(addAccentColor.value);
    if (!added) flash(addAccentBtn, `สูงสุด ${MAX_ACCENTS} สี`);
  });

  importBtn?.addEventListener('click', () => {
    const list = parseHexList(importInput.value);
    if (list.length === 0) {
      flash(importBtn, 'ไม่พบรหัสสี');
      return;
    }
    store.applyHexList(list);
    flash(importBtn, `ใส่แล้ว ${list.length} สี`);
  });

  exportBtn?.addEventListener('click', async () => {
    const { tokens } = buildPaletteTokens(store.getPalette(), store.getTheme());
    const css = tokensToCss(tokens, store.getTheme());
    exportOut.value = css;
    exportOut.hidden = false;
    try {
      await navigator.clipboard.writeText(css);
      flash(exportBtn, 'คัดลอกแล้ว');
    } catch {
      flash(exportBtn, 'เลือกข้อความด้านล่างเพื่อคัดลอก');
    }
  });

  resetBtn?.addEventListener('click', () => store.reset());

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => store.setTheme(button.dataset.previewTheme));
  });

  store.subscribe((palette, theme) => {
    renderRoles(roleList, palette, store);
    renderAccents(accentList, palette, store, accentCount);
    themeButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.previewTheme === theme);
      button.setAttribute('aria-pressed', String(button.dataset.previewTheme === theme));
    });

    // เตือนทันทีถ้าสีแบรนด์อ่านไม่ออกบนพื้นขาว — เป็นข้อผิดพลาดที่พบบ่อยที่สุด
    const warning = document.querySelector('#palette-warning');
    if (warning) {
      const ratio = contrastRatio(palette.primary, '#ffffff');
      warning.hidden = ratio >= 4.5;
      const value = warning.querySelector('#palette-warning-value');
      if (value) value.textContent = `${ratio.toFixed(2)}:1`;
    }
  });
}
