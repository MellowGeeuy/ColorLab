/**
 * checklist.js — เช็กลิสต์ตรวจงานสีก่อนส่ง (จำสถานะไว้ใน localStorage)
 */

const STORAGE_KEY = 'uxui-theory-checklist';

function readState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* เขียนไม่ได้ก็ยังใช้งานในหน้านี้ได้ */ }
}

export function initChecklist() {
  const items = Array.from(document.querySelectorAll('.checklist__item'));
  const counter = document.querySelector('#checklist-count');
  if (items.length === 0) return;

  const state = readState();

  const updateCounter = () => {
    if (!counter) return;
    const done = items.filter((item) => item.classList.contains('is-checked')).length;
    counter.textContent = `${done} / ${items.length}`;
  };

  items.forEach((item) => {
    const key = item.dataset.checkId;
    if (state[key]) item.classList.add('is-checked');

    item.setAttribute('role', 'checkbox');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-checked', String(Boolean(state[key])));

    const toggle = () => {
      const checked = item.classList.toggle('is-checked');
      item.setAttribute('aria-checked', String(checked));
      state[key] = checked;
      writeState(state);
      updateCounter();
    };

    item.addEventListener('click', toggle);
    item.addEventListener('keydown', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        toggle();
      }
    });
  });

  updateCounter();
}
