/**
 * compare-slider.js — ตัวลากเทียบภาพ "ก่อนแก้ / หลังแก้"
 *
 * ค่าตำแหน่งส่งออกเป็น CSS custom property ให้ CSS เป็นคนตัดภาพเอง
 * JS จึงไม่ต้องยุ่งกับ layout เลย และตัวคุมเป็น <input type="range"> จริง
 * เพื่อให้เลื่อนด้วยคีย์บอร์ดได้โดยไม่ต้องเขียน key handler เอง
 */

export function initCompareSliders(root = document) {
  const frames = [...root.querySelectorAll('[data-compare]')];

  frames.forEach(frame => {
    const range = frame.querySelector('.compare__range');
    if (!range) return;

    const apply = () => frame.style.setProperty('--compare-pos', `${range.value}%`);

    range.addEventListener('input', apply);
    apply();
  });
}
