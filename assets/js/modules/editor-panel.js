/**
 * editor-panel.js — แผงควบคุมสีลอยแบบ modal เปิด/ปิดด้วยปุ่มลอย
 * จำสถานะไว้ใน localStorage, ปิดได้ด้วยปุ่ม, คลิก scrim หรือกด Escape
 */

const STORAGE_KEY = 'uxui-theory-editor-open';

export function initEditorPanel() {
  const panel = document.querySelector('#editor-panel');
  const toggle = document.querySelector('#editor-toggle');
  const scrim = document.querySelector('#editor-scrim');
  if (!panel || !toggle || !scrim) return;

  let open = true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) open = stored === '1';
  } catch { /* private mode: เริ่มแบบเปิดเสมอ */ }

  const apply = () => {
    panel.classList.toggle('is-open', open);
    scrim.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'ปิดแผงควบคุมสี' : 'เปิดแผงควบคุมสี');
    toggle.querySelector('use')?.setAttribute('href', open ? '#i-x' : '#i-palette');
  };

  const setOpen = (value) => {
    open = value;
    apply();
    try {
      localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
    } catch { /* เขียนไม่ได้ก็ยังใช้งานได้ในหน้านี้ */ }
  };

  apply();

  toggle.addEventListener('click', () => setOpen(!open));
  scrim.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) setOpen(false);
  });
}
