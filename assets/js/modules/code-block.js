/**
 * code-block.js — กล่องโค้ดที่มีแท็บและปุ่มคัดลอก ใช้ซ้ำได้กับทุก component
 *
 * ไม่รู้จักเรื่อง palette หรือ component ใด ๆ รับแค่รายการแท็บที่บอกวิธีเอาข้อความมา
 * ทำให้ย้ายไปใช้หน้าอื่นได้โดยไม่ต้องแก้
 */

const COPY_RESET_MS = 1800;

function icon(id) {
  return `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
}

/**
 * @param {{id:string,label:string,getText:()=>string}[]} tabs
 * @param {{copyAllLabel?:string, getCopyAllText?:()=>string}} options
 */
export function createCodeBlock(tabs, options = {}) {
  const root = document.createElement('div');
  root.className = 'cs-code';

  const tabId = (id) => `cs-code-tab-${id}-${Math.random().toString(36).slice(2, 7)}`;
  const ids = new Map(tabs.map((tab) => [tab.id, tabId(tab.id)]));

  root.innerHTML = `
    <div class="cs-code__head">
      <div class="cs-code__tabs" role="tablist" aria-label="รูปแบบโค้ด">
        ${tabs.map((tab, index) => `
          <button type="button" class="cs-code__tab${index === 0 ? ' is-active' : ''}"
                  role="tab" id="${ids.get(tab.id)}" data-tab="${tab.id}"
                  aria-selected="${index === 0}" tabindex="${index === 0 ? '0' : '-1'}">
            ${tab.label}
          </button>`).join('')}
      </div>
      <div class="cs-code__actions">
        ${options.getCopyAllText ? `
          <button type="button" class="cs-code__copy" data-copy="all">
            ${icon('i-copy')}<span>${options.copyAllLabel ?? 'คัดลอกทั้งหมด'}</span>
          </button>` : ''}
        <button type="button" class="cs-code__copy cs-code__copy--primary" data-copy="tab">
          ${icon('i-copy')}<span>คัดลอก</span>
        </button>
      </div>
    </div>
    <pre class="cs-code__body" tabindex="0" role="tabpanel"><code></code></pre>
    <p class="cs-code__status" role="status" aria-live="polite"></p>
  `;

  const codeEl = root.querySelector('code');
  const preEl = root.querySelector('.cs-code__body');
  const statusEl = root.querySelector('.cs-code__status');
  const tabEls = Array.from(root.querySelectorAll('.cs-code__tab'));

  let activeId = tabs[0]?.id ?? '';

  const activeTab = () => tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  const render = () => {
    const tab = activeTab();
    if (!tab) return;
    codeEl.textContent = tab.getText();
    preEl.setAttribute('aria-labelledby', ids.get(tab.id));
    tabEls.forEach((el) => {
      const selected = el.dataset.tab === activeId;
      el.classList.toggle('is-active', selected);
      el.setAttribute('aria-selected', String(selected));
      el.tabIndex = selected ? 0 : -1;
    });
  };

  const setStatus = (message) => {
    statusEl.textContent = message;
    window.setTimeout(() => {
      if (statusEl.textContent === message) statusEl.textContent = '';
    }, COPY_RESET_MS);
  };

  const copy = async (text, button) => {
    const label = button.querySelector('span');
    const original = label.textContent;
    try {
      await navigator.clipboard.writeText(text);
      label.textContent = 'คัดลอกแล้ว';
      button.classList.add('is-done');
      setStatus('คัดลอกโค้ดไปยังคลิปบอร์ดแล้ว');
    } catch {
      // เบราว์เซอร์บางตัวไม่ให้เขียนคลิปบอร์ดโดยตรง จึงเลือกข้อความไว้ให้กด Ctrl+C เอง
      const range = document.createRange();
      range.selectNodeContents(codeEl);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      setStatus('เบราว์เซอร์ไม่ให้คัดลอกอัตโนมัติ เลือกข้อความไว้ให้แล้ว กด Ctrl+C');
      return;
    }
    window.setTimeout(() => {
      label.textContent = original;
      button.classList.remove('is-done');
    }, COPY_RESET_MS);
  };

  root.addEventListener('click', (event) => {
    const tabButton = event.target.closest('.cs-code__tab');
    if (tabButton) {
      activeId = tabButton.dataset.tab;
      render();
      return;
    }

    const copyButton = event.target.closest('[data-copy]');
    if (!copyButton) return;
    const text = copyButton.dataset.copy === 'all'
      ? options.getCopyAllText()
      : activeTab().getText();
    copy(text, copyButton);
  });

  // ลูกศรซ้ายขวาเดินระหว่างแท็บตามรูปแบบ tablist ที่ผู้ใช้คีย์บอร์ดคาดหวัง
  root.addEventListener('keydown', (event) => {
    if (!event.target.classList.contains('cs-code__tab')) return;
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.id === activeId);
    activeId = tabs[(index + step + tabs.length) % tabs.length].id;
    render();
    root.querySelector('.cs-code__tab.is-active').focus();
  });

  render();

  return { element: root, refresh: render };
}
