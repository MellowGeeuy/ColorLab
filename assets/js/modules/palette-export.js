/**
 * palette-export.js — แปลง palette ปัจจุบันเป็นโค้ดที่เอาไปใช้ต่อได้จริง
 * (CSS custom properties / JSON / Tailwind / SCSS) พร้อมคัดลอกและดาวน์โหลดเป็นไฟล์
 */

import { buildPaletteTokens, ROLES, ROLE_LABELS } from '../utils/palette-tokens.js';

const FORMAT_META = {
  css: { ext: 'css', mime: 'text/css', label: 'CSS Variables' },
  json: { ext: 'json', mime: 'application/json', label: 'JSON' },
  tailwind: { ext: 'js', mime: 'text/javascript', label: 'Tailwind' },
  scss: { ext: 'scss', mime: 'text/x-scss', label: 'SCSS' },
};

const publicName = (token) => token.replace('--pv-', '--color-');

function tokenLines(tokens, indent = '  ') {
  return Object.entries(tokens)
    .filter(([name]) => name !== '--pv-accent-count')
    .map(([name, value]) => `${indent}${publicName(name)}: ${value};`)
    .join('\n');
}

/** ส่งออกทั้งสองธีมเสมอ — ชุดสีที่ใช้ได้จริงต้องมีทั้งสว่างและมืดคู่กัน */
function toCss(palette) {
  const light = buildPaletteTokens(palette, 'light').tokens;
  const dark = buildPaletteTokens(palette, 'dark').tokens;

  return `/* Palette export — สร้างจาก UX/UI Color Workshop */\n`
    + `:root {\n${tokenLines(light)}\n}\n\n`
    + `[data-theme="dark"] {\n${tokenLines(dark)}\n}\n`;
}

function toJson(palette) {
  const light = buildPaletteTokens(palette, 'light');
  const dark = buildPaletteTokens(palette, 'dark');

  const scales = {};
  ROLES.forEach((role) => {
    scales[role] = Object.fromEntries(light.scales[role].map((entry) => [entry.step, entry.hex]));
  });

  const strip = (tokens) => Object.fromEntries(
    Object.entries(tokens)
      .filter(([name]) => name !== '--pv-accent-count')
      .map(([name, value]) => [publicName(name).replace('--color-', ''), value]),
  );

  return `${JSON.stringify({
    source: palette,
    scales,
    themes: { light: strip(light.tokens), dark: strip(dark.tokens) },
  }, null, 2)}\n`;
}

function toTailwind(palette) {
  const { scales } = buildPaletteTokens(palette, 'light');

  const roleBlocks = ROLES.map((role) => {
    const steps = scales[role]
      .map((entry) => `          ${entry.step}: '${entry.hex}',`)
      .join('\n');
    return `        ${role}: {\n${steps}\n        },`;
  }).join('\n');

  const accentBlock = palette.accents
    .map((hex, index) => `          ${index + 1}: '${hex}',`)
    .join('\n');

  return `// tailwind.config.js — วางใน theme.extend\n`
    + `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n`
    + `${roleBlocks}\n`
    + `        accent: {\n${accentBlock}\n        },\n`
    + `      },\n    },\n  },\n};\n`;
}

function toScss(palette) {
  const { scales } = buildPaletteTokens(palette, 'light');

  const roleLines = ROLES.flatMap((role) => scales[role]
    .map((entry) => `$${role}-${entry.step}: ${entry.hex};`)).join('\n');

  const accentLines = palette.accents
    .map((hex, index) => `$accent-${index + 1}: ${hex};`)
    .join('\n');

  const mapEntries = ROLES
    .map((role) => `  "${role}": $${role}-500,`)
    .join('\n');

  return `// Palette export — สร้างจาก UX/UI Color Workshop\n\n`
    + `${roleLines}\n\n${accentLines}\n\n`
    + `$palette: (\n${mapEntries}\n);\n`;
}

const BUILDERS = { css: toCss, json: toJson, tailwind: toTailwind, scss: toScss };

function download(text, filename, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // ปล่อย object URL ทันทีไม่ได้ — Firefox ยังอ่านไม่เสร็จตอน click คืนค่า
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function initPaletteExport(store) {
  const output = document.querySelector('#export-output');
  const tabs = Array.from(document.querySelectorAll('[data-export-format]'));
  if (!output || tabs.length === 0) return;

  const copyBtn = document.querySelector('#export-copy');
  const downloadBtn = document.querySelector('#export-download');
  const status = document.querySelector('#export-status');
  const summary = document.querySelector('#export-summary');

  let format = 'css';

  const render = () => {
    const palette = store.getPalette();
    output.value = BUILDERS[format](palette);

    tabs.forEach((tab) => {
      const active = tab.dataset.exportFormat === format;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    if (summary) {
      const lines = output.value.split('\n').length;
      summary.textContent = `${FORMAT_META[format].label} · ${lines} บรรทัด · ${palette.accents.length} สี accent`;
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      format = tab.dataset.exportFormat;
      render();
      if (status) status.textContent = `สลับเป็นรูปแบบ ${FORMAT_META[format].label} แล้ว`;
    });
  });

  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      if (status) status.textContent = `คัดลอก ${FORMAT_META[format].label} แล้ว`;
    } catch {
      output.select();
      if (status) status.textContent = 'เบราว์เซอร์ไม่ให้คัดลอกอัตโนมัติ — เลือกข้อความไว้ให้แล้ว กด Ctrl+C';
    }
  });

  downloadBtn?.addEventListener('click', () => {
    const meta = FORMAT_META[format];
    const filename = format === 'tailwind' ? 'tailwind.config.js' : `palette.${meta.ext}`;
    download(output.value, filename, meta.mime);
    if (status) status.textContent = `ดาวน์โหลด ${filename} แล้ว`;
  });

  // รายชื่อบทบาทช่วยให้ตรวจได้เร็วว่าไฟล์ที่ได้ครอบคลุมสีไหนบ้าง
  const roleHint = document.querySelector('#export-roles');
  if (roleHint) roleHint.textContent = ROLES.map((role) => ROLE_LABELS[role]).join(' · ');

  store.subscribe(render);
}
