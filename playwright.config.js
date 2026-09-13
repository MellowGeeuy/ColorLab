// @ts-check
/**
 * playwright.config.js — ตั้งค่าเทสต์ของ ColorLab
 *
 * โปรเจกต์นี้เป็น static ล้วน ไม่มี build step เทสต์จึงยิงใส่เซิร์ฟเวอร์ไฟล์ธรรมดา
 * ที่ Playwright สั่งเปิดให้เองก่อนรัน แล้วปิดให้ตอนจบ
 *
 * ใช้ channel: 'chrome' คือ Google Chrome ที่ติดตั้งในเครื่อง ไม่ใช่ Chromium ที่ Playwright โหลดมา
 * เพราะเครื่องนี้ดาวน์โหลดจาก cdn.playwright.dev ไม่ผ่าน (timeout)
 * ถ้าวันไหนโหลดได้ ให้รัน `npx playwright install chromium` แล้วเปลี่ยนบรรทัด channel เป็น
 * ...devices['Desktop Chrome'] เฉย ๆ เทสต์ทั้งชุดใช้ได้เหมือนเดิมโดยไม่ต้องแก้อย่างอื่น
 */
const { defineConfig, devices } = require('@playwright/test');

const PORT = 8765;
const BASE = `http://127.0.0.1:${PORT}`;

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  /* เผื่อความแกว่งของเครื่องไว้หนึ่งครั้ง เทสต์ที่วัดเวลาจะได้ไม่แดงเพราะภาระของเครื่อง */
  retries: 1,
  workers: 2,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // ฟอนต์ไทยโหลดจาก Google Fonts ถ้าเน็ตช้าเทสต์เรื่องตัวอักษรจะวัดผิด จึงรอนานขึ้น
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1600, height: 1000 } },
    },
    {
      /* มือถือรันเฉพาะเรื่องที่เกี่ยวกับการแสดงผล — เครื่องมือจัดผังกับการวัดความลื่น
         ออกแบบมาสำหรับเมาส์และจอกว้าง ไม่ได้ตั้งใจให้ใช้บนมือถือตั้งแต่แรก */
      name: 'mobile',
      testMatch: /(smoke|thai-typography)\.spec\.js/,
      use: { ...devices['Pixel 7'], channel: 'chrome' },
    },
  ],

  webServer: {
    /* static server ของโปรเจกต์เอง (tests/server.js) ไม่ใช่ python http.server
       เพราะตัวหลังตอบช้าจนเทสต์แดงแบบสุ่มเมื่อคลังคอมโพเนนต์โตขึ้น */
    command: 'node tests/server.js',
    url: BASE,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
