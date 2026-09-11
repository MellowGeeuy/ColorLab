/**
 * part-actions.js — คำศัพท์ของ "กดแล้วเกิดอะไร" ในผัง (pure, ไม่แตะ DOM)
 *
 * ผังไม่มีหลังบ้าน การกระทำอย่างลบหรือสั่งหยุดโปรเซสจึงเกิดขึ้นจริงไม่ได้
 * แต่สิ่งที่ผังต้องตอบให้ได้คือ "ปุ่มนี้ทำอะไร" ซึ่งเป็นข้อมูลที่คนเขียนโค้ดต่อจำเป็นต้องรู้
 * ของที่ส่งออกจึงติด data-action ไปด้วย และตอนกดในโหมดทดลองจะบอกผลที่จะเกิดแทนการทำจริง
 *
 * ยกเว้นสองอย่างที่ทำจริงได้ในผัง เพราะเป็นการเดินภายในผังเอง — ไปหน้าอื่น กับเปิดหน้าต่างซ้อน
 */

export const ACTION_GROUPS = [
  {
    label: 'เดินในผัง',
    actions: [
      { id: 'goto', label: 'ไปหน้าอื่น', needs: 'screen', live: true },
      { id: 'modal', label: 'เปิดหน้าต่างซ้อน', needs: 'modal', live: true },
      { id: 'back', label: 'ย้อนกลับ', live: true },
      { id: 'close', label: 'ปิดหน้าต่างซ้อน', live: true },
    ],
  },
  {
    label: 'จัดการข้อมูล',
    actions: [
      { id: 'create', label: 'เพิ่มรายการใหม่', needs: 'subject' },
      { id: 'update', label: 'บันทึกการแก้ไข', needs: 'subject' },
      { id: 'delete', label: 'ลบรายการ', needs: 'subject', destructive: true },
      { id: 'duplicate', label: 'ทำสำเนา', needs: 'subject' },
      { id: 'submit', label: 'ส่งฟอร์ม', needs: 'subject' },
      { id: 'export', label: 'ส่งออกข้อมูล', needs: 'subject' },
    ],
  },
  {
    label: 'สั่งงานที่กำลังทำงานอยู่',
    actions: [
      { id: 'start', label: 'สั่งเริ่ม', needs: 'subject' },
      { id: 'restart', label: 'สั่งเริ่มใหม่', needs: 'subject' },
      { id: 'pause', label: 'สั่งพัก', needs: 'subject' },
      { id: 'terminate', label: 'สั่งหยุดถาวร', needs: 'subject', destructive: true },
    ],
  },
  {
    label: 'ออกนอกผัง',
    actions: [
      { id: 'external', label: 'เปิดลิงก์ภายนอก', needs: 'url' },
    ],
  },
];

export const ACTIONS = ACTION_GROUPS.flatMap((group) => group.actions);

export const actionById = (id) => ACTIONS.find((action) => action.id === id) ?? null;

/** ประโยคที่บอกว่าจะเกิดอะไรขึ้น ใช้ทั้งบนแถบสถานะตอนทดลอง และเป็นคอมเมนต์ในไฟล์ที่ส่งออก */
export function describeAction(action, context = {}) {
  if (!action || action.type === 'none') return '';

  const subject = action.subject || 'รายการนี้';
  const screen = context.screenName || 'หน้าที่ผูกไว้';
  const modal = context.modalName || 'หน้าต่างซ้อนที่ผูกไว้';

  const lines = {
    goto: `ไปหน้า ${screen}`,
    modal: `เปิด ${modal} ซ้อนบนหน้านี้`,
    back: 'ย้อนกลับหน้าก่อนหน้า',
    close: 'ปิดหน้าต่างซ้อน',
    create: `เพิ่ม${subject}ใหม่`,
    update: `บันทึกการแก้ไข${subject}`,
    delete: `ลบ${subject} — ต้องถามยืนยันก่อนเสมอ`,
    duplicate: `ทำสำเนา${subject}`,
    submit: `ส่ง${subject}`,
    export: `ส่งออก${subject}`,
    start: `สั่งเริ่ม${subject}`,
    restart: `สั่งเริ่ม${subject}ใหม่`,
    pause: `สั่งพัก${subject}`,
    terminate: `สั่งหยุด${subject}ถาวร — ต้องถามยืนยันก่อนเสมอ`,
    external: `เปิดลิงก์ ${action.url || 'ที่ตั้งไว้'} ในแท็บใหม่`,
  };

  return lines[action.type] ?? '';
}

/** การกระทำที่ทำจริงได้ในผัง ไม่ต้องรอหลังบ้าน */
export const isLiveAction = (type) => Boolean(actionById(type)?.live);
