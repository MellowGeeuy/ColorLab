/**
 * google-fonts.js — รายการฟอนต์ที่คัดไว้ และตัวโหลดจาก Google Fonts แบบสด
 *
 * ทำไมต้องคัดรายการเอง: Google Fonts API ที่ดึงรายชื่อทั้งหมดต้องใช้ API key
 * ซึ่งเอาไปฝังในเว็บ static ไม่ได้ (ใครก็อ่านได้) จึงคัดตัวที่ใช้งานจริงในงาน UI มาไว้
 * แล้วเปิดช่องให้พิมพ์ชื่อฟอนต์อื่นเองได้ — ครอบคลุมทั้งคนที่อยากเลือกเร็วและคนที่มีฟอนต์ในใจแล้ว
 *
 * ฟอนต์ไทยอยู่ต้นรายการเสมอ เพราะงานส่วนใหญ่ที่เว็บนี้รองรับเป็นงานภาษาไทย
 * และการเลือกฟอนต์ไทยยากกว่า — ฟอนต์ละตินสวย ๆ ที่ไม่มีวรรณยุกต์ใช้กับงานไทยไม่ได้
 */

/**
 * weights = น้ำหนักที่ฟอนต์นั้นมีจริง ไม่ใช่ที่อยากให้มี
 * ถ้าขอน้ำหนักที่ฟอนต์ไม่มี เบราว์เซอร์จะสังเคราะห์ให้ (faux bold) ซึ่งรูปทรงเพี้ยน
 * การจำกัดตัวเลือกไว้เท่าที่มีจริงจึงเป็นส่วนหนึ่งของความถูกต้อง ไม่ใช่แค่ความสะดวก
 */
export const FONTS = [
  // ---- ไทย ----
  { name: 'IBM Plex Sans Thai', cat: 'sans',    thai: true,  weights: [100, 200, 300, 400, 500, 600, 700] },
  { name: 'Noto Sans Thai',     cat: 'sans',    thai: true,  weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Sarabun',            cat: 'sans',    thai: true,  weights: [100, 200, 300, 400, 500, 600, 700, 800] },
  { name: 'Prompt',             cat: 'sans',    thai: true,  weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Kanit',              cat: 'sans',    thai: true,  weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Anuphan',            cat: 'sans',    thai: true,  weights: [100, 200, 300, 400, 500, 600, 700] },
  { name: 'Bai Jamjuree',       cat: 'sans',    thai: true,  weights: [200, 300, 400, 500, 600, 700] },
  { name: 'Chakra Petch',       cat: 'sans',    thai: true,  weights: [300, 400, 500, 600, 700] },
  { name: 'K2D',                cat: 'sans',    thai: true,  weights: [100, 200, 300, 400, 500, 600, 700, 800] },
  { name: 'Athiti',             cat: 'sans',    thai: true,  weights: [200, 300, 400, 500, 600, 700] },
  { name: 'Mitr',               cat: 'sans',    thai: true,  weights: [200, 300, 400, 500, 600, 700] },
  { name: 'Noto Serif Thai',    cat: 'serif',   thai: true,  weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Taviraj',            cat: 'serif',   thai: true,  weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },

  // ---- ละติน: sans ----
  { name: 'Inter',              cat: 'sans',    thai: false, weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Roboto',             cat: 'sans',    thai: false, weights: [100, 300, 400, 500, 700, 900] },
  { name: 'Open Sans',          cat: 'sans',    thai: false, weights: [300, 400, 500, 600, 700, 800] },
  { name: 'Lato',               cat: 'sans',    thai: false, weights: [100, 300, 400, 700, 900] },
  { name: 'Montserrat',         cat: 'sans',    thai: false, weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Poppins',            cat: 'sans',    thai: false, weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Work Sans',          cat: 'sans',    thai: false, weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'DM Sans',            cat: 'sans',    thai: false, weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Manrope',            cat: 'sans',    thai: false, weights: [200, 300, 400, 500, 600, 700, 800] },
  { name: 'Space Grotesk',      cat: 'sans',    thai: false, weights: [300, 400, 500, 600, 700] },

  // ---- ละติน: serif / mono ----
  { name: 'Playfair Display',   cat: 'serif',   thai: false, weights: [400, 500, 600, 700, 800, 900] },
  { name: 'Merriweather',       cat: 'serif',   thai: false, weights: [300, 400, 700, 900] },
  { name: 'Lora',               cat: 'serif',   thai: false, weights: [400, 500, 600, 700] },
  { name: 'JetBrains Mono',     cat: 'mono',    thai: false, weights: [100, 200, 300, 400, 500, 600, 700, 800] },
  { name: 'IBM Plex Mono',      cat: 'mono',    thai: false, weights: [100, 200, 300, 400, 500, 600, 700] },
];

export const CATEGORY_LABELS = {
  sans: 'ไม่มีเชิง (sans)',
  serif: 'มีเชิง (serif)',
  mono: 'ความกว้างเท่ากัน (mono)',
};

/** ฟอนต์สำรองต่อท้ายเสมอ — เน็ตหลุดหรือชื่อผิด หน้ายังอ่านออก ไม่กลายเป็นฟอนต์ default ที่คาดเดาไม่ได้ */
const FALLBACK = {
  sans: '"Noto Sans Thai", system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", Consolas, monospace',
};

export function findFont(name) {
  const key = String(name).trim().toLowerCase();
  return FONTS.find((font) => font.name.toLowerCase() === key) ?? null;
}

export function fontStack(name, cat = 'sans') {
  return `"${String(name).replace(/"/g, '')}", ${FALLBACK[cat] ?? FALLBACK.sans}`;
}

/** ชื่อฟอนต์ -> ส่วน family ของ URL: ช่องว่างเป็น + ตามรูปแบบของ Google Fonts */
const toFamilyParam = (name) => name.trim().replace(/\s+/g, '+');

const loaded = new Map();

/**
 * โหลดฟอนต์จาก Google Fonts แล้วรอจนใช้งานได้จริง
 *
 * ใช้ <link> ไม่ใช่ FontFace API เพราะ Google ส่ง CSS ที่มี @font-face หลายชุด
 * (latin, latin-ext, thai) พร้อม unicode-range เบราว์เซอร์จะโหลดเฉพาะช่วงที่หน้านี้ใช้จริง
 * ถ้าไปดึงไฟล์เองจะเสียกลไกนั้นไปและโหลดเกินความจำเป็น
 *
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
export function loadFont(name, weights = [400, 700]) {
  const family = String(name).trim();
  if (!family) return Promise.resolve({ ok: false, reason: 'ยังไม่ได้ระบุชื่อฟอนต์' });

  const list = [...new Set(weights)].sort((a, b) => a - b);
  const key = `${family}|${list.join(',')}`;
  if (loaded.has(key)) return loaded.get(key);

  const href = `https://fonts.googleapis.com/css2?family=${toFamilyParam(family)}:wght@${list.join(';')}&display=swap`;

  const job = new Promise((resolve) => {
    /* ชื่อฟอนต์ที่ไม่มีอยู่จริงทำให้ Google ตอบ 400 แล้ว <link> ยิง error
       จับไว้เพื่อบอกผู้ใช้ตรง ๆ ดีกว่าปล่อยให้เห็นฟอนต์ไม่เปลี่ยนแล้วงงว่าพิมพ์ผิดตรงไหน */
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.fontFamily = family;

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    link.addEventListener('error', () => {
      link.remove();
      finish({ ok: false, reason: 'โหลดไม่สำเร็จ — ตรวจชื่อฟอนต์หรือการเชื่อมต่อ' });
    });

    link.addEventListener('load', async () => {
      try {
        /* <link> โหลดเสร็จแปลว่าได้ CSS มาแล้ว แต่ไฟล์ฟอนต์จริงยังอาจไม่มา
           ต้องรอ document.fonts ถึงจะวัดขนาดตัวอักษรได้ถูก */
        await Promise.all(list.map((w) => document.fonts.load(`${w} 16px "${family}"`)));
        finish({ ok: document.fonts.check(`400 16px "${family}"`), reason: 'ฟอนต์ไม่มีน้ำหนักที่ขอ' });
      } catch {
        finish({ ok: false, reason: 'โหลดไฟล์ฟอนต์ไม่สำเร็จ' });
      }
    });

    /* กันค้าง: เน็ตช้ามากหรือถูกบล็อก ไม่ควรให้ UI รอตลอดไป */
    setTimeout(() => finish({ ok: false, reason: 'หมดเวลารอ — อาจไม่ได้ต่อเน็ต' }), 8000);

    document.head.appendChild(link);
  });

  loaded.set(key, job);
  return job;
}
