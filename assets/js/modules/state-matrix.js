/**
 * state-matrix.js — ตาราง variant x state ของ component หนึ่งตัว
 *
 * ทุกช่องวาดจาก data-state ซึ่ง component-catalog.css เขียนคู่กับ pseudo-class ไว้แล้ว
 * จึงเห็น hover / focus / disabled พร้อมกันได้โดยไม่ต้องเอาเมาส์ไปชี้ทีละอัน
 * และทำให้สคริปต์ตรวจคอนทราสต์อ่านสีของสถานะเหล่านี้จาก DOM ได้จริง
 */

const STATE_LABELS = {
  default: 'ปกติ',
  hover: 'ชี้อยู่',
  active: 'กำลังกด',
  focus: 'โฟกัสด้วยคีย์บอร์ด',
  disabled: 'ปิดใช้งาน',
  selected: 'ถูกเลือก',
  error: 'ผิดพลาด',
};

export function renderStateMatrix(meta) {
  const { states, variants, render } = meta.matrix;

  const table = document.createElement('table');
  table.className = 'cs-matrix';

  const head = states.map((state) => `<th scope="col">${STATE_LABELS[state] ?? state}</th>`).join('');

  const rows = variants.map((variant) => {
    const cells = states.map((state) => `<td><div class="cs-matrix__cell">${render(variant.cls, state)}</div></td>`).join('');
    return `<tr><th scope="row">${variant.label}</th>${cells}</tr>`;
  }).join('');

  table.innerHTML = `<thead><tr><td></td>${head}</tr></thead><tbody>${rows}</tbody>`;

  const wrap = document.createElement('div');
  wrap.className = 'cs-matrix-wrap';
  wrap.appendChild(table);

  // ช่องในตารางเป็นภาพประกอบ ไม่ใช่ของที่กดได้จริง จึงต้องไม่อยู่ในลำดับ tab และไม่ถูกอ่านซ้ำ
  wrap.querySelectorAll('button, input, select, a').forEach((el) => {
    el.tabIndex = -1;
    el.setAttribute('aria-hidden', 'true');
  });

  return wrap;
}
