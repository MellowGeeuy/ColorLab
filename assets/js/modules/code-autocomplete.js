/**
 * code-autocomplete.js — กล่องเติมคำอัตโนมัติสำหรับ textarea ที่ใช้เขียนโค้ด
 *
 * พิมพ์อย่างน้อย 1 ตัวอักษรแล้วรายการจะขึ้นใต้เคอร์เซอร์
 * ↑ ↓ เลือก · Enter หรือ Tab ยืนยัน · Esc ปิด
 */

import { getCaretCoordinates } from '../utils/textarea-caret.js';
import { readContext, getCompletions, applyCompletion } from '../utils/code-completions.js';

const KIND_LABELS = {
  prop: 'CSS',
  value: 'ค่า',
  token: 'token',
  tag: 'แท็ก',
  attr: 'attr',
  color: 'สี',
  snippet: 'ตัวอย่าง',
};

const MIN_QUERY = 1;

function buildPopup() {
  const popup = document.createElement('div');
  popup.className = 'ac';
  popup.setAttribute('role', 'listbox');
  popup.hidden = true;
  return popup;
}

/**
 * @param {HTMLTextAreaElement} textarea
 * @param {{language: 'css'|'html', onAccept?: Function, getTokenValue?: (name:string)=>string}} options
 */
export function initCodeAutocomplete(textarea, options) {
  const { language, onAccept, getTokenValue, getPaletteColors } = options;
  const host = textarea.parentElement;
  if (!host) return { isOpen: () => false };

  const popup = buildPopup();
  host.appendChild(popup);

  let items = [];
  let activeIndex = 0;
  let context = null;

  const isOpen = () => !popup.hidden;

  const close = () => {
    popup.hidden = true;
    popup.replaceChildren();
    items = [];
    textarea.removeAttribute('aria-activedescendant');
  };

  const paint = () => {
    Array.from(popup.children).forEach((node, index) => {
      const active = index === activeIndex;
      node.classList.toggle('is-active', active);
      if (active) {
        // เลื่อนแค่ popup เอง — scrollIntoView() ไหลขึ้นไปเลื่อน .code-panel (overflow: hidden)
        // ที่ครอบอยู่ด้วย ทำให้หน้าจอ/เนื้อหาข้างนอกขยับตามผิดที่
        if (node.offsetTop < popup.scrollTop) {
          popup.scrollTop = node.offsetTop;
        } else if (node.offsetTop + node.offsetHeight > popup.scrollTop + popup.clientHeight) {
          popup.scrollTop = node.offsetTop + node.offsetHeight - popup.clientHeight;
        }
        textarea.setAttribute('aria-activedescendant', node.id);
      }
    });
  };

  const accept = (index = activeIndex) => {
    const item = items[index];
    if (!item) return;

    const result = applyCompletion(textarea.value, textarea.selectionStart, context, item);
    textarea.value = result.value;
    textarea.setSelectionRange(result.caret, result.caret);
    textarea.focus();

    close();
    onAccept?.();
  };

  const render = () => {
    popup.replaceChildren();

    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'ac__item';
      row.id = `ac-${language}-${index}`;
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', 'false');

      const kind = document.createElement('span');
      kind.className = `ac__kind ac__kind--${item.kind}`;
      kind.textContent = KIND_LABELS[item.kind] ?? item.kind;

      const label = document.createElement('span');
      label.className = 'ac__label';
      label.textContent = item.label;

      const detail = document.createElement('span');
      detail.className = 'ac__detail';
      detail.textContent = item.detail ?? '';

      row.append(kind, label);

      // token และรหัสสีแสดงสีจริงที่กำลังใช้อยู่ เพื่อเลือกได้โดยไม่ต้องเดา
      const swatch = item.kind === 'color' ? item.color : (item.kind === 'token' && getTokenValue?.(item.label));
      if (swatch) {
        const dot = document.createElement('span');
        dot.className = 'ac__dot';
        dot.style.backgroundColor = swatch;
        row.appendChild(dot);
      }

      row.appendChild(detail);

      row.addEventListener('mousedown', (event) => {
        event.preventDefault(); // กันไม่ให้ textarea เสียโฟกัสก่อนแทรกคำ
        accept(index);
      });
      row.addEventListener('mouseenter', () => { activeIndex = index; paint(); });

      popup.appendChild(row);
    });

    const coords = getCaretCoordinates(textarea, textarea.selectionStart);
    popup.style.insetBlockStart = `${textarea.offsetTop + coords.top + coords.height + 4}px`;
    popup.style.insetInlineStart = `${textarea.offsetLeft + coords.left}px`;
    popup.hidden = false;

    activeIndex = 0;
    paint();
  };

  /** @param {boolean} force เรียกเอง (Ctrl+Space) — แสดงรายการแม้ยังไม่ได้พิมพ์คำค้น */
  const refresh = (force = false) => {
    context = readContext(textarea.value, textarea.selectionStart, language);
    const query = context.word.replace(/^</, '');

    if (!force && query.length < MIN_QUERY) {
      close();
      return;
    }

    items = getCompletions(context, { colors: getPaletteColors?.() ?? [] });

    // ไม่เสนอ token ที่ palette ปัจจุบันยังไม่มีค่า (เช่น accent ที่ยังไม่ได้เพิ่ม) เพราะใช้แล้วจะไม่ติด
    if (getTokenValue) {
      items = items.filter((item) => item.kind !== 'token' || getTokenValue(item.label));
    }

    if (items.length === 0) {
      close();
      return;
    }

    render();
  };

  textarea.addEventListener('input', refresh);
  textarea.addEventListener('blur', close);
  textarea.addEventListener('click', close);

  textarea.addEventListener('keydown', (event) => {
    if (!isOpen()) {
      // Ctrl+Space เรียกรายการขึ้นมาเองได้ แม้จะยังไม่ได้พิมพ์เพิ่ม
      if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        refresh(true);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
        paint();
        break;
      case 'ArrowUp':
        event.preventDefault();
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        paint();
        break;
      case 'Enter':
      case 'Tab':
        event.preventDefault();
        accept();
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      default:
        break;
    }
  });

  return { isOpen, close };
}
