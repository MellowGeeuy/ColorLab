/**
 * palette-code.js — แปลง palette เป็นโค้ดสำหรับเอาไปใช้ต่อ (CSS / SCSS / Tailwind / JSON)
 *
 * อยู่ชั้น utils เพราะทั้งแผงสร้างชุดสีอัตโนมัติและเครื่องมือส่งออกต้องใช้ตัวแปลงชุดเดียวกัน
 * และโมดูลในชั้น modules ห้าม import กันเอง — ของกลางจึงต้องลงมาอยู่ชั้นนี้
 */

import { buildPaletteTokens, ROLES } from './palette-tokens.js';

export const FORMAT_META = {
  css: { ext: 'css', mime: 'text/css', label: 'CSS Variables' },
  scss: { ext: 'scss', mime: 'text/x-scss', label: 'SCSS' },
  tailwind: { ext: 'js', mime: 'text/javascript', label: 'Tailwind' },
  json: { ext: 'json', mime: 'application/json', label: 'JSON' },
};

// ชื่อ --pv-* เป็นชื่อภายในของพรีวิว คนที่เอาโค้ดไปใช้ควรได้ชื่อกลาง ๆ ที่อ่านรู้เรื่อง
const publicName = (token) => token.replace('--pv-', '--color-');

function tokenLines(tokens, indent = '  ') {
  return Object.entries(tokens)
    .filter(([name]) => name !== '--pv-accent-count')
    .map(([name, value]) => `${indent}${publicName(name)}: ${value};`)
    .join('\n');
}

/** ส่งออกทั้งสองธีมเสมอ — ชุดสีที่ใช้ได้จริงต้องมีทั้งสว่างและมืดคู่กัน */
export function toCss(palette) {
  const light = buildPaletteTokens(palette, 'light').tokens;
  const dark = buildPaletteTokens(palette, 'dark').tokens;

  return '/* Palette export — สร้างจาก ColorLab */\n'
    + `:root {\n${tokenLines(light)}\n}\n\n`
    + `[data-theme="dark"] {\n${tokenLines(dark)}\n}\n`;
}

export function toJson(palette) {
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

export function toTailwind(palette) {
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

  return '// tailwind.config.js — วางใน theme.extend\n'
    + 'module.exports = {\n  theme: {\n    extend: {\n      colors: {\n'
    + `${roleBlocks}\n`
    + `        accent: {\n${accentBlock}\n        },\n`
    + '      },\n    },\n  },\n};\n';
}

export function toScss(palette) {
  const { scales } = buildPaletteTokens(palette, 'light');

  const roleLines = ROLES.flatMap((role) => scales[role]
    .map((entry) => `$${role}-${entry.step}: ${entry.hex};`)).join('\n');

  const accentLines = palette.accents
    .map((hex, index) => `$accent-${index + 1}: ${hex};`)
    .join('\n');

  const mapEntries = ROLES
    .map((role) => `  "${role}": $${role}-500,`)
    .join('\n');

  return '// Palette export — สร้างจาก ColorLab\n\n'
    + `${roleLines}\n\n${accentLines}\n\n`
    + `$palette: (\n${mapEntries}\n);\n`;
}

export const BUILDERS = { css: toCss, scss: toScss, tailwind: toTailwind, json: toJson };

export function filenameFor(format) {
  return format === 'tailwind' ? 'tailwind.config.js' : `palette.${FORMAT_META[format].ext}`;
}
