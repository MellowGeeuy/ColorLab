/**
 * palette-bar.js — แถบชุดสีที่ติดอยู่ใต้ top bar ตลอดทุกเครื่องมือ
 * เป็นทั้งตัวบอกว่างานปัจจุบันมีสีอะไรบ้าง และตัวเลือกว่าจะให้ inspector แก้สีไหน
 */

import { ROLES, ROLE_LABELS } from '../utils/palette-tokens.js';
import { readableTextOn } from '../utils/color-utils.js';

export function initPaletteBar(store, selection) {
  const host = document.querySelector('#palette-bar-swatches');
  if (!host) return;

  const render = (palette) => {
    const current = selection.get();
    host.replaceChildren();

    const addChip = (hex, kind, key, label) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'swatch-chip';
      button.style.backgroundColor = hex;
      button.style.color = readableTextOn(hex);
      button.setAttribute('aria-pressed', String(current.kind === kind && current.key === key));
      button.setAttribute('aria-label', `${label} ${hex} — เลือกเพื่อแก้ในแผงคุณสมบัติ`);
      button.title = `${label} · ${hex.toUpperCase()}`;
      button.addEventListener('click', () => selection.set({ kind, key }));

      const roleTag = document.createElement('span');
      roleTag.className = 'swatch-chip__role';
      roleTag.textContent = label;
      button.appendChild(roleTag);

      host.appendChild(button);
    };

    ROLES.forEach((role) => addChip(palette[role], 'role', role, ROLE_LABELS[role].split(' ')[0]));

    const divider = document.createElement('span');
    divider.className = 'palette-bar__divider';
    divider.setAttribute('aria-hidden', 'true');
    host.appendChild(divider);

    palette.accents.forEach((hex, index) => addChip(hex, 'accent', index, `A${index + 1}`));
  };

  store.subscribe(render);
  // เลือกสีใหม่แล้ววงไฮไลต์ต้องย้ายตาม โดยไม่ต้องรอให้ palette เปลี่ยน
  selection.subscribe(() => render(store.getPalette()));
}
