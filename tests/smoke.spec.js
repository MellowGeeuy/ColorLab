// @ts-check
/**
 * smoke.spec.js — ทุกหน้าต้องเปิดได้ ไม่มี error และไม่ล้นแนวนอน
 *
 * การล้นแนวนอนคือบั๊กที่ผู้ใช้เจอก่อนเพื่อนเสมอบนมือถือ และเป็นสิ่งที่ regression ง่ายที่สุด
 * เวลาแก้ CSS เทสต์นี้จึงยิงทุกหน้าทุกความกว้าง
 */
const { test, expect } = require('@playwright/test');
const { PAGES, collectErrors, waitForFonts } = require('./helpers');

for (const target of PAGES) {
  test(`เปิดได้และไม่มี error: ${target.name}`, async ({ page }) => {
    const errors = collectErrors(page);
    const res = await page.goto(target.path);

    expect(res?.status(), `${target.path} ต้องตอบ 200`).toBe(200);
    await waitForFonts(page);

    // ไอคอนทั้งเว็บมาจาก sprite ตัวเดียว ถ้าโหลดไม่ติดจะไม่มีไอคอนเลยทั้งหน้า
    await expect.poll(
      () => page.evaluate(() => Boolean(document.querySelector('svg symbol'))),
      { message: 'icon sprite ต้องโหลดสำเร็จ' },
    ).toBe(true);

    // หน้าเครื่องมือมี h1 ตัวแรกอยู่ในคู่มือที่ซ่อนไว้ จึงเช็กที่เนื้อหาหลักแทน
    await expect(page.locator('main')).toBeVisible();
    expect(errors, `${target.path} ไม่ควรมี error`).toEqual([]);
  });

  test(`ไม่ล้นแนวนอน: ${target.name}`, async ({ page }) => {
    await page.goto(target.path);
    await waitForFonts(page);

    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));

    expect(overflow.doc, `${target.path} เนื้อหากว้างเกินจอ`).toBeLessThanOrEqual(overflow.client);
  });
}

test('ปุ่มสลับธีมเปลี่ยนได้จริงและจำค่าไว้', async ({ page }) => {
  await page.goto('/theory/contrast/');
  await waitForFonts(page);

  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.locator('#theme-toggle').click();
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after).not.toBe(before);

  await page.reload();
  const kept = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(kept, 'ธีมที่เลือกต้องอยู่ต่อหลังรีเฟรช').toBe(after);
});

test('สารบัญพาไปหน้าตอนได้ และปุ่มท้ายหน้าพาไปตอนถัดไป', async ({ page }) => {
  await page.goto('/');
  await page.locator('.hubcard').first().click();
  await expect(page).toHaveURL(/\/theory\/color-first\//);

  await page.locator('.pager__link--next').click();
  await expect(page).toHaveURL(/\/theory\/three-axes\//);
  await expect(page.locator('.toc__link.is-current')).toHaveCount(1);
});
