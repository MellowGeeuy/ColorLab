/**
 * layout-canvas.js — แคนวาสกริดที่ลากวาง ย้าย และยืดขนาดของบนผังได้
 *
 * ท่าทางทั้งหมดยึดตามที่เครื่องมือออกแบบใช้กันจนเป็นมาตรฐาน ผู้ใช้จึงไม่ต้องเรียนรู้ใหม่:
 * ลากตัวของเพื่อย้าย · ลากหมุดขอบเพื่อยืด · เว้นวรรคค้างแล้วลากเพื่อเลื่อนผัง ·
 * Ctrl กับล้อเมาส์เพื่อย่อขยายที่ตำแหน่งเคอร์เซอร์ · ลูกศรขยับทีละช่อง
 *
 * ตัวแคนวาสเป็น CSS Grid จริง ตำแหน่งของทุกชิ้นจึงเป็นตัวเลขช่องที่ export ออกไปใช้ได้ตรง ๆ
 * และเงาที่แสดงระหว่างลากคือช่องที่ของจะไปลงจริง ไม่ใช่การเดา
 */

import { rowsNeeded, itemsOf, activeScreen, layerState } from '../utils/layout-model.js';

const DRAG_THRESHOLD = 3;

export function createLayoutCanvas(options) {
  const {
    root, viewport, getLayout, onChange, onSelect, renderItem,
    getZoom = () => 1, onPan, isPreview = () => false, onChangeMany,
  } = options;

  let selectedId = null;
  /** ส่วนย่อยที่กำลังแก้อยู่ในชิ้นที่เลือก — null คือกำลังทำงานที่ระดับชิ้น */
  let selectedPart = null;
  /**
   * ชิ้นที่เลือกร่วมนอกเหนือจากตัวหลัก — ตัวหลักคือตัวที่แผงคุณสมบัติแสดง
   * แยกกันเพราะการแก้ค่าทีละฟิลด์ต้องมีเป้าเดียวเสมอ ส่วนการย้าย ซ่อน ลบ ทำได้ทั้งชุด
   */
  let extraIds = [];
  let drag = null;
  let pan = null;
  let spaceHeld = false;
  /** โหมดมือค้างไว้ตลอด (ปุ่มในแถบ) ต่างจาก Space ที่เป็นการค้างชั่วคราว */
  let handMode = false;

  const cellSize = () => {
    const layout = getLayout();
    const width = root.clientWidth - layout.gap * 2;
    const colWidth = (width - layout.gap * (layout.cols - 1)) / layout.cols;
    return { colWidth, rowHeight: layout.rowHeight, gap: layout.gap };
  };

  /** แปลงพิกัดบนจอเป็นช่องกริด — ใช้ทั้งตอนปล่อยของที่ลากมาและตอนคลิกที่ว่าง */
  const cellAt = (clientX, clientY) => {
    const rect = root.getBoundingClientRect();
    const { colWidth, rowHeight, gap } = cellSize();
    const zoom = getZoom() || 1;
    const localX = (clientX - rect.left) / zoom;
    const localY = (clientY - rect.top) / zoom;
    return {
      col: Math.max(1, Math.floor((localX - gap) / (colWidth + gap)) + 1),
      row: Math.max(1, Math.floor((localY - gap) / (rowHeight + gap)) + 1),
    };
  };

  const applyGridStyle = () => {
    const layout = getLayout();
    root.style.setProperty('--grid-cols', layout.cols);
    root.style.setProperty('--grid-row-h', `${layout.rowHeight}px`);
    root.style.setProperty('--grid-gap', `${layout.gap}px`);
    root.style.setProperty('--grid-rows', rowsNeeded(layout));
  };

  /* --- การวาด --- */

  const buildGuides = (layout) => {
    const guides = document.createElement('div');
    guides.className = 'lay-guides';
    guides.setAttribute('aria-hidden', 'true');
    guides.style.gridColumn = `1 / span ${layout.cols}`;
    guides.style.gridRow = `1 / span ${rowsNeeded(layout)}`;
    guides.style.gridTemplateColumns = `repeat(${layout.cols}, minmax(0, 1fr))`;
    guides.style.gap = `${layout.gap}px`;

    for (let i = 0; i < layout.cols; i += 1) guides.appendChild(document.createElement('span'));
    return guides;
  };

  /** เงาบอกช่องปลายทางระหว่างลาก — ผู้ใช้เห็นผลก่อนปล่อยมือ ไม่ต้องปล่อยแล้วค่อยลุ้น */
  const ghost = document.createElement('div');
  ghost.className = 'lay-ghost';
  ghost.hidden = true;
  ghost.setAttribute('aria-hidden', 'true');

  const showGhost = (item) => {
    ghost.hidden = false;
    ghost.style.gridColumn = `${item.col} / span ${item.w}`;
    ghost.style.gridRow = `${item.row} / span ${item.h}`;
  };

  const hideGhost = () => { ghost.hidden = true; };

  const render = () => {
    const layout = getLayout();
    applyGridStyle();
    root.replaceChildren();
    root.appendChild(buildGuides(layout));
    root.appendChild(ghost);

    const screen = activeScreen(layout);

    itemsOf(layout).forEach((item) => {
      const state = layerState(screen, item);
      // ชิ้นที่ซ่อนไว้หายจากผังจริง ๆ แบบเดียวกับเครื่องมือออกแบบ ยังเลือกได้จากแผงเลเยอร์
      if (state.hidden) return;

      const box = document.createElement('div');
      box.className = 'lay-item';
      box.dataset.id = item.id;
      box.dataset.slug = item.slug;
      // ธงนี้ทำสองหน้าที่: ตอนแก้ผังบอกว่าชิ้นนี้ผูกลิงก์ไว้แล้ว ตอนทดลองใช้เป็นเป้าที่กดได้
      if (item.link) box.dataset.link = item.link;
      box.style.gridColumn = `${item.col} / span ${item.w}`;
      box.style.gridRow = `${item.row} / span ${item.h}`;
      box.tabIndex = 0;
      box.setAttribute('role', 'button');
      box.setAttribute('aria-label', `${item.slug} คอลัมน์ ${item.col} แถว ${item.row} ขนาด ${item.w} คูณ ${item.h}`);
      if (state.locked) box.classList.add('is-locked');
      if (item.id === selectedId) {
        box.classList.add('is-selected');
        if (selectedPart) box.classList.add('is-part-mode');
      } else if (extraIds.includes(item.id)) {
        box.classList.add('is-selected', 'is-selected-extra');
      }

      const stage = document.createElement('div');
      stage.className = 'lay-item__stage';
      stage.setAttribute('aria-hidden', 'true');
      renderItem(item, stage);

      const size = document.createElement('span');
      size.className = 'lay-item__size';
      size.textContent = `${item.w} × ${item.h}`;

      box.append(stage, size);

      // หมุดยืดขนาดสามจุดแบบเครื่องมือออกแบบทั่วไป: ขอบขวา ขอบล่าง และมุม
      ['e', 's', 'se'].forEach((dir) => {
        const handle = document.createElement('span');
        handle.className = `lay-item__handle lay-item__handle--${dir}`;
        handle.dataset.role = 'resize';
        handle.dataset.dir = dir;
        box.appendChild(handle);
      });

      root.appendChild(box);
    });

    paintPart();
  };

  const paintPart = () => {
    root.querySelectorAll('[data-part].is-part-selected')
      .forEach((node) => node.classList.remove('is-part-selected'));

    if (!selectedPart) return;
    root.querySelector(`.lay-item[data-id="${selectedId}"] [data-part="${selectedPart}"]`)
      ?.classList.add('is-part-selected');
  };

  const paintSelection = () => {
    root.querySelectorAll('.lay-item').forEach((node) => {
      const id = node.dataset.id;
      const extra = extraIds.includes(id);
      node.classList.toggle('is-selected', id === selectedId || extra);
      node.classList.toggle('is-selected-extra', extra && id !== selectedId);
      node.classList.toggle('is-part-mode', id === selectedId && Boolean(selectedPart));
    });
  };

  const select = (id, part = null) => {
    selectedId = id;
    selectedPart = id ? part : null;
    extraIds = [];
    paintSelection();
    paintPart();
    onSelect(id, selectedPart);
  };

  /** เลือกทั้งชุด — ตัวสุดท้ายในลิสต์เป็นตัวหลักที่แผงคุณสมบัติจะแสดง */
  const selectMany = (ids) => {
    const list = [...new Set(ids)].filter(Boolean);
    selectedId = list.length ? list[list.length - 1] : null;
    extraIds = list.slice(0, -1);
    selectedPart = null;
    paintSelection();
    paintPart();
    onSelect(selectedId, null);
  };

  /** เพิ่ม/เอาออกจากชุดที่เลือก — Ctrl หรือ Shift คลิกบนแคนวาสและในแผงเลเยอร์ใช้ตัวเดียวกัน */
  const toggleSelect = (id) => {
    const current = selectedId ? [...extraIds, selectedId] : [...extraIds];
    selectMany(current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]);
  };

  const focusItem = (id) => {
    root.querySelector(`.lay-item[data-id="${id}"]`)?.focus();
  };

  /** เน้นชิ้นบนผังตอนชี้ที่แถวในแผงเลเยอร์ — บอกว่าแถวนั้นคือของชิ้นไหนโดยไม่ต้องคลิก */
  const peek = (id) => {
    root.querySelectorAll('.lay-item.is-peek').forEach((node) => node.classList.remove('is-peek'));
    if (id) root.querySelector(`.lay-item[data-id="${id}"]`)?.classList.add('is-peek');
  };

  /* --- ลากย้าย ยืดขนาด และเลื่อนผัง --- */

  root.addEventListener('pointerdown', (event) => {
    // ระหว่างทดลองใช้ ผังต้องทำตัวเหมือนหน้าเว็บจริง ไม่ใช่ของที่ลากได้
    if (isPreview()) return;

    if (spaceHeld || handMode || event.button === 1) {
      pan = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
      viewport.classList.add('is-panning');
      event.preventDefault();
      return;
    }

    const box = event.target.closest('.lay-item');
    if (!box) {
      select(null);
      options.onCanvasPoint?.(cellAt(event.clientX, event.clientY));
      return;
    }

    const layout = getLayout();
    const item = itemsOf(layout).find((entry) => entry.id === box.dataset.id);
    if (!item) return;

    // ล็อกไว้แล้วต้องกดไม่โดนเลย ไม่งั้นมันกันมือลั่นไม่ได้จริง — ยังเลือกได้จากแผงเลเยอร์
    if (layerState(activeScreen(layout), item).locked) {
      options.onLockedHit?.(item.id);
      return;
    }

    // Ctrl หรือ Shift คลิก = เพิ่มเข้าชุดที่เลือก ไม่ใช่เริ่มเลือกใหม่
    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      toggleSelect(item.id);
      event.preventDefault();
      return;
    }

    // คลิกแรกเลือกทั้งชิ้น คลิกซ้ำบนส่วนย่อยจึงเจาะเข้าไปแก้ส่วนนั้น
    // (ท่าเดียวกับเครื่องมือออกแบบทั่วไป — ลากทั้งชิ้นได้เหมือนเดิมโดยไม่ต้องออกจากโหมดแก้ส่วน)
    const partNode = event.target.closest('[data-part]');
    const inGroupSelection = extraIds.includes(item.id);

    if (partNode && item.id === selectedId && event.target.dataset.role !== 'resize') {
      select(item.id, partNode.dataset.part);
    } else if (item.id !== selectedId && !inGroupSelection) {
      select(item.id);
    }

    // ลากชิ้นที่อยู่ในชุดที่เลือกไว้ = ย้ายทั้งชุดพร้อมกัน ระยะเท่ากันทุกตัว
    const groupIds = inGroupSelection || extraIds.length
      ? [selectedId, ...extraIds].filter(Boolean)
      : [item.id];

    drag = {
      mode: event.target.dataset.role === 'resize' ? 'resize' : 'move',
      dir: event.target.dataset.dir ?? 'se',
      id: item.id,
      ids: groupIds.includes(item.id) ? groupIds : [item.id],
      startX: event.clientX,
      startY: event.clientY,
      origin: { ...item },
      origins: new Map(itemsOf(layout)
        .filter((entry) => groupIds.includes(entry.id))
        .map((entry) => [entry.id, { ...entry }])),
      moved: false,
    };

    // pointer ที่มาจากสคริปต์ทดสอบไม่มีตัวจริงให้จับ — จับไม่ได้ก็ลากต่อได้ ไม่ต้องล้ม
    try { root.setPointerCapture(event.pointerId); } catch { /* ไม่มี pointer จริง */ }
    root.classList.add('is-dragging');
    event.preventDefault();
  });

  root.addEventListener('pointermove', (event) => {
    if (pan) {
      viewport.scrollLeft = pan.left - (event.clientX - pan.x);
      viewport.scrollTop = pan.top - (event.clientY - pan.y);
      return;
    }

    if (!drag) return;

    // ระยะที่เมาส์เดินเป็นพิกเซลบนจอ ต้องหารด้วยระดับการย่อขยายก่อน
    const zoom = getZoom() || 1;
    const dx = (event.clientX - drag.startX) / zoom;
    const dy = (event.clientY - drag.startY) / zoom;
    if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
    drag.moved = true;

    const { colWidth, rowHeight, gap } = cellSize();
    const stepX = Math.round(dx / (colWidth + gap));
    const stepY = Math.round(dy / (rowHeight + gap));

    let patch;
    if (drag.mode === 'move') {
      patch = { col: drag.origin.col + stepX, row: drag.origin.row + stepY };
    } else {
      patch = {};
      if (drag.dir !== 's') patch.w = drag.origin.w + stepX;
      if (drag.dir !== 'e') patch.h = drag.origin.h + stepY;
    }

    // ระหว่างลากยังไม่บันทึกเป็นขั้นของ undo — ไม่งั้นลากครั้งเดียวได้ประวัติร้อยขั้น
    if (drag.mode === 'move' && drag.ids.length > 1 && onChangeMany) {
      const patches = {};
      drag.ids.forEach((id) => {
        const origin = drag.origins.get(id);
        if (origin) patches[id] = { col: origin.col + stepX, row: origin.row + stepY };
      });
      onChangeMany(patches, false);
    } else {
      onChange(drag.id, patch, false);
    }

    const moving = itemsOf(getLayout()).find((entry) => entry.id === drag.id);
    if (moving) showGhost(moving);
  });

  const endDrag = (event) => {
    if (pan) {
      pan = null;
      viewport.classList.remove('is-panning');
      return;
    }
    if (!drag) return;
    if (drag.moved) onChange(drag.id, {}, true);
    try { root.releasePointerCapture(event.pointerId); } catch { /* ไม่เคยจับไว้ */ }
    root.classList.remove('is-dragging');
    hideGhost();
    drag = null;
  };

  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);

  /* --- คีย์บอร์ดบนตัวชิ้นงาน --- */

  root.addEventListener('keydown', (event) => {
    if (isPreview()) return;

    // Esc ถอยออกจากส่วนย่อยมาที่ระดับชิ้นก่อน แล้วค่อยเลิกเลือกทั้งหมด
    if (event.key === 'Escape' && selectedId) {
      event.preventDefault();
      select(selectedId, null);
      return;
    }

    const box = event.target.closest('.lay-item');
    if (!box) return;

    const layout = getLayout();
    const item = itemsOf(layout).find((entry) => entry.id === box.dataset.id);
    if (!item) return;

    const map = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    const delta = map[event.key];

    if (delta) {
      event.preventDefault();
      if (layerState(activeScreen(layout), item).locked) return;

      const ids = [selectedId, ...extraIds].filter(Boolean);
      // กด Shift พร้อมลูกศรคือยืดขนาด ตรงกับที่เครื่องมือออกแบบทั่วไปทำ
      if (!event.shiftKey && ids.length > 1 && ids.includes(item.id) && onChangeMany) {
        const patches = {};
        itemsOf(layout).filter((entry) => ids.includes(entry.id)).forEach((entry) => {
          patches[entry.id] = { col: entry.col + delta[0], row: entry.row + delta[1] };
        });
        onChangeMany(patches, true);
        requestAnimationFrame(() => focusItem(item.id));
        return;
      }

      const patch = event.shiftKey
        ? { w: item.w + delta[0], h: item.h + delta[1] }
        : { col: item.col + delta[0], row: item.row + delta[1] };
      onChange(item.id, patch, true);
      requestAnimationFrame(() => focusItem(item.id));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select(item.id);
    }
  });

  /* --- เว้นวรรคค้างเพื่อเลื่อนผัง --- */

  const isTyping = (target) => target instanceof Element
    && target.matches('input, textarea, select');

  const onSpaceDown = (event) => {
    if (event.code !== 'Space' || event.repeat) return;
    // event.target เป็น document ได้เมื่ออีเวนต์ไม่ได้มาจาก element ใด จึงต้องกันก่อนเรียก matches
    if (isTyping(event.target)) return;
    spaceHeld = true;
    viewport.classList.add('is-pannable');
    event.preventDefault();
  };

  const onSpaceUp = (event) => {
    if (event.code !== 'Space') return;
    spaceHeld = false;
    if (!handMode) viewport.classList.remove('is-pannable', 'is-panning');
  };

  document.addEventListener('keydown', onSpaceDown);
  document.addEventListener('keyup', onSpaceUp);
  window.addEventListener('blur', () => { spaceHeld = false; viewport.classList.remove('is-pannable', 'is-panning'); });

  /* --- ล้อเมาส์: ย่อขยายที่ตำแหน่งเคอร์เซอร์ · Shift เลื่อนแนวนอน --- */

  viewport.addEventListener('wheel', (event) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      onPan?.({ type: 'zoom', delta: event.deltaY, x: event.clientX, y: event.clientY });
      return;
    }
    if (event.shiftKey) {
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    }
  }, { passive: false });

  /* --- รับของที่ลากมาจากคลัง ---
     เดิมใช้ dragover/drop ของ HTML5 DnD ซึ่งไม่ยิง event บนจอสัมผัสเลย
     เปลี่ยนเป็นให้ฝั่งที่ลาก (pages/layout.js) เรียกสามเมธอดนี้จาก pointermove/pointerup แทน
     ตรรกะการแปลงพิกัดเป็นช่องกริดยังเป็น cellAt ตัวเดิม ไม่ได้ทำซ้ำ */

  /** จุดนี้อยู่เหนือแคนวาสไหม — ใช้ทั้งไฮไลต์และตัดสินว่าปล่อยแล้วนับหรือไม่ */
  const pointInCanvas = (clientX, clientY) => {
    const rect = root.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right
        && clientY >= rect.top && clientY <= rect.bottom;
  };

  return {
    /** ไฮไลต์แคนวาสระหว่างลาก — คืนค่าว่าอยู่เหนือแคนวาสไหม ให้ตัวลากไปเปลี่ยนหน้าตาเคอร์เซอร์ */
    dropPreview(clientX, clientY) {
      const over = pointInCanvas(clientX, clientY);
      root.classList.toggle('is-dropping', over);
      return over;
    },

    /** เลิกไฮไลต์ ไม่ว่าจะปล่อยหรือยกเลิก */
    endDropPreview() {
      root.classList.remove('is-dropping');
    },

    /** ช่องกริดที่ตรงกับพิกัดนี้ — null ถ้าอยู่นอกแคนวาส */
    dropCellAt(clientX, clientY) {
      return pointInCanvas(clientX, clientY) ? cellAt(clientX, clientY) : null;
    },

    render,
    select,
    selectMany,
    toggleSelect,
    peek,
    focusItem,
    getSelected: () => selectedId,
    getSelectedIds: () => [...extraIds, selectedId].filter(Boolean),
    getSelectedPart: () => selectedPart,
    repaintPart: paintPart,

    /** เปิด/ปิดโหมดมือถาวร — คืนค่าสถานะใหม่ให้ผู้เรียกไปอัปเดตปุ่ม */
    toggleHand(force) {
      handMode = force ?? !handMode;
      viewport.classList.toggle('is-pannable', handMode);
      if (!handMode) viewport.classList.remove('is-panning');
      return handMode;
    },

    isHandMode: () => handMode,
  };
}
