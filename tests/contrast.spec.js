// @ts-check
/**
 * contrast.spec.js — เว็บที่สอนเรื่องคอนทราสต์ต้องผ่านเกณฑ์ของตัวเอง
 *
 * วัดสีที่เบราว์เซอร์วาดจริง ไม่ได้อ่านจากไฟล์ CSS
 * ตัวอย่างที่จงใจทำให้ผิดเพื่อสอน (อยู่ใน .figure หรือ .tool) ไม่นับเป็นข้อบกพร่อง
 *
 * เกณฑ์: WCAG 2.2 SC 1.4.3 ข้อความ 4.5:1 (ตัวใหญ่ 3:1) · SC 1.4.11 เส้นขอบ control 3:1
 */
const { test, expect } = require('@playwright/test');
const { waitForFonts, revealAll, freezeMotion } = require('./helpers');

const TARGETS = ['/', '/theory/contrast/', '/theory/scales/', '/workspace/', '/component-style/', '/layout/'];

const AUDIT = () => {
  const lum = (c) => {
    const f = (v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const hex = (c) => `#${c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  const bgOf = (el) => {
    let node = el;
    while (node) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c.length >= 3 && (c[3] === undefined || c[3] > 0.95)) return c;
      node = node.parentElement;
    }
    return [255, 255, 255];
  };

  // ตัวอย่างที่กำลังสอนอยู่ในกรอบภาพหรือกล่องเครื่องมือ หลายอันจงใจทำให้ตกเกณฑ์
  const DEMO = '.figure, .tool, .legibility, .compare, .glare, .cvd-demo, .axis-lab, .mixer, .context, .elev, .dark-brand, .model-lab, .wcag-demo, .scale-table, .steps, .arena, .area-meter, .rolepick, .sector, .harmony-use, .vibe, .mood, .themes, .roles, .proof, .ratio, .gaze, .elevlab, .notation, .wheels, .harmony-explorer, .ramps, .axes, .hu-banner, .hu-cards, .hu-chart';

  const fails = [];
  const seen = new Set();

  document.querySelectorAll('main *, .topbar *, .toc *, .pager *').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    if (el.closest(DEMO)) return;

    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!own) return;

    const fg = parse(cs.color);
    const bg = bgOf(el);
    const px = parseFloat(cs.fontSize);
    const large = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
    const need = large ? 3 : 4.5;
    const got = ratio(fg, bg);

    const key = `${hex(fg)}${hex(bg)}${Math.round(px)}`;
    if (seen.has(key)) return;
    seen.add(key);

    if (got < need) {
      fails.push(`ข้อความ ${got.toFixed(2)}:1 (ต้อง ${need}) ${hex(fg)} บน ${hex(bg)} ${px}px "${el.textContent.trim().slice(0, 24)}"`);
    }
  });

  document.querySelectorAll('.btn, input, select, textarea').forEach((el) => {
    if (el.closest(DEMO)) return;
    const cs = getComputedStyle(el);
    const width = parseFloat(cs.borderTopWidth);
    if (!width) return;
    const color = parse(cs.borderTopColor);
    if (color[3] !== undefined && color[3] < 0.5) return;
    const around = bgOf(el.parentElement);
    const got = ratio(color, around);
    const key = `b${hex(color)}${hex(around)}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (got < 3) fails.push(`เส้นขอบ ${got.toFixed(2)}:1 (ต้อง 3) ${hex(color)} บน ${hex(around)}`);
  });

  return fails;
};

for (const path of TARGETS) {
  for (const theme of ['light', 'dark']) {
    test(`คอนทราสต์ผ่านเกณฑ์ WCAG: ${path} · ธีม ${theme}`, async ({ page }) => {
      await page.goto(path);
      await waitForFonts(page);
      await freezeMotion(page);
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await revealAll(page);
      await page.waitForTimeout(150);

      const fails = await page.evaluate(AUDIT);
      expect(fails, `${path} (${theme}) ตกเกณฑ์:\n${fails.join('\n')}`).toEqual([]);
    });
  }
}
