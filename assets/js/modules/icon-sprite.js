/**
 * icon-sprite.js — โหลด SVG sprite กลางเข้าหน้าเว็บ
 *
 * เก็บ sprite ไว้ไฟล์เดียวแล้ว inject ตอนรัน เพื่อไม่ต้องคัดลอก symbol ซ้ำในทุกหน้า
 * (ต้องเปิดผ่าน HTTP — fetch ใช้กับ file:// ไม่ได้ เช่นเดียวกับ ES Modules)
 */

const SPRITE_URL = new URL('../../images/icon-sprite.svg', import.meta.url);

export async function loadIconSprite() {
  if (document.querySelector('.icon-sprite')) return;

  try {
    const response = await fetch(SPRITE_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const holder = document.createElement('div');
    holder.className = 'icon-sprite';
    holder.setAttribute('aria-hidden', 'true');
    holder.innerHTML = await response.text();
    document.body.prepend(holder);
  } catch (error) {
    // ไอคอนหายไม่ควรทำให้ทั้งหน้าใช้งานไม่ได้ — ข้อความและปุ่มยังทำงานปกติ
    console.warn('[icon-sprite] โหลดไม่สำเร็จ:', error.message);
  }
}
