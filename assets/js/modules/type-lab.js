/**
 * type-lab.js — เครื่องมือที่ 2: ตัวอักษรกับสี
 *
 * ตอบคำถามที่เครื่องมือสีทั่วไปตอบไม่ได้: "คู่สีนี้ใช้กับตัวอักษรขนาดไหนได้บ้าง"
 *
 * WCAG ไม่ได้มีเกณฑ์คอนทราสต์ค่าเดียว แต่แยกตาม "ขนาดและน้ำหนัก" ของตัวอักษร
 * ข้อความใหญ่ต้องการแค่ 3:1 ส่วนข้อความปกติต้องการ 4.5:1
 * คู่สีเดียวกันจึงผ่านที่หัวข้อแต่ตกที่เนื้อความได้ — เป็นกับดักที่คนทำ UI พลาดบ่อยที่สุด
 * เพราะเครื่องมือตรวจคอนทราสต์ส่วนใหญ่ให้ตัวเลขเดียวโดยไม่ถามว่าจะเอาไปใช้ขนาดไหน
 *
 * ที่นี่จึงตรวจทีละขั้นของสเกล แล้วบอกตรง ๆ ว่าขั้นไหนใช้ได้ ขั้นไหนต้องแก้
 */

import { contrastRatio, wcagResults, readableTextOn } from '../utils/color-utils.js';
import { ROLES, ROLE_LABELS } from '../utils/palette-tokens.js';
import { FONTS, CATEGORY_LABELS, findFont, fontStack, loadFont } from '../utils/google-fonts.js';

/* --------------------------------------------------------------------------
   สเกลและกติกา
   -------------------------------------------------------------------------- */

/* ขนาดทุกค่าหาร 2 ลงตัวและอยู่บนกริด 4px ได้เมื่อคูณกับ line-height ที่แนะนำ
   ตรงกับกติกาของ design-system.css ที่ตรึงทุกอย่างไว้กับกริด 4px */
const TYPE_SCALE = [
  { key: 'display', label: 'Display',        size: 48, weight: 700 },
  { key: 'h1',      label: 'หัวข้อ 1',        size: 36, weight: 700 },
  { key: 'h2',      label: 'หัวข้อ 2',        size: 30, weight: 600 },
  { key: 'h3',      label: 'หัวข้อ 3',        size: 24, weight: 600 },
  { key: 'h4',      label: 'หัวข้อ 4',        size: 20, weight: 600 },
  { key: 'body-lg', label: 'เนื้อความใหญ่',   size: 18, weight: 400 },
  { key: 'body',    label: 'เนื้อความ',       size: 16, weight: 400 },
  { key: 'body-sm', label: 'เนื้อความเล็ก',   size: 14, weight: 400 },
  { key: 'caption', label: 'คำกำกับ',         size: 12, weight: 400 },
];

/**
 * นิยาม "ข้อความใหญ่" ของ WCAG 2.2 (SC 1.4.3)
 * 18pt = 24px หรือ 14pt = 18.66px เมื่อเป็นตัวหนา
 * ตัวเลข 18.66 ไม่ใช่ค่าที่ตั้งเอง แต่มาจาก 14pt x 96/72
 */
const isLargeText = (size, weight) => size >= 24 || (size >= 18.66 && weight >= 700);

const requiredRatio = (size, weight, level) => {
  const large = isLargeText(size, weight);
  if (level === 'AAA') return large ? 4.5 : 7;
  return large ? 3 : 4.5;
};

/** ปัดให้ตกกริด 4px — ตัวอักษรทุกบรรทัดจึงเรียงตรงกันข้ามคอลัมน์ */
const toGrid = (px) => Math.round(px / 4) * 4;

/**
 * line-height ที่แนะนำ
 *
 * ตัวใหญ่ต้องการช่องไฟบรรทัดน้อยกว่าเพราะตาเห็นรูปคำทั้งก้อนอยู่แล้ว
 * ตัวเล็กต้องการมากกว่าเพราะตาต้องไล่ทีละบรรทัด
 *
 * ภาษาไทยต้องการมากกว่าภาษาละตินอย่างมีนัยสำคัญ เพราะมีสระบนซ้อนวรรณยุกต์
 * (เช่น "เปี๊ยะ") และสระล่าง ความสูงจริงของบรรทัดจึงกินพื้นที่กว่าที่ font-size บอก
 * ถ้าใช้ค่าเดียวกับละตินจะเกิดวรรณยุกต์ชนบรรทัดบน
 */
function suggestLineHeight(size, thai) {
  let ratio;
  if (size >= 36) ratio = 1.15;
  else if (size >= 24) ratio = 1.25;
  else if (size >= 20) ratio = 1.4;
  else ratio = 1.6;

  if (thai && size < 24) ratio += 0.15;
  return toGrid(size * ratio);
}

/**
 * letter-spacing ที่แนะนำ
 *
 * ตัวใหญ่ดูโปร่งเกินจริงเพราะช่องไฟถูกออกแบบมาสำหรับขนาดเนื้อความ จึงบีบเข้าเล็กน้อย
 * ตัวเล็กดูแน่นเกินไป จึงถ่างออกนิดหน่อย
 *
 * ภาษาไทยบีบได้น้อยกว่ามาก — สระกับวรรณยุกต์วางอยู่เหนือพยัญชนะ
 * ถ้าบีบแรงจะเริ่มชนกันในแนวนอน จึงจำกัดไว้ที่ -0.01em และไม่ถ่างเลยที่ตัวเล็ก
 */
function suggestTracking(size, thai) {
  if (size >= 36) return thai ? '-0.01em' : '-0.02em';
  if (size >= 24) return thai ? '-0.005em' : '-0.01em';
  if (size >= 16) return '0';
  return thai ? '0' : '0.01em';
}

const PREVIEW_TEXT = {
  th: {
    display: 'ออกแบบด้วยสี',
    body: 'ตัวอักษรที่อ่านง่ายไม่ได้มาจากฟอนต์สวยอย่างเดียว แต่มาจากขนาด น้ำหนัก ช่องไฟบรรทัด และคอนทราสต์ที่ทำงานร่วมกัน เปลี่ยนอย่างใดอย่างหนึ่งแล้วที่เหลือต้องขยับตาม',
  },
  en: {
    display: 'Design with color',
    body: 'Readable type is never about the typeface alone. Size, weight, line height and contrast work together — change one and the rest must follow.',
  },
  mix: {
    display: 'ออกแบบ Design 2026',
    body: 'งาน UI ส่วนใหญ่ผสมไทยกับอังกฤษในประโยคเดียว เช่น กด Save เพื่อบันทึก หรือ 1,240 รายการ ฟอนต์ที่ดีต้องให้ความสูงของตัวเลขและตัวอักษรละตินเข้ากับตัวไทยได้',
  },
};

/* --------------------------------------------------------------------------
   การวิเคราะห์
   -------------------------------------------------------------------------- */

/**
 * ตรวจทั้งสเกลกับคู่สีที่เลือก แล้วคืนผลทีละขั้น
 * นี่คือหัวใจของเครื่องมือ — ตัวเลขคอนทราสต์ตัวเดียวไม่พอ ต้องผูกกับขนาดเสมอ
 */
export function analyzeScale(fg, bg, { thai = false, fontName = '' } = {}) {
  const ratio = contrastRatio(fg, bg);
  const wcag = wcagResults(ratio);

  const steps = TYPE_SCALE.map((step) => {
    const large = isLargeText(step.size, step.weight);
    const needAA = requiredRatio(step.size, step.weight, 'AA');
    const needAAA = requiredRatio(step.size, step.weight, 'AAA');
    return {
      ...step,
      large,
      needAA,
      needAAA,
      passAA: ratio >= needAA,
      passAAA: ratio >= needAAA,
      lineHeight: suggestLineHeight(step.size, thai),
      tracking: suggestTracking(step.size, thai),
    };
  });

  const notes = [];
  const failing = steps.filter((step) => !step.passAA);

  if (failing.length === 0) {
    notes.push({ kind: 'ok', text: `คู่สีนี้ผ่านเกณฑ์ AA ทุกขนาดในสเกล (${ratio.toFixed(2)}:1)` });
  } else if (failing.length === steps.length) {
    notes.push({
      kind: 'bad',
      text: `คอนทราสต์ ${ratio.toFixed(2)}:1 ต่ำเกินไปสำหรับทุกขนาด — ต้องอย่างน้อย 3:1 แม้แต่กับหัวข้อใหญ่สุด`,
    });
  } else {
    const biggestFail = failing[0];
    notes.push({
      kind: 'warn',
      text: `คู่สีนี้ใช้ได้ถึงขนาด ${steps.find((s) => s.passAA)?.size ?? '-'}px `
        + `แต่ตกเกณฑ์ตั้งแต่ ${biggestFail.label} (${biggestFail.size}px) ลงไป — `
        + `เพราะข้อความเล็กต้องการ ${biggestFail.needAA}:1 แต่ได้แค่ ${ratio.toFixed(2)}:1`,
    });
  }

  /* กับดักที่เจอบ่อย: เลือกน้ำหนักบางเพราะดูโปร่งตอนทำหัวข้อ แล้วเอาไปใช้กับเนื้อความด้วย
     เส้นที่บางลงทำให้คอนทราสต์ที่ตาเห็นจริงต่ำกว่าตัวเลขที่วัดได้ ซึ่ง WCAG ไม่ได้ครอบคลุม */
  if (thai) {
    notes.push({
      kind: 'info',
      text: 'ฟอนต์ไทย: line-height ที่แนะนำถูกบวกเพิ่มจากค่าละตินแล้ว เพราะสระบนซ้อนวรรณยุกต์กินความสูงเกินกว่าที่ font-size บอก',
    });
  }

  if (/thin|light|100|200|300/i.test(fontName)) {
    notes.push({ kind: 'warn', text: 'ชื่อฟอนต์บอกว่าเป็นน้ำหนักบาง — ตรวจเนื้อความขนาด 14–16px ด้วยตาอีกครั้ง' });
  }

  return { ratio, wcag, steps, notes };
}

/** แปลงผลวิเคราะห์เป็น CSS custom properties ที่ก๊อปไปวางใช้ได้ทันที */
export function presetCss(result, { fontName, cat, fg, bg }) {
  const lines = [
    '/* Type preset — สร้างจาก ColorLab Colorground */',
    ':root {',
    `  --font-family: ${fontStack(fontName, cat)};`,
    '',
    `  --color-text: ${fg};`,
    `  --color-bg: ${bg};`,
    `  /* คอนทราสต์ ${result.ratio.toFixed(2)}:1 */`,
    '',
  ];

  result.steps.forEach((step) => {
    const status = step.passAA ? 'ผ่าน AA' : `ไม่ผ่าน AA (ต้อง ${step.needAA}:1)`;
    lines.push(`  /* ${step.label} — ${status} */`);
    lines.push(`  --fs-${step.key}: ${(step.size / 16).toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}rem;`);
    lines.push(`  --lh-${step.key}: ${(step.lineHeight / 16).toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}rem;`);
    lines.push(`  --ls-${step.key}: ${step.tracking};`);
    lines.push(`  --fw-${step.key}: ${step.weight};`);
    lines.push('');
  });

  lines.push('}');
  return lines.join('\n');
}

/* --------------------------------------------------------------------------
   UI
   -------------------------------------------------------------------------- */

const el = {};

function pick(id) {
  return document.querySelector(`#${id}`);
}

function renderFontOptions() {
  const groups = { sans: [], serif: [], mono: [] };
  FONTS.forEach((font) => groups[font.cat]?.push(font));

  el.fontSelect.innerHTML = Object.entries(groups).map(([cat, list]) => {
    const options = list.map((font) => {
      const tag = font.thai ? ' — รองรับไทย' : '';
      return `<option value="${font.name}">${font.name}${tag}</option>`;
    }).join('');
    return `<optgroup label="${CATEGORY_LABELS[cat]}">${options}</optgroup>`;
  }).join('');
}

export function initTypeLab(store) {
  const root = document.querySelector('#type-lab');
  if (!root) return;

  [
    'type-font', 'type-font-custom', 'type-font-load', 'type-weights', 'type-status',
    'type-fg', 'type-bg', 'type-fg-hex', 'type-bg-hex', 'type-swap',
    'type-sample', 'type-specimen', 'type-analyze', 'type-result', 'type-code',
  ].forEach((id) => { el[id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = pick(id); });

  el.fontSelect = el.typeFont;
  if (!el.fontSelect || !el.typeSpecimen) return;

  const state = {
    font: 'IBM Plex Sans Thai',
    cat: 'sans',
    thai: true,
    weights: [100, 200, 300, 400, 500, 600, 700],
    weight: 400,
    fg: '#0f172a',
    bg: '#ffffff',
    sample: 'th',
  };

  /* ---- สีจากชุดสีปัจจุบัน ---- */

  const paintRoleButtons = (palette) => {
    const build = (target, current) => ROLES.map((role) => {
      const hex = palette[role];
      return `<button type="button" class="type-swatch" data-target="${target}" data-hex="${hex}"
        style="--sw:${hex}" ${current.toLowerCase() === hex.toLowerCase() ? 'aria-pressed="true"' : ''}
        title="${ROLE_LABELS[role]}"><span class="u-visually-hidden">${ROLE_LABELS[role]}</span></button>`;
    }).join('')
      /* ขาวกับดำเกือบดำเป็นคู่ที่ใช้จริงบ่อยที่สุดในงานเนื้อความ ต้องหยิบได้ในคลิกเดียว */
      + `<button type="button" class="type-swatch" data-target="${target}" data-hex="#ffffff" style="--sw:#ffffff" title="ขาว"><span class="u-visually-hidden">ขาว</span></button>`
      + `<button type="button" class="type-swatch" data-target="${target}" data-hex="#0f172a" style="--sw:#0f172a" title="เกือบดำ"><span class="u-visually-hidden">เกือบดำ</span></button>`;

    el.typeFg.innerHTML = build('fg', state.fg);
    el.typeBg.innerHTML = build('bg', state.bg);
  };

  /* ---- ตัวอย่างสด ---- */

  const renderSpecimen = () => {
    const text = PREVIEW_TEXT[state.sample];
    const stack = fontStack(state.font, state.cat);

    el.typeSpecimen.style.setProperty('--type-fg', state.fg);
    el.typeSpecimen.style.setProperty('--type-bg', state.bg);
    el.typeSpecimen.style.setProperty('--type-family', stack);

    /* แสดงทุกขั้นพร้อมกันในคอลัมน์เดียว เพื่อให้เทียบ "ใหญ่+บาง" กับ "เล็ก+หนา" ได้ด้วยตาเดียว
       ถ้าให้เลือกดูทีละขนาดจะเทียบไม่ได้ ซึ่งเป็นสิ่งที่ต้องเทียบที่สุด */
    el.typeSpecimen.innerHTML = TYPE_SCALE.map((step) => {
      const lh = suggestLineHeight(step.size, state.thai);
      const ls = suggestTracking(step.size, state.thai);
      const body = step.size >= 24 ? text.display : text.body;
      const weight = state.weight && step.size < 24 ? state.weight : step.weight;
      return `
        <div class="type-row">
          <div class="type-row__meta">
            <span class="type-row__name">${step.label}</span>
            <span class="type-row__spec">${step.size}/${lh} · ${weight}</span>
          </div>
          <p class="type-row__text" style="font-size:${step.size}px; line-height:${lh}px;
             letter-spacing:${ls}; font-weight:${weight}">${body}</p>
        </div>`;
    }).join('');
  };

  const renderWeights = () => {
    el.typeWeights.innerHTML = state.weights.map((w) => `
      <button type="button" class="type-weight" data-weight="${w}"
        ${w === state.weight ? 'aria-pressed="true"' : ''}>${w}</button>`).join('');
  };

  /* ---- โหลดฟอนต์ ---- */

  const applyFont = async (name) => {
    const known = findFont(name);
    state.font = name;
    state.cat = known?.cat ?? 'sans';
    state.thai = known?.thai ?? /thai|sarabun|prompt|kanit|mitr|athiti|anuphan|k2d/i.test(name);
    state.weights = known?.weights ?? [300, 400, 500, 600, 700];
    if (!state.weights.includes(state.weight)) state.weight = state.weights.includes(400) ? 400 : state.weights[0];

    el.typeStatus.textContent = `กำลังโหลด ${name}…`;
    renderWeights();
    renderSpecimen();

    const result = await loadFont(name, state.weights);
    el.typeStatus.textContent = result.ok
      ? `โหลด ${name} แล้ว — น้ำหนักที่มี ${state.weights.join(' · ')}`
      : `${name}: ${result.reason}`;
    el.typeStatus.dataset.state = result.ok ? 'ok' : 'bad';
    renderSpecimen();
  };

  /* ---- วิเคราะห์ ---- */

  const runAnalysis = () => {
    const result = analyzeScale(state.fg, state.bg, { thai: state.thai, fontName: state.font });

    const rows = result.steps.map((step) => `
      <tr data-pass="${step.passAA ? 'yes' : 'no'}">
        <th scope="row">${step.label}</th>
        <td class="u-mono">${step.size}px</td>
        <td class="u-mono">${step.lineHeight}px</td>
        <td class="u-mono">${step.tracking}</td>
        <td>${step.large ? 'ใหญ่' : 'ปกติ'}</td>
        <td class="u-mono">${step.needAA}:1</td>
        <td><span class="type-badge" data-ok="${step.passAA}">${step.passAA ? 'ผ่าน' : 'ไม่ผ่าน'}</span></td>
        <td><span class="type-badge" data-ok="${step.passAAA}">${step.passAAA ? 'ผ่าน' : 'ไม่ผ่าน'}</span></td>
      </tr>`).join('');

    el.typeResult.innerHTML = `
      <div class="type-score">
        <div class="type-score__ratio">
          <span class="type-score__num u-mono">${result.ratio.toFixed(2)}:1</span>
          <span class="type-score__label">คอนทราสต์ของคู่สีที่เลือก</span>
        </div>
        <div class="type-score__bars">
          <span class="type-badge" data-ok="${result.wcag.largeAA}">ข้อความใหญ่ AA</span>
          <span class="type-badge" data-ok="${result.wcag.normalAA}">ข้อความปกติ AA</span>
          <span class="type-badge" data-ok="${result.wcag.normalAAA}">ข้อความปกติ AAA</span>
        </div>
      </div>

      <ul class="type-notes">
        ${result.notes.map((note) => `<li data-kind="${note.kind}">${note.text}</li>`).join('')}
      </ul>

      <div class="type-table-wrap">
        <table class="type-table">
          <caption class="u-visually-hidden">ผลตรวจแต่ละขั้นของสเกล</caption>
          <thead>
            <tr>
              <th scope="col">ขั้น</th><th scope="col">ขนาด</th><th scope="col">บรรทัด</th>
              <th scope="col">ช่องไฟ</th><th scope="col">นับเป็น</th><th scope="col">ต้องการ</th>
              <th scope="col">AA</th><th scope="col">AAA</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

    el.typeCode.textContent = presetCss(result, {
      fontName: state.font, cat: state.cat, fg: state.fg, bg: state.bg,
    });
    el.typeCode.closest('[hidden]')?.removeAttribute('hidden');
  };

  /* ---- ผูกเหตุการณ์ ---- */

  renderFontOptions();
  el.fontSelect.value = state.font;

  el.fontSelect.addEventListener('change', () => applyFont(el.fontSelect.value));

  el.typeFontLoad?.addEventListener('click', () => {
    const name = el.typeFontCustom.value.trim();
    if (name) applyFont(name);
  });
  el.typeFontCustom?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    el.typeFontLoad?.click();
  });

  el.typeWeights.addEventListener('click', (event) => {
    const button = event.target.closest('[data-weight]');
    if (!button) return;
    state.weight = Number(button.dataset.weight);
    renderWeights();
    renderSpecimen();
  });

  const onSwatch = (event) => {
    const button = event.target.closest('[data-hex]');
    if (!button) return;
    state[button.dataset.target] = button.dataset.hex;
    if (button.dataset.target === 'fg') el.typeFgHex.value = state.fg;
    else el.typeBgHex.value = state.bg;
    paintRoleButtons(store.getPalette());
    renderSpecimen();
  };
  el.typeFg.addEventListener('click', onSwatch);
  el.typeBg.addEventListener('click', onSwatch);

  const bindHex = (input, key) => input?.addEventListener('input', () => {
    const value = input.value.trim();
    if (!/^#[0-9a-f]{6}$/i.test(value)) return;
    state[key] = value;
    paintRoleButtons(store.getPalette());
    renderSpecimen();
  });
  bindHex(el.typeFgHex, 'fg');
  bindHex(el.typeBgHex, 'bg');

  el.typeSwap?.addEventListener('click', () => {
    [state.fg, state.bg] = [state.bg, state.fg];
    el.typeFgHex.value = state.fg;
    el.typeBgHex.value = state.bg;
    paintRoleButtons(store.getPalette());
    renderSpecimen();
  });

  el.typeSample?.addEventListener('change', () => {
    state.sample = el.typeSample.value;
    renderSpecimen();
  });

  el.typeAnalyze?.addEventListener('click', runAnalysis);

  /* ชุดสีเปลี่ยนจากเครื่องมืออื่นหรือแท็บอื่น ปุ่มสีต้องตามทันที */
  store.subscribe((palette) => {
    paintRoleButtons(palette);
    /* ครั้งแรกสุด: ตั้งสีตัวอักษรให้อ่านออกบนพื้นที่เลือกไว้ แทนที่จะให้ผู้ใช้มาไล่แก้เอง */
    if (!el.typeFgHex.value) {
      state.bg = '#ffffff';
      state.fg = readableTextOn(state.bg);
      el.typeFgHex.value = state.fg;
      el.typeBgHex.value = state.bg;
    }
    renderSpecimen();
  });

  applyFont(state.font);
}
