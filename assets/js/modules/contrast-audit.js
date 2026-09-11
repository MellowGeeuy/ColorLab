/**
 * contrast-audit.js — ตรวจคู่สีของ palette ปัจจุบันตามเกณฑ์ WCAG แล้วสรุปผลเป็นตาราง
 */

import { auditTokens } from '../utils/palette-tokens.js';

function swatchPair(fgHex, bgHex) {
  const cell = document.createElement('div');
  cell.className = 'audit__sample';
  cell.style.backgroundColor = bgHex;
  cell.style.color = fgHex;
  cell.textContent = 'Aa';
  return cell;
}

function renderRow(entry) {
  const row = document.createElement('tr');

  const sample = document.createElement('td');
  sample.appendChild(swatchPair(entry.fgHex, entry.bgHex));

  const label = document.createElement('td');
  label.textContent = entry.label;

  const codes = document.createElement('td');
  codes.className = 'u-mono u-small';
  codes.textContent = `${entry.fgHex.toUpperCase()} / ${entry.bgHex.toUpperCase()}`;

  const ratio = document.createElement('td');
  ratio.className = 'u-mono u-num u-num-end';
  ratio.textContent = `${entry.ratio.toFixed(2)}:1`;

  const verdict = document.createElement('td');
  const badge = document.createElement('span');
  badge.className = entry.pass ? 'badge badge--pass' : 'badge badge--fail';
  badge.textContent = entry.pass ? `ผ่าน ${entry.min}:1` : `ต่ำกว่า ${entry.min}:1`;
  verdict.appendChild(badge);

  row.append(sample, label, codes, ratio, verdict);
  return row;
}

/** ต้องเรียกก่อน initThemePreview เพื่อให้ดักอีเวนต์ชุดแรกที่ยิงตอนตั้งค่าเริ่มต้นได้ทัน */
export function initContrastAudit() {
  const body = document.querySelector('#audit-body');
  const summary = document.querySelector('#audit-summary');
  const accentBody = document.querySelector('#audit-accents');
  const stage = document.querySelector('#preview-stage');
  if (!body || !stage) return;

  const render = ({ detail }) => {
    const { results, accents, passed, total } = auditTokens(detail.tokens);

    body.replaceChildren(...results.map(renderRow));

    if (summary) {
      const failed = total - passed;
      summary.textContent = failed === 0
        ? `ผ่านครบทั้ง ${total} คู่`
        : `ผ่าน ${passed} จาก ${total} คู่ — ต้องแก้ ${failed} จุด`;
      summary.className = failed === 0 ? 'badge badge--pass' : 'badge badge--fail';
    }

    if (accentBody) {
      accentBody.replaceChildren();
      accents.forEach((accent) => {
        const row = document.createElement('tr');

        const chip = document.createElement('td');
        const dot = document.createElement('span');
        dot.className = 'audit__dot';
        dot.style.backgroundColor = accent.hex;
        chip.appendChild(dot);

        const name = document.createElement('td');
        name.textContent = `Accent ${accent.index}`;

        const hex = document.createElement('td');
        hex.className = 'u-mono u-small';
        hex.textContent = accent.hex.toUpperCase();

        const onSurface = document.createElement('td');
        onSurface.className = 'u-mono u-num u-num-end';
        onSurface.textContent = `${accent.onSurface.toFixed(2)}:1`;

        const verdict = document.createElement('td');
        const badge = document.createElement('span');
        // accent ใช้เป็นพื้นของ chip/กราฟ จึงวัดที่เกณฑ์ 3:1 ขององค์ประกอบ UI
        const ok = accent.onSurface >= 3;
        badge.className = ok ? 'badge badge--pass' : 'badge badge--neutral';
        badge.textContent = ok ? 'แยกออกจากพื้น' : 'กลืนกับพื้น';
        verdict.appendChild(badge);

        row.append(chip, name, hex, onSurface, verdict);
        accentBody.appendChild(row);
      });
    }
  };

  stage.addEventListener('tokenschange', render);
}
