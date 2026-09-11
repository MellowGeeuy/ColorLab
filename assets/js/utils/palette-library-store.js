/**
 * palette-library-store.js — ที่เก็บชุดสีที่ผู้ใช้บันทึกไว้ (pure, ไม่แตะ DOM)
 *
 * แยกออกมาเป็น util เพราะมีสองที่ที่เขียนคลังเดียวกัน:
 * แผงสร้างชุดสีอัตโนมัติ (บันทึกชุดที่เพิ่งสร้าง) และเครื่องมือบันทึก & ส่งออก
 * ถ้าปล่อยให้แต่ละที่อ่านเขียน localStorage เอง สองฝั่งจะเห็นข้อมูลไม่ตรงกัน
 */

import { normalizePalette } from './palette-tokens.js';

export const LIBRARY_KEY = 'uxui-theory-palette-library';
export const MAX_LIBRARY_ENTRIES = 24;

export function readLibrary() {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLibrary(entries) {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(entries));
    return true;
  } catch {
    // โหมดส่วนตัวหรือพื้นที่เต็ม — ผู้ใช้ยังทำงานต่อได้ แค่ไม่ถูกจำไว้
    return false;
  }
}

/**
 * บันทึกชุดสีใหม่ไว้บนสุดของคลัง
 * @returns {{ok: boolean, reason?: string, name?: string, entries: object[]}}
 */
export function saveToLibrary(name, palette) {
  const entries = readLibrary();

  if (entries.length >= MAX_LIBRARY_ENTRIES) {
    return { ok: false, reason: 'full', entries };
  }

  const entry = {
    name: String(name || `ชุดสีที่ ${entries.length + 1}`).trim(),
    savedAt: new Date().toISOString(),
    palette: normalizePalette(palette),
  };

  const next = [entry, ...entries];
  const stored = writeLibrary(next);

  return {
    ok: stored,
    reason: stored ? undefined : 'storage',
    name: entry.name,
    entries: next,
  };
}
