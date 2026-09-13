// @ts-check
/**
 * server.js — เซิร์ฟเวอร์ไฟล์ธรรมดาสำหรับรันเทสต์
 *
 * เดิมใช้ `python -m http.server` แต่พอคลังคอมโพเนนต์โตขึ้นเป็นสี่สิบกว่าชิ้น
 * การเปิดหน้าหนึ่งครั้งยิงคำขอหลายสิบครั้ง และเมื่อรันหลาย worker พร้อมกัน
 * คำขอบางอันตอบช้าจนเทสต์แดงแบบสุ่ม ทั้งที่ตัวเว็บไม่ได้มีอะไรผิด
 *
 * ตัวนี้เป็น static server ล้วน ไม่มี dependency นอก Node เอง
 * อ่านไฟล์จากรากโปรเจกต์ กัน path traversal และตอบ 404 เป็นข้อความสั้น ๆ
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 8765);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';

  // ห้ามออกนอกรากโปรเจกต์ แม้จะเขียน ../ มาในเส้นทาง
  const file = path.resolve(ROOT, `.${rel}`);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
      // เทสต์ต้องเห็นไฟล์ล่าสุดเสมอ ไม่งั้นแก้โค้ดแล้วเทสต์ยังวัดของเก่า
      'cache-control': 'no-store',
    }).end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`static server: http://127.0.0.1:${PORT}\n`);
});
