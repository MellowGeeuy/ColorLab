/**
 * code-completions.js — คลังคำเติมอัตโนมัติสำหรับช่องเขียนโค้ด (pure, ไม่แตะ DOM)
 *
 * `$0` ในข้อความที่แทรก คือจุดที่เคอร์เซอร์จะไปอยู่หลังเลือกคำแนะนำ
 */

/* --- CSS ----------------------------------------------------------------- */

const CSS_PROPERTIES = [
  'align-items', 'align-self', 'appearance', 'aspect-ratio', 'backdrop-filter',
  'background', 'background-color', 'background-image', 'border', 'border-bottom',
  'border-color', 'border-left', 'border-radius', 'border-right', 'border-top',
  'border-width', 'bottom', 'box-shadow', 'box-sizing', 'color', 'column-gap',
  'cursor', 'display', 'filter', 'flex', 'flex-direction', 'flex-wrap', 'font-family',
  'font-size', 'font-weight', 'gap', 'grid-template-columns', 'grid-template-rows',
  'height', 'inset', 'justify-content', 'left', 'letter-spacing', 'line-height',
  'list-style', 'margin', 'margin-bottom', 'margin-top', 'max-height', 'max-width',
  'min-height', 'min-width', 'object-fit', 'opacity', 'outline', 'outline-offset',
  'overflow', 'overflow-x', 'overflow-y', 'padding', 'padding-block', 'padding-inline',
  'place-items', 'position', 'right', 'row-gap', 'text-align', 'text-decoration',
  'text-transform', 'top', 'transform', 'transition', 'user-select', 'white-space',
  'width', 'word-break', 'z-index',
];

/** ค่าที่ใช้ได้ของแต่ละ property — ใช้เสนอคำแนะนำหลังเครื่องหมาย : */
const CSS_VALUES = {
  'align-items': ['center', 'flex-start', 'flex-end', 'stretch', 'baseline'],
  'aspect-ratio': ['1 / 1', '16 / 9', '4 / 3'],
  'box-sizing': ['border-box', 'content-box'],
  cursor: ['pointer', 'default', 'not-allowed', 'text', 'grab'],
  display: ['flex', 'grid', 'block', 'inline-flex', 'inline-block', 'none'],
  'flex-direction': ['row', 'column', 'row-reverse', 'column-reverse'],
  'flex-wrap': ['wrap', 'nowrap'],
  'font-weight': ['400', '500', '600', '700'],
  'justify-content': ['center', 'space-between', 'flex-start', 'flex-end', 'space-around'],
  'object-fit': ['cover', 'contain', 'fill'],
  overflow: ['hidden', 'auto', 'visible', 'scroll'],
  position: ['relative', 'absolute', 'fixed', 'sticky', 'static'],
  'text-align': ['center', 'start', 'end', 'justify'],
  'text-transform': ['uppercase', 'lowercase', 'capitalize', 'none'],
  'white-space': ['nowrap', 'pre', 'pre-wrap', 'normal'],
  'word-break': ['break-word', 'break-all', 'normal'],
};

/** token ของ palette — คำอธิบายไว้แสดงในรายการ */
export const TOKEN_COMPLETIONS = [
  ['--pv-bg', 'พื้นหลังหน้า'],
  ['--pv-surface', 'พื้นการ์ด'],
  ['--pv-surface-alt', 'พื้นรอง'],
  ['--pv-border', 'เส้นขอบ'],
  ['--pv-border-strong', 'เส้นขอบเข้ม'],
  ['--pv-text', 'ตัวอักษรหลัก'],
  ['--pv-text-muted', 'ตัวอักษรรอง'],
  ['--pv-text-subtle', 'ตัวอักษรจาง'],
  ['--pv-primary', 'สีแบรนด์ (พื้นปุ่ม)'],
  ['--pv-primary-hover', 'สีแบรนด์ตอน hover'],
  ['--pv-primary-soft', 'พื้นอ่อนสีแบรนด์'],
  ['--pv-primary-text', 'ข้อความสีแบรนด์ บนการ์ด'],
  ['--pv-primary-ring', 'วงโฟกัส'],
  ['--pv-on-primary', 'ตัวอักษรบนสีแบรนด์'],
  ['--pv-on-primary-soft', 'ตัวอักษรบนพื้นอ่อนแบรนด์'],
  ['--pv-shadow', 'เงา'],
  ...['success', 'warning', 'danger', 'info'].flatMap((role) => {
    const name = { success: 'สำเร็จ', warning: 'เตือน', danger: 'อันตราย', info: 'ข้อมูล' }[role];
    return [
      [`--pv-${role}`, `สี${name} (พื้น)`],
      [`--pv-${role}-soft`, `พื้นอ่อนสี${name}`],
      [`--pv-${role}-text`, `ข้อความสี${name} บนการ์ด`],
      [`--pv-on-${role}`, `ตัวอักษรบนสี${name}`],
      [`--pv-on-${role}-soft`, `ตัวอักษรบนพื้นอ่อน${name}`],
    ];
  }),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => [`--pv-accent-${n}`, `สี accent ที่ ${n}`]),
  ...['primary', 'neutral', 'success', 'warning', 'danger', 'info'].flatMap((role) =>
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
      .map((step) => [`--pv-${role}-${step}`, `${role} ขั้น ${step}`])),
];

const CSS_SNIPPETS = [
  {
    label: 'flex-center', detail: 'จัดกึ่งกลางด้วย flex',
    insert: 'display: flex;\nalign-items: center;\njustify-content: center;\ngap: 8px;$0',
  },
  {
    label: 'grid-auto', detail: 'กริดยืดหยุ่นตามความกว้าง',
    insert: 'display: grid;\ngrid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\ngap: 16px;$0',
  },
  {
    label: 'card-style', detail: 'สไตล์การ์ดมาตรฐาน',
    insert: 'background: var(--pv-surface);\nborder: 1px solid var(--pv-border);\nborder-radius: 14px;\npadding: 20px;\ncolor: var(--pv-text);$0',
  },
  {
    label: 'btn-style', detail: 'สไตล์ปุ่มหลัก',
    insert: 'background: var(--pv-primary);\ncolor: var(--pv-on-primary);\nborder: none;\nborder-radius: 10px;\npadding: 10px 18px;\ncursor: pointer;$0',
  },
  {
    label: 'focus-ring', detail: 'วงโฟกัสที่มองเห็นชัด',
    insert: 'outline: 2px solid var(--pv-primary-ring);\noutline-offset: 2px;$0',
  },
  {
    label: 'truncate', detail: 'ตัดข้อความบรรทัดเดียว',
    insert: 'overflow: hidden;\ntext-overflow: ellipsis;\nwhite-space: nowrap;$0',
  },
];

/* --- HTML ---------------------------------------------------------------- */

const HTML_TAGS = [
  'a', 'article', 'aside', 'button', 'div', 'em', 'footer', 'form', 'h1', 'h2', 'h3',
  'h4', 'header', 'img', 'input', 'label', 'li', 'main', 'nav', 'ol', 'option', 'p',
  'section', 'select', 'small', 'span', 'strong', 'table', 'tbody', 'td', 'textarea',
  'th', 'thead', 'tr', 'ul',
];

const SELF_CLOSING = new Set(['img', 'input', 'br', 'hr']);

const HTML_ATTRIBUTES = [
  ['class', 'ชื่อคลาส', 'class="$0"'],
  ['style', 'สไตล์อินไลน์', 'style="$0"'],
  ['id', 'ไอดี', 'id="$0"'],
  ['href', 'ปลายทางลิงก์', 'href="$0"'],
  ['src', 'ที่อยู่ไฟล์', 'src="$0"'],
  ['alt', 'ข้อความแทนภาพ', 'alt="$0"'],
  ['type', 'ชนิดของ input', 'type="$0"'],
  ['placeholder', 'ข้อความตัวอย่าง', 'placeholder="$0"'],
  ['value', 'ค่าเริ่มต้น', 'value="$0"'],
  ['title', 'ข้อความเมื่อวางเมาส์', 'title="$0"'],
  ['aria-label', 'ชื่อสำหรับโปรแกรมอ่านหน้าจอ', 'aria-label="$0"'],
  ['aria-hidden', 'ซ่อนจากโปรแกรมอ่านหน้าจอ', 'aria-hidden="true"'],
  ['role', 'บทบาทขององค์ประกอบ', 'role="$0"'],
  ['disabled', 'ปิดใช้งาน', 'disabled'],
  ['checked', 'ถูกเลือกไว้', 'checked'],
  ['data-', 'ข้อมูลของเราเอง', 'data-$0=""'],
];

const HTML_SNIPPETS = [
  {
    label: 'card', detail: 'การ์ดพร้อมหัวข้อและปุ่ม',
    insert: `<article class="card">
  <h3 class="card__title">$0</h3>
  <p class="card__text">คำอธิบายสั้น ๆ</p>
  <button class="card__btn">ดูรายละเอียด</button>
</article>`,
  },
  {
    label: 'stat', detail: 'กล่องตัวเลขสรุป',
    insert: `<div class="stat">
  <span class="stat__label">$0</span>
  <strong class="stat__value">12,480</strong>
</div>`,
  },
  {
    label: 'alert', detail: 'กล่องแจ้งเตือน',
    insert: '<div class="alert alert--success">$0บันทึกเรียบร้อยแล้ว</div>',
  },
  {
    label: 'form-field', detail: 'ช่องกรอกพร้อม label',
    insert: `<div class="field">
  <label class="field__label" for="f1">$0</label>
  <input class="field__input" id="f1" type="text">
</div>`,
  },
  {
    label: 'btn-row', detail: 'แถวปุ่มหลัก/รอง',
    insert: `<div class="row">
  <button class="btn btn--primary">$0บันทึก</button>
  <button class="btn btn--ghost">ยกเลิก</button>
</div>`,
  },
  {
    label: 'grid', detail: 'กริดสามช่อง',
    insert: `<div class="grid">
  <div class="grid__item">$0</div>
  <div class="grid__item"></div>
  <div class="grid__item"></div>
</div>`,
  },
  {
    label: 'table', detail: 'ตารางพร้อมหัวตาราง',
    insert: `<table class="table">
  <thead><tr><th>$0ชื่อ</th><th>สถานะ</th></tr></thead>
  <tbody><tr><td>รายการที่ 1</td><td>ปกติ</td></tr></tbody>
</table>`,
  },
];

/* --- การจับคู่คำ --------------------------------------------------------- */

/** ให้คะแนน: ขึ้นต้นตรงกันดีที่สุด ตามด้วยตรงกันแบบมีอยู่ในคำ แล้วค่อยแบบเรียงตัวอักษรกระจาย */
function score(label, query) {
  if (!query) return 1;

  const lower = label.toLowerCase();
  if (lower.startsWith(query)) return 1000 - label.length;

  const index = lower.indexOf(query);
  if (index > 0) return 500 - index - label.length * 0.1;

  // fuzzy: ตัวอักษรของ query ต้องปรากฏตามลำดับใน label
  let cursor = -1;
  for (const char of query) {
    cursor = lower.indexOf(char, cursor + 1);
    if (cursor === -1) return -1;
  }
  return 100 - label.length * 0.1;
}

function rank(items, query, limit = 12) {
  return items
    .map((item) => ({ item, s: score(item.label, query) }))
    .filter((entry) => entry.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((entry) => entry.item);
}

const tokenItems = TOKEN_COMPLETIONS.map(([label, detail]) => ({
  label, detail, kind: 'token', insert: `var(${label})`,
}));

const cssPropItems = CSS_PROPERTIES.map((label) => ({
  label, detail: 'property', kind: 'prop', insert: `${label}: $0;`,
}));

const cssSnippetItems = CSS_SNIPPETS.map((s) => ({ ...s, kind: 'snippet' }));

const htmlTagItems = HTML_TAGS.map((tag) => ({
  label: tag,
  detail: 'tag',
  kind: 'tag',
  insert: SELF_CLOSING.has(tag) ? `<${tag} $0>` : `<${tag}>$0</${tag}>`,
}));

const htmlSnippetItems = HTML_SNIPPETS.map((s) => ({ ...s, kind: 'snippet' }));

const htmlAttrItems = HTML_ATTRIBUTES.map(([label, detail, insert]) => ({
  label, detail, insert, kind: 'attr',
}));

/** แยกว่ากำลังพิมพ์ชื่อ property หรือค่าของ property จากข้อความ CSS ที่ค้างอยู่ */
function readCssContext(text, word) {
  const colon = text.lastIndexOf(':');
  const semicolon = text.lastIndexOf(';');
  const inValue = colon > semicolon;
  const property = inValue ? text.slice(0, colon).trim().split(/[\s{;]/).pop() : '';
  return { word, mode: inValue ? 'value' : 'property', property };
}

/** อ่านบริบทรอบเคอร์เซอร์เพื่อรู้ว่ากำลังพิมพ์อะไรอยู่ */
export function readContext(value, caret, language) {
  const before = value.slice(0, caret);
  const line = before.slice(before.lastIndexOf('\n') + 1);

  // คำที่กำลังพิมพ์: ตัวอักษร ตัวเลข ขีด, < ที่นำหน้าแท็ก หรือ # ที่นำหน้ารหัสสี
  const match = line.match(/(<?[-a-zA-Z][-a-zA-Z0-9]*|#[0-9a-fA-F]*)$/);
  const word = match ? match[1] : '';

  if (language === 'css') return readCssContext(line, word);

  // อยู่ข้างใน style="..." ที่ยังไม่ปิดเครื่องหมายคำพูด — ใช้ตรรกะเดียวกับช่อง CSS
  const inlineStyle = /style="([^"]*)$/i.exec(before);
  if (inlineStyle) return { ...readCssContext(inlineStyle[1], word), inline: true };

  // อยู่ข้างในแท็กที่ยังไม่ปิด และผ่านชื่อแท็กมาแล้ว = กำลังพิมพ์ attribute
  const openBracket = before.lastIndexOf('<');
  const closeBracket = before.lastIndexOf('>');
  const insideTag = openBracket > closeBracket;
  const afterTagName = insideTag && /^<[a-zA-Z][-a-zA-Z0-9]*\s/.test(before.slice(openBracket));

  return { word, mode: afterTagName ? 'attr' : 'html', property: '' };
}

/**
 * รายการคำแนะนำสำหรับบริบทที่กำหนด
 * @param {{colors?: Array<{hex:string, detail:string}>}} extras สีจริงจาก palette ที่กำลังใช้อยู่
 */
export function getCompletions(context, extras = {}) {
  const raw = context.word;
  const query = raw.replace(/^</, '').toLowerCase();

  // พิมพ์ # เมื่อไร ก็เสนอสีจาก palette ที่ใช้อยู่จริง ไม่ต้องเปิดไปคัดลอกรหัสเอง
  if (query.startsWith('#')) {
    const colors = (extras.colors ?? []).map((color) => ({
      label: color.hex, detail: color.detail, kind: 'color', insert: color.hex, color: color.hex,
    }));
    return rank(colors, query.slice(1) ? query : '', 14);
  }

  if (context.mode === 'value') {
    const values = (CSS_VALUES[context.property] ?? []).map((value) => ({
      label: value, detail: context.property, kind: 'value', insert: value,
    }));
    // token ใช้ได้กับทุก property จึงเสนอควบคู่กับค่าเฉพาะทางเสมอ
    return rank([...values, ...tokenItems], query);
  }

  if (context.mode === 'property') {
    if (query.startsWith('--')) return rank(tokenItems, query);
    // ใน style="" ไม่ต้องเสนอ snippet หลายบรรทัด เพราะเขียนในบรรทัดเดียว
    const base = context.inline ? cssPropItems : [...cssSnippetItems, ...cssPropItems];
    return rank([...base, ...tokenItems], query);
  }

  if (context.mode === 'attr') return rank(htmlAttrItems, query);

  return rank([...htmlSnippetItems, ...htmlTagItems], query);
}

/**
 * แทนที่คำที่พิมพ์ค้างไว้ด้วยคำแนะนำที่เลือก
 * @returns {{value:string, caret:number}} ข้อความใหม่ และตำแหน่งเคอร์เซอร์ (ตรงจุด $0 ถ้ามี)
 */
export function applyCompletion(value, caret, context, item) {
  const start = caret - context.word.length;
  const marker = item.insert.indexOf('$0');
  const text = item.insert.replace('$0', '');

  return {
    value: value.slice(0, start) + text + value.slice(caret),
    caret: start + (marker === -1 ? text.length : marker),
  };
}
