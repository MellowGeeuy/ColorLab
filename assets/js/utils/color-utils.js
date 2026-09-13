/**
 * color-utils.js — pure color math (ไม่ยุ่งกับ DOM)
 * อ้างอิงสูตร: WCAG 2.2 relative luminance, sRGB <-> HSL, Brettel/Viénot CVD matrices
 */

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function hexToRgb(hex) {
  const match = String(hex).trim().match(HEX_PATTERN);
  if (!match) return null;

  let body = match[1];
  if (body.length === 3) body = body.split('').map((c) => c + c).join('');

  return {
    r: parseInt(body.slice(0, 2), 16),
    g: parseInt(body.slice(2, 4), 16),
    b: parseInt(body.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }) {
  const toHex = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  // ไม่ปัดเศษที่นี่ เพื่อให้แปลงกลับเป็น HEX แล้วได้ค่าเดิม — ให้ผู้เรียกปัดตอนแสดงผล
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }) {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;

  const segment = Math.floor(hn / 60);
  const table = [
    [c, x, 0], [x, c, 0], [0, c, x],
    [0, x, c], [x, 0, c], [c, 0, x],
  ];
  const [r, g, b] = table[segment] ?? [0, 0, 0];

  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

export function hslToHex(hsl) {
  return rgbToHex(hslToRgb(hsl));
}

export function hexToHsl(hex) {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb) : null;
}

export function formatHsl({ h, s, l }) {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

/* --- OKLCH ---------------------------------------------------------------
   สูตร Oklab ของ Björn Ottosson (2020) — ใช้ในหน้า Color Theory เพื่อแสดงว่า
   "ความสว่างที่ตั้งเท่ากัน" ใน HSL กับใน OKLCH ให้ผลกับสายตาต่างกันแค่ไหน

   ต่างจาก HSL ตรงที่ต้องแปลงผ่าน linear-light ก่อน — HSL ทำงานบนค่าที่ผ่าน
   gamma มาแล้วจึงคำนวณเร็วแต่ไม่ตรงกับการรับรู้ ส่วน Oklab ยอมแลกด้วยการ
   ถอด gamma ออกไปคำนวณในปริภูมิที่ระยะห่างเท่ากันแปลว่าตาเห็นต่างเท่ากัน

   ค่า L อยู่ในช่วง 0–1 (ไม่ใช่ 0–100) และ H เป็นองศาเหมือน HSL แต่คนละสเกล
   — hue 220 ของ HSL ไม่ใช่ hue 220 ของ OKLCH                              */

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function oklchToRgb({ l, c, h }) {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);

  const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sc = (l - 0.0894841775 * a - 1.2914855480 * b) ** 3;

  return {
    r: clamp(Math.round(linearToSrgb(4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc) * 255), 0, 255),
    g: clamp(Math.round(linearToSrgb(-1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc) * 255), 0, 255),
    b: clamp(Math.round(linearToSrgb(-0.0041960863 * lc - 0.7034186147 * mc + 1.7076147010 * sc) * 255), 0, 255),
  };
}

export function oklchToHex(oklch) {
  return rgbToHex(oklchToRgb(oklch));
}

export function rgbToOklch({ r, g, b }) {
  const rl = srgbToLinear(r / 255);
  const gl = srgbToLinear(g / 255);
  const bl = srgbToLinear(b / 255);

  const lc = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl);
  const mc = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl);
  const sc = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl);

  const l = 0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc;
  const a = 1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc;
  const bb = 0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc;

  const hue = (Math.atan2(bb, a) * 180) / Math.PI;
  return { l, c: Math.hypot(a, bb), h: hue < 0 ? hue + 360 : hue };
}

export function hexToOklch(hex) {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToOklch(rgb) : null;
}

export function formatOklch({ l, c, h }) {
  return `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)})`;
}

/* --- Luminance & contrast (WCAG 2.2) ------------------------------------ */

function channelLuminance(value) {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ r, g, b }) {
  return 0.2126 * channelLuminance(r)
       + 0.7152 * channelLuminance(g)
       + 0.0722 * channelLuminance(b);
}

export function contrastRatio(hexA, hexB) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return 1;

  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);

  return (lighter + 0.05) / (darker + 0.05);
}

/** เกณฑ์ WCAG: normal ต้อง 4.5 (AA) / 7 (AAA) · large ต้อง 3 (AA) / 4.5 (AAA) */
export function wcagResults(ratio) {
  return {
    normalAA: ratio >= 4.5,
    normalAAA: ratio >= 7,
    largeAA: ratio >= 3,
    largeAAA: ratio >= 4.5,
    uiComponent: ratio >= 3,
  };
}

/** เลือกสีตัวอักษรที่อ่านง่ายที่สุดบนพื้นหลังที่กำหนด */
export function readableTextOn(bgHex, darkHex = '#0f172a', lightHex = '#ffffff') {
  return contrastRatio(bgHex, darkHex) >= contrastRatio(bgHex, lightHex) ? darkHex : lightHex;
}

/* --- Harmony ------------------------------------------------------------- */

const HARMONY_OFFSETS = {
  complementary: [0, 180],
  analogous: [-30, 0, 30],
  triadic: [0, 120, 240],
  'split-complementary': [0, 150, 210],
  tetradic: [0, 60, 180, 240],
  square: [0, 90, 180, 270],
  monochromatic: [0],
};

export const HARMONY_LABELS = {
  complementary: 'Complementary สีตรงข้าม',
  analogous: 'Analogous สีข้างเคียง',
  triadic: 'Triadic สามเหลี่ยม',
  'split-complementary': 'Split Complementary ตรงข้ามแยกสอง',
  tetradic: 'Tetradic สี่เหลี่ยม',
  square: 'Square สี่เหลี่ยมจัตุรัส',
  monochromatic: 'Monochromatic สีเดียว',
};

export const HARMONY_HINTS = {
  complementary: 'ตรงข้าม 180 องศา',
  analogous: 'ข้างเคียง 30 องศา',
  triadic: 'สามเหลี่ยม 120 องศา',
  'split-complementary': 'ตรงข้ามแล้วแยกสอง 150 กับ 210 องศา',
  tetradic: 'สี่เหลี่ยมผืนผ้า 60 กับ 180 องศา',
  square: 'สี่เหลี่ยมจัตุรัส 90 องศา',
  monochromatic: 'สีเดียวไล่ความสว่าง',
};

/* --- วงล้อสีแบบศิลปะ (RYB) ------------------------------------------------ */

/**
 * วงล้อที่คนเรียนศิลปะคุ้นคือวงล้อแม่สี แดง-เหลือง-น้ำเงิน ซึ่งไม่ใช่วงล้อเดียวกับ hue ของ HSL
 * บนวงล้อ HSL คู่ตรงข้ามของม่วงคือเขียวอมเหลือง แต่บนวงล้อศิลปะคือเหลือง
 * ตารางนี้แปลงมุมบนวงล้อศิลปะเป็น hue ของ HSL ทุก 15 องศา แล้วเชื่อมระหว่างจุดแบบเชิงเส้น
 */
const RYB_TO_RGB_HUE = [
  0, 8, 17, 26, 34, 41, 48, 54, 60, 81, 103, 123,
  138, 155, 171, 187, 204, 219, 234, 251, 267, 282, 298, 329, 360,
];

const wrap360 = (value) => (((value % 360) + 360) % 360);

function interpolate(table, position) {
  const scaled = position / 15;
  const index = Math.floor(scaled);
  const fraction = scaled - index;
  const from = table[index];
  const to = table[index + 1] ?? table[table.length - 1];
  return from + (to - from) * fraction;
}

/** มุมบนวงล้อศิลปะ (0=แดง 120=เหลือง 240=น้ำเงิน) เป็น hue ของ HSL */
export function rybHueToRgbHue(rybHue) {
  return wrap360(interpolate(RYB_TO_RGB_HUE, wrap360(rybHue)));
}

/** ทางกลับ — ค้นในตารางเดียวกันเพื่อไม่ให้มีตัวเลขสองชุดที่ต้องแก้พร้อมกัน */
export function rgbHueToRybHue(rgbHue) {
  const target = wrap360(rgbHue);
  for (let i = 0; i < RYB_TO_RGB_HUE.length - 1; i += 1) {
    const from = RYB_TO_RGB_HUE[i];
    const to = RYB_TO_RGB_HUE[i + 1];
    if (target >= from && target <= to) {
      const span = to - from;
      const fraction = span === 0 ? 0 : (target - from) / span;
      return wrap360(i * 15 + fraction * 15);
    }
  }
  return target;
}

/**
 * คืนชุดสีตามหลัก harmony
 *
 * การหมุนเกิดบนวงล้อศิลปะ ไม่ใช่บน hue ของ HSL ตรง ๆ
 * ไม่งั้นคู่ตรงข้ามของม่วงจะออกมาเป็นเขียวอมเหลืองแทนที่จะเป็นเหลือง
 * monochromatic ใช้การไล่ lightness แทนการหมุน hue
 */
export function buildHarmony(baseHsl, type) {
  if (type === 'monochromatic') {
    return [80, 65, 50, 35, 22].map((l) => ({ h: baseHsl.h, s: baseHsl.s, l }));
  }

  const offsets = HARMONY_OFFSETS[type] ?? HARMONY_OFFSETS.complementary;
  const baseRyb = rgbHueToRybHue(baseHsl.h);

  return offsets.map((offset) => ({
    h: rybHueToRgbHue(baseRyb + offset),
    s: baseHsl.s,
    l: baseHsl.l,
  }));
}

/* --- Tonal scale --------------------------------------------------------- */

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const SCALE_LIGHTNESS = [97, 94, 87, 78, 67, 56, 48, 39, 31, 24, 15];

/**
 * สร้าง tonal scale 11 ขั้นจากสีตั้งต้น
 *
 * สีที่ผู้ใช้เลือกต้องปรากฏในสเกลจริง ๆ จึงยึด (anchor) ไว้ที่ขั้นซึ่งความสว่างใกล้เคียงที่สุด
 * แล้วยืด/หดขั้นที่เหลือให้ไล่ไปหาปลายทั้งสองด้านอย่างต่อเนื่อง
 * ถ้าไล่ตาม SCALE_LIGHTNESS ตรง ๆ สีเข้มอย่าง #16a34a จะถูกดันให้สว่างขึ้นจนคอนทราสต์ไม่ผ่าน
 *
 * ปลายสเกลลด saturation ลงเล็กน้อยเพื่อไม่ให้สีอ่อน/เข้มดูฉูดฉาดเกินจริง
 */
export function buildScale(baseHsl) {
  const baseL = clamp(baseHsl.l, 3, 99);

  // ถ้าสีตั้งต้นเข้มหรือสว่างกว่าปลายสเกลมาตรฐาน ให้ยืดสเกลออกไปครอบมัน
  const lightest = Math.max(SCALE_LIGHTNESS[0], baseL);
  const darkest = Math.min(SCALE_LIGHTNESS[SCALE_LIGHTNESS.length - 1], baseL);

  const anchorIndex = SCALE_LIGHTNESS.reduce(
    (best, l, i) => (Math.abs(l - baseL) < Math.abs(SCALE_LIGHTNESS[best] - baseL) ? i : best),
    0,
  );
  const anchorL = SCALE_LIGHTNESS[anchorIndex];

  const lightnessAt = (index) => {
    if (index === anchorIndex) return baseL;

    if (index < anchorIndex) {
      const span = lightest - anchorL;
      if (span <= 0) return SCALE_LIGHTNESS[index];
      return lightest - (lightest - baseL) * ((lightest - SCALE_LIGHTNESS[index]) / span);
    }

    const span = anchorL - darkest;
    if (span <= 0) return SCALE_LIGHTNESS[index];
    return darkest + (baseL - darkest) * ((SCALE_LIGHTNESS[index] - darkest) / span);
  };

  return SCALE_STEPS.map((step, index) => {
    const isBase = index === anchorIndex;
    const l = clamp(lightnessAt(index), 3, 99);
    const distance = Math.abs(l - baseL) / 100;
    const s = isBase ? baseHsl.s : clamp(baseHsl.s * (1 - distance * 0.35), 8, 100);
    const hsl = { h: baseHsl.h, s, l };
    const hex = hslToHex(hsl);

    return {
      step,
      hex,
      hsl,
      isBase, // ขั้นที่ตรงกับสีซึ่งผู้ใช้เลือกไว้
      onColor: readableTextOn(hex),
      contrastOnWhite: contrastRatio(hex, '#ffffff'),
      contrastOnBlack: contrastRatio(hex, '#0f172a'),
    };
  });
}

/**
 * เลือกขั้นในสเกลที่อ่านออกบนพื้นหลังที่กำหนด
 * ไล่จากขั้นที่ใกล้ตัวเลือกตั้งต้นออกไป เพื่อให้ได้สีที่ยังใกล้เคียงเจตนาเดิมมากที่สุด
 *
 * @param {Array} scale ผลจาก buildScale
 * @param {string} bgHex พื้นหลังที่สีนี้จะไปวางอยู่
 * @param {number} minRatio เกณฑ์คอนทราสต์ที่ต้องผ่าน
 * @param {number} preferredStep ขั้นที่อยากได้ก่อน
 */
export function pickAccessibleStep(scale, bgHex, minRatio, preferredStep) {
  const startIndex = Math.max(0, scale.findIndex((entry) => entry.step === preferredStep));
  const bgIsDark = relativeLuminance(hexToRgb(bgHex) ?? { r: 255, g: 255, b: 255 }) < 0.18;

  // พื้นมืดต้องไล่หาสีที่สว่างขึ้น (ขั้นเลขน้อย) พื้นสว่างไล่หาสีที่เข้มขึ้น
  const direction = bgIsDark ? -1 : 1;

  for (let i = startIndex; i >= 0 && i < scale.length; i += direction) {
    if (contrastRatio(scale[i].hex, bgHex) >= minRatio) return scale[i];
  }

  // ไม่มีขั้นไหนผ่านเลย — คืนขั้นที่คอนทราสต์สูงสุดเท่าที่มี
  return scale.reduce((best, entry) =>
    (contrastRatio(entry.hex, bgHex) > contrastRatio(best.hex, bgHex) ? entry : best), scale[0]);
}

/* --- Color vision deficiency simulation ---------------------------------- */

const CVD_MATRICES = {
  protanopia: [0.567, 0.433, 0.0, 0.558, 0.442, 0.0, 0.0, 0.242, 0.758],
  deuteranopia: [0.625, 0.375, 0.0, 0.7, 0.3, 0.0, 0.0, 0.3, 0.7],
  tritanopia: [0.95, 0.05, 0.0, 0.0, 0.433, 0.567, 0.0, 0.475, 0.525],
  achromatopsia: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
};

export const CVD_LABELS = {
  normal: 'Normal vision',
  protanopia: 'Protanopia (แดงบอด)',
  deuteranopia: 'Deuteranopia (เขียวบอด)',
  tritanopia: 'Tritanopia (น้ำเงินบอด)',
  achromatopsia: 'Achromatopsia (ไม่เห็นสี)',
};

export function simulateCvd(hex, type) {
  const rgb = hexToRgb(hex);
  if (!rgb || type === 'normal' || !CVD_MATRICES[type]) return hex;

  const m = CVD_MATRICES[type];
  return rgbToHex({
    r: rgb.r * m[0] + rgb.g * m[1] + rgb.b * m[2],
    g: rgb.r * m[3] + rgb.g * m[4] + rgb.b * m[5],
    b: rgb.r * m[6] + rgb.g * m[7] + rgb.b * m[8],
  });
}

/* ── HSV ──────────────────────────────────────────────────────────────────
   ตัวเลือกสีแบบ 2 มิติใช้ HSV ไม่ใช่ HSL เพราะระนาบ S×V ให้สีอิ่มเต็มที่
   อยู่มุมขวาบนเสมอ — ตรงกับที่ผู้ใช้คาดหวังจาก picker ทั่วไป ส่วน HSL
   จะดันสีอิ่มไปกองกลางแกนตั้ง ทำให้ลากเลือกยากกว่า                        */

export function rgbToHsv({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  // ไม่ปัดเศษที่นี่ — ปัดแล้วค่า hex ที่ผู้ใช้พิมพ์จะเพี้ยนตอนแปลงกลับ
  // (#4f46e5 กลายเป็น #4f47e6) ให้ฝั่ง UI ปัดเองตอนแสดงผลเท่านั้น
  return {
    h,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  };
}

export function hsvToRgb({ h, s, v }) {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const vn = clamp(v, 0, 100) / 100;

  const c = vn * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = vn - c;

  const [r1, g1, b1] = hn < 60 ? [c, x, 0]
    : hn < 120 ? [x, c, 0]
    : hn < 180 ? [0, c, x]
    : hn < 240 ? [0, x, c]
    : hn < 300 ? [x, 0, c]
    : [c, 0, x];

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

export function hexToHsv(hex) {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsv(rgb) : null;
}

export function hsvToHex(hsv) {
  return rgbToHex(hsvToRgb(hsv));
}

export function formatRgb({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}
