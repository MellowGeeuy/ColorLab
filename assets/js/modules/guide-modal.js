/**
 * guide-modal.js — คู่มือใช้งานทั้งเว็บในหน้าต่างเดียว เปิดจากปุ่มไฟข้างปุ่มธีม
 * เก็บเนื้อหาไว้ที่นี่ที่เดียวแทนที่จะเขียนซ้ำใน HTML ทุกหน้า ทุกหน้าจึงเห็นคู่มือชุดเดียวกัน
 * และแก้ที่เดียวจบ — หน้าไหนเปิด ก็เด้งไปหัวข้อของหน้านั้นก่อน
 */

const SECTIONS = [
  {
    id: 'start',
    title: 'เริ่มจากตรงนี้',
    icon: '#i-compass',
    lead: 'ColorLab ทำงานเป็นสายเดียว เริ่มที่ชุดสี แล้วชุดสีนั้นจะตามไปทุกหน้า',
    blocks: [
      {
        kind: 'steps',
        items: [
          ['สร้างชุดสีที่ Colorground', 'เลือกสีตั้งต้นหนึ่งสี ระบบจะแตกเป็นชุดสีให้เลือก 7 สูตร แล้วกดบันทึกชุดที่ชอบ'],
          ['ดูของจริงที่ Component Style', 'คอมโพเนนต์ทั้ง 21 ตัวเปลี่ยนเป็นชุดสีที่บันทึกไว้ทันที พร้อมโค้ดให้คัดลอก'],
          ['ประกอบเป็นหน้าที่ Layout', 'ลากคอมโพเนนต์มาวางเป็นผังหน้าจอ ผูกลิงก์ กดไล่ดูได้ แล้วส่งออกเป็นไฟล์เดียว'],
          ['อ่านทฤษฎีที่ Color Theory', 'ไม่ต้องอ่านจบก่อนก็ได้ ใช้เป็นที่เปิดดูตอนสงสัยว่าทำไมต้องทำแบบนั้น'],
        ],
      },
      {
        kind: 'note',
        text: 'ชุดสีที่บันทึกเก็บไว้ในเบราว์เซอร์ของเครื่องที่ใช้ ไม่ได้ส่งขึ้นเซิร์ฟเวอร์ — เปลี่ยนเครื่องหรือล้างข้อมูลเบราว์เซอร์แล้วจะไม่เห็นชุดเดิม',
      },
    ],
  },
  {
    id: 'ground',
    title: 'Colorground',
    icon: '#i-sliders',
    lead: 'ที่สร้างชุดสี — จุดตั้งต้นของทั้งเว็บ',
    blocks: [
      {
        kind: 'list',
        title: 'เลือกสีตั้งต้น',
        items: [
          ['วงล้อ', 'จิ้มหรือลากบนวงล้อเพื่อเลือกเนื้อสีกับความอิ่มพร้อมกัน จิ้มใกล้ขอบได้สีจัด จิ้มใกล้กลางได้สีหม่น'],
          ['รหัสสี', 'มีสีในใจอยู่แล้วพิมพ์รหัส เช่น #845EC2 ลงช่องได้เลย วงล้อจะขยับตาม'],
          ['ความสว่าง', 'แถบเลื่อนคุมความสว่างของสีตั้งต้น ปรับแล้วทั้ง 7 สูตรคำนวณใหม่ทันที'],
        ],
      },
      {
        kind: 'list',
        title: 'เลือกสูตรแล้วบันทึก',
        items: [
          ['7 สูตร', 'แต่ละสูตรคือวิธีจัดความสัมพันธ์ของสีคนละแบบ เช่น สีเดียวไล่น้ำหนัก คู่ตรงข้าม หรือสามสีเท่ากันบนวงล้อ'],
          ['กดที่ช่องสี', 'คัดลอกรหัสสีนั้นไปใช้ได้ทันที'],
          ['บันทึกชุดสี', 'ชุดที่บันทึกจะถูกตั้งเป็นชุดที่ใช้อยู่ทันที หน้า Component Style และ Layout จะเปลี่ยนตามทันทีโดยไม่ต้องไปเลือกซ้ำ'],
          ['ส่งออกเป็นโค้ด', 'ปุ่มวงเล็บปีกกาข้างปุ่มบันทึก — เปิดหน้าต่างโค้ดของชุดนั้น เลือกได้สี่รูปแบบ CSS · SCSS · Tailwind · JSON แล้วคัดลอกหรือดาวน์โหลดเป็นไฟล์'],
          ['CSS ที่ได้', 'เป็นตัวแปรใน :root พร้อมชุดของธีมมืดใน [data-theme="dark"] วางในโปรเจกต์แล้วใช้ต่อได้ทันที'],
          ['คืนค่าชุดสีเริ่มต้น', 'ปุ่มวงกลมบนแถบบน กดแล้วกลับไปใช้ชุดสีตั้งต้นของเว็บ ชุดที่บันทึกไว้ไม่หาย'],
        ],
      },
      { kind: 'keys', title: 'คีย์ลัด', items: [['Ctrl / Cmd + K', 'เปิดช่องค้นหาคำสั่ง พิมพ์ชื่อเครื่องมือหรือคำสั่งแล้วกด Enter']] },
    ],
  },
  {
    id: 'component',
    title: 'Component Style',
    icon: '#i-layers',
    lead: 'คอมโพเนนต์ 21 ตัวใต้ชุดสีที่เลือก พร้อมโค้ดที่คัดลอกไปใช้ได้ทันที',
    blocks: [
      {
        kind: 'list',
        title: 'หน้ารวม',
        items: [
          ['5 กลุ่ม', 'นำทาง · โครงหน้า · ข้อมูล · ฟอร์ม · สถานะ — กดที่การ์ดใบไหนก็ได้เพื่อเข้าไปดูตัวนั้นเต็ม ๆ'],
          ['ปุ่มชุดสีมุมขวาบน', 'แถบสีเล็ก ๆ คือชุดที่ใช้อยู่ กดเพื่อสลับไปชุดอื่นที่บันทึกไว้ หรือสลับธีมสว่าง/มืดของพื้นที่ตัวอย่าง'],
          ['ลบชุดสีที่ไม่ใช้', 'ปุ่มถังขยะท้ายแต่ละแถวในรายการชุดสี — มีหน้าต่างให้ยืนยันก่อนเสมอ ลบแล้วชุดที่ใช้อยู่บนหน้าจอไม่เปลี่ยน'],
        ],
      },
      {
        kind: 'list',
        title: 'หน้ารายตัว',
        items: [
          ['พรีวิว', 'ของจริงที่กดได้ ไม่ใช่ภาพนิ่ง'],
          ['รูปแบบย่อย', 'ตัวเดียวกันในสถานการณ์ต่างกัน พร้อมคำอธิบายว่าควรใช้แบบไหนเมื่อไหร่'],
          ['ตารางสถานะ', 'ปกติ ชี้ กด โฟกัส ปิดใช้ — เทียบกันให้เห็นว่าสถานะไหนหน้าตาเป็นอย่างไร'],
          ['ตาราง token', 'บอกว่าสีแต่ละส่วนมาจากตัวแปรตัวไหน เอาไปทำ design system ต่อได้'],
          ['โค้ดสามแท็บ', 'HTML · CSS · การใช้งาน กดปุ่มคัดลอกมุมขวาบนของกล่องโค้ดแล้ววางในโปรเจกต์ได้เลย'],
        ],
      },
    ],
  },
  {
    id: 'layout',
    title: 'Layout',
    icon: '#i-grid',
    lead: 'ประกอบคอมโพเนนต์จริงเป็นผังหน้าจอ ผูกลิงก์ แล้วกดไล่ดูได้เหมือนของจริง',
    blocks: [
      {
        kind: 'list',
        title: 'สามส่วนของหน้าจอ',
        items: [
          ['แผงซ้าย', 'มีสองแท็บ — คลังคอมโพเนนต์ไว้ลากของมาวาง และเลเยอร์ไว้จัดการชิ้นที่วางแล้ว'],
          ['ผังตรงกลาง', 'พื้นที่ทำงาน ลากวางบนกริดได้ ใช้ปุ่มย่อ/ขยาย/พอดีจอที่แถบล่างช่วยมอง'],
          ['แผงขวา', 'คุณสมบัติของชิ้นที่เลือก — เปลี่ยนข้อความ ขนาด โทน และผูกลิงก์ไปหน้าอื่นได้ที่นี่'],
        ],
      },
      {
        kind: 'list',
        title: 'เลเยอร์',
        items: [
          ['ลำดับในลิสต์คือลำดับจริง', 'ลำดับเลเยอร์คือลำดับของโค้ดที่ส่งออก และเป็นลำดับที่ปุ่ม Tab จะวิ่งตาม จึงมีคำสั่งเรียงตามผังให้กดเมื่อลำดับไม่ตรงกับสายตา'],
          ['จัดการ', 'ตั้งชื่อ ซ่อน ล็อก เลือกหลายชิ้น จัดกลุ่ม และลากสลับลำดับได้'],
          ['ค้นหา', 'ช่องค้นหาบนหัวแผง พิมพ์ชื่อเลเยอร์เพื่อกระโดดไปหา'],
        ],
      },
      {
        kind: 'list',
        title: 'มุมมองและการส่งออก',
        items: [
          ['ผังหน้า / บอร์ดรวมทุกหน้า', 'สลับระหว่างดูทีละหน้า กับเห็นทุกหน้าพร้อมเส้นเชื่อมว่ากดอะไรไปไหน'],
          ['ทดลองใช้ผัง', 'เข้าโหมดกดจริง ลิงก์ที่ผูกไว้จะพาไปหน้าปลายทางเหมือนเว็บจริง'],
          ['ดูโฟลว์ทั้งระบบ', 'แผนภาพรวมว่าแต่ละหน้าเชื่อมกันอย่างไร'],
          ['ส่งออก', 'ได้ไฟล์เดียวที่เปิดแล้วกดไล่ดูได้จริง ส่งให้คนอื่นดูได้โดยไม่ต้องมีเว็บนี้'],
        ],
      },
      { kind: 'keys', title: 'คีย์ลัด', items: [['ปุ่มคีย์ลัดบนแถบเครื่องมือ', 'กดเพื่อดูรายการคีย์ลัดทั้งหมดของหน้านี้']] },
    ],
  },
  {
    id: 'theory',
    title: 'Color Theory',
    icon: '#i-book',
    lead: '11 ตอน แยกกันคนละหน้า อธิบายด้วยภาพ ตัวอย่างที่กดเล่นได้ และค่าที่วัดจริง',
    blocks: [
      {
        kind: 'list',
        title: 'อ่านยังไง',
        items: [
          ['หน้าสารบัญ', 'หน้าแรกของ Color Theory คือสารบัญรวม 11 ตอน กดการ์ดไหนก็เข้าไปอ่านตอนนั้นได้เลย ไม่ต้องอ่านเรียง'],
          ['รางสารบัญด้านซ้าย', 'มีทุกหน้าของตอน ชี้เมาส์ค้างเพื่อกางชื่อเต็ม ตอนที่กำลังอ่านจะกางหัวข้อย่อยในหน้านั้นออกมาด้วย จอแคบกดปุ่มสารบัญบนแถบบนแทน'],
          ['ปุ่มท้ายหน้า', 'ทุกตอนมีปุ่มไปตอนก่อนหน้าและตอนถัดไป อ่านเรียงได้โดยไม่ต้องกลับมาที่สารบัญ'],
          ['แถบความคืบหน้า', 'เส้นบาง ๆ ใต้แถบบนบอกว่าอ่านมาถึงไหนของตอนนี้แล้ว'],
          ['ภาพที่กดได้', 'หลายภาพในหน้านี้ลากหรือกดเล่นได้ เช่น แถบเลื่อนสามแกนของสี วงล้อ Harmony และตัวเทียบก่อนแก้/หลังแก้'],
          ['ตัวอย่างที่ลองเองได้', 'ทุกตอนมีอย่างน้อยหนึ่งตัว เช่น สลับมุมมองตาบอดสี จำลองหน้าจอกลางแดด สร้าง Tint/Shade/Tone จากสีตัวเอง ลากหาจุดที่ขอบสีสั่น และวัดคู่สีกับเกณฑ์ WCAG'],
          ['ท้ายตอน', 'ทุกตอนจบด้วยสรุปสามข้อกับลิงก์ไปอ่านต้นทาง เช่น W3C หรือ Material Design'],
        ],
      },
      {
        kind: 'list',
        title: 'ลำดับเนื้อหา',
        items: [
          ['พื้นฐาน', 'สีทำงานก่อนตัวหนังสือ · สามแกนของสี · Color Models'],
          ['ทฤษฎีสี', 'วงล้อสีและ Harmony · สีกับความรู้สึก'],
          ['ระบบสีใน UI', 'สี่บทบาทของสี · จากสีเดียวสู่สเกล'],
          ['การเข้าถึง', 'Contrast และ WCAG · Dark Mode'],
          ['ลงมือใช้จริง', 'สัดส่วนการใช้สี · ก่อนแก้ / หลังแก้'],
        ],
      },
    ],
  },
  {
    id: 'common',
    title: 'ของที่มีทุกหน้า',
    icon: '#i-wrench',
    blocks: [
      {
        kind: 'list',
        items: [
          ['ปุ่มธีม', 'สลับธีมสว่าง/มืดของตัวเว็บเอง คนละอันกับธีมของพื้นที่ตัวอย่างในหน้า Component Style'],
          ['ปุ่มคู่มือ', 'ปุ่มไฟดวงนี้ — เปิดคู่มือได้จากทุกหน้า'],
          ['เมนูบนสุด', 'สลับไปมาระหว่างสามหน้าหลัก ปุ่ม Colorground ทางขวาคือที่สร้างชุดสี'],
          ['จอแคบ', 'เมนูจะยุบเหลือไอคอน และย้ายไปอยู่ปุ่มวงกลมมุมขวาล่างเมื่อเลื่อนลง'],
        ],
      },
      { kind: 'keys', title: 'คีย์ลัดที่ใช้ได้ในคู่มือนี้', items: [['Esc', 'ปิดคู่มือ'], ['Tab', 'เลื่อนไปหัวข้อถัดไป']] },
    ],
  },
];

// เปิดมาที่หัวข้อของหน้าที่ยืนอยู่ — คนกดคู่มือส่วนใหญ่สงสัยหน้าตรงหน้า ไม่ใช่หน้าอื่น
const PAGE_SECTION = {
  'component-style': 'component',
  layout: 'layout',
  workspace: 'ground',
};

// แต่ละหน้าเป็นโฟลเดอร์ของตัวเอง ชื่อโฟลเดอร์สุดท้ายจึงเป็นตัวบอกว่ายืนอยู่หน้าไหน
// หน้าแรกอยู่ที่รากจึงไม่มีชื่อโฟลเดอร์ของตัวเอง ตกมาที่ theory
function currentSection() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1]?.replace(/\.html$/, '');
  return PAGE_SECTION[last] ?? 'theory';
}

function renderBlock(block) {
  const wrap = document.createElement('div');
  wrap.className = 'guide__block';

  if (block.title) {
    const heading = document.createElement('h3');
    heading.className = 'guide__block-title';
    heading.textContent = block.title;
    wrap.appendChild(heading);
  }

  if (block.kind === 'note') {
    const note = document.createElement('p');
    note.className = 'guide__note';
    note.textContent = block.text;
    wrap.appendChild(note);
    return wrap;
  }

  const list = document.createElement(block.kind === 'steps' ? 'ol' : 'ul');
  list.className = block.kind === 'steps' ? 'guide__steps' : 'guide__list';

  block.items.forEach(([term, detail]) => {
    const item = document.createElement('li');
    item.className = block.kind === 'steps' ? 'guide__step' : 'guide__item';

    const name = document.createElement('span');
    name.className = block.kind === 'keys' ? 'guide__key' : 'guide__term';
    name.textContent = term;

    const text = document.createElement('span');
    text.className = 'guide__detail';
    text.textContent = detail;

    item.append(name, text);
    list.appendChild(item);
  });

  wrap.appendChild(list);
  return wrap;
}

function buildPanel(section) {
  const panel = document.createElement('section');
  panel.className = 'guide__panel';
  panel.id = `guide-panel-${section.id}`;
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `guide-tab-${section.id}`);
  panel.tabIndex = 0;
  panel.hidden = true;

  const head = document.createElement('div');
  head.className = 'guide__panel-head';

  const title = document.createElement('h2');
  title.className = 'guide__panel-title';
  title.textContent = section.title;
  head.appendChild(title);

  if (section.lead) {
    const lead = document.createElement('p');
    lead.className = 'guide__lead';
    lead.textContent = section.lead;
    head.appendChild(lead);
  }

  panel.appendChild(head);
  section.blocks.forEach((block) => panel.appendChild(renderBlock(block)));
  return panel;
}

function buildModal() {
  const root = document.createElement('div');
  root.className = 'guide';
  root.id = 'guide';
  root.hidden = true;
  root.innerHTML = `
    <div class="guide__scrim" data-guide-close></div>
    <div class="guide__panel-wrap" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <header class="guide__head">
        <span class="guide__mark" aria-hidden="true">
          <svg class="icon"><use href="#i-lightbulb"/></svg>
        </span>
        <div class="guide__heading">
          <h1 class="guide__title" id="guide-title">คู่มือใช้งาน</h1>
          <p class="guide__sub">ส่วนไหนใช้ยังไง อ่านตรงนี้</p>
        </div>
        <button type="button" class="btn btn--icon btn--sm" data-guide-close aria-label="ปิดคู่มือ">
          <svg class="icon" aria-hidden="true"><use href="#i-x"/></svg>
        </button>
      </header>
      <div class="guide__body">
        <nav class="guide__nav" role="tablist" aria-orientation="vertical" aria-label="หัวข้อคู่มือ"></nav>
        <div class="guide__content"></div>
      </div>
    </div>
  `;

  const nav = root.querySelector('.guide__nav');
  const content = root.querySelector('.guide__content');

  SECTIONS.forEach((section) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'guide__tab';
    tab.id = `guide-tab-${section.id}`;
    tab.dataset.section = section.id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    tab.setAttribute('aria-controls', `guide-panel-${section.id}`);
    tab.tabIndex = -1;
    tab.innerHTML = `<svg class="icon guide__tab-icon" aria-hidden="true"><use href="${section.icon}"/></svg>`;

    const label = document.createElement('span');
    label.textContent = section.title;
    tab.appendChild(label);

    nav.appendChild(tab);
    content.appendChild(buildPanel(section));
  });

  document.body.appendChild(root);
  return root;
}

export function initGuideModal() {
  const opener = document.querySelector('#guide-open');
  if (!opener) return;

  const root = buildModal();
  const tabs = Array.from(root.querySelectorAll('.guide__tab'));
  const panels = Array.from(root.querySelectorAll('.guide__panel'));
  const content = root.querySelector('.guide__content');
  let lastFocused = null;

  const show = (id) => {
    tabs.forEach((tab) => {
      const on = tab.dataset.section === id;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    panels.forEach((panel) => { panel.hidden = panel.id !== `guide-panel-${id}`; });
    content.scrollTop = 0;
  };

  const open = () => {
    lastFocused = document.activeElement;
    root.hidden = false;
    // กันหน้าหลังฉากเลื่อนตามล้อเมาส์ขณะคู่มือเปิดอยู่
    document.body.style.overflow = 'hidden';
    show(currentSection());
    root.querySelector('.guide__tab[aria-selected="true"]')?.focus();
  };

  const close = () => {
    root.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  };

  opener.addEventListener('click', open);

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-guide-close]')) close();
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    // ขังโฟกัสไว้ในหน้าต่างตามข้อกำหนดของ dialog — ไม่งั้น Tab จะหลุดไปกดของหลังฉากที่มองไม่เห็น
    if (event.key === 'Tab') {
      const stops = Array.from(
        root.querySelectorAll('button:not([tabindex="-1"]), .guide__panel:not([hidden])'),
      );
      if (stops.length === 0) return;

      const first = stops[0];
      const last = stops[stops.length - 1];
      const onEdge = event.shiftKey ? document.activeElement === first : document.activeElement === last;
      if (!onEdge) return;

      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }

    // ลูกศรเดินหัวข้อตาม APG tablist — Home/End กระโดดหัวท้าย
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;

    const moves = {
      ArrowDown: index + 1,
      ArrowUp: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(event.key in moves)) return;

    event.preventDefault();
    const next = (moves[event.key] + tabs.length) % tabs.length;
    tabs[next].focus();
    show(tabs[next].dataset.section);
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => show(tab.dataset.section));
  });
}
