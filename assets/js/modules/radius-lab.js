/**
 * radius-lab.js — ตั้งความโค้งของมุมให้ทั้งระบบ แล้วเห็นผลกับ component จริงทันที
 *
 * พรีวิวในนี้ไม่ใช่กล่องสี่เหลี่ยมจำลอง แต่เป็น markup ชุดเดียวกับที่หน้า Component Style
 * และหน้า Layout ใช้ ดึงมาจาก assets/components/ ตรง ๆ — ถ้าเห็นว่ามุมสวยตรงนี้
 * ของจริงก็จะออกมาแบบนั้น ไม่ใช่ "ใกล้เคียง"
 *
 * ค่าที่ตั้งถูกเก็บคู่กับชุดสีใน palette-store จึงข้ามหน้าและข้ามแท็บไปด้วยกันเสมอ
 */

import { RADIUS, buildRadiusTokens, buildPaletteTokens } from '../utils/palette-tokens.js';
import { loadMarkup } from './component-catalog.js';

/** ตัวอย่างที่เลือกมาเพราะกินมุมคนละขนาด — ปุ่มใช้ sm การ์ดใช้ lg ป้ายใช้ full */
const SHOWCASE = ['button', 'field', 'card', 'alert'];

const SCALE_LABELS = [
  ['--cs-radius-sm', 'เล็ก', 'ปุ่ม ป้าย ช่องกรอก'],
  ['--cs-radius-md', 'กลาง', 'กล่อง แถบเครื่องมือ'],
  ['--cs-radius-lg', 'ใหญ่', 'การ์ด กล่องลอย'],
  ['--cs-radius-full', 'กลม', 'รูปโปรไฟล์ จุดสถานะ — ไม่ขยับตาม'],
];

export async function initRadiusLab(store) {
  const root = document.querySelector('#shape-lab');
  if (!root || !store) return;

  const range = root.querySelector('#shape-range');
  const value = root.querySelector('#shape-value');
  const scale = root.querySelector('#shape-scale');
  const preview = root.querySelector('#shape-preview');
  if (!range || !preview) return;

  range.min = String(RADIUS.min);
  range.max = String(RADIUS.max);
  range.step = String(RADIUS.step);

  // โหลด markup ครั้งเดียว แล้วเปลี่ยนแค่ token ตอนลาก — ไม่ต้อง fetch ซ้ำทุกเฟรม
  const parts = await Promise.all(SHOWCASE.map(async (slug) => {
    try {
      return (await loadMarkup(slug)).card;
    } catch {
      return '';
    }
  }));
  preview.innerHTML = parts.filter(Boolean).join('\n');

  /** ทาสีและมุมลงบนกล่องพรีวิวเท่านั้น ไม่แตะ UI ของเครื่องมือรอบข้าง */
  const paint = () => {
    const radius = store.getRadius();
    const radiusTokens = buildRadiusTokens(radius);
    const { tokens } = buildPaletteTokens(store.getPalette(), store.getTheme());

    Object.entries(tokens).forEach(([name, hex]) => {
      if (name === '--pv-accent-count') return;
      preview.style.setProperty(name.replace('--pv-', '--color-'), hex);
    });
    Object.entries(radiusTokens).forEach(([name, px]) => {
      preview.style.setProperty(name.replace('--pv-radius-', '--cs-radius-'), px);
      preview.style.setProperty(name.replace('--pv-radius-', '--radius-'), px);
    });

    if (value) value.textContent = `${radius}px`;
    if (range.value !== String(radius)) range.value = String(radius);

    if (scale) {
      scale.replaceChildren(...SCALE_LABELS.map(([token, label, use]) => {
        const px = radiusTokens[token.replace('--cs-radius-', '--pv-radius-')];
        const li = document.createElement('li');
        li.className = 'shape__step';
        li.innerHTML = `<span class="shape__chip" style="border-radius:${px}"></span>
          <span class="shape__step-text"><b>${label}</b><small>${use}</small></span>
          <code>${px}</code>`;
        return li;
      }));
    }
  };

  range.addEventListener('input', () => store.setRadius(Number(range.value)));
  store.subscribe(paint);
}
