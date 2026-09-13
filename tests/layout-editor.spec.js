// @ts-check
/**
 * layout-editor.spec.js — พฤติกรรมของเครื่องมือจัดผัง
 *
 * เน้นสองเรื่องที่ผู้ใช้เจอจริงและเคยพังมาแล้ว
 *   1. ของที่วางลงผังต้องไม่ถูกตัดเนื้อหา ไม่งั้นผังบนจอไม่ตรงกับไฟล์ที่ส่งออก
 *   2. ลากหนึ่งครั้ง = undo หนึ่งครั้ง ไม่ใช่สองครั้ง
 */
const { test, expect } = require('@playwright/test');
const { collectErrors, waitForFonts, resetLayout } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await resetLayout(page);
});

test('วางของจากคลังแล้วขึ้นบนผัง', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/layout/');
  await waitForFonts(page);

  await expect(page.locator('.lay-item')).toHaveCount(0);
  await page.locator('.lay-lib__item').first().click();
  await expect(page.locator('.lay-item')).toHaveCount(1);

  // แผงขวาต้องเปลี่ยนไปแสดงของที่เพิ่งวาง
  await expect(page.locator('.lay-insp__title')).toBeVisible();
  expect(errors).toEqual([]);
});

test('ทุก component ต้องไม่ถูกตัดเนื้อหาตั้งแต่วางครั้งแรก', async ({ page }) => {
  await page.goto('/layout/');
  await waitForFonts(page);

  const slugs = await page.locator('.lay-lib__item').evaluateAll(
    (nodes) => nodes.map((n) => n.dataset.slug),
  );

  const cut = [];
  for (const slug of slugs) {
    await page.locator(`.lay-lib__item[data-slug="${slug}"]`).click();
    await page.waitForTimeout(140);
    const over = await page.locator('.lay-item.is-selected').getAttribute('data-overflow');
    if (over) cut.push(`${slug} ล้น ${over}px`);
    // ลบทิ้งก่อนวางตัวถัดไป ผังจะได้ไม่ยาวจนวัดยาก
    await page.locator('[data-act="remove"]').click();
    await page.waitForTimeout(80);
  }

  expect(cut, `component เหล่านี้ถูกตัดเนื้อหาตั้งแต่วางครั้งแรก:\n${cut.join('\n')}`).toEqual([]);
});

test('ย่อของให้เล็กเกินไปต้องมีป้ายเตือน และปุ่มขยายให้พอดีต้องแก้ได้จบในครั้งเดียว', async ({ page }) => {
  await page.goto('/layout/');
  await waitForFonts(page);

  await page.locator('.lay-lib__item[data-slug="card"]').click();
  const item = page.locator('.lay-item').first();
  await expect(item).not.toHaveAttribute('data-overflow', /.*/);

  // ย่อความสูงลงจนเนื้อหาล้นแน่ ๆ
  const height = page.locator('[data-field="h"]');
  await height.fill('4');
  await height.dispatchEvent('change');

  await expect(item, 'ของที่เนื้อหาล้นต้องมีป้ายบอก').toHaveAttribute('data-overflow', /\d+/);
  await expect(page.locator('[data-fit]')).toBeVisible();

  await page.locator('[data-act="fit"]').click();
  await expect(item, 'กดขยายให้พอดีครั้งเดียวต้องหายล้น').not.toHaveAttribute('data-overflow', /.*/);
});

test('ลากหนึ่งครั้ง กด undo หนึ่งครั้งต้องกลับที่เดิม', async ({ page }) => {
  await page.goto('/layout/');
  await waitForFonts(page);
  await page.locator('.lay-lib__item').first().click();

  const before = {
    col: await page.locator('[data-field="col"]').inputValue(),
    row: await page.locator('[data-field="row"]').inputValue(),
  };

  const item = page.locator('.lay-item').first();
  const box = await item.boundingBox();
  if (!box) throw new Error('ไม่พบกล่องของชิ้นที่จะลาก');

  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  for (let i = 1; i <= 8; i += 1) {
    await page.mouse.move(box.x + 20 + i * 18, box.y + 20 + i * 9);
  }
  await page.mouse.up();
  await page.waitForTimeout(250);

  const moved = {
    col: await page.locator('[data-field="col"]').inputValue(),
    row: await page.locator('[data-field="row"]').inputValue(),
  };
  expect(moved, 'ลากแล้วตำแหน่งต้องเปลี่ยน').not.toEqual(before);

  await page.locator('#lay-undo').click();
  await page.waitForTimeout(250);

  const back = {
    col: await page.locator('[data-field="col"]').inputValue(),
    row: await page.locator('[data-field="row"]').inputValue(),
  };
  expect(back, 'undo ครั้งเดียวต้องกลับไปตำแหน่งก่อนลาก').toEqual(before);
});

test('ลากด้วยคีย์บอร์ดได้ และโฟกัสไม่หลุด', async ({ page }) => {
  await page.goto('/layout/');
  await waitForFonts(page);
  // ต้องใช้ของที่แคบกว่าความกว้างผัง — ของที่กว้างเต็ม 12 คอลัมน์ขยับขวาไม่ได้อยู่แล้ว
  await page.locator('.lay-lib__item[data-slug="badge"]').click();

  const item = page.locator('.lay-item').first();
  await item.focus();
  const before = await page.locator('[data-field="col"]').inputValue();

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);

  const after = await page.locator('[data-field="col"]').inputValue();
  expect(Number(after), 'ลูกศรขวาต้องขยับไปหนึ่งคอลัมน์').toBe(Number(before) + 1);

  const focused = await page.evaluate(() => document.activeElement?.classList.contains('lay-item'));
  expect(focused, 'โฟกัสต้องยังอยู่ที่ชิ้นเดิมหลังขยับ').toBe(true);
});

test('ผังที่ทำไว้ยังอยู่หลังรีเฟรช', async ({ page }) => {
  await page.goto('/layout/');
  await waitForFonts(page);
  await page.locator('.lay-lib__item').first().click();
  await page.locator('.lay-lib__item').nth(1).click();
  await expect(page.locator('.lay-item')).toHaveCount(2);

  await page.reload();
  await waitForFonts(page);
  await expect(page.locator('.lay-item'), 'ผังต้องถูกจำไว้ในเครื่อง').toHaveCount(2);
});
