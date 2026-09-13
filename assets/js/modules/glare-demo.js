/**
 * glare-demo.js — จำลองหน้าจอกลางแดดในตอนที่ 01
 *
 * แสงจ้าไม่ได้ "ลบสี" ออกไป แต่ไปบีบช่วงความสว่างที่ตาแยกออกให้แคบลง
 * ของที่คอนทราสต์ต่ำอยู่แล้วจึงหายก่อน — ทำด้วย filter contrast() คู่กับ brightness()
 * ซึ่งให้อาการใกล้เคียงกับของจริงพอที่จะใช้สอนได้ โดยไม่ต้องจำลองเชิงฟิสิกส์
 *
 * ค่าที่ใช้: ความจ้า 100% ลดคอนทราสต์ลงเหลือ 45% และยกความสว่างขึ้น 35%
 * ซึ่งเป็นช่วงที่ของที่อยู่ราว 3:1 เริ่มหายไป แต่ของที่ผ่าน 4.5:1 ยังอ่านได้
 */

const NOTES = [
  { at: 0, text: 'ในร่ม — ทุกอย่างอ่านออกตามที่ออกแบบไว้' },
  { at: 30, text: 'ใกล้หน้าต่าง — ข้อความสีเทาอ่อนเริ่มจาง' },
  { at: 60, text: 'กลางแจ้งมีเมฆ — ลิงก์กับปุ่มแบบเส้นขอบเริ่มหาไม่เจอ' },
  { at: 85, text: 'กลางแดดจัด — เหลือแค่ปุ่มพื้นทึบที่ยังทำหน้าที่ได้' },
];

export function initGlareDemo() {
  const root = document.querySelector('[data-glare]');
  if (!root) return;

  const range = root.querySelector('[data-glare-range]');
  const screen = root.querySelector('[data-glare-screen]');
  const note = root.querySelector('[data-glare-note]');
  if (!range || !screen) return;

  const render = () => {
    const level = Number(range.value) / 100;

    /* ตั้งเป็น custom property แทนการเขียน filter ลงไปตรง ๆ
       เผื่อผู้ใช้ที่ขอลดการเคลื่อนไหว จะได้ปิดทรานซิชันจาก CSS ได้ที่เดียว */
    screen.style.setProperty('--glare-contrast', (1 - level * 0.55).toFixed(3));
    screen.style.setProperty('--glare-bright', (1 + level * 0.35).toFixed(3));

    if (note) {
      const step = [...NOTES].reverse().find((n) => Number(range.value) >= n.at);
      note.textContent = step ? step.text : NOTES[0].text;
    }
  };

  range.addEventListener('input', render);
  render();
}
