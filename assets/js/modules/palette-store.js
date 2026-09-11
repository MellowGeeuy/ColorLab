/**
 * palette-store.js — เก็บ state ของ palette ที่กำลังแก้ไข และแจ้งผู้ที่สนใจเมื่อมีการเปลี่ยนแปลง
 */

import {
  DEFAULT_PALETTE, MAX_ACCENTS, normalizePalette, PRESETS,
} from '../utils/palette-tokens.js';

const STORAGE_KEY = 'uxui-theory-palette';

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function createPaletteStore() {
  const stored = readStored();
  let palette = normalizePalette(stored?.palette ?? DEFAULT_PALETTE);
  let theme = stored?.theme === 'dark' ? 'dark' : 'light';
  const listeners = new Set();

  const notify = () => listeners.forEach((listener) => listener(palette, theme));

  /**
   * ชุดสีเดียวถูกใช้ข้ามหน้า (Colorground · Component Style · หน้าอื่น ๆ) และผู้ใช้มักเปิดค้างไว้
   * หลายแท็บพร้อมกัน อีเวนต์ storage ยิงเฉพาะแท็บอื่นที่ไม่ใช่ตัวที่เขียน
   * แท็บที่เปิดค้างจึงอัปเดตตามทันทีโดยไม่ต้องรีเฟรช
   */
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const next = JSON.parse(event.newValue);
      palette = normalizePalette(next.palette ?? palette);
      theme = next.theme === 'dark' ? 'dark' : 'light';
      notify();
    } catch { /* ข้อมูลเสีย: คงค่าเดิมไว้ ดีกว่าล้างงานของผู้ใช้ */ }
  });

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ palette, theme }));
    } catch { /* โหมดส่วนตัว: ใช้งานต่อได้ แค่ไม่ถูกจำไว้ */ }
  };

  const emit = () => {
    persist();
    notify();
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      listener(palette, theme);
      return () => listeners.delete(listener);
    },

    getPalette: () => ({ ...palette, accents: [...palette.accents] }),
    getTheme: () => theme,

    setRole(role, hex) {
      if (palette[role] === hex) return;
      palette = normalizePalette({ ...palette, [role]: hex });
      emit();
    },

    setAccent(index, hex) {
      const accents = [...palette.accents];
      if (index < 0 || index >= accents.length || accents[index] === hex) return;
      accents[index] = hex;
      palette = normalizePalette({ ...palette, accents });
      emit();
    },

    addAccent(hex) {
      if (palette.accents.length >= MAX_ACCENTS) return false;
      palette = normalizePalette({ ...palette, accents: [...palette.accents, hex] });
      emit();
      return true;
    },

    removeAccent(index) {
      if (palette.accents.length <= 1) return false;
      const accents = palette.accents.filter((_, i) => i !== index);
      palette = normalizePalette({ ...palette, accents });
      emit();
      return true;
    },

    /** รับสีจากการวางข้อความ: สีแรกเป็น primary ที่เหลือเป็น accent */
    applyHexList(list) {
      if (list.length === 0) return false;
      const [first, ...rest] = list;
      palette = normalizePalette({
        ...palette,
        primary: first,
        accents: rest.length > 0 ? rest.slice(0, MAX_ACCENTS) : palette.accents,
      });
      emit();
      return true;
    },

    /** โหลดทั้งชุดจากคลังที่ผู้ใช้บันทึกไว้ */
    applyPalette(next) {
      palette = normalizePalette(next);
      emit();
      return true;
    },

    applyPreset(key) {
      const preset = PRESETS[key];
      if (!preset) return false;
      palette = normalizePalette(preset.palette);
      emit();
      return true;
    },

    setTheme(next) {
      if (theme === next) return;
      theme = next === 'dark' ? 'dark' : 'light';
      emit();
    },

    toggleTheme() {
      theme = theme === 'dark' ? 'light' : 'dark';
      emit();
    },

    reset() {
      palette = normalizePalette(DEFAULT_PALETTE);
      emit();
    },
  };
}
