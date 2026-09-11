/**
 * workshop-shell.js — ส่วนประกอบระดับหน้าของห้องแล็บ: แถบสีสรุปด้านบน
 * และการขยายพรีวิว UI ให้เต็มจอ
 */

import { ROLES } from '../utils/palette-tokens.js';

function initHeroStrip(store) {
  const strip = document.querySelector('#hero-strip');
  if (!strip) return;

  store.subscribe((palette) => {
    strip.replaceChildren();
    [...ROLES.map((role) => palette[role]), ...palette.accents].forEach((hex) => {
      const cell = document.createElement('div');
      cell.style.backgroundColor = hex;
      strip.appendChild(cell);
    });
  });
}

function initStageExpand() {
  const button = document.querySelector('#stage-expand');
  const section = document.querySelector('#components');
  if (!button || !section) return;

  const setExpanded = (expanded) => {
    section.classList.toggle('is-expanded', expanded);
    button.setAttribute('aria-pressed', String(expanded));
    button.setAttribute('aria-label', expanded ? 'ย่อพรีวิวกลับ' : 'ขยายพรีวิวเต็มจอ');
    button.lastChild.textContent = expanded ? ' ย่อกลับ' : ' ขยายเต็มจอ';
    document.body.classList.toggle('has-overlay', expanded);
  };

  button.addEventListener('click', () => {
    setExpanded(!section.classList.contains('is-expanded'));
    if (!section.classList.contains('is-expanded')) button.scrollIntoView({ block: 'center' });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && section.classList.contains('is-expanded')) setExpanded(false);
  });
}

export function initWorkshopShell(store) {
  initHeroStrip(store);
  initStageExpand();
}
