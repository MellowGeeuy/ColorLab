/**
 * theme-toggle.js — สลับ light/dark ผ่าน data-theme บน <html>
 * จำค่าที่ผู้ใช้เลือกไว้ใน localStorage ถ้าไม่เคยเลือกให้ตามระบบปฏิบัติการ
 */

const STORAGE_KEY = 'uxui-theory-theme';

function resolveInitialTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch { /* private mode: อ่านไม่ได้ก็ใช้ค่าระบบ */ }

  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme, button) {
  document.documentElement.setAttribute('data-theme', theme);
  if (!button) return;

  button.querySelector('use')?.setAttribute('href', theme === 'dark' ? '#i-sun' : '#i-moon');
  button.setAttribute('aria-label', theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด');
}

export function initThemeToggle() {
  const button = document.querySelector('#theme-toggle');
  let theme = resolveInitialTheme();
  applyTheme(theme, button);

  button?.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme, button);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch { /* เขียนไม่ได้ก็ปล่อยผ่าน ธีมยังทำงานในหน้านี้ */ }
  });
}
