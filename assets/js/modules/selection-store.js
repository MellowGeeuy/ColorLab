/**
 * selection-store.js — จำว่าตอนนี้ผู้ใช้เลือกสีไหนใน palette bar อยู่
 * แยกจาก palette-store เพราะเป็นคนละเรื่อง: palette คือข้อมูลของงาน
 * ส่วน selection คือสถานะของ UI ที่ไม่ต้องบันทึกลงเครื่อง
 */

export function createSelectionStore(initial = { kind: 'role', key: 'primary' }) {
  let selection = initial;
  const listeners = new Set();

  return {
    subscribe(listener) {
      listeners.add(listener);
      listener(selection);
      return () => listeners.delete(listener);
    },

    get: () => ({ ...selection }),

    set(next) {
      if (selection.kind === next.kind && selection.key === next.key) return;
      selection = { ...next };
      listeners.forEach((listener) => listener(selection));
    },

    /** อ่านค่าสีจริงของสิ่งที่เลือกออกจาก palette */
    resolve(palette) {
      if (selection.kind === 'accent') {
        return palette.accents[selection.key] ?? palette.accents[0] ?? palette.primary;
      }
      return palette[selection.key] ?? palette.primary;
    },
  };
}
