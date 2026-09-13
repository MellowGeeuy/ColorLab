// @ts-check
/**
 * thai-typography.spec.js — ตัวอักษรไทยต้องเห็นครบ ไม่ถูกเฉือน
 *
 * ภาษาไทยมีสระบนซ้อนวรรณยุกต์กับสระล่าง กล่องบรรทัดที่สูงพอสำหรับภาษาอังกฤษ
 * จึงเฉือนยอดสระหรือหางสระของไทยได้ โดยที่ไม่มีอะไรใน DOM ฟ้องเลย
 *
 * เทสต์นี้วัดด้วย canvas measureText: อ่านความสูงของ "หมึก" จริงของข้อความนั้น
 * ด้วยฟอนต์และน้ำหนักเดียวกับที่ element ใช้ แล้วเทียบกับกล่องบรรทัด
 * ถ้าหมึกล้นออกไปแปลว่าผู้ใช้จะเห็นสระถูกตัด
 *
 * เทสต์นี้เกิดจากของจริง: ตอนเปลี่ยนฟอนต์เป็น Anuphan เจอ 10 จุดทั่วเว็บที่สระโดนเฉือน
 * เพราะ Anuphan ต้องการ line-height 1.73 เท่า ขณะที่ฟอนต์เดิมต้องการ 1.46 เท่า
 */
const { test, expect } = require('@playwright/test');
const { PAGES, waitForFonts, revealAll } = require('./helpers');

/** คืนรายการ element ที่หมึกไทยล้นกล่องบรรทัด */
const INK_PROBE = () => {
  const ctx = document.createElement('canvas').getContext('2d');
  const hasThai = (s) => /[฀-๿]/.test(s);
  const label = (el) => {
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '';
    return el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (cls ? `.${cls}` : '');
  };

  const bad = [];
  document.querySelectorAll('body *').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;

    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3 && n.textContent.trim())
      .map((n) => n.textContent)
      .join(' ')
      .trim();
    if (!own || !hasThai(own)) return;
    if (el.getBoundingClientRect().height < 3) return;

    const fs = parseFloat(cs.fontSize);
    const lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const m = ctx.measureText(own.slice(0, 80));
    if (!isFinite(m.actualBoundingBoxAscent)) return;

    // หมึกถูกวางกลางกล่องบรรทัด: half-leading เท่ากันทั้งบนและล่าง
    const halfLead = (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
    const top = halfLead + (m.fontBoundingBoxAscent - m.actualBoundingBoxAscent);
    const bottom = halfLead + (m.fontBoundingBoxDescent - m.actualBoundingBoxDescent);

    // ยอมได้ครึ่งพิกเซล — จอวาดด้วย device pixel และมีการ antialias อยู่แล้ว
    // ส่วนที่ล้นต่ำกว่านี้มองไม่เห็นจริง และจะทำให้เทสต์แดงจากการปัดเศษ
    const TOLERANCE = -0.5;
    if (top < TOLERANCE || bottom < TOLERANCE) {
      bad.push({
        sel: label(el),
        text: own.slice(0, 30),
        fontSize: Math.round(fs * 10) / 10,
        lineHeight: Math.round(lh * 10) / 10,
        overTop: Math.round(top * 10) / 10,
        overBottom: Math.round(bottom * 10) / 10,
      });
    }
  });
  return bad;
};

for (const target of PAGES) {
  test(`สระไทยไม่ถูกเฉือน: ${target.name}`, async ({ page }) => {
    await page.goto(target.path);
    await waitForFonts(page);
    await revealAll(page);

    // หน้า Layout ต้องมีของบนผังก่อน ไม่งั้นไม่มีตัวอักษรให้วัด
    if (target.path === '/layout/') {
      const chips = page.locator('.lay-lib__item');
      const total = Math.min(await chips.count(), 6);
      for (let i = 0; i < total; i += 1) await chips.nth(i).click();
      await page.waitForTimeout(400);
    }

    const bad = await page.evaluate(INK_PROBE);
    const report = bad
      .map((b) => `${b.sel} ${b.fontSize}px/lh${b.lineHeight} บน ${b.overTop} ล่าง ${b.overBottom} "${b.text}"`)
      .join('\n');

    expect(bad, `พบตัวอักษรไทยถูกเฉือน:\n${report}`).toEqual([]);
  });
}

test('ปุ่มและช่องกรอกมี line-height ที่ระบุไว้ ไม่ใช่ normal', async ({ page }) => {
  await page.goto('/layout/');
  await waitForFonts(page);

  // normal ของ Anuphan คำนวณเป็น 1.2 เท่า ซึ่งไม่พอกับสระซ้อนของไทย
  const tight = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button, input, select, textarea').forEach((el) => {
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      if (cs.lineHeight === 'normal') {
        out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ยังเป็น normal`);
        return;
      }
      if (parseFloat(cs.lineHeight) / fs < 1.3) {
        out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} = ${(parseFloat(cs.lineHeight) / fs).toFixed(2)}`);
      }
    });
    return [...new Set(out)];
  });

  expect(tight, `control เหล่านี้บรรทัดแคบเกินไปสำหรับไทย:\n${tight.join('\n')}`).toEqual([]);
});
