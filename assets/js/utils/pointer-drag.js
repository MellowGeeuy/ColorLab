/**
 * pointer-drag.js — ลากด้วย Pointer Events ใช้ได้ทั้งเมาส์ ทัช และปากกา
 *
 * ทำไมไม่ใช้ HTML5 Drag and Drop: มันไม่ยิง event บนจอสัมผัสเลย ทั้ง iOS Safari และ
 * Android Chrome การลากวางในหน้า Layout จึงใช้ไม่ได้บนมือถือทั้งหมด
 * ส่วนอื่นของหน้านี้ (layout-canvas.js, layout-board.js) ใช้ pointerdown อยู่แล้ว
 * ไฟล์นี้จึงเป็นการดึงท่าเดียวกันมาไว้ที่เดียวให้ส่วนที่ยังใช้ DnD เรียกใช้ร่วมกัน
 *
 * เรื่องที่ยากที่สุดคือ "ลาก" กับ "เลื่อนดูรายการ" ใช้ท่าเดียวกันบนทัช
 * ทั้งแผงเลเยอร์และคลังคอมโพเนนต์เป็นลิสต์ที่ต้องเลื่อนดูได้ ถ้าตั้ง touch-action: none
 * ไว้ที่แถว นิ้วจะเลื่อนลิสต์ไม่ได้เลย จึงแยกด้วยเจตนาแทน:
 *   เมาส์/ปากกา — ขยับเกิน 5px ถือว่าเริ่มลาก (ชี้ได้แม่นอยู่แล้ว)
 *   นิ้ว        — ต้องแตะค้าง 320ms โดยไม่ขยับก่อน ถึงจะเข้าโหมดลาก
 *                 ระหว่างนั้นถ้าเลื่อนนิ้ว = ตั้งใจจะ scroll ก็ยกเลิกการลากไป
 * เป็นท่าเดียวกับที่ iOS/Android ใช้จัดลำดับรายการ ผู้ใช้จึงเดาถูกโดยไม่ต้องสอน
 */

const MOUSE_THRESHOLD = 5;
const TOUCH_HOLD_MS = 320;
const TOUCH_SLOP = 8;

/**
 * @param {HTMLElement} root ตัวที่ฟัง pointerdown (ใช้ event delegation ได้)
 * @param {object} opts
 * @param {(event: PointerEvent) => HTMLElement|null} opts.handle
 *        คืน element ที่จะลาก หรือ null ถ้าจุดที่กดไม่ใช่จุดเริ่มลาก
 * @param {(ctx: {target: HTMLElement, x: number, y: number}) => boolean|void} opts.onStart
 *        คืน false เพื่อไม่เริ่มลาก
 * @param {(ctx: {target: HTMLElement, x: number, y: number, dx: number, dy: number}) => void} opts.onMove
 * @param {(ctx: {target: HTMLElement, x: number, y: number, cancelled: boolean}) => void} opts.onEnd
 */
export function makeDraggable(root, { handle, onStart, onMove, onEnd }) {
  let target = null;      // element ที่กำลังลาก
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let armed = false;      // เข้าโหมดลากแล้วหรือยัง
  let holdTimer = 0;

  const clearHold = () => {
    if (!holdTimer) return;
    clearTimeout(holdTimer);
    holdTimer = 0;
  };

  /* ครั้งที่นิ้วเลื่อนหลังเข้าโหมดลากแล้ว ต้องห้ามหน้าเลื่อนตาม
     ตั้ง touch-action ตอนนี้ไม่ทัน เบราว์เซอร์ตัดสินใจไปแล้วตั้งแต่ touchmove แรก
     จึงต้องดัก touchmove แบบ non-passive แล้ว preventDefault เอง
     ทำได้เพราะตอนแตะค้าง นิ้วยังไม่ขยับ การ scroll จึงยังไม่เริ่ม */
  const blockScroll = (event) => { if (armed) event.preventDefault(); };

  const finish = (event, cancelled) => {
    clearHold();
    document.removeEventListener('touchmove', blockScroll);
    if (target && armed) onEnd({ target, x: event?.clientX ?? startX, y: event?.clientY ?? startY, cancelled });
    if (pointerId !== null && target?.hasPointerCapture?.(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
    target = null;
    pointerId = null;
    armed = false;
  };

  const arm = (x, y) => {
    if (armed || !target) return;
    if (onStart({ target, x, y }) === false) {
      finish(null, true);
      return;
    }
    armed = true;
  };

  root.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const found = handle(event);
    if (!found) return;

    target = found;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    armed = false;

    /* จับ pointer ไว้กับ element นี้ นิ้วเลื่อนออกนอกกรอบแล้วยังตามต่อ
       และ pointerup จะมาถึงเราแน่นอนแม้ปล่อยนอกหน้าต่าง */
    target.setPointerCapture?.(event.pointerId);
    document.addEventListener('touchmove', blockScroll, { passive: false });

    if (event.pointerType === 'touch') {
      holdTimer = setTimeout(() => { holdTimer = 0; arm(startX, startY); }, TOUCH_HOLD_MS);
    }
  });

  root.addEventListener('pointermove', (event) => {
    if (!target || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (!armed) {
      const dist = Math.hypot(dx, dy);
      if (event.pointerType === 'touch') {
        /* ยังไม่ครบเวลาแตะค้างแล้วนิ้วขยับ = ตั้งใจจะเลื่อนลิสต์ ไม่ใช่จะลาก */
        if (dist > TOUCH_SLOP) finish(event, true);
        return;
      }
      if (dist < MOUSE_THRESHOLD) return;
      arm(event.clientX, event.clientY);
      if (!armed) return;
    }

    event.preventDefault();
    onMove({ target, x: event.clientX, y: event.clientY, dx, dy });
  });

  const onUp = (event) => {
    if (!target || event.pointerId !== pointerId) return;
    finish(event, false);
  };

  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', (event) => {
    if (!target || event.pointerId !== pointerId) return;
    finish(event, true);
  });

  /* Escape ระหว่างลาก = ยกเลิก — ผู้ใช้คีย์บอร์ดคาดหวังแบบนี้ทุกที่ */
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && target) finish(null, true);
  });

  return {
    /** true ระหว่างที่กำลังลากอยู่จริง — ให้ผู้เรียกกันไม่ให้ click ทำงานซ้อน */
    isDragging: () => armed,
  };
}

/**
 * ตัวติดตามนิ้ว — HTML5 DnD วาดภาพลากให้เอง พอเลิกใช้ก็ต้องวาดเอง
 * ไม่งั้นผู้ใช้ไม่เห็นว่ากำลังถืออะไรอยู่
 */
export function createDragGhost(label) {
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.textContent = label;
  document.body.appendChild(ghost);
  return {
    moveTo(x, y) {
      ghost.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    },
    setState(ok) {
      ghost.classList.toggle('is-over', !!ok);
    },
    destroy() {
      ghost.remove();
    },
  };
}
