/**
 * part-styles.js — คำศัพท์ของการแต่งส่วนย่อยบนผัง (pure, ไม่แตะ DOM)
 *
 * สีเป็น "บทบาท" ไม่ใช่ค่าสีดิบ — ค่าจริงมาจากชุดสีที่ตั้งไว้ใน Colorground เสมอ
 * ชื่อ token ที่ใช้คือชื่อสาธารณะ (--color-*) ซึ่งเป็นชื่อที่ layout.js เขียนลงในพื้นที่ผัง
 * ไม่ใช่ --pv-* ที่เป็นชื่อภายในของ palette-tokens.js
 * ผังจึงเปลี่ยนชุดสีทีเดียวแล้วทุกชิ้นตามไปพร้อมกัน และของที่ export ออกไปยังผูกกับ token ชุดเดิม
 *
 * ตัวเลือกที่แนะนำผูกกับชนิดของส่วนย่อย ไม่ใช่ความชอบ — ปุ่มลบควรเป็นสีอันตราย
 * ไม่ใช่เพราะแดงสวย แต่เพราะสีคือคำเตือนล่วงหน้าก่อนกด
 */

export const TONES = [
  { id: 'primary', label: 'หลัก', token: '--color-primary', on: '--color-on-primary' },
  { id: 'success', label: 'สำเร็จ', token: '--color-success-soft', on: '--color-on-success-soft' },
  { id: 'warning', label: 'เตือน', token: '--color-warning-soft', on: '--color-on-warning-soft' },
  { id: 'danger', label: 'อันตราย', token: '--color-danger-soft', on: '--color-on-danger-soft' },
  { id: 'info', label: 'ข้อมูล', token: '--color-info-soft', on: '--color-on-info-soft' },
  { id: 'neutral', label: 'กลาง', token: '--color-surface-alt', on: '--color-text' },
  { id: 'muted', label: 'จาง', token: '--color-surface', on: '--color-text-muted' },
];

export const SIZES = [
  { id: 'sm', label: 'เล็ก' },
  { id: 'md', label: 'กลาง' },
  { id: 'lg', label: 'ใหญ่' },
];

/** ชนิดของส่วนย่อย ดูจากคลาสที่ component ใช้จริง ไม่ใช่จากชื่อ tag */
export function partKind(node) {
  if (!node) return 'other';
  const cls = node.classList;
  // ปุ่มที่ไม่มีตัวขยายคือปุ่มหลักของบล็อกนั้น ปุ่มจางกับปุ่มโปร่งเป็นปุ่มรอง
  if (cls.contains('ui-btn')) {
    return cls.contains('ui-btn--ghost') || cls.contains('ui-btn--secondary')
      ? 'button-secondary'
      : 'button';
  }
  if (cls.contains('ui-badge')) return 'badge';
  if (cls.contains('ui-chip')) return 'chip';
  if (cls.contains('ui-tab')) return 'tab';
  if (cls.contains('ui-navbar__link') || cls.contains('ui-sidenav__item')
    || cls.contains('ui-crumb__link') || cls.contains('ui-footer__link')) return 'navlink';
  if (cls.contains('ui-page')) return 'page';
  return 'other';
}

/**
 * สีที่ควรใช้กับส่วนนี้ พร้อมเหตุผลสั้น ๆ ที่ผู้ใช้เอาไปตัดสินใจต่อได้
 * เดาจากคำบนปุ่มด้วย เพราะ "ลบถาวร" กับ "บันทึก" ควรได้คำแนะนำคนละแบบ ทั้งที่เป็นปุ่มเหมือนกัน
 */
export function suggestTone(kind, label = '') {
  const text = label.toLowerCase();

  const danger = /ลบ|ยกเลิก|ปิดใช้|หยุด|terminate|delete|remove/.test(text);
  const warn = /เตือน|รอ|ค้าง|เกิน|เลยกำหนด|ร่าง/.test(text);

  if (danger) return { tone: 'danger', why: 'เป็นการกระทำที่ย้อนกลับไม่ได้ สีต้องเตือนก่อนกด' };
  if (kind === 'button') return { tone: 'primary', why: 'เป็นการกระทำหลักของบล็อกนี้ ควรเด่นที่สุดเพียงจุดเดียว' };
  if (kind === 'button-secondary') return { tone: 'neutral', why: 'เป็นปุ่มรอง ปล่อยให้ปุ่มหลักในบล็อกเดียวกันเด่นอยู่คนเดียว' };
  if (kind === 'badge' && warn) return { tone: 'warning', why: 'ป้ายบอกสถานะที่ยังไม่จบ ใช้สีเตือนให้สะดุดตาแต่ไม่ตกใจ' };
  if (kind === 'badge') return { tone: 'success', why: 'ป้ายบอกสถานะที่จบแล้ว ใช้สีสำเร็จ' };
  if (kind === 'navlink' || kind === 'tab') return { tone: 'neutral', why: 'ทางเดินไม่ควรแย่งสายตาไปจากเนื้อหา ใช้สีกลาง' };
  return { tone: 'primary', why: 'ใช้สีแบรนด์เมื่ออยากให้เป็นจุดนำสายตา' };
}

/** ค่า CSS ที่จะเขียนลงบน element — คืนเป็นคู่ property เพื่อให้ตัว export ใช้ชุดเดียวกันได้ */
export function toneVars(toneId) {
  const tone = TONES.find((entry) => entry.id === toneId);
  if (!tone) return null;
  return { '--part-tone': `var(${tone.token})`, '--part-on': `var(${tone.on})` };
}
