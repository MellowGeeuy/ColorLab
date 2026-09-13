/**
 * role-picker.js — เลือกดูทีละบทบาทของสีในตอนที่ 06
 *
 * ภาพหลักของตอนนั้นไฮไลต์วนอัตโนมัติ ซึ่งดีสำหรับคนที่เพิ่งเปิดหน้ามา
 * แต่พอจะเทียบจริงว่า "Neutral กินพื้นที่เท่าไร" ภาพที่ขยับเองตลอดกลับดูยาก
 * ตัวนี้จึงทำงานตรงข้าม คือหยุดนิ่งแล้วให้เลือกเองว่าจะดูบทบาทไหน
 */

const NOTES = {
  all: 'ทั้งสี่บทบาทอยู่ในหน้าจอเดียวกัน กดเลือกทีละอันเพื่อดูว่าแต่ละบทบาทกินพื้นที่แค่ไหน',
  primary: 'Primary — โผล่แค่โลโก้กับปุ่มหลัก สองจุดในทั้งหน้าจอ นี่คือสัดส่วนที่ควรเป็น',
  neutral: 'Neutral — เกือบทั้งหน้าจอคือสีกลาง จึงเป็นกลุ่มที่ต้องมีขั้นมากที่สุด 9–11 ขั้น',
  semantic: 'Semantic — ความหมายตายตัว success / warning / danger ห้ามหยิบไปใช้ตกแต่ง',
  accent: 'Accent — ใช้แยกหมวดในกราฟและแท็ก ไม่ควรเกิน 6 สี และต้องไม่ชนกับ semantic',
};

export function initRolePicker() {
  const root = document.querySelector('[data-rolepick]');
  if (!root) return;

  const chips = [...root.querySelectorAll('[data-role-pick]')];
  const parts = [...root.querySelectorAll('[data-role]')];
  const note = root.querySelector('[data-rolepick-note]');
  if (chips.length === 0) return;

  const render = (pick) => {
    chips.forEach((chip) => {
      const active = chip.dataset.rolePick === pick;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });

    /* หรี่ชิ้นที่ไม่ได้เลือกแทนการซ่อน — ต้องยังเห็นว่าหน้าจอเต็มหน้าตาเป็นอย่างไร
       ไม่งั้นจะเทียบสัดส่วนไม่ได้ ซึ่งเป็นเหตุผลเดียวที่ภาพนี้มีอยู่ */
    parts.forEach((el) => {
      el.classList.toggle('is-dim', pick !== 'all' && el.dataset.role !== pick);
    });

    if (note) note.textContent = NOTES[pick] ?? NOTES.all;
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => render(chip.dataset.rolePick));
  });

  render('all');
}
