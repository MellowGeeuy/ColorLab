/**
 * reveal-on-view.js — สั่งให้ภาพประกอบเริ่มเล่นตอนเลื่อนมาถึงเท่านั้น
 *
 * ถ้าปล่อยให้อนิเมชันทุกตัวเล่นพร้อมกันตั้งแต่โหลด ผู้อ่านจะพลาดของที่อยู่ล่างหน้าไปหมด
 * และเบราว์เซอร์ต้องวาดทุกอย่างพร้อมกันโดยเปล่าประโยชน์
 */

const IN_VIEW = 'is-in-view';

export function initRevealOnView(selector = '[data-reveal]') {
  const targets = [...document.querySelectorAll(selector)];
  if (!targets.length) return;

  // ไม่รองรับ IntersectionObserver ก็ให้เห็นภาพนิ่งที่สมบูรณ์ไปเลย ดีกว่าไม่เห็นอะไร
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add(IN_VIEW));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add(IN_VIEW);
      observer.unobserve(entry.target);
    });
    // เกณฑ์ต่ำเพราะภาพประกอบบางอันสูงเกือบเต็มจอ ถ้าตั้งไว้สูงกว่านี้
    // ภาพจะเริ่มเล่นก็ต่อเมื่อผู้อ่านเลื่อนเลยส่วนบนของภาพไปแล้ว
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(el => observer.observe(el));
}
