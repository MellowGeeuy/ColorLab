/**
 * layer-panel.js — แผงเลเยอร์ของหน้า Layout
 *
 * ลิสต์นี้กลับหัวจาก items array ตามกติกาที่เครื่องมือออกแบบใช้กันหมด
 * บนสุดของลิสต์ = ชิ้นที่วาดทีหลัง = อยู่หน้าสุดเวลาซ้อนกัน
 *
 * สิ่งที่แผงนี้ทำต่างจากแผงเลเยอร์ทั่วไป: ลำดับในลิสต์คือลำดับ DOM ของไฟล์ที่ส่งออกจริง
 * จึงเท่ากับลำดับ Tab และลำดับที่โปรแกรมอ่านหน้าจอไล่อ่าน — แผงจึงเตือนเมื่อลำดับนี้
 * ไม่ตรงกับลำดับที่ตาอ่าน และมีคำสั่งเรียงให้ตรงในปุ่มเดียว
 *
 * โครง ARIA ตาม APG treeview: role=tree ครอบ · treeitem ต่อแถว · role=group ครอบลูก
 * · roving tabindex (มีแถวเดียวที่ tabindex=0) · ลูกศรเดินลิสต์ · ซ้ายขวาพับกาง
 */

import { layerRows, layerState, groupsOf, activeScreen, readingOrderIssues } from '../utils/layout-model.js';
import { makeDraggable } from '../utils/pointer-drag.js';

const icon = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

const escapeHtml = (text) => String(text ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function createLayerPanel(options) {
  const {
    root, search, getLayout, labelOf, iconOf,
    onSelect, onPeek, onReorder, onRenameItem, onItemFlags,
    onGroupPatch, getSelectedIds,
  } = options;

  let filter = '';
  /** แถวที่คีย์บอร์ดจะเข้าไปอยู่เมื่อ Tab เข้ามาในแผง — roving tabindex ต้องมีตัวเดียวเสมอ */
  let focusId = null;
  /** จุดยึดของการเลือกเป็นช่วงด้วย Shift — เก็บแยกจากตัวที่เลือกล่าสุดตามพฤติกรรมลิสต์ทั่วไป */
  let anchorId = null;
  let dragId = null;
  /* กัน click ที่เบราว์เซอร์ยิงตามหลัง pointerup ของการลาก */
  let suppressClick = false;

  /* --- ข้อมูลที่แถวใช้ร่วมกัน --- */

  const screenNow = () => activeScreen(getLayout());

  /** ทุกแถวเรียงจากบนลงล่างโดยไม่สนว่ากลุ่มพับอยู่ไหม — ใช้คำนวณลำดับใหม่ตอนลากวาง */
  const fullRows = () => {
    const screen = screenNow();
    if (!screen) return [];
    return layerRows({ ...screen, groups: groupsOf(screen).map((g) => ({ ...g, collapsed: false })) });
  };

  const matches = (item) => !filter || labelOf(item).toLowerCase().includes(filter)
    || String(item.slug).toLowerCase().includes(filter);

  /* --- การวาด --- */

  const rowHtml = (row, level, posinset, setsize, selected) => {
    const screen = screenNow();

    if (row.kind === 'group') {
      const { group } = row;
      const on = group.members.some((id) => selected.includes(id));
      return `
        <div class="lay-layer lay-layer--group" role="treeitem" data-kind="group" data-id="${group.id}"
             aria-level="${level}" aria-posinset="${posinset}" aria-setsize="${setsize}"
             aria-expanded="${group.collapsed ? 'false' : 'true'}" aria-selected="${on ? 'true' : 'false'}"
             tabindex="-1">
          <div class="lay-layer__row">
            <button type="button" class="lay-layer__twist" data-act="twist" tabindex="-1"
                    aria-label="${group.collapsed ? 'กางกลุ่ม' : 'พับกลุ่ม'} ${escapeHtml(group.name)}">
              ${icon('i-chevron-down')}
            </button>
            ${icon('i-folder', 'icon lay-layer__kind')}
            <span class="lay-layer__name" data-act="rename">${escapeHtml(group.name)}</span>
            <span class="lay-layer__count">${group.members.length}</span>
            <button type="button" class="lay-layer__flag" data-act="hide" tabindex="-1"
                    aria-pressed="${group.hidden ? 'true' : 'false'}"
                    aria-label="${group.hidden ? 'แสดงกลุ่มนี้' : 'ซ่อนกลุ่มนี้'}">
              ${icon(group.hidden ? 'i-eye-off' : 'i-eye')}
            </button>
            <button type="button" class="lay-layer__flag" data-act="lock" tabindex="-1"
                    aria-pressed="${group.locked ? 'true' : 'false'}"
                    aria-label="${group.locked ? 'ปลดล็อกกลุ่มนี้' : 'ล็อกกลุ่มนี้'}">
              ${icon(group.locked ? 'i-lock' : 'i-unlock')}
            </button>
          </div>
          <div class="lay-layer__kids" role="group"></div>
        </div>`;
    }

    const { item } = row;
    const state = layerState(screen, item);
    const inherited = state.hidden && !item.hidden;
    const inheritedLock = state.locked && !item.locked;

    return `
      <div class="lay-layer" role="treeitem" data-kind="item" data-id="${item.id}"
           aria-level="${level}" aria-posinset="${posinset}" aria-setsize="${setsize}"
           aria-selected="${selected.includes(item.id) ? 'true' : 'false'}" tabindex="-1"
           ${state.hidden ? 'data-hidden="true"' : ''} ${state.locked ? 'data-locked="true"' : ''}>
        <div class="lay-layer__row">
          <span class="lay-layer__twist lay-layer__twist--leaf" aria-hidden="true"></span>
          ${icon(iconOf(item), 'icon lay-layer__kind')}
          <span class="lay-layer__name" data-act="rename">${escapeHtml(labelOf(item))}</span>
          ${item.link ? `<span class="lay-layer__mark" title="ผูกลิงก์ไว้">${icon('i-link')}</span>` : ''}
          <button type="button" class="lay-layer__flag" data-act="hide" tabindex="-1"
                  aria-pressed="${state.hidden ? 'true' : 'false'}"
                  ${inherited ? 'disabled title="กลุ่มที่ครอบอยู่ถูกซ่อนไว้"' : ''}
                  aria-label="${state.hidden ? 'แสดงชิ้นนี้บนผัง' : 'ซ่อนชิ้นนี้จากผัง'}">
            ${icon(state.hidden ? 'i-eye-off' : 'i-eye')}
          </button>
          <button type="button" class="lay-layer__flag" data-act="lock" tabindex="-1"
                  aria-pressed="${state.locked ? 'true' : 'false'}"
                  ${inheritedLock ? 'disabled title="กลุ่มที่ครอบอยู่ถูกล็อกไว้"' : ''}
                  aria-label="${state.locked ? 'ปลดล็อกชิ้นนี้' : 'ล็อกชิ้นนี้ไม่ให้ลากโดน'}">
            ${icon(state.locked ? 'i-lock' : 'i-unlock')}
          </button>
        </div>
      </div>`;
  };

  const render = () => {
    const screen = screenNow();
    if (!screen) { root.replaceChildren(); return; }

    const selected = getSelectedIds();
    const rows = layerRows(screen);
    const tops = rows.filter((row) => row.depth === 0);

    // กรองแล้วกลุ่มยังอยู่ถ้าชื่อกลุ่มตรง หรือมีสมาชิกตรง — ไม่งั้นของที่หาอยู่จะหายไปทั้งก้อน
    const keep = (row) => {
      if (!filter) return true;
      if (row.kind === 'item') return matches(row.item);
      return row.group.name.toLowerCase().includes(filter) || row.members.some(matches);
    };

    const visibleTops = tops.filter(keep);
    root.replaceChildren();

    visibleTops.forEach((row, index) => {
      const holder = document.createElement('div');
      holder.innerHTML = rowHtml(row, 1, index + 1, visibleTops.length, selected).trim();
      const node = holder.firstElementChild;
      root.appendChild(node);

      if (row.kind !== 'group' || row.group.collapsed) return;

      const kids = node.querySelector('.lay-layer__kids');
      const members = row.members.filter((item) => !filter || matches(item)
        || row.group.name.toLowerCase().includes(filter));

      members.forEach((item, kidIndex) => {
        const kidHolder = document.createElement('div');
        kidHolder.innerHTML = rowHtml(
          { kind: 'item', item, group: row.group }, 2, kidIndex + 1, members.length, selected,
        ).trim();
        kids.appendChild(kidHolder.firstElementChild);
      });
    });

    if (!root.querySelector(`.lay-layer[data-id="${focusId}"]`)) focusId = null;
    const first = root.querySelector(`.lay-layer[data-id="${focusId}"]`) ?? root.querySelector('.lay-layer');
    if (first) first.tabIndex = 0;

    if (visibleTops.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'lay-layers__empty';
      empty.textContent = filter ? 'ไม่มีเลเยอร์ที่ตรงกับคำค้น' : 'ยังไม่มีของบนหน้านี้ — วางจากคลังได้เลย';
      root.appendChild(empty);
    }
  };

  /* --- การเลือก --- */

  const visibleIds = () => [...root.querySelectorAll('.lay-layer')].map((node) => node.dataset.id);

  /** กลุ่มไม่ใช่ของที่เลือกได้เอง เลือกกลุ่ม = เลือกสมาชิกทุกตัว */
  const idsBehind = (id) => {
    const screen = screenNow();
    const group = groupsOf(screen).find((entry) => entry.id === id);
    return group ? [...group.members] : [id];
  };

  const rangeIds = (fromId, toId) => {
    const list = visibleIds();
    const a = list.indexOf(fromId);
    const b = list.indexOf(toId);
    if (a < 0 || b < 0) return idsBehind(toId);
    return list.slice(Math.min(a, b), Math.max(a, b) + 1).flatMap(idsBehind);
  };

  const pick = (id, event) => {
    const current = getSelectedIds();
    focusId = id;

    if (event.shiftKey && anchorId) {
      onSelect(rangeIds(anchorId, id));
      return;
    }

    anchorId = id;

    if (event.ctrlKey || event.metaKey) {
      const behind = idsBehind(id);
      const has = behind.every((entry) => current.includes(entry));
      onSelect(has
        ? current.filter((entry) => !behind.includes(entry))
        : [...current, ...behind.filter((entry) => !current.includes(entry))]);
      return;
    }

    onSelect(idsBehind(id));
  };

  /* --- เปลี่ยนชื่อในแถว --- */

  const startRename = (node) => {
    const label = node.querySelector('.lay-layer__name');
    if (!label || label.querySelector('input')) return;

    const isGroup = node.dataset.kind === 'group';
    const current = label.textContent;
    const input = document.createElement('input');
    input.className = 'lay-layer__input';
    input.value = current;
    input.setAttribute('aria-label', 'ชื่อเลเยอร์');
    label.replaceChildren(input);
    input.focus();
    input.select();

    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      const value = input.value.trim();
      label.textContent = save && value ? value : current;
      if (!save || value === current) return;
      if (isGroup) onGroupPatch(node.dataset.id, { name: value });
      else onRenameItem(node.dataset.id, value);
    };

    input.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Enter') { event.preventDefault(); finish(true); }
      if (event.key === 'Escape') { event.preventDefault(); finish(false); }
    });
    input.addEventListener('blur', () => finish(true));
  };

  /* --- คลิก --- */

  root.addEventListener('click', (event) => {
    if (suppressClick) return;
    const node = event.target.closest('.lay-layer');
    if (!node) return;

    const action = event.target.closest('[data-act]')?.dataset.act;
    const isGroup = node.dataset.kind === 'group';
    const id = node.dataset.id;

    if (action === 'twist') {
      const group = groupsOf(screenNow()).find((entry) => entry.id === id);
      onGroupPatch(id, { collapsed: !group?.collapsed });
      return;
    }

    if (action === 'hide' || action === 'lock') {
      const key = action === 'hide' ? 'hidden' : 'locked';
      if (isGroup) {
        const group = groupsOf(screenNow()).find((entry) => entry.id === id);
        onGroupPatch(id, { [key]: !group?.[key] });
      } else {
        const item = screenNow().items.find((entry) => entry.id === id);
        onItemFlags([id], { [key]: !item?.[key] });
      }
      return;
    }

    pick(id, event);
  });

  root.addEventListener('dblclick', (event) => {
    const node = event.target.closest('.lay-layer');
    if (!node || event.target.closest('.lay-layer__flag, .lay-layer__twist')) return;
    startRename(node);
  });

  /* --- ชี้แล้วเน้นของบนผัง --- */

  root.addEventListener('pointerover', (event) => {
    const node = event.target.closest('.lay-layer');
    onPeek(node && node.dataset.kind === 'item' ? node.dataset.id : null);
  });

  root.addEventListener('pointerleave', () => onPeek(null));

  /* --- คีย์บอร์ด --- */

  const focusRow = (id) => {
    const node = root.querySelector(`.lay-layer[data-id="${id}"]`);
    if (!node) return;
    root.querySelectorAll('.lay-layer').forEach((entry) => { entry.tabIndex = -1; });
    node.tabIndex = 0;
    node.focus();
    focusId = id;
  };

  root.addEventListener('keydown', (event) => {
    const node = event.target.closest('.lay-layer');
    if (!node) return;
    const id = node.dataset.id;
    const list = visibleIds();
    const index = list.indexOf(id);
    const isGroup = node.dataset.kind === 'group';
    const group = isGroup ? groupsOf(screenNow()).find((entry) => entry.id === id) : null;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (index < list.length - 1) focusRow(list[index + 1]);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (index > 0) focusRow(list[index - 1]);
        break;
      case 'Home':
        event.preventDefault();
        if (list.length) focusRow(list[0]);
        break;
      case 'End':
        event.preventDefault();
        if (list.length) focusRow(list[list.length - 1]);
        break;
      case 'ArrowRight':
        if (!isGroup) break;
        event.preventDefault();
        if (group?.collapsed) onGroupPatch(id, { collapsed: false });
        else if (group?.members.length) focusRow(group.members[group.members.length - 1]);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (isGroup && !group?.collapsed) { onGroupPatch(id, { collapsed: true }); break; }
        if (!isGroup) {
          const owner = groupsOf(screenNow()).find((entry) => entry.members.includes(id));
          if (owner) focusRow(owner.id);
        }
        break;
      case 'Enter':
        event.preventDefault();
        startRename(node);
        break;
      case ' ':
        event.preventDefault();
        pick(id, { ctrlKey: true });
        break;
      case 'h':
      case 'H':
        event.preventDefault();
        node.querySelector('[data-act="hide"]')?.click();
        break;
      case 'l':
      case 'L':
        event.preventDefault();
        node.querySelector('[data-act="lock"]')?.click();
        break;
      default:
        break;
    }
  });

  /* --- ลากจัดลำดับ --- */

  const clearDropMarks = () => root.querySelectorAll('.is-drop-before, .is-drop-after')
    .forEach((node) => node.classList.remove('is-drop-before', 'is-drop-after'));

  /** แถวที่อยู่ใต้ปลายนิ้วตอนนี้ — ไม่มี dragover ให้ใช้แล้ว จึงต้องยิงรังสีเอง */
  const rowAt = (x, y) => document.elementFromPoint(x, y)?.closest('.lay-layer') ?? null;

  const dropSide = (node, y) => {
    const box = node.getBoundingClientRect();
    return y > box.top + box.height / 2;
  };

  /** ย้าย dragId ไปก่อน/หลังแถวเป้าหมาย — คณิตศาสตร์ชุดเดิม แค่แยกออกมาจาก event handler */
  const applyReorder = (targetNode, after) => {
    // ทำงานบนลำดับที่ตาเห็น (บนลงล่าง) แล้วค่อยกลับหัวเป็นลำดับของ items ตอนท้าย
    const rows = fullRows();
    const seen = rows.filter((row) => row.kind === 'item').map((row) => row.id);
    const moving = idsBehind(dragId);
    const targetIds = idsBehind(targetNode.dataset.id);
    const anchorTarget = after ? targetIds[targetIds.length - 1] : targetIds[0];

    const rest = seen.filter((id) => !moving.includes(id));
    const at = rest.indexOf(anchorTarget);
    if (at < 0) return;

    const visual = [...rest.slice(0, after ? at + 1 : at), ...moving, ...rest.slice(after ? at + 1 : at)];
    onReorder([...visual].reverse());
  };

  /* ลากด้วย Pointer Events ไม่ใช่ HTML5 DnD — DnD ไม่ยิง event บนจอสัมผัสเลย
     แผงนี้จึงเคยจัดลำดับไม่ได้บนมือถือทั้งหมด (ดู utils/pointer-drag.js) */
  makeDraggable(root, {
    handle: (event) => {
      /* ปุ่มในแถวกับชื่อที่กดเพื่อเปลี่ยนต้องทำงานตามปกติ ไม่ใช่จุดเริ่มลาก */
      if (event.target.closest('button, input, [data-act="rename"]')) return null;
      return event.target.closest('.lay-layer');
    },

    onStart: ({ target }) => {
      dragId = target.dataset.id;
      target.classList.add('is-dragging');
      /* บอกทั้งหน้าว่ากำลังลาก เพื่อกันข้อความถูกลากเลือกไปด้วยระหว่างทาง */
      document.body.classList.add('is-layer-dragging');
    },

    onMove: ({ x, y }) => {
      clearDropMarks();
      const node = rowAt(x, y);
      if (!node || node.dataset.id === dragId) return;
      node.classList.add(dropSide(node, y) ? 'is-drop-after' : 'is-drop-before');
    },

    onEnd: ({ x, y, cancelled }) => {
      const node = cancelled ? null : rowAt(x, y);
      if (node && dragId && node.dataset.id !== dragId) {
        applyReorder(node, dropSide(node, y));
      }
      root.querySelectorAll('.is-dragging').forEach((n) => n.classList.remove('is-dragging'));
      document.body.classList.remove('is-layer-dragging');
      clearDropMarks();
      dragId = null;

      /* pointerup จบแล้วเบราว์เซอร์จะยิง click ตามมา ถ้าไม่กันไว้แถวที่ลากจะถูกเลือกซ้ำ */
      if (!cancelled) {
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 0);
      }
    },
  });

  /* --- ช่องค้นหา --- */

  search?.addEventListener('input', () => {
    filter = search.value.trim().toLowerCase();
    render();
  });

  return {
    render,
    focusRow,
    /** จำนวนชิ้นที่ลำดับ DOM ไม่ตรงกับลำดับที่ตาอ่าน — หน้าเรียกไปขึ้นป้ายเตือน */
    orderIssues: () => readingOrderIssues(screenNow()),
  };
}
