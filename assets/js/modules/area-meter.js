/**
 * area-meter.js — วัดสัดส่วนพื้นที่จริงของหน้าจอตัวอย่างในตอนที่ 10
 *
 * กฎ 60/30/10 ถูกพูดถึงบ่อยจนกลายเป็นคาถา แต่แทบไม่มีที่ไหนวัดให้ดู
 * ไฟล์นี้วัดจริงจากขนาดที่เบราว์เซอร์วางจริง (getBoundingClientRect) ไม่ใช่ตัวเลข
 * ที่เขียนกำกับไว้ — ย่อหน้าจอหรือเปลี่ยนโหมด ตัวเลขก็ขยับตามของจริงทุกครั้ง
 *
 * แอตทริบิวต์ data-area เป็นแหล่งความจริงแหล่งเดียวของทั้งสีและการวัด
 * CSS ทาสีตามค่าของมัน ส่วน JS ก็นับตามค่าเดียวกัน — จึงไม่มีทางที่ภาพกับตัวเลข
 * จะเล่าคนละเรื่อง แม้จะสลับโหมดไปมากี่รอบก็ตาม
 */

const ROLES = [
  { key: 'brand', label: 'สีแบรนด์' },
  { key: 'surface', label: 'พื้นผิวรอง' },
  { key: 'text', label: 'ตัวหนังสือและไอคอน' },
];

export function initAreaMeter() {
  const root = document.querySelector('[data-area-meter]');
  if (!root) return;

  const frame = root.querySelector('[data-area-frame]');
  const bar = root.querySelector('[data-area-bar]');
  const legend = root.querySelector('[data-area-legend]');
  const verdict = root.querySelector('[data-area-verdict]');
  const toggle = root.querySelector('[data-area-loud]');
  if (!frame) return;

  /* พื้นที่สุทธิ = พื้นที่ตัวเอง ลบพื้นที่ของลูกที่นับเป็นบทบาทด้วยกัน
     ถ้าไม่ลบ การ์ดหนึ่งใบที่มีตัวอักษรอยู่ข้างในจะถูกนับสองรอบ แล้วผลรวมจะเกิน 100% */
  const netArea = (el) => {
    const own = el.getBoundingClientRect();
    const inner = [...el.querySelectorAll('[data-area]')]
      .reduce((sum, child) => {
        const r = child.getBoundingClientRect();
        return sum + r.width * r.height;
      }, 0);
    return Math.max(0, own.width * own.height - inner);
  };

  const measure = () => {
    const box = frame.getBoundingClientRect();
    const total = box.width * box.height;
    if (total === 0) return null;

    const used = {};
    ROLES.forEach(({ key }) => { used[key] = 0; });

    frame.querySelectorAll('[data-area]').forEach((el) => {
      const role = el.dataset.area;
      if (role in used) used[role] += netArea(el);
    });

    const share = {};
    ROLES.forEach(({ key }) => { share[key] = (used[key] / total) * 100; });
    share.bg = Math.max(0, 100 - ROLES.reduce((sum, { key }) => sum + share[key], 0));
    return share;
  };

  const render = () => {
    const share = measure();
    if (!share) return;

    const rows = [{ key: 'bg', label: 'พื้นหลังเปล่า' }, ...ROLES];

    if (bar) {
      bar.replaceChildren(...rows.map(({ key }) => {
        const seg = document.createElement('span');
        seg.className = 'area-meter__seg';
        seg.dataset.area = key;
        seg.style.flexGrow = String(share[key]);
        return seg;
      }));
    }

    if (legend) {
      legend.replaceChildren(...rows.map(({ key, label }) => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="area-meter__dot" data-area="${key}"></i>${label}
          <b class="u-num">${share[key].toFixed(1)}%</b>`;
        return li;
      }));
    }

    if (verdict) {
      const brand = share.brand;
      /* เกณฑ์สองตัวนี้มาจากกฎ 60/30/10 ตรง ๆ — 10% คือค่าที่กฎแนะนำ
         เผื่อขึ้นไปถึง 14% ให้เป็น "ยังอยู่ในช่วง" เพราะปุ่มจริงมีขนาดขั้นต่ำของมัน */
      const state = brand <= 14 ? 'pass' : brand <= 25 ? 'neutral' : 'fail';
      verdict.textContent = {
        pass: `สีแบรนด์ ${brand.toFixed(1)}% อยู่ในช่วงที่กฎ 60/30/10 แนะนำ สายตาวิ่งไปที่ปุ่มได้ทันที`,
        neutral: `สีแบรนด์ ${brand.toFixed(1)}% เริ่มเยอะไปแล้ว ต้องเพ่งหาว่าชิ้นไหนคือขั้นตอนถัดไป`,
        fail: `สีแบรนด์ ${brand.toFixed(1)}% ทุกชิ้นแย่งกันเด่น เลยไม่มีชิ้นไหนเด่นจริง`,
      }[state];
      verdict.className = `badge area-meter__verdict badge--${state}`;
    }
  };

  toggle?.addEventListener('change', () => {
    /* สลับบทบาทของชิ้นที่ "ใส่สีแบรนด์ได้แต่ไม่จำเป็น" — แก้ที่ data-area ที่เดียว
       สีที่เห็นกับตัวเลขที่วัดจึงเปลี่ยนพร้อมกันเสมอ */
    frame.querySelectorAll('[data-area-optional]').forEach((el) => {
      el.dataset.area = toggle.checked ? 'brand' : el.dataset.areaOptional;
    });
    render();
  });

  /* วัดใหม่เมื่อกล่องเปลี่ยนขนาด — สัดส่วนบนจอแคบไม่เท่าจอกว้างอยู่แล้ว
     ถ้าวัดครั้งเดียวตอนโหลด ตัวเลขจะกลายเป็นของปลอมทันทีที่ผู้ใช้หมุนจอ */
  if ('ResizeObserver' in window) new ResizeObserver(render).observe(frame);
  render();
}
