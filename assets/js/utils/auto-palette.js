/**
 * auto-palette.js — สร้างชุดสีสำเร็จรูปหลายแบบจากสีตั้งต้นสีเดียว (pure ไม่แตะ DOM)
 *
 * ทุกชุดหมุนเนื้อสีบนวงล้อศิลปะผ่าน buildHarmony ไม่ใช่บวก hue ของ HSL ตรง ๆ
 * คู่ตรงข้ามของม่วงจึงเป็นเหลืองตามที่หน้า Color Theory สอน
 *
 * แต่ละชุดคืนสีตามบทบาทที่เอาไปใช้ได้ทันที ไม่ใช่แค่กองสีสวย ๆ
 * ลำดับสีในชุดคือ: สีหลัก, สีรอง/เน้น, พื้นอ่อน, สีเข้มสำหรับตัวอักษรหรือพื้นเข้ม
 */

import {
  hexToHsl, hslToHex, clamp, buildHarmony, contrastRatio,
} from './color-utils.js';

const rotate = (hsl, type, index) => buildHarmony(hsl, type)[index] ?? hsl;

const shift = (hsl, { s = 0, l = 0 } = {}) => ({
  h: hsl.h,
  s: clamp(hsl.s + s, 0, 100),
  l: clamp(hsl.l + l, 0, 100),
});

const at = (hsl, { s, l }) => ({ h: hsl.h, s: clamp(s, 0, 100), l: clamp(l, 0, 100) });

/**
 * ชุดสีทั้งเจ็ดแบบ — เรียงจากใช้ง่ายที่สุดไปหาที่ต้องกล้าที่สุด
 * id ใช้เป็นคีย์ถาวร ห้ามเปลี่ยนเพราะอาจถูกอ้างใน URL หรือคลังในอนาคต
 */
export const AUTO_PALETTE_RECIPES = [
  {
    id: 'tints-shades',
    name: 'Tints & Shades',
    thai: 'ไล่อ่อนเข้มสีเดียว',
    // ตำแหน่งของสีที่ควรเป็นสีแบรนด์เมื่อกด "ใช้ชุดนี้" — แต่ละสูตรวางสีหลักไว้คนละที่
    primaryIndex: 2,
    note: 'ปลอดภัยที่สุด ใช้เมื่อแบรนด์มีสีเดียวและต้องการลำดับชั้นล้วน ๆ',
    build: (base) => [
      at(base, { s: base.s * 0.35, l: 94 }),
      at(base, { s: base.s * 0.75, l: 78 }),
      base,
      at(base, { s: base.s * 0.95, l: Math.max(28, base.l - 22) }),
      at(base, { s: base.s * 0.8, l: 16 }),
    ],
  },
  {
    id: 'analogous-soft',
    name: 'Analogous',
    thai: 'สีข้างเคียง',
    primaryIndex: 2,
    note: 'กลมกลืนที่สุด เหมาะกับงานที่อยากให้ทั้งหน้าอ่านเป็นก้อนเดียว',
    build: (base) => {
      const [left, mid, right] = buildHarmony(base, 'analogous');
      return [
        at(left, { s: left.s * 0.9, l: 92 }),
        at(left, { s: left.s, l: 62 }),
        mid,
        at(right, { s: right.s, l: Math.max(30, base.l - 18) }),
      ];
    },
  },
  {
    id: 'complementary-pop',
    name: 'Complementary',
    thai: 'สีตรงข้าม',
    note: 'มีสีเน้นที่ตัดกับสีหลักชัด เหมาะกับหน้าที่ต้องมีปุ่มหลักเด่นจริง',
    build: (base) => {
      const opposite = rotate(base, 'complementary', 1);
      return [
        base,
        at(base, { s: base.s * 0.55, l: 86 }),
        at(base, { s: base.s * 0.25, l: 96 }),
        at(opposite, { s: Math.max(45, opposite.s), l: 48 }),
      ];
    },
  },
  {
    id: 'triadic-balance',
    name: 'Triadic',
    thai: 'สามเหลี่ยม',
    note: 'สามเนื้อสีที่ห่างเท่ากัน ใช้เมื่อต้องแยกหมวดหมู่ด้วยสีหลายกลุ่ม',
    build: (base) => {
      const [first, second, third] = buildHarmony(base, 'triadic');
      return [
        first,
        at(second, { s: second.s * 0.9, l: 58 }),
        at(third, { s: third.s * 0.9, l: 52 }),
        at(first, { s: first.s * 0.3, l: 95 }),
      ];
    },
  },
  {
    id: 'pastel',
    name: 'Pastel',
    thai: 'พาสเทล',
    primaryIndex: 0,
    note: 'ลดความอิ่มลงและยกความสว่างขึ้นทั้งชุด ต้องมีสีเข้มปิดท้ายไว้ใช้กับตัวอักษร',
    build: (base) => {
      const [left, , right] = buildHarmony(base, 'analogous');
      const opposite = rotate(base, 'complementary', 1);
      return [
        at(base, { s: clamp(base.s * 0.55, 25, 62), l: 84 }),
        at(left, { s: clamp(left.s * 0.5, 22, 58), l: 88 }),
        at(right, { s: clamp(right.s * 0.5, 22, 58), l: 90 }),
        at(opposite, { s: clamp(opposite.s * 0.5, 22, 58), l: 86 }),
        at(base, { s: base.s * 0.6, l: 26 }),
      ];
    },
  },
  {
    id: 'vivid',
    name: 'Vivid',
    thai: 'สีจัดจ้าน',
    note: 'ดันความอิ่มขึ้นสุดทาง ใช้กับงานที่ต้องการพลัง แต่ต้องวางบนพื้นเข้มหรือขาวล้วนเท่านั้น',
    build: (base) => {
      const opposite = rotate(base, 'complementary', 1);
      const [, splitA, splitB] = buildHarmony(base, 'split-complementary');
      return [
        at(base, { s: clamp(base.s * 1.25, 70, 96), l: clamp(base.l, 45, 58) }),
        at(splitA, { s: clamp(splitA.s * 1.2, 70, 96), l: 54 }),
        at(splitB, { s: clamp(splitB.s * 1.2, 70, 96), l: 50 }),
        at(opposite, { s: clamp(opposite.s * 1.2, 70, 96), l: 46 }),
        at(base, { s: 30, l: 12 }),
      ];
    },
  },
  {
    id: 'neutral-accent',
    name: 'Neutral + Accent',
    thai: 'เทาอมสีแบรนด์ + สีเน้น',
    primaryIndex: 4,
    note: 'ชุดที่ใกล้หน้าจอจริงที่สุด พื้นและตัวอักษรเป็นเทาที่อมเนื้อสีแบรนด์ เหลือสีสดไว้จุดเดียว',
    build: (base) => [
      at(base, { s: 12, l: 97 }),
      at(base, { s: 10, l: 88 }),
      at(base, { s: 8, l: 46 }),
      at(base, { s: 14, l: 18 }),
      base,
    ],
  },
];

/** สร้างทุกชุดจากสีตั้งต้นเดียว */
export function buildAutoPalettes(hex) {
  const base = hexToHsl(hex);
  if (!base) return [];

  return AUTO_PALETTE_RECIPES.map((recipe) => {
    const colors = recipe.build(base).map(hslToHex);
    const unique = [...new Set(colors)];
    const primaryHex = colors[recipe.primaryIndex ?? 0] ?? unique[0];

    return {
      id: recipe.id,
      name: recipe.name,
      thai: recipe.thai,
      note: recipe.note,
      colors: unique,
      primaryHex,
    };
  });
}

/**
 * แปลงชุดสีเป็น palette ของระบบ — เลือกสีที่เข้มพอเป็นสีแบรนด์ ไม่ใช่หยิบตัวแรกเสมอ
 * เพราะบางชุด (พาสเทล) สีแรกอ่อนเกินกว่าจะวางตัวอักษรขาวได้
 */
/**
 * @param {string[]} colors สีทั้งชุด
 * @param {string} [preferredPrimary] สีที่สูตรตั้งใจให้เป็นสีแบรนด์ (เช่นชุดเทาที่สีเน้นอยู่ท้ายสุด)
 */
export function toPaletteSeed(colors, preferredPrimary) {
  // ระบบ token คำนวณสเกลจากสีแบรนด์เอง สีพาสเทลจึงใช้เป็นสีแบรนด์ได้
  // ที่ต้องกันคือสีที่จางจนเกือบขาว เพราะปุ่มจะกลืนกับพื้นการ์ด
  const usable = (hex) => contrastRatio(hex, '#ffffff') >= 1.35;
  const primary = (preferredPrimary && usable(preferredPrimary))
    ? preferredPrimary
    : colors.find(usable) ?? colors[0];

  // สีที่จางเกือบขาวเป็นสีพื้น ไม่ใช่สีเน้น — ถ้าปล่อยเข้าไปจะได้ accent ที่มองไม่เห็นบนการ์ด
  const accents = colors
    .filter((hex) => hex !== primary && contrastRatio(hex, '#ffffff') >= 1.5)
    .slice(0, 4);

  return { primary, accents };
}

/** สุ่มสีตั้งต้นที่ยังอยู่ในช่วงที่ใช้เป็นสีแบรนด์ได้จริง ไม่จืดและไม่สว่างจนหาย */
export function randomSeedHex() {
  const h = Math.floor(Math.random() * 360);
  const s = 55 + Math.floor(Math.random() * 35);
  const l = 38 + Math.floor(Math.random() * 22);
  return hslToHex({ h, s, l });
}

export { shift };
