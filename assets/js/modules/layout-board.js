/**
 * layout-board.js — มุมมองบอร์ด: เห็นทุกหน้าพร้อมกันและเห็นว่าอะไรพาไปไหน
 *
 * ที่มาของรูปแบบนี้คือกระดาน prototype ของเครื่องมือออกแบบ (docs/research/layout-redesign-research.md)
 * กรอบหนึ่งกรอบคือหนึ่งหน้าจอ ชื่ออยู่เหนือกรอบและเป็นที่จับสำหรับลากย้าย
 * เส้นโค้งลากจากชิ้นที่ผูกลิงก์ไปยังขอบซ้ายของหน้าปลายทาง จึงอ่าน flow ได้ทั้งกระดานโดยไม่ต้องกดทีละชิ้น
 *
 * ตำแหน่งกรอบเป็นเรื่องของการดูอย่างเดียว ไม่ออกไปกับไฟล์ที่ส่งออก
 * ผังจริงยังเป็นกริดเสมอ เพราะตัวเลขที่เห็นต้องเป็นตัวเลขเดียวกับที่ export
 */

import { boardWidth, boardHeight } from '../utils/layout-model.js';

const NS = 'http://www.w3.org/2000/svg';
const DRAG_THRESHOLD = 3;

export function createLayoutBoard(options) {
  const {
    root, viewport, getLayout, getZoom = () => 1,
    renderScreen, onOpen, onSelectScreen, onMove, onPlay, onScreenMenu,
  } = options;

  let drag = null;

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'lay-board__wires');
  svg.setAttribute('aria-hidden', 'true');

  const frameEls = new Map();

  const render = () => {
    const layout = getLayout();
    root.replaceChildren();
    frameEls.clear();

    const width = boardWidth(layout);

    layout.screens.forEach((screen) => {
      const height = boardHeight(layout, screen);

      const frame = document.createElement('div');
      frame.className = 'lay-frame';
      frame.dataset.screen = screen.id;
      frame.style.left = `${screen.x ?? 0}px`;
      frame.style.top = `${screen.y ?? 0}px`;
      frame.style.width = `${width}px`;
      if (screen.id === layout.activeScreen) frame.classList.add('is-active');

      // ป้ายชื่อทำหน้าที่เดียวกับชื่อเฟรมในเครื่องมือออกแบบ: เป็นทั้งชื่อและที่จับของทั้งกรอบ
      const label = document.createElement('div');
      label.className = 'lay-frame__label';
      label.dataset.role = 'handle';

      if (screen.id === layout.start) {
        const flag = document.createElementNS(NS, 'svg');
        flag.setAttribute('class', 'icon lay-frame__start');
        const use = document.createElementNS(NS, 'use');
        use.setAttribute('href', '#i-play');
        flag.appendChild(use);
        label.appendChild(flag);
      }

      const name = document.createElement('span');
      name.className = 'lay-frame__name';
      name.textContent = screen.name;
      label.appendChild(name);

      const size = document.createElement('span');
      size.className = 'lay-frame__size';
      size.textContent = `${width} × ${Math.round(height)}`;
      label.appendChild(size);

      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'lay-frame__open';
      open.dataset.role = 'open';
      open.textContent = 'แก้หน้านี้';
      label.appendChild(open);

      const body = document.createElement('div');
      body.className = 'lay-frame__body';
      body.style.height = `${height}px`;
      body.style.setProperty('--grid-cols', layout.cols);
      body.style.setProperty('--grid-row-h', `${layout.rowHeight}px`);
      body.style.setProperty('--grid-gap', `${layout.gap}px`);

      renderScreen(screen, body);

      frame.append(label, body);
      root.appendChild(frame);
      frameEls.set(screen.id, frame);
    });

    root.appendChild(svg);
    // วาดเส้นทันทีไม่รอเฟรมถัดไป — แท็บที่ไม่ได้อยู่หน้าจอไม่ยิง requestAnimationFrame
    // เส้นจะไม่ขึ้นเลยถ้าไปพึ่งมัน และขนาดบอร์ดก็จะยังเป็นศูนย์
    drawWires();
  };

  /** เส้นโค้งแนวนอนอ่านง่ายกว่าเส้นตรง เพราะไม่ตัดผ่านกรอบอื่นเป็นมุมแหลม */
  const drawWires = () => {
    const layout = getLayout();
    svg.replaceChildren();

    const rootRect = root.getBoundingClientRect();
    const zoom = getZoom();
    let maxX = 0;
    let maxY = 0;

    layout.screens.forEach((screen) => {
      const frame = frameEls.get(screen.id);
      if (!frame) return;
      maxX = Math.max(maxX, (screen.x ?? 0) + frame.offsetWidth);
      maxY = Math.max(maxY, (screen.y ?? 0) + frame.offsetHeight);

      // ลิงก์ของชิ้นงานมีได้ทั้งแบบทั้งชิ้นและแบบรายส่วน
      // แต่เมนูที่ทุกหน้ามีเหมือนกันทำให้เส้นซ้ำกันสิบกว่าเส้นระหว่างสองหน้าเดิม
      // บอร์ดต้องตอบว่า "หน้านี้ไปหน้าไหนได้บ้าง" ไม่ใช่ "มีปุ่มกี่ปุ่มที่พาไปที่นั่น"
      // จึงเหลือเส้นเดียวต่อคู่ (ชิ้นงาน → หน้าปลายทาง)
      const seen = new Set();
      const wires = screen.items.flatMap((item) => {
        const box = frame.querySelector(`[data-id="${item.id}"]`);
        if (!box) return [];

        const list = [];
        const add = (node, to) => {
          const key = `${item.id}>${to}`;
          if (seen.has(key)) return;
          seen.add(key);
          list.push({ node, to });
        };

        if (item.link) add(box, item.link);

        Object.entries(item.links ?? {}).forEach(([part, to]) => {
          const node = box.querySelector(`[data-part="${part}"]`);
          if (node) add(node, to);
        });

        return list;
      });

      wires.forEach(({ node: source, to }) => {
        const targetFrame = frameEls.get(to);
        if (!targetFrame) return;

        const sr = source.getBoundingClientRect();
        const tr = targetFrame.getBoundingClientRect();

        const x1 = (sr.right - rootRect.left) / zoom;
        const y1 = (sr.top + sr.height / 2 - rootRect.top) / zoom;
        const x2 = (tr.left - rootRect.left) / zoom;
        const y2 = (tr.top + 24 - rootRect.top) / zoom;

        const bend = Math.max(60, Math.abs(x2 - x1) * 0.45);

        const path = document.createElementNS(NS, 'path');
        // เส้นของหน้าที่กำลังทำงานอยู่ต้องอ่านออกก่อนเพื่อน ที่เหลือเป็นฉากหลัง
        const focused = screen.id === layout.activeScreen || to === layout.activeScreen;
        path.setAttribute('class', focused ? 'lay-wire is-focused' : 'lay-wire');
        path.setAttribute('d', `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`);
        svg.appendChild(path);

        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('class', 'lay-wire__dot');
        dot.setAttribute('cx', x1);
        dot.setAttribute('cy', y1);
        dot.setAttribute('r', 4);
        svg.appendChild(dot);

        const head = document.createElementNS(NS, 'path');
        head.setAttribute('class', 'lay-wire__head');
        head.setAttribute('d', `M ${x2 - 9} ${y2 - 5} L ${x2} ${y2} L ${x2 - 9} ${y2 + 5} Z`);
        svg.appendChild(head);
      });
    });

    svg.setAttribute('width', maxX + 80);
    svg.setAttribute('height', maxY + 80);
    root.style.width = `${maxX + 80}px`;
    root.style.height = `${maxY + 80}px`;
  };

  /* --- ลากย้ายกรอบ --- */

  root.addEventListener('pointerdown', (event) => {
    const frame = event.target instanceof Element ? event.target.closest('.lay-frame') : null;
    if (!frame) return;

    const role = event.target.closest('[data-role]')?.dataset.role;
    if (role === 'open') {
      onOpen?.(frame.dataset.screen);
      return;
    }

    onSelectScreen?.(frame.dataset.screen);

    // จับตรงไหนของกรอบก็ลากได้ ไม่ต้องเล็งป้ายชื่อ — ยกเว้นปุ่มที่มีหน้าที่ของตัวเอง
    if (role && role !== 'handle') return;

    const screen = getLayout().screens.find((entry) => entry.id === frame.dataset.screen);
    drag = {
      id: frame.dataset.screen,
      startX: event.clientX,
      startY: event.clientY,
      originX: screen?.x ?? 0,
      originY: screen?.y ?? 0,
      moved: false,
    };

    try { root.setPointerCapture(event.pointerId); } catch { /* ตัวชี้สังเคราะห์ไม่มี capture ให้จับ */ }
    event.preventDefault();
  });

  root.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const zoom = getZoom();
    const dx = (event.clientX - drag.startX) / zoom;
    const dy = (event.clientY - drag.startY) / zoom;

    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;

    // ต้องหาใหม่สดทุกครั้ง ไม่ใช้ตัวที่จำไว้ตอนกด — การเลือกหน้าตอนคลิกทำให้บอร์ดวาดใหม่
    // กรอบที่จำไว้จึงกลายเป็นของที่หลุดจากหน้าไปแล้ว ขยับเท่าไหร่ก็ไม่มีอะไรเกิดขึ้น
    const frame = root.querySelector(`.lay-frame[data-screen="${drag.id}"]`);
    if (!frame) return;
    frame.style.left = `${Math.max(0, drag.originX + dx)}px`;
    frame.style.top = `${Math.max(0, drag.originY + dy)}px`;
    drawWires();
  });

  const endDrag = (event) => {
    if (!drag) return;
    const frame = root.querySelector(`.lay-frame[data-screen="${drag.id}"]`);
    if (drag.moved && frame) {
      onMove?.(drag.id, parseFloat(frame.style.left), parseFloat(frame.style.top));
    }
    try { root.releasePointerCapture(event.pointerId); } catch { /* ไม่มี capture ก็ไม่ต้องคืน */ }
    drag = null;
  };

  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);

  root.addEventListener('contextmenu', (event) => {
    const frame = event.target instanceof Element ? event.target.closest('.lay-frame') : null;
    if (!frame) return;
    event.preventDefault();
    onScreenMenu?.(frame.dataset.screen, event.clientX, event.clientY);
  });

  root.addEventListener('dblclick', (event) => {
    const frame = event.target instanceof Element ? event.target.closest('.lay-frame') : null;
    if (frame) onOpen?.(frame.dataset.screen);
  });

  root.addEventListener('click', (event) => {
    const flag = event.target instanceof Element ? event.target.closest('.lay-frame__start') : null;
    if (flag) onPlay?.();
  });

  return { render, drawWires };
}
