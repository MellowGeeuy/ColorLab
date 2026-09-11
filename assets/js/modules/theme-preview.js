/**
 * theme-preview.js — เขียน token ของ palette ลงบนพื้นที่พรีวิว และวาดส่วนที่ผูกกับจำนวนสี accent
 */

import { buildPaletteTokens } from '../utils/palette-tokens.js';
import { readableTextOn } from '../utils/color-utils.js';

const CHART_BARS = [72, 45, 88, 61, 34, 79, 52, 66];

function applyTokens(target, tokens) {
  Object.entries(tokens).forEach(([name, value]) => target.style.setProperty(name, value));
}

/** ลบ token ของ accent ที่ถูกเอาออกไปแล้ว ไม่งั้นค่าเก่าจะค้างอยู่บน element */
function clearStaleAccents(target, count) {
  for (let i = count + 1; i <= 12; i += 1) {
    target.style.removeProperty(`--pv-accent-${i}`);
    target.style.removeProperty(`--pv-accent-${i}-on`);
    target.style.removeProperty(`--pv-accent-${i}-soft`);
  }
}

function renderChart(container, accents) {
  if (!container) return;
  container.replaceChildren();

  CHART_BARS.forEach((value, index) => {
    const hex = accents[index % accents.length];
    const column = document.createElement('div');
    column.className = 'mock-chart__col';

    const bar = document.createElement('div');
    bar.className = 'mock-chart__bar';
    bar.style.height = `${value}%`;
    bar.style.backgroundColor = hex;

    const label = document.createElement('span');
    label.className = 'mock-chart__label';
    label.textContent = `Q${index + 1}`;

    column.append(bar, label);
    container.appendChild(column);
  });
}

function renderTags(container, accents) {
  if (!container) return;
  const names = ['Design', 'Research', 'Frontend', 'Backend', 'Mobile', 'Data', 'Growth', 'Ops'];
  container.replaceChildren();

  accents.forEach((hex, index) => {
    const tag = document.createElement('span');
    tag.className = 'mock-tag';
    tag.style.backgroundColor = hex;
    tag.style.color = readableTextOn(hex);
    tag.textContent = names[index % names.length];
    container.appendChild(tag);
  });
}

function renderLegend(container, accents) {
  if (!container) return;
  container.replaceChildren();

  accents.forEach((hex, index) => {
    const item = document.createElement('div');
    item.className = 'mock-legend__item';

    const dot = document.createElement('span');
    dot.className = 'mock-legend__dot';
    dot.style.backgroundColor = hex;

    const label = document.createElement('span');
    label.textContent = `หมวด ${index + 1}`;

    item.append(dot, label);
    container.appendChild(item);
  });
}

export function initThemePreview(store) {
  const stage = document.querySelector('#preview-stage');
  if (!stage) return null;

  const chart = document.querySelector('#mock-chart');
  const tags = document.querySelector('#mock-tags');
  const legend = document.querySelector('#mock-legend');

  // เขียน token ไว้ที่ :root เพราะพรีวิวโค้ดสดอยู่คนละที่กับ stage แต่ต้องใช้ token ชุดเดียวกัน
  // ไม่ชนกับ token ของหน้าเว็บเองเพราะคนละ prefix (--pv- กับ --color-)
  const root = document.documentElement;
  let latest = null;

  store.subscribe((palette, theme) => {
    const { tokens } = buildPaletteTokens(palette, theme);
    latest = tokens;

    applyTokens(root, tokens);
    clearStaleAccents(root, palette.accents.length);
    stage.dataset.previewTheme = theme;

    renderChart(chart, palette.accents);
    renderTags(tags, palette.accents);
    renderLegend(legend, palette.accents);

    stage.dispatchEvent(new CustomEvent('tokenschange', { detail: { tokens, theme } }));
  });

  return { getTokens: () => latest, stage };
}
