/**
 * layout-model.js — สถานะของผังหน้าและกฎการวางบนกริด (pure ไม่แตะ DOM)
 *
 * ทุกอย่างบนผังมีขนาดเป็นจำนวนช่องกริดเสมอ ไม่มีหน่วยลอย ๆ
 * ตำแหน่งจริงเป็นพิกเซลค่อยคำนวณจากความกว้างคอลัมน์ตอนวาด
 * แยกจากตัววาดเพื่อให้ undo/redo กับ export ทำงานกับข้อมูลชุดเดียวกัน
 */

export const GRID = {
  cols: 12,
  rowHeight: 40,
  gap: 16,
  minRows: 12,
};

/**
 * ขนาดผังที่เลือกได้ — ใช้ตัวเลขของอุปกรณ์และเบรกพอยต์ที่เจอจริงในงาน
 * ความสูงคือ "หนึ่งหน้าจอ" ของอุปกรณ์นั้นหลังหักแถบเบราว์เซอร์ ใช้ดูว่าอะไรอยู่เหนือรอยพับบ้าง
 */
export const CANVAS_PRESETS = [
  { id: 'auto', label: 'เต็มพื้นที่', px: null, height: null, group: 'อิสระ', note: 'ยืดตามพื้นที่ที่เหลือ' },

  { id: 'mobile-sm', label: 'มือถือเล็ก', px: 360, height: 640, group: 'มือถือ', note: 'Android ทั่วไป' },
  { id: 'mobile', label: 'มือถือ', px: 390, height: 730, group: 'มือถือ', note: 'iPhone 14 / 15' },
  { id: 'mobile-lg', label: 'มือถือใหญ่', px: 430, height: 800, group: 'มือถือ', note: 'iPhone Pro Max' },

  { id: 'tablet', label: 'แท็บเล็ต', px: 768, height: 1024, group: 'แท็บเล็ต', note: 'iPad แนวตั้ง' },
  { id: 'tablet-lg', label: 'แท็บเล็ตแนวนอน', px: 1024, height: 768, group: 'แท็บเล็ต', note: 'iPad แนวนอน' },

  { id: 'laptop', label: 'โน้ตบุ๊ก', px: 1366, height: 700, group: 'เดสก์ท็อป', note: 'ความกว้างที่พบบ่อยที่สุดในงานองค์กร' },
  { id: 'desktop', label: 'เดสก์ท็อป', px: 1440, height: 820, group: 'เดสก์ท็อป', note: 'จอตั้งโต๊ะทั่วไป' },
  { id: 'wide', label: 'จอกว้าง', px: 1920, height: 950, group: 'เดสก์ท็อป', note: 'Full HD' },
];

export const COL_CHOICES = [4, 6, 8, 12, 16, 24];
/** 8px คือหน่วยฐานของระบบ ใช้เมื่ออยากวางละเอียด ส่วนค่าที่ใหญ่กว่าใช้เมื่ออยากให้เข้าแถวเร็ว */
export const ROW_HEIGHTS = [8, 16, 24, 40, 64];
export const GAP_CHOICES = [0, 4, 8, 12, 16, 24];

const STORAGE_KEY = 'uxui-theory-layout';
const HISTORY_LIMIT = 40;

let seq = 0;
const nextId = () => `item-${Date.now().toString(36)}-${(seq += 1)}`;

/** ขนาดตั้งต้นของแต่ละ component เป็นจำนวนช่อง — ค่าที่ทำให้ของนั้นดูสมส่วนตั้งแต่วางครั้งแรก */
export const DEFAULT_SIZE = {
  table: { w: 12, h: 7 },
  toolbar: { w: 12, h: 2 },
  pagination: { w: 12, h: 2 },
  list: { w: 6, h: 6 },
  badge: { w: 3, h: 2 },
  button: { w: 3, h: 2 },
  field: { w: 6, h: 4 },
  empty: { w: 6, h: 5 },
  skeleton: { w: 6, h: 4 },

  navbar: { w: 12, h: 2 },
  sidebar: { w: 3, h: 5 },
  breadcrumb: { w: 5, h: 1 },
  tabs: { w: 6, h: 2 },

  hero: { w: 8, h: 5 },
  'section-head': { w: 12, h: 2 },
  card: { w: 4, h: 7 },
  stat: { w: 6, h: 3 },
  accordion: { w: 8, h: 3 },
  footer: { w: 12, h: 5 },

  alert: { w: 8, h: 3 },
  modal: { w: 6, h: 5 },
};

let screenSeq = 0;
const nextScreenId = () => `screen-${Date.now().toString(36)}-${(screenSeq += 1)}`;

/**
 * x/y คือตำแหน่งบนมุมมองบอร์ดเท่านั้น ไม่เกี่ยวกับผังจริงและไม่ออกไปกับไฟล์ที่ส่งออก
 * แยกกันชัดเจนเพราะผังต้องเป็นกริดจริงเสมอ ส่วนบอร์ดเป็นแค่การจัดวางไว้ดูภาพรวม
 */
export function createScreen(initial = {}) {
  return {
    id: nextScreenId(),
    name: 'หน้าใหม่',
    items: [],
    // กลุ่มเลเยอร์เป็นชุดการเลือก ไม่ใช่กล่องจริง จึงอยู่คู่กับ items ไม่ได้ห่อมันไว้
    groups: [],
    x: 0,
    y: 0,
    ...initial,
    ...(Array.isArray(initial.groups) ? {} : { groups: [] }),
  };
}

/** ระยะห่างระหว่างกรอบบนบอร์ด เว้นให้พอเห็นเส้นเชื่อมโค้งได้โดยไม่ทับกรอบ */
export const BOARD_GAP = 120;

/** ความกว้างที่ใช้แทนหน้าที่ตั้งเป็น "เต็มพื้นที่" ตอนวาดบนบอร์ด */
export const BOARD_AUTO_WIDTH = 960;

export const boardWidth = (layout) => (
  layout.width && layout.width !== 'auto' ? layout.width : BOARD_AUTO_WIDTH
);

/** ความสูงของกรอบบนบอร์ด คิดจากแถวที่ของกินจริง ไม่ใช่แถวขั้นต่ำของแคนวาส */
export function boardHeight(layout, screen) {
  const rows = screen.items.reduce((max, item) => Math.max(max, item.row + item.h - 1), 0);
  const used = Math.max(rows, 6);
  return used * layout.rowHeight + (used + 1) * layout.gap;
}

/** จำนวนกรอบต่อแถวบนบอร์ด — สี่หน้าต่อแถวยังอ่านชื่อออกที่ระดับย่อปกติ */
const BOARD_PER_ROW = 4;

/**
 * เรียงทุกกรอบใหม่เป็นตาราง โดยไม่สนตำแหน่งเดิม
 *
 * ต่างจาก resolveBoardOverlaps ที่แค่ผลักตัวที่ทับให้พ้นกัน (ซึ่งเก็บงานจัดด้วยมือไว้
 * แต่ทิ้งช่องว่างค้างไว้เมื่อมีการลบหน้า) ตัวนี้คือการล้างแล้วเรียงใหม่ทั้งกระดาน
 * จึงต้องเป็นคำสั่งที่ผู้ใช้กดเอง ไม่ใช่สิ่งที่ระบบทำให้เงียบ ๆ แล้วงานจัดหายไป
 *
 * แถวสูงเท่ากับกรอบที่สูงที่สุดในแถวนั้น ไม่ใช่ค่าคงที่ — หน้าที่ยาวกว่าจึงไม่ไปทับแถวถัดไป
 */
export function arrangeBoard(layout) {
  const width = boardWidth(layout);
  let rowTop = 0;
  let rowHeight = 0;

  const screens = layout.screens.map((screen, index) => {
    const column = index % BOARD_PER_ROW;

    if (column === 0 && index > 0) {
      rowTop += rowHeight + BOARD_GAP;
      rowHeight = 0;
    }

    rowHeight = Math.max(rowHeight, boardHeight(layout, screen));
    return { ...screen, x: column * (width + BOARD_GAP), y: rowTop };
  });

  return { ...layout, screens };
}

/** วางกรอบที่ยังไม่มีตำแหน่งให้เรียงต่อกันเป็นแถว ผู้ใช้ค่อยลากจัดเองทีหลัง */
export function ensureBoardPositions(layout) {
  const known = layout.screens.filter((screen) => (
    Number.isFinite(screen.x) && Number.isFinite(screen.y) && (screen.x !== 0 || screen.y !== 0)
  ));

  // ยังไม่มีใครถูกจัดด้วยมือเลย ก็เรียงทั้งกระดานเป็นตารางไปเลย
  // ไม่ใช่เรียงต่อกันเป็นแถวเดียวยาวจนเลื่อนหาไม่เจอเมื่อผังมีหลายหน้า
  if (known.length === 0) return arrangeBoard(layout);

  const width = boardWidth(layout);
  const edge = known.reduce((max, screen) => Math.max(max, screen.x + width), 0);
  let cursor = edge + BOARD_GAP;
  let changed = false;

  const screens = layout.screens.map((screen) => {
    if (known.includes(screen)) return screen;

    // หน้าใหม่ไปต่อท้ายของที่จัดไว้แล้ว ไม่ไปทับงานจัดด้วยมือที่ตำแหน่งต้น ๆ
    const placed = { ...screen, x: cursor, y: 0 };
    cursor += width + BOARD_GAP;
    changed = true;
    return placed;
  });

  return changed ? { ...layout, screens } : layout;
}

/**
 * กันกรอบซ้อนกันบนบอร์ด — จำเป็นเพราะความกว้างของผังเปลี่ยนได้ทีหลัง
 * ตำแหน่งที่เคยพอดีตอนกว้าง 960 จะทับกันทันทีเมื่อเปลี่ยนเป็น 1366
 * ตัวที่ไม่ชนใครถูกปล่อยไว้ที่เดิม การจัดวางด้วยมือจึงไม่หายไปโดยไม่จำเป็น
 */
export function resolveBoardOverlaps(layout) {
  const width = boardWidth(layout);
  const ordered = [...layout.screens]
    .map((screen, index) => ({ screen, index }))
    .sort((a, b) => (a.screen.y ?? 0) - (b.screen.y ?? 0) || (a.screen.x ?? 0) - (b.screen.x ?? 0));

  const placed = [];
  const moved = new Map();
  let changed = false;

  ordered.forEach(({ screen }) => {
    const height = boardHeight(layout, screen);
    let x = screen.x ?? 0;
    const y = screen.y ?? 0;

    for (let guard = 0; guard < 50; guard += 1) {
      const hit = placed.find((box) => (
        x < box.x + box.w + BOARD_GAP && box.x < x + width + BOARD_GAP
        && y < box.y + box.h + BOARD_GAP && box.y < y + height + BOARD_GAP
      ));
      if (!hit) break;
      x = hit.x + hit.w + BOARD_GAP;
    }

    if (x !== (screen.x ?? 0)) {
      changed = true;
      moved.set(screen.id, x);
    }
    placed.push({ x, y, w: width, h: height });
  });

  if (!changed) return layout;

  return {
    ...layout,
    screens: layout.screens.map((screen) => (
      moved.has(screen.id) ? { ...screen, x: moved.get(screen.id) } : screen
    )),
  };
}

export function setScreenPosition(layout, id, x, y) {
  return {
    ...layout,
    screens: layout.screens.map((screen) => (
      screen.id === id ? { ...screen, x: Math.round(x), y: Math.round(y) } : screen
    )),
  };
}

/**
 * ผังหนึ่งชุดมีได้หลายหน้าจอ แต่ใช้กริดชุดเดียวกันทั้งงาน
 * เพราะการทดลองไหลของงานคือการเดินข้ามหน้าในผลิตภัณฑ์เดียว ไม่ใช่คนละระบบ
 */
export function createLayout(initial = {}) {
  const base = {
    cols: GRID.cols,
    rowHeight: GRID.rowHeight,
    gap: GRID.gap,
    width: 'auto',
    height: null,
    screens: [],
    activeScreen: null,
    start: null,
    view: 'edit',
    ...initial,
  };

  // ผังรุ่นเก่าเก็บ items ไว้ที่ตัวผังตรง ๆ ย้ายมาเป็นหน้าจอแรกให้อัตโนมัติ
  if (!Array.isArray(base.screens) || base.screens.length === 0) {
    base.screens = [createScreen({
      name: 'หน้าแรก',
      items: Array.isArray(initial.items) ? initial.items : [],
    })];
  }

  delete base.items;

  const ids = base.screens.map((screen) => screen.id);
  if (!ids.includes(base.activeScreen)) base.activeScreen = ids[0];
  if (!ids.includes(base.start)) base.start = ids[0];

  return base;
}

/* --- หน้าจอ ---------------------------------------------------------------- */

export const screenById = (layout, id) => layout.screens.find((screen) => screen.id === id) ?? null;

export const activeScreen = (layout) => screenById(layout, layout.activeScreen) ?? layout.screens[0];

/** ของบนหน้าจอที่กำลังแก้อยู่ — ทุกที่ที่เคยอ่าน layout.items ต้องผ่านตัวนี้ */
export const itemsOf = (layout) => activeScreen(layout)?.items ?? [];

/** ของทุกหน้ารวมกัน ใช้ตอนนับและตอนส่งออก */
export const allItems = (layout) => layout.screens.flatMap((screen) => screen.items);

function mapActiveItems(layout, fn) {
  const current = activeScreen(layout);
  if (!current) return layout;
  return {
    ...layout,
    screens: layout.screens.map((screen) => (
      screen.id === current.id ? { ...screen, items: fn(screen.items) } : screen
    )),
  };
}

export function addScreen(layout, name) {
  const screen = createScreen({ name: name || `หน้า ${layout.screens.length + 1}` });
  return { ...layout, screens: [...layout.screens, screen], activeScreen: screen.id };
}

export function renameScreen(layout, id, name) {
  return {
    ...layout,
    screens: layout.screens.map((screen) => (screen.id === id ? { ...screen, name } : screen)),
  };
}

export function setActiveScreen(layout, id) {
  return screenById(layout, id) ? { ...layout, activeScreen: id } : layout;
}

export function setStartScreen(layout, id) {
  return screenById(layout, id) ? { ...layout, start: id } : layout;
}

/**
 * ลบหน้าจอแล้วต้องล้างลิงก์ที่ชี้มาหน้านี้ทิ้งด้วย
 * ไม่งั้นตอนทดลองจะกดปุ่มแล้วไปหน้าที่ไม่มีอยู่ โดยไม่มีอะไรเตือน
 */
export function removeScreen(layout, id) {
  if (layout.screens.length <= 1) return layout;

  const kept = layout.screens.filter((screen) => screen.id !== id);
  const ids = kept.map((screen) => screen.id);

  const screens = kept.map((screen) => ({
    ...screen,
    items: screen.items.map((item) => pruneLinks(item, ids)),
  }));
  return {
    ...layout,
    screens,
    activeScreen: ids.includes(layout.activeScreen) ? layout.activeScreen : ids[0],
    start: ids.includes(layout.start) ? layout.start : ids[0],
  };
}

/** จำนวนแถวที่พอดีกับความสูงหนึ่งหน้าจอของขนาดที่เลือก — ใช้วาดเส้นบอกรอยพับ */
export function foldRow(layout) {
  if (!layout.height) return null;
  return Math.max(1, Math.round((layout.height + layout.gap) / (layout.rowHeight + layout.gap)));
}

/**
 * เปลี่ยนขนาดกริดแล้วต้องดึงของที่หลุดขอบกลับเข้ามาด้วย ทุกหน้าจอ ไม่ใช่เฉพาะหน้าที่เปิดอยู่
 * เช่นลดจาก 12 เหลือ 6 คอลัมน์ ของที่กว้าง 8 ช่องต้องหดเหลือ 6 ไม่ใช่ล้นออกไปเงียบ ๆ
 */
export function resizeGrid(layout, patch) {
  const next = { ...layout, ...patch };
  return {
    ...next,
    screens: layout.screens.map((screen) => ({
      ...screen,
      items: screen.items.map((item) => normalizeItem(item, next.cols)),
    })),
  };
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * กันไม่ให้ของหลุดขอบกริด — ปรับตำแหน่งกับขนาดให้อยู่ในกรอบเสมอ
 *
 * name เป็น null แปลว่ายังไม่ได้ตั้งชื่อเอง ให้ไปหยิบชื่อคอมโพเนนต์มาแสดงแทน
 * ไม่เก็บชื่อ fallback ลงข้อมูล เพราะวันที่แคตตาล็อกเปลี่ยนชื่อ ผังเก่าจะค้างชื่อเดิม
 */
export function normalizeItem(item, cols = GRID.cols) {
  const w = clamp(Math.round(item.w), 1, cols);
  const h = Math.max(1, Math.round(item.h));
  return {
    ...item,
    w,
    h,
    col: clamp(Math.round(item.col), 1, cols - w + 1),
    row: Math.max(1, Math.round(item.row)),
    name: typeof item.name === 'string' && item.name.trim() ? item.name : null,
    hidden: item.hidden === true,
    locked: item.locked === true,
  };
}

/**
 * ขนาดตั้งต้นถูกกำหนดไว้เป็นสัดส่วนของกริด 12 คอลัมน์กับแถวสูง 40px
 * เมื่อผู้ใช้เปลี่ยนกริด ต้องแปลงตามด้วย ไม่งั้นตารางที่ควรเต็มแถวจะเหลือครึ่งเดียว
 */
function scaledSize(slug, layout) {
  const base = DEFAULT_SIZE[slug] ?? { w: 4, h: 3 };
  const w = Math.max(1, Math.round((base.w / GRID.cols) * layout.cols));
  const h = Math.max(1, Math.round((base.h * GRID.rowHeight) / layout.rowHeight));
  return { w, h };
}

/**
 * ลิงก์มีสองระดับ
 * link  = ทั้งชิ้นพาไปไหน ใช้กับของที่มีปลายทางเดียว เช่นปุ่มเดี่ยว
 * links = แต่ละส่วนข้างในพาไปคนละที่ เช่นเมนูสี่อันในแถบนำทาง
 * ตอนกดจริงให้ดูรายส่วนก่อนเสมอ ถ้าส่วนนั้นไม่ได้ผูกไว้ค่อยตกมาที่ทั้งชิ้น
 */
export function setPartLink(layout, id, part, target) {
  const item = itemsOf(layout).find((entry) => entry.id === id);
  if (!item) return layout;

  const links = { ...(item.links ?? {}) };
  if (target) links[part] = target;
  else delete links[part];

  return updateItem(layout, id, { links });
}

/**
 * ของที่ผู้ใช้แก้รายส่วน เก็บแยกจาก markup ต้นฉบับเสมอ
 * parts[partId] = { text, tone, size, action } — คีย์ไหนไม่ได้ตั้งก็ใช้ของเดิมจากไฟล์ component
 * เก็บเฉพาะสิ่งที่ต่างจากต้นฉบับ เพื่อให้แก้ไฟล์ component แล้วผังเก่ายังได้ของใหม่ตามไปด้วย
 */
export function setPartProp(layout, id, part, patch) {
  const item = itemsOf(layout).find((entry) => entry.id === id);
  if (!item) return layout;

  const parts = { ...(item.parts ?? {}) };
  const next = { ...(parts[part] ?? {}), ...patch };

  Object.keys(next).forEach((key) => {
    const value = next[key];
    const empty = value === null || value === undefined || value === ''
      || (key === 'action' && value.type === 'none');
    if (empty) delete next[key];
  });

  if (Object.keys(next).length) parts[part] = next;
  else delete parts[part];

  return updateItem(layout, id, { parts });
}

export function partProps(item, part) {
  return item?.parts?.[part] ?? {};
}

/* --------------------------------------------------------------------------
   รายการที่ซ้ำกันในคอมโพเนนต์ — เมนู แท็บ แถวในลิสต์

   ไม่ได้แก้ markup ต้นฉบับ แต่เก็บว่า "เพิ่มอะไรต่อจากตัวไหน" กับ "ซ่อนตัวไหน"
   ตัวที่เพิ่มก็มีธง data-part ของตัวเอง จึงแต่งคำ สี ขนาด และผูก action ได้เหมือนของเดิมทุกอย่าง
   -------------------------------------------------------------------------- */

let extraSeq = 0;

export function addPartClone(layout, id, fromPart, text, cls = null) {
  const item = itemsOf(layout).find((entry) => entry.id === id);
  if (!item) return layout;

  extraSeq += 1;
  const extras = [...(item.extras ?? []), {
    id: `x${Date.now().toString(36)}${extraSeq}`,
    from: fromPart,
    // จำคลาสของต้นแบบไว้ด้วย เผื่อวันหนึ่งต้นแบบถูกลบ — รายการที่ผู้ใช้เพิ่มเองจะได้ไม่หายตามไป
    // แต่ไปเกาะกับพี่น้องตัวอื่นในกลุ่มเดียวกันแทน
    cls: cls ?? null,
    text: text ?? '',
  }];

  return updateItem(layout, id, { extras });
}

/**
 * ซ่อนรายการ ไม่ใช่ลบทิ้งจาก markup
 * ของที่มาจากไฟล์ component ลบจริงไม่ได้อยู่แล้ว ส่วนของที่ผู้ใช้เพิ่มเองก็ถอดออกจากรายการไปเลย
 */
export function dropPart(layout, id, part) {
  const item = itemsOf(layout).find((entry) => entry.id === id);
  if (!item) return layout;

  const extras = (item.extras ?? []).filter((entry) => entry.id !== part);
  const wasExtra = extras.length !== (item.extras ?? []).length;

  const parts = { ...(item.parts ?? {}) };
  delete parts[part];

  const links = { ...(item.links ?? {}) };
  delete links[part];

  if (wasExtra) return updateItem(layout, id, { extras, parts, links });

  const dropped = [...new Set([...(item.dropped ?? []), part])];
  return updateItem(layout, id, { dropped, parts, links });
}

export function restorePart(layout, id, part) {
  const item = itemsOf(layout).find((entry) => entry.id === id);
  if (!item) return layout;
  return updateItem(layout, id, {
    dropped: (item.dropped ?? []).filter((entry) => entry !== part),
  });
}

/** สลับตำแหน่งรายการกับเพื่อนบ้าน — ลำดับที่ผู้ใช้จัดเก็บเป็น array ของ partId ต่อหนึ่งกลุ่ม */
export function movePart(layout, id, group, part, delta) {
  const item = itemsOf(layout).find((entry) => entry.id === id);
  if (!item) return layout;

  const current = item.order?.[group.key] ?? group.members;
  const from = current.indexOf(part);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= current.length) return layout;

  const next = [...current];
  next[from] = current[to];
  next[to] = part;

  return updateItem(layout, id, { order: { ...(item.order ?? {}), [group.key]: next } });
}

/** ปลายทางที่ยังชี้ไปหน้าที่ไม่มีอยู่แล้ว ต้องล้างทิ้ง ไม่งั้นกดแล้วไปไหนไม่รู้ */
function pruneLinks(item, ids) {
  const links = Object.fromEntries(
    Object.entries(item.links ?? {}).filter(([, target]) => ids.includes(target)),
  );

  // การกระทำชนิด "ไปหน้าอื่น" เก็บปลายทางไว้ที่ตัวมันเองด้วย ถ้าล้างแต่ links
  // ปุ่มจะยังถือปลายทางที่ไม่มีอยู่แล้ว กดตอนทดลองก็เงียบโดยไม่มีอะไรบอกว่าทำไม
  const parts = Object.fromEntries(Object.entries(item.parts ?? {}).map(([part, props]) => {
    if (props.action?.type !== 'goto' || ids.includes(props.action.target)) return [part, props];
    const { action, ...rest } = props;
    return [part, rest];
  }));

  return {
    ...item,
    link: ids.includes(item.link) ? item.link : null,
    links,
    parts,
  };
}

/** ลบชิ้นแล้วต้องล้างการกระทำที่สั่งให้เปิดชิ้นนั้นเป็นหน้าต่างซ้อนด้วย ไม่งั้นปุ่มจะกดแล้วเงียบ */
function pruneModalActions(items, goneId) {
  return items.map((item) => {
    const parts = item.parts ?? {};
    const stale = Object.entries(parts)
      .filter(([, props]) => props.action?.type === 'modal' && props.action.target === goneId);

    if (stale.length === 0) return item;

    const next = { ...parts };
    stale.forEach(([part]) => {
      const { action, ...rest } = next[part];
      if (Object.keys(rest).length) next[part] = rest;
      else delete next[part];
    });

    return { ...item, parts: next };
  });
}

export function addItem(layout, slug, position = {}) {
  const size = scaledSize(slug, layout);
  const item = normalizeItem({
    id: nextId(),
    slug,
    variant: 0,
    link: null,
    links: {},
    parts: {},
    col: position.col ?? 1,
    row: position.row ?? nextFreeRow(layout),
    w: position.w ?? size.w,
    h: position.h ?? size.h,
  }, layout.cols);

  return mapActiveItems(layout, (items) => [...items, item]);
}

export function updateItem(layout, id, patch) {
  return mapActiveItems(layout, (items) => items.map((item) => (
    item.id === id ? normalizeItem({ ...item, ...patch }, layout.cols) : item
  )));
}

export function removeItem(layout, id) {
  // หน้าต่างซ้อนถูกเรียกข้ามหน้าได้ จึงต้องกวาดทุกหน้า ไม่ใช่แค่หน้าที่กำลังเปิด
  const screens = layout.screens.map((screen) => ({
    ...screen,
    items: pruneModalActions(screen.items.filter((item) => item.id !== id), id),
    // กลุ่มที่เหลือสมาชิกไม่ถึงสองตัวไม่มีความหมายอีกต่อไป ปล่อยค้างไว้จะได้แถวเปล่าในแผงเลเยอร์
    groups: pruneGroups(screen.groups, screen.items.filter((item) => item.id !== id)),
  }));

  return { ...layout, screens };
}

export function moveItemToEnd(layout, id) {
  return mapActiveItems(layout, (items) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return items;
    return [...items.filter((entry) => entry.id !== id), item];
  });
}

/** แถวว่างถัดไป — วางของใหม่ต่อท้ายเสมอ ผู้ใช้ค่อยลากไปที่อื่นเอง */
export function nextFreeRow(layout) {
  return itemsOf(layout).reduce((max, item) => Math.max(max, item.row + item.h), 1);
}

export function rowsNeeded(layout) {
  return Math.max(GRID.minRows, nextFreeRow(layout) + 2);
}

/* --- เลเยอร์ ---------------------------------------------------------------- */

/**
 * ลำดับใน items ไม่ได้เป็นแค่ลำดับซ้อน มันคือลำดับ DOM ของไฟล์ที่ส่งออก
 * ซึ่งเท่ากับลำดับ Tab และลำดับที่โปรแกรมอ่านหน้าจอไล่อ่าน
 * จึงเก็บความจริงไว้ที่เดียวคือลำดับ array ไม่มีฟิลด์ z รายชิ้นให้ขัดกันเอง
 *
 * กลุ่มเป็น "ชุดการเลือก" ไม่ใช่กล่องจริง สมาชิกยังอยู่ใน items ระดับเดียวกันหมด
 * กลุ่มจึงไม่ออกไปกับไฟล์ที่ส่งออก และไม่กระทบพิกัดของสมาชิกเลย
 */

let groupSeq = 0;
const nextGroupId = () => `group-${Date.now().toString(36)}-${(groupSeq += 1)}`;

export const groupsOf = (screen) => screen?.groups ?? [];

function pruneGroups(groups, items) {
  const ids = items.map((item) => item.id);
  return groupsOf({ groups }).map((group) => ({
    ...group,
    members: group.members.filter((id) => ids.includes(id)),
  })).filter((group) => group.members.length >= 2);
}

function mapActiveScreen(layout, fn) {
  const current = activeScreen(layout);
  if (!current) return layout;

  // คืนของเดิมทั้งก้อนเมื่อไม่มีอะไรเปลี่ยน ผู้เรียกจึงเช็คด้วย === ได้ว่าคำสั่งนั้นชนขอบแล้ว
  const next = fn(current);
  if (next === current) return layout;

  return {
    ...layout,
    screens: layout.screens.map((screen) => (screen.id === current.id ? next : screen)),
  };
}

/** สถานะที่มีผลจริงกับชิ้นหนึ่ง — กลุ่มที่ซ่อนหรือล็อกไว้ครอบสมาชิกทุกตัวโดยไม่เขียนทับธงของสมาชิก */
export function layerState(screen, item) {
  const group = groupsOf(screen).find((entry) => entry.members.includes(item.id)) ?? null;
  return {
    group,
    hidden: item.hidden === true || group?.hidden === true,
    locked: item.locked === true || group?.locked === true,
  };
}

export const visibleItemsOf = (screen) => (screen?.items ?? [])
  .filter((item) => !layerState(screen, item).hidden);

export const hiddenCountOf = (screen) => (screen?.items ?? []).length - visibleItemsOf(screen).length;

/**
 * แถวที่แผงเลเยอร์วาด — กลับหัวจาก array เพราะทุกเครื่องมือใช้กติกาเดียวกันว่า
 * บนสุดของลิสต์คือชิ้นที่อยู่หน้าสุด ซึ่งตรงกับตัวท้าย array (วาดทีหลังจึงทับตัวอื่น)
 */
export function layerRows(screen) {
  const items = screen?.items ?? [];
  const groups = groupsOf(screen);
  const groupOf = new Map();
  groups.forEach((group) => group.members.forEach((id) => groupOf.set(id, group)));

  const rows = [];
  const seen = new Set();

  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i];
    const group = groupOf.get(item.id);

    if (!group) {
      rows.push({ kind: 'item', id: item.id, item, depth: 0, group: null });
      continue;
    }

    if (seen.has(group.id)) continue;
    seen.add(group.id);

    const members = items.filter((entry) => group.members.includes(entry.id)).reverse();
    rows.push({ kind: 'group', id: group.id, group, depth: 0, members });
    if (group.collapsed) continue;
    members.forEach((member) => rows.push({ kind: 'item', id: member.id, item: member, depth: 1, group }));
  }

  return rows;
}

/**
 * สมาชิกกลุ่มต้องอยู่ติดกันในลำดับเสมอ ไม่งั้นแผงเลเยอร์จะวาดกลุ่มคร่อมของที่ไม่ได้เป็นสมาชิก
 * ทุกคำสั่งที่จัดลำดับใหม่จึงต้องผ่านตัวนี้ปิดท้าย
 */
function compactGroups(items, groups) {
  let list = [...items];

  groups.forEach((group) => {
    const members = list.filter((item) => group.members.includes(item.id));
    if (members.length < 2) return;
    const anchor = list.reduce((max, item, index) => (group.members.includes(item.id) ? index : max), 0);
    list = [
      ...list.slice(0, anchor + 1).filter((item) => !group.members.includes(item.id)),
      ...members,
      ...list.slice(anchor + 1),
    ];
  });

  return list;
}

/** ตั้งลำดับ items ใหม่ทั้งชุด — ตัวที่ไม่ได้ถูกเอ่ยถึงต่อท้ายไว้ ห้ามหายไปเงียบ ๆ */
export function setItemOrder(layout, ids) {
  return mapActiveScreen(layout, (screen) => {
    const byId = new Map(screen.items.map((item) => [item.id, item]));
    const next = ids.map((id) => byId.get(id)).filter(Boolean);
    const placed = new Set(next.map((item) => item.id));
    screen.items.forEach((item) => { if (!placed.has(item.id)) next.push(item); });
    return { ...screen, items: compactGroups(next, groupsOf(screen)) };
  });
}

/**
 * เลื่อนชิ้นที่เลือกขึ้นหรือลงทีละขั้นในลำดับ (delta +1 คือไปทางท้าย array = ขึ้นหน้าในลิสต์)
 * มีไว้เพราะ WCAG 2.5.7 บังคับว่าทุกอย่างที่ทำด้วยการลากต้องมีทางอื่นที่ไม่ต้องลากด้วย
 */
export function nudgeOrder(layout, ids, delta) {
  return mapActiveScreen(layout, (screen) => {
    const list = [...screen.items];
    const marks = list.map((item, index) => (ids.includes(item.id) ? index : -1)).filter((i) => i >= 0);
    if (marks.length === 0) return screen;

    if (delta > 0) {
      if (marks[marks.length - 1] >= list.length - 1) return screen;
      for (let k = marks.length - 1; k >= 0; k -= 1) {
        const i = marks[k];
        [list[i], list[i + 1]] = [list[i + 1], list[i]];
      }
    } else {
      if (marks[0] <= 0) return screen;
      for (let k = 0; k < marks.length; k += 1) {
        const i = marks[k];
        [list[i], list[i - 1]] = [list[i - 1], list[i]];
      }
    }

    return { ...screen, items: compactGroups(list, groupsOf(screen)) };
  });
}

/** ส่งไปหน้าสุด (ท้าย array) หรือหลังสุด (ต้น array) — ลำดับภายในชุดที่เลือกคงเดิม */
export function moveOrderToEdge(layout, ids, edge) {
  return mapActiveScreen(layout, (screen) => {
    const picked = screen.items.filter((item) => ids.includes(item.id));
    const rest = screen.items.filter((item) => !ids.includes(item.id));
    const list = edge === 'front' ? [...rest, ...picked] : [...picked, ...rest];
    return { ...screen, items: compactGroups(list, groupsOf(screen)) };
  });
}

/** เรียงลำดับเนื้อหาตามที่ตาอ่าน — บนลงล่าง ซ้ายไปขวา ตรงกับลำดับ Tab ที่ผู้ใช้ปลายทางจะได้ */
export function sortItemsByPosition(layout) {
  return mapActiveScreen(layout, (screen) => ({
    ...screen,
    items: compactGroups(
      [...screen.items].sort((a, b) => (a.row - b.row) || (a.col - b.col)),
      groupsOf(screen),
    ),
  }));
}

/** จำนวนชิ้นที่ลำดับใน DOM ไม่ตรงกับลำดับที่ตาเห็น — ศูนย์แปลว่าไฟล์ที่ส่งออก Tab ไล่ตามสายตา */
export function readingOrderIssues(screen) {
  const items = screen?.items ?? [];
  const sorted = [...items].sort((a, b) => (a.row - b.row) || (a.col - b.col));
  return items.reduce((count, item, index) => (sorted[index].id === item.id ? count : count + 1), 0);
}

export function renameItem(layout, id, name) {
  const clean = String(name ?? '').trim();
  return updateItem(layout, id, { name: clean || null });
}

export function setItemFlags(layout, ids, patch) {
  const list = Array.isArray(ids) ? ids : [ids];
  return mapActiveItems(layout, (items) => items.map((item) => (
    list.includes(item.id) ? { ...item, ...patch } : item
  )));
}

export function groupItems(layout, ids, name) {
  const screen = activeScreen(layout);
  if (!screen) return layout;

  const members = screen.items.filter((item) => ids.includes(item.id));
  if (members.length < 2) return layout;

  // สมาชิกอาจอยู่กระจายกันในลำดับ ต้องดึงมาต่อกันก่อน ไม่งั้นกลุ่มจะคร่อมของที่ไม่ได้เป็นสมาชิก
  const anchor = screen.items.reduce((max, item, index) => (ids.includes(item.id) ? index : max), 0);
  const items = [
    ...screen.items.slice(0, anchor + 1).filter((item) => !ids.includes(item.id)),
    ...members,
    ...screen.items.slice(anchor + 1),
  ];

  const group = {
    id: nextGroupId(),
    name: String(name ?? '').trim() || `กลุ่ม ${groupsOf(screen).length + 1}`,
    members: members.map((item) => item.id),
    collapsed: false,
    hidden: false,
    locked: false,
  };

  // ชิ้นที่เคยอยู่กลุ่มอื่นต้องหลุดจากกลุ่มเดิม สมาชิกซ้ำสองกลุ่มทำให้แผงวาดซ้ำ
  const groups = [
    ...groupsOf(screen).map((entry) => ({
      ...entry,
      members: entry.members.filter((id) => !ids.includes(id)),
    })).filter((entry) => entry.members.length >= 2),
    group,
  ];

  return mapActiveScreen(layout, () => ({ ...screen, items, groups }));
}

export function ungroup(layout, groupId) {
  return mapActiveScreen(layout, (screen) => ({
    ...screen,
    groups: groupsOf(screen).filter((group) => group.id !== groupId),
  }));
}

export function updateGroup(layout, groupId, patch) {
  return mapActiveScreen(layout, (screen) => ({
    ...screen,
    groups: groupsOf(screen).map((group) => (
      group.id === groupId ? { ...group, ...patch } : group
    )),
  }));
}

/* --- ประวัติการแก้ไข -------------------------------------------------------- */

export function createHistory(initial) {
  let past = [];
  let present = initial;
  let future = [];

  return {
    get: () => present,
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,

    /** commit=false ใช้ระหว่างลาก เพื่อไม่ให้ได้ประวัติร้อยขั้นจากการลากครั้งเดียว */
    set(next, commit = true) {
      if (commit) {
        past = [...past.slice(-HISTORY_LIMIT + 1), present];
        future = [];
      }
      present = next;
      return present;
    },

    undo() {
      if (past.length === 0) return present;
      future = [present, ...future];
      present = past[past.length - 1];
      past = past.slice(0, -1);
      return present;
    },

    redo() {
      if (future.length === 0) return present;
      past = [...past, present];
      [present] = future;
      future = future.slice(1);
      return present;
    },
  };
}

/* --- เก็บลงเครื่อง ---------------------------------------------------------- */

export function readLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const legacy = Array.isArray(parsed.items);
    const modern = Array.isArray(parsed.screens) && parsed.screens.length > 0;
    if (!legacy && !modern) return null;
    return createLayout(parsed);
  } catch {
    return null;
  }
}

export function writeLayout(layout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    return true;
  } catch {
    return false;
  }
}
