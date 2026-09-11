/**
 * inspector.js — แผงขวา: แสดงและแก้คุณสมบัติของสีที่เลือกอยู่ใน palette bar
 * ทุกแถวเป็น label ซ้ายกว้างคงที่ + ค่าชิดขวา เพื่อให้คอลัมน์ค่าตรงแนวกันทั้งแผง
 */

import {
  hexToHsl, hslToHex, hexToRgb, contrastRatio, readableTextOn, clamp,
} from '../utils/color-utils.js';
import { ROLE_LABELS, buildPaletteTokens } from '../utils/palette-tokens.js';

const CHANNELS = [
  { key: 'h', label: 'Hue', min: 0, max: 360, unit: '°' },
  { key: 's', label: 'Saturation', min: 0, max: 100, unit: '%' },
  { key: 'l', label: 'Lightness', min: 0, max: 100, unit: '%' },
];

function row(label, valueNode) {
  const wrap = document.createElement('div');
  wrap.className = 'prop';

  const name = document.createElement('span');
  name.className = 'prop__label';
  name.textContent = label;

  wrap.append(name, valueNode);
  return wrap;
}

function textValue(text) {
  const span = document.createElement('span');
  span.className = 'prop__value';
  span.textContent = text;
  return span;
}

function verdictBadge(ratio, min) {
  const badge = document.createElement('span');
  badge.className = `badge ${ratio >= min ? 'badge--pass' : 'badge--fail'} u-num`;
  badge.textContent = `${ratio.toFixed(2)}:1`;
  return badge;
}

export function initInspector(store, selection) {
  const body = document.querySelector('#inspector-body');
  const panel = document.querySelector('#inspector');
  const toggle = document.querySelector('#inspector-toggle');
  const closeBtn = document.querySelector('#inspector-close');
  if (!body) return;

  const setOpen = (open) => {
    panel?.classList.toggle('is-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
  };

  toggle?.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
  closeBtn?.addEventListener('click', () => setOpen(false));

  const render = () => {
    const palette = store.getPalette();
    const theme = store.getTheme();
    const current = selection.get();
    const hex = selection.resolve(palette);
    const hsl = hexToHsl(hex);
    const rgb = hexToRgb(hex);
    if (!hsl || !rgb) return;

    const label = current.kind === 'accent'
      ? `สี Accent ที่ ${Number(current.key) + 1}`
      : ROLE_LABELS[current.key] ?? current.key;

    const apply = (nextHsl) => {
      const nextHex = hslToHex({
        h: clamp(nextHsl.h, 0, 360),
        s: clamp(nextHsl.s, 0, 100),
        l: clamp(nextHsl.l, 0, 100),
      });
      if (current.kind === 'accent') store.setAccent(Number(current.key), nextHex);
      else store.setRole(current.key, nextHex);
    };

    body.replaceChildren();

    /* — สีที่เลือก — */
    const preview = document.createElement('div');
    preview.className = 'inspector__preview';
    preview.style.backgroundColor = hex;
    preview.style.color = readableTextOn(hex);
    preview.textContent = hex.toUpperCase();
    body.appendChild(preview);

    const idGroup = document.createElement('div');
    idGroup.className = 'inspector__group';
    const legend = document.createElement('span');
    legend.className = 'inspector__legend';
    legend.textContent = label;
    idGroup.appendChild(legend);

    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'prop__input';
    hexInput.value = hex.toUpperCase();
    hexInput.spellcheck = false;
    hexInput.setAttribute('aria-label', `รหัสสีของ ${label}`);
    hexInput.addEventListener('change', () => {
      const raw = hexInput.value.trim();
      const value = raw.startsWith('#') ? raw : `#${raw}`;
      const parsed = hexToHsl(value);
      if (parsed) apply(parsed);
      else hexInput.value = hex.toUpperCase();
    });
    idGroup.appendChild(row('HEX', hexInput));
    idGroup.appendChild(row('RGB', textValue(`${rgb.r}, ${rgb.g}, ${rgb.b}`)));
    body.appendChild(idGroup);

    /* — ปรับ H / S / L — */
    const hslGroup = document.createElement('div');
    hslGroup.className = 'inspector__group';
    const hslLegend = document.createElement('span');
    hslLegend.className = 'inspector__legend';
    hslLegend.textContent = 'ปรับค่าสี';
    hslGroup.appendChild(hslLegend);

    CHANNELS.forEach(({ key, label: name, min, max, unit }) => {
      const line = document.createElement('div');
      line.className = 'prop prop--slider';

      const tag = document.createElement('label');
      tag.className = 'prop__label';
      tag.textContent = name;
      tag.setAttribute('for', `insp-${key}`);

      const range = document.createElement('input');
      range.type = 'range';
      range.className = 'range';
      range.id = `insp-${key}`;
      range.min = String(min);
      range.max = String(max);
      range.value = String(Math.round(hsl[key]));
      range.addEventListener('input', () => apply({ ...hsl, [key]: Number(range.value) }));

      const out = document.createElement('span');
      out.className = 'prop__value';
      out.textContent = `${Math.round(hsl[key])}${unit}`;

      line.append(tag, range, out);
      hslGroup.appendChild(line);
    });
    body.appendChild(hslGroup);

    /* — คอนทราสต์เทียบพื้นจริงของธีมที่กำลังพรีวิว — */
    const { tokens } = buildPaletteTokens(palette, theme);
    const contrastGroup = document.createElement('div');
    contrastGroup.className = 'inspector__group';
    const cLegend = document.createElement('span');
    cLegend.className = 'inspector__legend';
    cLegend.textContent = `คอนทราสต์ · ธีม${theme === 'dark' ? 'มืด' : 'สว่าง'}`;
    contrastGroup.appendChild(cLegend);

    [
      ['พื้นการ์ด', tokens['--pv-surface'], 4.5],
      ['พื้นหน้า', tokens['--pv-bg'], 4.5],
      ['ตัวอักษรหลัก', tokens['--pv-text'], 4.5],
    ].forEach(([name, against, min]) => {
      contrastGroup.appendChild(row(name, verdictBadge(contrastRatio(hex, against), min)));
    });

    contrastGroup.appendChild(row('ขาว', verdictBadge(contrastRatio(hex, '#ffffff'), 4.5)));
    contrastGroup.appendChild(row('ดำ', verdictBadge(contrastRatio(hex, '#000000'), 4.5)));
    body.appendChild(contrastGroup);

    /* — ตัวอักษรที่อ่านออกบนสีนี้ — */
    const onGroup = document.createElement('div');
    onGroup.className = 'inspector__group';
    const onLegend = document.createElement('span');
    onLegend.className = 'inspector__legend';
    onLegend.textContent = 'ใช้เป็นพื้น';
    onGroup.appendChild(onLegend);

    const onColor = readableTextOn(hex);
    onGroup.appendChild(row('ตัวอักษรที่ควรใช้', textValue(onColor.toUpperCase())));
    onGroup.appendChild(row('ได้อัตราส่วน', verdictBadge(contrastRatio(hex, onColor), 4.5)));
    body.appendChild(onGroup);
  };

  store.subscribe(render);
  selection.subscribe(render);
}
