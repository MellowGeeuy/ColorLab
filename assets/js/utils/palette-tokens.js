/**
 * palette-tokens.js — แปลง palette ของผู้ใช้เป็นชุด CSS custom properties (pure, ไม่แตะ DOM)
 *
 * ทุก token ขึ้นต้นด้วย --pv- เพื่อไม่ให้ชนกับ token ของตัวหน้าเว็บเอง
 * component ในพื้นที่พรีวิวจะอ่านเฉพาะ token ชุดนี้เท่านั้น
 */

import {
  buildScale, hexToHsl, hslToHex, readableTextOn, contrastRatio, clamp, pickAccessibleStep,
} from './color-utils.js';

export const ROLES = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'];

export const ROLE_LABELS = {
  primary: 'Primary — สีแบรนด์',
  neutral: 'Neutral — โครงหน้าจอ',
  success: 'Success — สำเร็จ',
  warning: 'Warning — เตือน',
  danger: 'Danger — อันตราย',
  info: 'Info — ข้อมูล',
};

export const MAX_ACCENTS = 8;

/**
 * ความโค้งของมุม — ผู้ใช้ปรับได้ค่าเดียว แล้วทั้งสเกลขยับตามกัน
 *
 * เก็บเป็นค่าฐานตัวเดียวแทนที่จะให้ตั้งทีละขนาด เพราะสัดส่วนระหว่างขนาดคือสิ่งที่
 * ทำให้ทั้งระบบดูเป็นชุดเดียวกัน ถ้าปล่อยให้ตั้งอิสระ มุมของปุ่มกับการ์ดจะหลุดจากกันทันที
 *
 * --radius-full ไม่ขยับตามค่านี้ เพราะมันไม่ใช่ "ขนาดของมุม" แต่เป็นรูปทรง —
 * รูปโปรไฟล์กับจุดสถานะต้องกลมเสมอ ต่อให้ผู้ใช้เลือกดีไซน์แบบเหลี่ยมทั้งระบบ
 */
export const RADIUS = { min: 0, max: 24, step: 1, base: 10 };

export function buildRadiusTokens(base = RADIUS.base) {
  const px = clamp(Math.round(Number(base) || 0), RADIUS.min, RADIUS.max);
  return {
    '--pv-radius-sm': `${Math.round(px * 0.6)}px`,
    '--pv-radius-md': `${px}px`,
    '--pv-radius-lg': `${Math.round(px * 1.4)}px`,
    '--pv-radius-full': '999px',
  };
}

export const DEFAULT_PALETTE = {
  primary: '#4f46e5',
  neutral: '#64748b',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  info: '#0284c7',
  accents: ['#06b6d4', '#c026d3', '#ea580c', '#65a30d'],
};

export const PRESETS = {
  indigo: {
    label: 'Indigo Studio',
    palette: DEFAULT_PALETTE,
  },
  ocean: {
    label: 'Ocean',
    palette: {
      primary: '#0369a1', neutral: '#5b7083', success: '#0f766e',
      warning: '#b45309', danger: '#be123c', info: '#0891b2',
      accents: ['#0e7490', '#1d4ed8', '#7c3aed', '#059669'],
    },
  },
  sunset: {
    label: 'Sunset',
    palette: {
      primary: '#e11d48', neutral: '#78716c', success: '#15803d',
      warning: '#ea580c', danger: '#b91c1c', info: '#7c3aed',
      accents: ['#f97316', '#db2777', '#a21caf', '#ca8a04'],
    },
  },
  forest: {
    label: 'Forest',
    palette: {
      primary: '#15803d', neutral: '#57534e', success: '#16a34a',
      warning: '#ca8a04', danger: '#dc2626', info: '#0d9488',
      accents: ['#4d7c0f', '#0f766e', '#a16207', '#7c2d12'],
    },
  },
  mono: {
    label: 'Monochrome',
    palette: {
      primary: '#334155', neutral: '#64748b', success: '#475569',
      warning: '#78716c', danger: '#7f1d1d', info: '#475569',
      accents: ['#94a3b8', '#64748b', '#475569', '#334155'],
    },
  },
};

/** ทำให้ค่าที่รับมาเป็น palette ที่ใช้งานได้เสมอ แม้ข้อมูลจะไม่ครบหรือเสียหาย */
export function normalizePalette(input) {
  const source = input && typeof input === 'object' ? input : {};
  const result = {};

  ROLES.forEach((role) => {
    const value = String(source[role] ?? '').trim();
    result[role] = /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : DEFAULT_PALETTE[role];
  });

  const accents = Array.isArray(source.accents) ? source.accents : DEFAULT_PALETTE.accents;
  result.accents = accents
    .map((value) => String(value).trim().toLowerCase())
    .filter((value) => /^#[0-9a-f]{6}$/.test(value))
    .slice(0, MAX_ACCENTS);

  if (result.accents.length === 0) result.accents = [...DEFAULT_PALETTE.accents];

  return result;
}

/** ดึงสีจากข้อความอิสระ เช่น "#fff, #4f46e5 #0ea5e9" หรือ CSS ที่คัดลอกมา */
export function parseHexList(text) {
  const matches = String(text).match(/#[0-9a-f]{3}(?:[0-9a-f]{3})?\b/gi) ?? [];
  const seen = new Set();

  return matches
    .map((hex) => {
      const body = hex.slice(1);
      const full = body.length === 3 ? body.split('').map((c) => c + c).join('') : body;
      return `#${full.toLowerCase()}`;
    })
    .filter((hex) => (seen.has(hex) ? false : seen.add(hex)));
}

function scaleOf(hex) {
  return buildScale(hexToHsl(hex));
}

/** สีพื้นอ่อนสำหรับ badge / alert — อิง hue เดิมแต่ปรับความสว่างตามธีม */
function softOf(hex, isDark) {
  const hsl = hexToHsl(hex);
  return hslToHex({
    h: hsl.h,
    s: clamp(hsl.s * (isDark ? 0.55 : 0.85), 8, 70),
    l: isDark ? 16 : 95,
  });
}

/**
 * สร้าง token ทั้งหมดของธีม
 * @returns {{tokens: Object<string,string>, scales: Object<string, Map<number,string>>}}
 */
export function buildPaletteTokens(palette, theme = 'light') {
  const safe = normalizePalette(palette);
  const isDark = theme === 'dark';
  const scales = {};
  const tokens = {};

  ROLES.forEach((role) => {
    const scale = scaleOf(safe[role]);
    scales[role] = scale;
    scale.forEach((entry) => { tokens[`--pv-${role}-${entry.step}`] = entry.hex; });
  });

  const at = (role, step) => scales[role].find((entry) => entry.step === step).hex;

  // พื้นผิวและตัวอักษร — ชั้นนี้คือชั้นเดียวที่ธีมมืดเข้ามาเปลี่ยน
  tokens['--pv-bg'] = isDark ? at('neutral', 950) : at('neutral', 50);
  tokens['--pv-surface'] = isDark ? at('neutral', 900) : '#ffffff';
  tokens['--pv-surface-alt'] = isDark ? at('neutral', 800) : at('neutral', 100);
  tokens['--pv-border'] = isDark ? at('neutral', 800) : at('neutral', 200);
  tokens['--pv-text'] = isDark ? at('neutral', 50) : at('neutral', 900);

  const surface = tokens['--pv-surface'];

  /* เทียบกับ surface-alt ไม่ใช่ surface — เพราะ surface-alt คือพื้นที่ "ยากกว่า" เสมอ
     (ธีมสว่างมันเข้มกว่าพื้นขาว ธีมมืดมันสว่างกว่าพื้นการ์ด) และคอมโพเนนต์อย่าง
     ตัวนับใน sidenav กับ breadcrumb ในแถบเครื่องมือก็ไปนั่งอยู่บนพื้นนั้น
     ของเดิมเทียบกับ surface อย่างเดียว ตัวอักษรรองจึงเหลือ 4.13:1 เมื่อไปอยู่บน surface-alt */
  const hardestSurface = tokens['--pv-surface-alt'];

  // ตัวอักษรรองและขอบช่องกรอกต้องอ่านออกจริง จึงเลือกขั้นที่ผ่านเกณฑ์แทนการล็อกตัวเลขไว้
  tokens['--pv-text-muted'] = pickAccessibleStep(
    scales.neutral, hardestSurface, 4.5, isDark ? 400 : 600,
  ).hex;
  tokens['--pv-text-subtle'] = isDark ? at('neutral', 500) : at('neutral', 400);
  tokens['--pv-border-strong'] = pickAccessibleStep(
    scales.neutral, hardestSurface, 3, isDark ? 600 : 400,
  ).hex;

  ROLES.filter((role) => role !== 'neutral').forEach((role) => {
    const scale = scales[role];
    const anchorIndex = scale.findIndex((entry) => entry.isBase);
    const soft = softOf(safe[role], isDark);

    // ธีมสว่างใช้สีที่ผู้ใช้เลือกตรง ๆ ธีมมืดยกให้สว่างขึ้นสองขั้นเพื่อให้ตัดกับพื้นมืด
    const baseIndex = isDark ? Math.max(0, anchorIndex - 2) : anchorIndex;
    const base = scale[baseIndex].hex;
    const baseStep = scale[baseIndex].step;

    tokens[`--pv-${role}`] = base;
    tokens[`--pv-${role}-hover`] = scale[clamp(baseIndex + (isDark ? -1 : 1), 0, scale.length - 1)].hex;
    tokens[`--pv-${role}-soft`] = soft;
    tokens[`--pv-on-${role}`] = readableTextOn(base);

    // สีเดียวกันใช้เป็น "พื้น" กับ "ตัวอักษร" ไม่ได้เสมอไป
    // จึงเลือกขั้นที่อ่านออกแยกกันสำหรับข้อความบนการ์ดและข้อความบนพื้นอ่อนของตัวเอง
    tokens[`--pv-${role}-text`] = pickAccessibleStep(scale, surface, 4.5, baseStep).hex;
    tokens[`--pv-on-${role}-soft`] = pickAccessibleStep(scale, soft, 4.5, baseStep).hex;
  });

  tokens['--pv-primary-ring'] = at('primary', isDark ? 500 : 400);
  tokens['--pv-shadow'] = isDark ? '0 8px 24px rgb(0 0 0 / 0.5)' : '0 4px 14px rgb(15 23 42 / 0.08)';

  safe.accents.forEach((hex, index) => {
    const n = index + 1;
    tokens[`--pv-accent-${n}`] = hex;
    tokens[`--pv-accent-${n}-on`] = readableTextOn(hex);
    tokens[`--pv-accent-${n}-soft`] = softOf(hex, isDark);
  });

  tokens['--pv-accent-count'] = String(safe.accents.length);

  return { tokens, scales };
}

/** คู่สีที่ต้องตรวจตาม WCAG — ใช้ทั้งในตารางตรวจและสรุปคะแนน */
export const AUDIT_PAIRS = [
  { id: 'text-bg', label: 'ตัวอักษรหลัก บนพื้นหน้า', fg: '--pv-text', bg: '--pv-bg', min: 4.5 },
  { id: 'text-surface', label: 'ตัวอักษรหลัก บนการ์ด', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
  { id: 'muted-surface', label: 'ตัวอักษรรอง บนการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
  { id: 'primary-on', label: 'ตัวอักษรบนปุ่มหลัก', fg: '--pv-on-primary', bg: '--pv-primary', min: 4.5 },
  { id: 'primary-surface', label: 'ลิงก์สีแบรนด์ บนการ์ด', fg: '--pv-primary-text', bg: '--pv-surface', min: 4.5 },
  // WCAG 1.4.11 บังคับ 3:1 กับองค์ประกอบที่ต้องมองเห็นเพื่อใช้งาน เช่นขอบช่องกรอก (เส้นคั่นตกแต่งไม่บังคับ)
  { id: 'border-surface', label: 'ขอบช่องกรอกข้อมูล บนการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
  { id: 'success-soft', label: 'ข้อความสำเร็จ บนพื้นอ่อน', fg: '--pv-on-success-soft', bg: '--pv-success-soft', min: 4.5 },
  { id: 'warning-soft', label: 'ข้อความเตือน บนพื้นอ่อน', fg: '--pv-on-warning-soft', bg: '--pv-warning-soft', min: 4.5 },
  { id: 'danger-soft', label: 'ข้อความอันตราย บนพื้นอ่อน', fg: '--pv-on-danger-soft', bg: '--pv-danger-soft', min: 4.5 },
  { id: 'info-soft', label: 'ข้อความข้อมูล บนพื้นอ่อน', fg: '--pv-on-info-soft', bg: '--pv-info-soft', min: 4.5 },
];

export function auditTokens(tokens) {
  const results = AUDIT_PAIRS.map((pair) => {
    const ratio = contrastRatio(tokens[pair.fg], tokens[pair.bg]);
    return {
      ...pair,
      fgHex: tokens[pair.fg],
      bgHex: tokens[pair.bg],
      ratio,
      pass: ratio >= pair.min,
    };
  });

  const accents = [];
  const count = Number(tokens['--pv-accent-count'] ?? 0);
  for (let i = 1; i <= count; i += 1) {
    const hex = tokens[`--pv-accent-${i}`];
    accents.push({
      index: i,
      hex,
      onSurface: contrastRatio(hex, tokens['--pv-surface']),
      onText: contrastRatio(hex, tokens[`--pv-accent-${i}-on`]),
    });
  }

  return {
    results,
    accents,
    passed: results.filter((r) => r.pass).length,
    total: results.length,
  };
}
