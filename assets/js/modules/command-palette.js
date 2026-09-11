/**
 * command-palette.js — ค้นหาและกระโดดไปเครื่องมือหรือคำสั่งด้วย Ctrl/Cmd + K
 * มีไว้เพื่อไม่ต้องยัดทุกอย่างลง rail และเป็นที่รวมคำสั่งที่ไม่มีที่อยู่บนหน้าจอ
 */

export function initCommandPalette(commands) {
  const root = document.querySelector('#cmdk');
  const input = document.querySelector('#cmdk-input');
  const list = document.querySelector('#cmdk-list');
  const empty = document.querySelector('#cmdk-empty');
  const opener = document.querySelector('#cmdk-open');
  if (!root || !input || !list) return;

  let active = 0;
  let visible = commands;
  let lastFocused = null;

  const render = () => {
    list.replaceChildren();

    visible.forEach((command, index) => {
      const item = document.createElement('li');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = index === active ? 'cmdk__item is-active' : 'cmdk__item';

      const icon = document.createElement('span');
      icon.className = 'cmdk__item-icon';
      icon.innerHTML = `<svg class="icon" aria-hidden="true"><use href="${command.icon}"/></svg>`;

      const label = document.createElement('span');
      label.textContent = command.label;

      const hint = document.createElement('span');
      hint.className = 'cmdk__item-hint';
      hint.textContent = command.hint ?? '';

      button.append(icon, label, hint);
      button.addEventListener('click', () => { command.run(); close(); });
      // ใช้ mousemove ไม่ใช่ mouseenter เพื่อไม่ให้เคอร์เซอร์ที่ค้างอยู่เฉย ๆ
      // แย่งไฮไลต์จากที่ผู้ใช้เพิ่งเลื่อนด้วยลูกศร
      button.addEventListener('mousemove', () => {
        if (active === index) return;
        active = index;
        render();
      });

      item.appendChild(button);
      list.appendChild(item);
    });

    if (empty) empty.hidden = visible.length > 0;
  };

  const filter = (query) => {
    const q = query.trim().toLowerCase();
    visible = q
      ? commands.filter((c) => `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(q))
      : commands;
    active = 0;
    render();
  };

  function open() {
    lastFocused = document.activeElement;
    root.hidden = false;
    input.value = '';
    filter('');
    input.focus();
  }

  function close() {
    root.hidden = true;
    // คืนโฟกัสให้ที่เดิม ไม่งั้นคนใช้คีย์บอร์ดจะหลุดไปต้นหน้า
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  }

  opener?.addEventListener('click', open);
  input.addEventListener('input', () => filter(input.value));

  root.addEventListener('click', (event) => {
    if (event.target === root) close();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (visible.length === 0) return;
      active = (active + (event.key === 'ArrowDown' ? 1 : -1) + visible.length) % visible.length;
      render();
      list.children[active]?.querySelector('button')?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      visible[active]?.run();
      close();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (root.hidden) open();
      else close();
    }
  });

  render();
}
