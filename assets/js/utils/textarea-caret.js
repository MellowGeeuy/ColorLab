/**
 * textarea-caret.js — หาพิกัดของเคอร์เซอร์ใน textarea
 *
 * textarea ไม่มี API บอกตำแหน่งเคอร์เซอร์ จึงต้องสร้าง div เงาที่มีสไตล์เหมือนกันทุกอย่าง
 * ใส่ข้อความถึงตำแหน่งเคอร์เซอร์ แล้ววัดว่าตัวอักษรถัดไปจะไปอยู่ตรงไหน
 */

const MIRROR_PROPS = [
  'boxSizing', 'width', 'height',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing',
  'lineHeight', 'textTransform', 'textIndent', 'tabSize',
  'whiteSpace', 'overflowWrap', 'wordBreak',
];

/**
 * @returns {{top:number, left:number, height:number}} พิกัดเทียบกับมุมบนซ้ายของ textarea (หักการเลื่อนแล้ว)
 */
export function getCaretCoordinates(textarea, position) {
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement('div');

  MIRROR_PROPS.forEach((prop) => { mirror.style[prop] = style[prop]; });
  mirror.style.position = 'absolute';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';
  mirror.style.visibility = 'hidden';
  mirror.style.overflow = 'hidden';

  mirror.textContent = textarea.value.slice(0, position);

  const marker = document.createElement('span');
  // ต้องมีเนื้อหาอย่างน้อยหนึ่งตัว ไม่งั้น span จะไม่มีขนาดให้วัด
  marker.textContent = textarea.value.slice(position) || '.';
  mirror.appendChild(marker);

  document.body.appendChild(mirror);
  const top = marker.offsetTop;
  const left = marker.offsetLeft;
  const height = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
  document.body.removeChild(mirror);

  return {
    top: top - textarea.scrollTop,
    left: left - textarea.scrollLeft,
    height,
  };
}
