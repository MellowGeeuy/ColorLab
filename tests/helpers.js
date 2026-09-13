// @ts-check
/** helpers.js — ของที่ใช้ร่วมกันหลายไฟล์เทสต์ */

/** ทุกหน้าที่มีจริงในเว็บ ใช้ทั้งใน smoke และเทสต์ตัวอักษร */
const PAGES = [
  { path: '/', name: 'สารบัญ Color Theory' },
  { path: '/theory/color-first/', name: '01 สีทำงานก่อนตัวหนังสือ' },
  { path: '/theory/three-axes/', name: '02 สามแกนของสี' },
  { path: '/theory/color-models/', name: '03 Color Models' },
  { path: '/theory/harmony/', name: '04 วงล้อสีและ Harmony' },
  { path: '/theory/psychology/', name: '05 สีกับความรู้สึก' },
  { path: '/theory/color-roles/', name: '06 สี่บทบาทของสี' },
  { path: '/theory/scales/', name: '07 จากสีเดียวสู่สเกล' },
  { path: '/theory/contrast/', name: '08 Contrast และ WCAG' },
  { path: '/theory/dark-mode/', name: '09 Dark Mode' },
  { path: '/theory/proportion/', name: '10 สัดส่วนการใช้สี' },
  { path: '/theory/fixes/', name: '11 ก่อนแก้ / หลังแก้' },
  { path: '/workspace/', name: 'Colorground' },
  { path: '/component-style/', name: 'Component Style' },
  { path: '/layout/', name: 'Layout' },
];

/**
 * เก็บ error จาก console และ exception ที่หลุดออกมา
 * favicon 404 ไม่นับ — เว็บนี้ไม่มี favicon โดยตั้งใจ
 */
function collectErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    // ข้อความของ 404 ไม่มี URL อยู่ในตัวมันเอง ต้องดูที่ location เอา
    const where = msg.location?.().url ?? '';
    if (msg.text().includes('favicon') || where.includes('favicon')) return;
    errors.push(`console: ${msg.text().slice(0, 160)} @ ${where.slice(-60)}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${String(err).slice(0, 200)}`));
  return errors;
}

/** รอให้ฟอนต์โหลดเสร็จก่อนวัดอะไรที่เกี่ยวกับตัวอักษร */
async function waitForFonts(page) {
  await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 15_000 });
}

/** เปิดภาพที่รอ reveal ทั้งหมดให้โผล่ ไม่งั้นวัดอะไรไม่ได้เพราะยัง opacity 0 */
async function revealAll(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in-view'));
  });
}

/** ล้างผังที่ค้างอยู่ในเครื่อง ให้ทุกเทสต์เริ่มจากผังเปล่าเหมือนกัน */
async function resetLayout(page) {
  // addInitScript ทำงานทุกครั้งที่หน้าโหลด รวมถึงตอนรีเฟรชด้วย
  // ถ้าล้างทุกรอบ เทสต์ที่ตรวจว่า "ผังยังอยู่หลังรีเฟรช" จะไม่มีวันผ่าน
  // ใช้ sessionStorage เป็นเครื่องหมายเพราะอยู่ข้ามการรีเฟรชในแท็บเดียวกัน
  await page.addInitScript(() => {
    try {
      if (sessionStorage.getItem('pw-layout-reset')) return;
      sessionStorage.setItem('pw-layout-reset', '1');
      localStorage.removeItem('uxui-theory-layout');
    } catch { /* โหมดส่วนตัวอ่าน storage ไม่ได้ */ }
  });
}

/**
 * หยุดทรานซิชันและอนิเมชันทั้งหน้า
 *
 * จำเป็นกับเทสต์ที่วัดสี — ปุ่ม Colorground มี transition ของสีตัวอักษรที่หน่วงไว้ 260ms
 * โดยตั้งใจ ถ้าไม่หยุดก่อนวัด จะจับสีระหว่างทางแล้วรายงานว่าคอนทราสต์ตกทั้งที่ไม่ตก
 */
async function freezeMotion(page) {
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
}

module.exports = { PAGES, collectErrors, waitForFonts, revealAll, resetLayout, freezeMotion };
