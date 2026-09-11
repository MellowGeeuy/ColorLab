/**
 * confirm-dialog.js — หน้าต่างยืนยันของเว็บเอง ใช้แทน confirm() ของเบราว์เซอร์ทุกกรณี
 *
 * ของเบราว์เซอร์หน้าตาไม่เหมือนระบบที่เหลือ บังคับสีและภาษาปุ่มไม่ได้ และบล็อกทั้งหน้าไว้
 * ตัวนี้ใช้ token เดียวกับทั้งเว็บ คืนค่าเป็น Promise จึงเขียนต่อแบบ await ได้เหมือนกัน
 */

let dialog = null;

function build() {
  const root = document.createElement('div');
  root.className = 'ask';
  root.hidden = true;
  root.innerHTML = `
    <div class="ask__scrim" data-ask-cancel></div>
    <div class="ask__panel" role="alertdialog" aria-modal="true"
         aria-labelledby="ask-title" aria-describedby="ask-text">
      <span class="ask__mark" id="ask-mark" aria-hidden="true">
        <svg class="icon"><use href="#i-alert-triangle"/></svg>
      </span>
      <h2 class="ask__title" id="ask-title"></h2>
      <p class="ask__text" id="ask-text"></p>
      <div class="ask__foot">
        <button type="button" class="btn btn--sm" data-ask-cancel></button>
        <button type="button" class="btn btn--sm" id="ask-ok"></button>
      </div>
    </div>
  `;

  document.body.appendChild(root);
  return root;
}

/**
 * ถามยืนยันก่อนทำสิ่งที่ย้อนกลับไม่ได้
 * @param {object} options
 * @param {string} options.title หัวเรื่องสั้น ๆ บอกว่ากำลังจะทำอะไร
 * @param {string} options.text ผลที่จะเกิดขึ้นจริงถ้ากดยืนยัน
 * @param {string} [options.confirmLabel] คำบนปุ่มยืนยัน — ใช้คำกริยาของงานนั้น ไม่ใช่ "ตกลง"
 * @param {string} [options.cancelLabel]
 * @param {'danger'|'primary'} [options.tone] danger สำหรับสิ่งที่เอากลับคืนไม่ได้
 * @returns {Promise<boolean>}
 */
export function askConfirm({
  title, text, confirmLabel = 'ยืนยัน', cancelLabel = 'ยกเลิก', tone = 'danger',
}) {
  if (!dialog) dialog = build();

  const okBtn = dialog.querySelector('#ask-ok');
  const cancelBtn = dialog.querySelector('[data-ask-cancel].btn');
  const lastFocused = document.activeElement;

  dialog.querySelector('#ask-title').textContent = title;
  dialog.querySelector('#ask-text').textContent = text;
  okBtn.textContent = confirmLabel;
  cancelBtn.textContent = cancelLabel;

  okBtn.className = tone === 'danger' ? 'btn btn--sm btn--danger' : 'btn btn--sm btn--primary';
  dialog.querySelector('#ask-mark').className = tone === 'danger' ? 'ask__mark ask__mark--danger' : 'ask__mark';

  dialog.hidden = false;
  document.body.style.overflow = 'hidden';
  // โฟกัสปุ่มยกเลิกก่อนเสมอ — Enter ที่เผลอกดค้างมาจากหน้าก่อนต้องไม่กลายเป็นการลบ
  cancelBtn.focus();

  return new Promise((resolve) => {
    const done = (answer) => {
      dialog.hidden = true;
      document.body.style.overflow = '';
      dialog.removeEventListener('click', onClick);
      dialog.removeEventListener('keydown', onKeydown);
      if (lastFocused instanceof HTMLElement) lastFocused.focus();
      resolve(answer);
    };

    const onClick = (event) => {
      if (event.target.closest('[data-ask-cancel]')) done(false);
      else if (event.target.closest('#ask-ok')) done(true);
    };

    const onKeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        done(false);
        return;
      }

      // ขังโฟกัสไว้สองปุ่มนี้ ระหว่างยังไม่ตอบต้องไปกดอย่างอื่นไม่ได้
      if (event.key !== 'Tab') return;
      event.preventDefault();
      (document.activeElement === cancelBtn ? okBtn : cancelBtn).focus();
    };

    dialog.addEventListener('click', onClick);
    dialog.addEventListener('keydown', onKeydown);
  });
}
