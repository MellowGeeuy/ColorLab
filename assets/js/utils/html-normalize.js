/**
 * html-normalize.js — ช่วยแก้ inline style ที่เขียนแบบสั้นเกินไปให้เบราว์เซอร์เข้าใจ (pure)
 *
 * `style="#feeeee"` ไม่ใช่ CSS ที่ถูกต้อง เพราะไม่ได้บอกว่าสีนั้นใช้กับอะไร
 * ในสนามทดลองเราเดาให้ว่าหมายถึงสีตัวอักษร แล้วรายงานกลับไปให้ผู้เขียนรู้ว่าแก้อะไรไป
 */

const NAMED_COLORS = new Set([
  'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink',
  'gray', 'grey', 'brown', 'cyan', 'magenta', 'lime', 'navy', 'teal', 'olive',
  'maroon', 'silver', 'gold', 'beige', 'ivory', 'coral', 'salmon', 'khaki',
  'indigo', 'violet', 'turquoise', 'tan', 'crimson', 'transparent',
]);

const COLOR_PATTERN = /^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|var\(\s*--[^)]*\))$/i;

/** ค่าที่ให้มาเป็น "สี" ล้วน ๆ หรือเปล่า */
export function isColorValue(value) {
  const trimmed = value.trim();
  return COLOR_PATTERN.test(trimmed) || NAMED_COLORS.has(trimmed.toLowerCase());
}

/**
 * เติมชื่อ property ให้ inline style ที่ใส่มาแต่ค่าสี
 * @returns {{html: string, fixes: string[]}} fixes คือค่าที่ถูกเติมให้ (ไว้แจ้งผู้ใช้)
 */
export function normalizeInlineStyles(html) {
  const fixes = [];

  const fixed = html.replace(/style\s*=\s*"([^"]*)"/gi, (match, body) => {
    // มี : แล้วแปลว่าเขียนถูกอยู่แล้ว ไม่ต้องยุ่ง
    if (body.includes(':') || !isColorValue(body)) return match;

    const value = body.trim();
    fixes.push(value);
    return `style="color: ${value}"`;
  });

  return { html: fixed, fixes };
}
