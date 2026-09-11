/**
 * component-catalog.js — ทะเบียน component ของหน้า Component Style
 *
 * metadata อยู่ที่นี่ ส่วน markup อยู่ที่ assets/components/<slug>.html
 * และ CSS อยู่ที่ assets/css/component-catalog.css
 * ทั้งสองไฟล์ถูก fetch มาแสดงเป็นทั้งพรีวิวและโค้ด จึงไม่มีทางไม่ตรงกัน
 */

// ผูกกับตำแหน่งของไฟล์นี้ ไม่ใช่ตำแหน่งของหน้า — แต่ละหน้าอยู่คนละชั้นโฟลเดอร์กัน
const MARKUP_DIR = new URL('../../components', import.meta.url);
const CATALOG_CSS = new URL('../../css/component-catalog.css', import.meta.url);

export const GROUPS = [
  { id: 'nav', label: 'นำทาง' },
  { id: 'layout', label: 'โครงหน้า' },
  { id: 'data', label: 'ข้อมูล' },
  { id: 'form', label: 'ฟอร์มและการกระทำ' },
  { id: 'feedback', label: 'สถานะและการรอ' },
];

/**
 * anatomy: ส่วนประกอบที่มองเห็น คู่กับ token ที่มันกิน (ชื่อ --color-* ตามที่ผู้ใช้จะได้ไปใช้)
 * matrix:  ตัวสร้างตาราง variant x state — control ในตารางเป็นภาพประกอบ ไม่ใช่ของกดได้จริง
 * audit:   คู่สีที่ component นี้ต้องผ่าน อ้างชื่อ --pv-* เพราะตรวจกับ token ที่คำนวณในหน้า
 * fill:    ยืดเต็มความสูงของกล่องที่วางบนผังได้ไหม
 *          ของที่เป็นกล่องบรรจุ (ตาราง การ์ด ท้ายเว็บ) ยืดแล้วได้ผลจริง
 *          ส่วนของที่มีความสูงของตัวเอง (ปุ่ม ป้าย) ยืดแล้วผิดรูป จึงจัดกึ่งกลางกล่องแทน
 */
export const COMPONENTS = [
  {
    slug: 'table',
    fill: true,
    name: 'Data table',
    group: 'data',
    summary: 'แสดงข้อมูลหลายแถวที่ต้องเทียบกันเป็นคอลัมน์ เช่น รายการเอกสารหรือธุรกรรม',
    useWhen: [
      'ข้อมูลมีหลายคุณสมบัติที่ต้องเทียบข้ามแถว',
      'ผู้ใช้ต้องเรียงลำดับ กรอง หรือเลือกหลายรายการพร้อมกัน',
    ],
    avoidWhen: [
      'มีข้อมูลไม่เกินสองคุณสมบัติต่อรายการ ใช้ List อ่านง่ายกว่า',
      'ต้องอ่านบนจอมือถือเป็นหลัก ควรยุบเป็นการ์ดแทน',
    ],
    anatomy: [
      { part: 'พื้นหัวตาราง', token: '--color-surface-alt', note: 'ต่างจากพื้นการ์ดเพียงเล็กน้อย เป็นด่านที่ palette อิ่มสีสูงมักพัง' },
      { part: 'เส้นคั่นแถว', token: '--color-border', note: 'เส้นตกแต่ง ไม่ถูกบังคับ 3:1 แต่ต้องมองเห็น' },
      { part: 'ตัวอักษรหัวคอลัมน์', token: '--color-text-muted', note: 'ต้องได้ 4.5:1 บนพื้นหัวตาราง' },
      { part: 'แถวที่ชี้อยู่', token: '--color-primary-soft', note: 'พื้นอ่อนของสีแบรนด์ ต้องไม่กลืนกับ zebra' },
      { part: 'ขอบซ้ายของแถวที่เลือก', token: '--color-primary', note: 'บอกการเลือกด้วยรูปทรง ไม่พึ่งพื้นสีอย่างเดียว' },
    ],
    matrix: {
      states: ['default', 'hover', 'selected'],
      variants: [{ label: 'แถวข้อมูล', cls: '' }],
      render: (cls, state) => {
        const attr = state === 'selected' ? ' aria-selected="true"' : ` data-state="${state}"`;
        return `<div class="ui-table-wrap"><table class="ui-table"><tbody><tr${attr}>`
          + '<td>บริษัท ก.</td><td class="ui-table__num">120,000</td></tr></tbody></table></div>';
      },
    },
    audit: [
      { label: 'ตัวอักษรหัวคอลัมน์ บนพื้นหัวตาราง', fg: '--pv-text-muted', bg: '--pv-surface-alt', min: 4.5 },
      { label: 'ตัวอักษรในเซลล์ บนพื้นการ์ด', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ตัวอักษรในเซลล์ บนแถว zebra', fg: '--pv-text', bg: '--pv-surface-alt', min: 4.5 },
      { label: 'ตัวอักษรในเซลล์ บนแถวที่ชี้อยู่', fg: '--pv-text', bg: '--pv-primary-soft', min: 4.5 },
      { label: 'ขอบซ้ายของแถวที่เลือก บนพื้นการ์ด', fg: '--pv-primary', bg: '--pv-surface', min: 3 },
    ],
  },

  {
    slug: 'toolbar',
    name: 'Table toolbar',
    group: 'data',
    summary: 'แถบค้นหา ตัวกรอง และการกระทำ ที่อยู่เหนือตารางหรือรายการ',
    useWhen: [
      'ตารางมีข้อมูลมากพอที่ผู้ใช้ต้องค้นหาหรือกรองก่อน',
      'มีการกระทำที่ทำกับทั้งชุดข้อมูล เช่น สร้างรายการใหม่หรือส่งออก',
    ],
    avoidWhen: [
      'รายการสั้นจนกวาดตาหาได้เร็วกว่าพิมพ์ค้นหา',
    ],
    anatomy: [
      { part: 'พื้นแถบ', token: '--color-surface', note: 'ระดับเดียวกับการ์ด เพื่อให้อ่านเป็นก้อนเดียวกับตาราง' },
      { part: 'ขอบช่องค้นหา', token: '--color-border-strong', note: 'WCAG 1.4.11 บังคับ 3:1 เพราะต้องเห็นจึงจะรู้ว่าพิมพ์ตรงไหน' },
      { part: 'ตัวกรองที่เลือก', token: '--color-primary-soft + --color-primary-text', note: 'มีเครื่องหมายถูกกำกับ ไม่บอกด้วยสีอย่างเดียว' },
      { part: 'ข้อความชี้แนะในช่องค้นหา', token: '--color-text-subtle', note: 'จางได้ แต่ต้องไม่ใช้แทน label' },
    ],
    matrix: {
      states: ['default', 'hover', 'focus', 'selected'],
      variants: [{ label: 'ตัวกรอง', cls: '' }],
      render: (cls, state) => {
        const pressed = state === 'selected' ? 'true' : 'false';
        const attr = state === 'selected' ? '' : ` data-state="${state}"`;
        return `<button type="button" class="ui-chip" aria-pressed="${pressed}" tabindex="-1"${attr}>รอดำเนินการ</button>`;
      },
    },
    audit: [
      { label: 'ขอบช่องค้นหา บนพื้นแถบ', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'ข้อความตัวกรองที่เลือก บนพื้นอ่อน', fg: '--pv-primary-text', bg: '--pv-primary-soft', min: 4.5 },
      { label: 'ขอบตัวกรองที่เลือก บนพื้นแถบ', fg: '--pv-primary', bg: '--pv-surface', min: 3 },
      { label: 'ข้อความตัวกรองปกติ บนพื้นแถบ', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'pagination',
    name: 'Pagination',
    group: 'data',
    summary: 'แบ่งผลลัพธ์จำนวนมากเป็นหน้า พร้อมบอกว่ากำลังอยู่ตรงไหนของทั้งหมด',
    useWhen: [
      'ผลลัพธ์มากกว่าหนึ่งหน้าจอ และผู้ใช้ต้องกลับมาที่เดิมได้',
      'จำนวนรวมมีความหมายกับผู้ใช้ เช่น งานที่ต้องเคลียร์ให้หมด',
    ],
    avoidWhen: [
      'เป็นฟีดที่ไหลไปเรื่อย ๆ ไม่มีปลายทาง ใช้โหลดเพิ่มดีกว่า',
    ],
    anatomy: [
      { part: 'ข้อความบอกช่วง', token: '--color-text-muted', note: 'ใช้ตัวเลขความกว้างเท่ากันเพื่อไม่ให้ตัวเลขขยับตอนเปลี่ยนหน้า' },
      { part: 'หน้าปัจจุบัน', token: '--color-primary + --color-on-primary', note: 'คู่สีที่พังบ่อยเมื่อผู้ใช้เลือกสีแบรนด์อ่อน' },
      { part: 'ปุ่มหน้าอื่น', token: '--color-surface + --color-border', note: 'ต้องแตะได้อย่างน้อย 28px ตามสเกล control ของระบบ' },
      { part: 'ปุ่มที่ไปต่อไม่ได้', token: 'opacity', note: 'ต้องใช้ disabled จริง ไม่ใช่แค่ทำให้จาง' },
    ],
    matrix: {
      states: ['default', 'hover', 'focus', 'selected', 'disabled'],
      variants: [{ label: 'ปุ่มหน้า', cls: '' }],
      render: (cls, state) => {
        if (state === 'selected') return '<button type="button" class="ui-page" aria-current="page" tabindex="-1">1</button>';
        if (state === 'disabled') return '<button type="button" class="ui-page" tabindex="-1" disabled>1</button>';
        return `<button type="button" class="ui-page" tabindex="-1" data-state="${state}">1</button>`;
      },
    },
    audit: [
      { label: 'ตัวเลขหน้าปัจจุบัน บนพื้นสีแบรนด์', fg: '--pv-on-primary', bg: '--pv-primary', min: 4.5 },
      { label: 'ตัวเลขหน้าอื่น บนพื้นปุ่ม', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ปุ่มหน้าปัจจุบัน บนพื้นหน้า', fg: '--pv-primary', bg: '--pv-bg', min: 3 },
      { label: 'ข้อความบอกช่วง บนพื้นหน้า', fg: '--pv-text-muted', bg: '--pv-bg', min: 4.5 },
    ],
  },

  {
    slug: 'list',
    fill: true,
    name: 'List',
    group: 'data',
    summary: 'รายการที่แต่ละแถวมีตัวตนของตัวเอง เช่น ผู้ใช้ ไฟล์ หรืองานที่ต้องทำ',
    useWhen: [
      'แต่ละรายการมีสองถึงสามข้อมูลที่ต้องเห็นพร้อมกัน',
      'ต้องมีการกระทำประจำแถว เช่น แก้ไขหรือเชิญซ้ำ',
    ],
    avoidWhen: [
      'ต้องเทียบตัวเลขข้ามแถว ใช้ Data table แทน',
    ],
    anatomy: [
      { part: 'พื้นรายการ', token: '--color-surface', note: 'พื้นชั้นที่สองเหนือพื้นหน้า' },
      { part: 'วงกลมตัวย่อ', token: '--color-primary-soft + --color-primary-text', note: 'ตัวอักษรเล็กบนพื้นอ่อน ต้องผ่าน 4.5:1' },
      { part: 'ชื่อรายการ', token: '--color-text', note: 'น้ำหนักตัวอักษรแยกลำดับ ไม่ใช้สีแยกอย่างเดียว' },
      { part: 'ข้อมูลรอง', token: '--color-text-muted', note: 'จุดที่ palette กลาง ๆ มักตกเกณฑ์' },
      { part: 'แถวที่ชี้อยู่', token: '--color-surface-alt', note: 'ต่างจากพื้นปกติเพียงเล็กน้อย' },
    ],
    matrix: {
      states: ['default', 'hover'],
      variants: [{ label: 'แถวรายการ', cls: '' }],
      render: (cls, state) => '<ul class="ui-list"><li class="ui-list__item"'
        + (state === 'default' ? '' : ` data-state="${state}"`)
        + '><span class="ui-list__avatar" aria-hidden="true">สม</span>'
        + '<div class="ui-list__body"><span class="ui-list__title">สมชาย</span>'
        + '<span class="ui-list__meta">12 เอกสาร</span></div></li></ul>',
    },
    audit: [
      { label: 'ชื่อรายการ บนพื้นรายการ', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ข้อมูลรอง บนพื้นรายการ', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ตัวย่อในวงกลม บนพื้นอ่อนของแบรนด์', fg: '--pv-primary-text', bg: '--pv-primary-soft', min: 4.5 },
      { label: 'ข้อมูลรอง บนแถวที่ชี้อยู่', fg: '--pv-text-muted', bg: '--pv-surface-alt', min: 4.5 },
    ],
  },

  {
    slug: 'badge',
    name: 'Status badge',
    group: 'data',
    summary: 'ป้ายสั้นที่บอกสถานะของรายการ อ่านได้ในพริบตาโดยไม่ต้องเปิดเข้าไปดู',
    useWhen: [
      'สถานะมีจำนวนจำกัดและตายตัว เช่น เสร็จแล้ว รอดำเนินการ เลยกำหนด',
      'ต้องกวาดตาหาแถวที่ผิดปกติในตารางยาว ๆ',
    ],
    avoidWhen: [
      'ข้อความยาวเกินสามคำ ควรใช้ข้อความปกติ',
      'ใช้แทนปุ่ม — ป้ายไม่ใช่ของที่กดได้',
    ],
    anatomy: [
      { part: 'พื้นป้าย', token: '--color-{role}-soft', note: 'พื้นอ่อนที่คำนวณจาก hue ของบทบาทนั้น' },
      { part: 'ตัวอักษร', token: '--color-on-{role}-soft', note: 'เลือกขั้นสีที่ผ่าน 4.5:1 บนพื้นอ่อนนั้นโดยเฉพาะ' },
      { part: 'ขอบ', token: 'currentColor', note: 'ผูกกับสีตัวอักษร จึงผ่านคอนทราสต์ไปพร้อมกันเสมอ' },
      { part: 'จุดนำหน้า', token: 'currentColor', note: 'ทำให้แยกสถานะได้แม้แยกเฉดสีไม่ออก (WCAG 1.4.1)' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'Neutral', cls: '' },
        { label: 'Success', cls: 'ui-badge--success' },
        { label: 'Warning', cls: 'ui-badge--warning' },
        { label: 'Danger', cls: 'ui-badge--danger' },
        { label: 'Info', cls: 'ui-badge--info' },
        { label: 'Brand', cls: 'ui-badge--brand' },
      ],
      render: (cls) => `<span class="ui-badge ${cls}"><span class="ui-badge__dot" aria-hidden="true"></span>สถานะ</span>`,
    },
    audit: [
      { label: 'ข้อความสำเร็จ บนพื้นอ่อน', fg: '--pv-on-success-soft', bg: '--pv-success-soft', min: 4.5 },
      { label: 'ข้อความเตือน บนพื้นอ่อน', fg: '--pv-on-warning-soft', bg: '--pv-warning-soft', min: 4.5 },
      { label: 'ข้อความอันตราย บนพื้นอ่อน', fg: '--pv-on-danger-soft', bg: '--pv-danger-soft', min: 4.5 },
      { label: 'ข้อความข้อมูล บนพื้นอ่อน', fg: '--pv-on-info-soft', bg: '--pv-info-soft', min: 4.5 },
      { label: 'ข้อความป้ายกลาง บนพื้นสำรอง', fg: '--pv-text-muted', bg: '--pv-surface-alt', min: 4.5 },
    ],
  },

  {
    slug: 'button',
    name: 'Button',
    group: 'form',
    summary: 'ตัวสั่งให้ระบบทำอะไรสักอย่าง ลำดับความสำคัญบอกด้วยรูปแบบ ไม่ใช่ขนาด',
    useWhen: [
      'เป็นการกระทำที่เกิดขึ้นในหน้านี้ เช่น บันทึก ส่ง ลบ',
      'ต้องการให้ผู้ใช้เห็นทางออกหลักของหน้าได้ทันที',
    ],
    avoidWhen: [
      'เป็นการพาไปหน้าอื่น ควรใช้ลิงก์เพื่อให้เปิดแท็บใหม่ได้',
      'มีปุ่ม primary มากกว่าหนึ่งในพื้นที่เดียว จะไม่เหลือลำดับความสำคัญ',
    ],
    anatomy: [
      { part: 'พื้นปุ่ม', token: '--color-primary', note: 'สีแบรนด์ตรงที่ผู้ใช้เลือก' },
      { part: 'ตัวอักษรบนปุ่ม', token: '--color-on-primary', note: 'คู่ที่พังบ่อยที่สุดเมื่อเลือกสีแบรนด์อ่อน ระบบเลือกขาว-ดำให้อัตโนมัติ' },
      { part: 'พื้นตอนชี้', token: '--color-primary-hover', note: 'ขั้นถัดไปในสเกล ไม่ใช่การใส่ opacity' },
      { part: 'วงแหวนโฟกัส', token: '--color-primary-ring', note: 'ต้องเห็นชัดสำหรับผู้ใช้คีย์บอร์ด อยู่นอกขอบปุ่ม 2px' },
      { part: 'ขอบปุ่มรอง', token: '--color-border-strong', note: 'ปุ่มที่ไม่มีพื้น ต้องพึ่งขอบให้ผ่าน 3:1' },
    ],
    matrix: {
      states: ['default', 'hover', 'active', 'focus', 'disabled'],
      variants: [
        { label: 'Primary', cls: '' },
        { label: 'Secondary', cls: 'ui-btn--secondary' },
        { label: 'Ghost', cls: 'ui-btn--ghost' },
        { label: 'Danger', cls: 'ui-btn--danger' },
      ],
      render: (cls, state) => {
        const disabled = state === 'disabled' ? ' disabled' : '';
        return `<button type="button" class="ui-btn ${cls}" tabindex="-1" data-state="${state}"${disabled}>ปุ่ม</button>`;
      },
    },
    audit: [
      { label: 'ตัวอักษรบนปุ่มหลัก', fg: '--pv-on-primary', bg: '--pv-primary', min: 4.5 },
      { label: 'ตัวอักษรบนปุ่มหลักตอนชี้', fg: '--pv-on-primary', bg: '--pv-primary-hover', min: 4.5 },
      { label: 'ตัวอักษรบนปุ่มอันตราย', fg: '--pv-on-danger', bg: '--pv-danger', min: 4.5 },
      { label: 'ตัวอักษรปุ่มรอง บนพื้นการ์ด', fg: '--pv-primary-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ขอบปุ่มรอง บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'วงแหวนโฟกัส บนพื้นหน้า', fg: '--pv-primary-ring', bg: '--pv-bg', min: 3 },
      { label: 'พื้นปุ่มหลัก บนพื้นหน้า', fg: '--pv-primary', bg: '--pv-bg', min: 3 },
    ],
  },

  {
    slug: 'field',
    fill: true,
    name: 'Form field',
    group: 'form',
    summary: 'ช่องกรอกพร้อมป้ายกำกับ คำอธิบาย และข้อความผิดพลาดที่ผูกกันด้วย aria',
    useWhen: [
      'ต้องรับข้อมูลจากผู้ใช้ทุกกรณี',
    ],
    avoidWhen: [
      'ใช้ placeholder แทน label — ข้อความจะหายไปตอนพิมพ์และคอนทราสต์ต่ำเกินไป',
    ],
    anatomy: [
      { part: 'ป้ายกำกับ', token: '--color-text', note: 'ต้องผูกกับช่องด้วย for และ id เสมอ' },
      { part: 'ขอบช่อง', token: '--color-border-strong', note: 'ที่เดียวที่ WCAG 1.4.11 ขอบ 3:1 ถูกทดสอบจริง' },
      { part: 'พื้นช่อง', token: '--color-surface', note: 'ต้องต่างจากพื้นหน้าให้เห็นว่าเป็นช่องกรอก' },
      { part: 'ข้อความชี้แนะ', token: '--color-text-subtle', note: 'จางที่สุดที่ยอมได้ ห้ามใส่ข้อมูลจำเป็นไว้ตรงนี้' },
      { part: 'คำอธิบายใต้ช่อง', token: '--color-text-muted', note: 'ผูกด้วย aria-describedby' },
      { part: 'ข้อความผิดพลาด', token: '--color-danger-text', note: 'มีไอคอนคู่เสมอ เพราะสีอย่างเดียวไม่พอ (1.4.1)' },
    ],
    matrix: {
      states: ['default', 'focus', 'error', 'disabled'],
      variants: [{ label: 'ช่องข้อความ', cls: '' }],
      render: (cls, state) => {
        const disabled = state === 'disabled' ? ' disabled' : '';
        return `<input class="ui-input" type="text" value="ข้อความ" tabindex="-1" data-state="${state}"${disabled} aria-label="ตัวอย่างช่องกรอก">`;
      },
    },
    audit: [
      { label: 'ขอบช่องกรอก บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'ข้อความที่พิมพ์ บนพื้นช่อง', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'คำอธิบายใต้ช่อง บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ข้อความผิดพลาด บนพื้นการ์ด', fg: '--pv-danger-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ขอบช่องที่ผิดพลาด บนพื้นการ์ด', fg: '--pv-danger', bg: '--pv-surface', min: 3 },
      { label: 'วงแหวนโฟกัส บนพื้นการ์ด', fg: '--pv-primary-ring', bg: '--pv-surface', min: 3 },
    ],
  },

  {
    slug: 'empty',
    fill: true,
    name: 'Empty state',
    group: 'feedback',
    summary: 'สิ่งที่ผู้ใช้เห็นเมื่อยังไม่มีข้อมูล ต้องบอกด้วยว่าทำอะไรต่อได้',
    useWhen: [
      'ยังไม่มีข้อมูลเลย หรือกรองแล้วไม่พบ',
      'ต้องการชวนให้ผู้ใช้สร้างรายการแรก',
    ],
    avoidWhen: [
      'ข้อมูลกำลังโหลดอยู่ ให้ใช้ Skeleton แทน ไม่งั้นผู้ใช้เข้าใจผิดว่าไม่มีข้อมูล',
    ],
    anatomy: [
      { part: 'กรอบเส้นประ', token: '--color-border-strong', note: 'บอกว่าเป็นพื้นที่ที่จะมีของมาอยู่ ไม่ใช่กล่องเสีย' },
      { part: 'ไอคอน', token: '--color-text-subtle', note: 'จางได้เพราะเป็นภาพประกอบ ไม่ได้ถือข้อมูล' },
      { part: 'หัวข้อ', token: '--color-text', note: 'บอกสถานการณ์ ไม่ใช่คำว่า "ไม่มีข้อมูล" ลอย ๆ' },
      { part: 'คำอธิบาย', token: '--color-text-muted', note: 'กว้างไม่เกิน 42 ตัวอักษรเพื่อให้อ่านจบในสายตาเดียว' },
    ],
    matrix: {
      states: ['default'],
      variants: [{ label: 'สถานะว่าง', cls: '' }],
      render: () => '<div class="ui-empty"><p class="ui-empty__title">ยังไม่มีรายการ</p>'
        + '<p class="ui-empty__text">สร้างรายการแรกได้เลย</p></div>',
    },
    audit: [
      { label: 'หัวข้อ บนพื้นการ์ด', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'คำอธิบาย บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'กรอบเส้นประ บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
    ],
  },

  {
    slug: 'skeleton',
    fill: true,
    name: 'Skeleton',
    group: 'feedback',
    summary: 'โครงร่างระหว่างรอข้อมูล บอกล่วงหน้าว่าของที่กำลังมาหน้าตาประมาณไหน',
    useWhen: [
      'การโหลดใช้เวลาเกินราวหนึ่งวินาที และรู้โครงหน้าล่วงหน้าแล้ว',
    ],
    avoidWhen: [
      'ไม่รู้ว่าผลลัพธ์จะมีกี่แถวหรือหน้าตาแบบไหน จะกลายเป็นการหลอกตา',
      'การรอสั้นมากจนภาพกะพริบ',
    ],
    anatomy: [
      { part: 'แถบพื้น', token: '--color-surface-alt', note: 'พื้นชั้นรอง ต้องเห็นต่างจากพื้นการ์ดจริง' },
      { part: 'แสงกวาด', token: '--color-border', note: 'ต่างจากพื้นเพียงเล็กน้อย ถ้าต่างมากจะกลายเป็นของกะพริบ' },
      { part: 'ข้อความสำหรับโปรแกรมอ่านหน้าจอ', token: 'aria-live', note: 'ผู้ใช้ที่มองไม่เห็นต้องรู้ว่ากำลังโหลด' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'แถบข้อความ', cls: 'ui-skeleton--text' },
        { label: 'แถบสั้น', cls: 'ui-skeleton--short' },
        { label: 'วงกลม', cls: 'ui-skeleton--circle' },
      ],
      render: (cls) => `<span class="ui-skeleton ${cls}" style="display:block"></span>`,
    },
    audit: [
      { label: 'แสงกวาด บนแถบพื้น', fg: '--pv-border', bg: '--pv-surface-alt', min: 1.1 },
      { label: 'แถบพื้น บนพื้นการ์ด', fg: '--pv-surface-alt', bg: '--pv-surface', min: 1.05 },
    ],
  },

  {
    slug: 'navbar',
    name: 'Navigation bar',
    group: 'nav',
    summary: 'แถบบนสุดของเว็บ บอกว่าอยู่ที่ไหน ไปไหนต่อได้ และมีปุ่มหลักอะไร',
    useWhen: [
      'เว็บมีหน้าระดับบนไม่เกินราวเจ็ดหน้า และผู้ใช้ต้องสลับไปมาบ่อย',
      'ต้องการให้แบรนด์กับปุ่มหลักอยู่ในสายตาตลอดเวลา',
    ],
    avoidWhen: [
      'เมนูระดับบนเกินเจ็ดรายการหรือมีเมนูย่อยหลายชั้น ให้ใช้ Side navigation แทน',
      'หน้าจอเป็นงานเต็มจอที่ต้องการพื้นที่แนวตั้งทุกพิกเซล',
    ],
    anatomy: [
      { part: 'พื้นแถบ', token: '--color-surface', note: 'ระดับเดียวกับการ์ด แยกจากพื้นหน้าด้วยเส้นล่าง ไม่ใช่ด้วยเงา' },
      { part: 'เส้นล่าง', token: '--color-border', note: 'ตัวคั่นที่ทำให้แถบยังอ่านออกเมื่อเลื่อนหน้าแล้วเนื้อหาไหลผ่านใต้' },
      { part: 'เมนูปกติ', token: '--color-text-muted', note: 'ต้องได้ 4.5:1 บนพื้นแถบ' },
      { part: 'เมนูของหน้าที่เปิดอยู่', token: '--color-primary-soft + --color-primary-text', note: 'มีขีดใต้กำกับด้วย ไม่บอกตำแหน่งด้วยสีอย่างเดียว' },
      { part: 'จุดแจ้งเตือน', token: '--color-danger', note: 'เป็นภาพประกอบ ข้อความจริงอยู่ใน aria-label ของปุ่ม' },
    ],
    matrix: {
      states: ['default', 'hover', 'focus', 'selected'],
      variants: [{ label: 'เมนู', cls: '' }],
      render: (cls, state) => {
        const current = state === 'selected' ? ' aria-current="page"' : ` data-state="${state}"`;
        return `<span class="ui-navbar" style="border:0;padding:0;background:none">`
          + `<span class="ui-navbar__link"${current}>รายการ</span></span>`;
      },
    },
    audit: [
      { label: 'เมนูปกติ บนพื้นแถบ', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'เมนูที่เปิดอยู่ บนพื้นอ่อน', fg: '--pv-primary-text', bg: '--pv-primary-soft', min: 4.5 },
      { label: 'ขีดใต้เมนูที่เปิดอยู่ บนพื้นแถบ', fg: '--pv-primary', bg: '--pv-surface', min: 3 },
      { label: 'ชื่อแบรนด์ บนพื้นแถบ', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'sidebar',
    fill: true,
    name: 'Side navigation',
    group: 'nav',
    summary: 'เมนูด้านข้างของงานหลังบ้าน แบ่งเป็นกลุ่มได้ และบอกจำนวนงานค้างได้',
    useWhen: [
      'มีหน้าให้ไปมากกว่าเจ็ดหน้า หรือต้องจัดเป็นกลุ่มตามหน้าที่',
      'ผู้ใช้ทำงานอยู่ในระบบนาน ๆ และต้องสลับหน้าตลอดวัน',
    ],
    avoidWhen: [
      'เว็บแนะนำสินค้าที่มีไม่กี่หน้า แถบบนอ่านง่ายกว่า',
      'จอกว้างไม่ถึงราว 900px โดยไม่มีแผนพับเมนู',
    ],
    anatomy: [
      { part: 'หัวข้อกลุ่ม', token: '--color-text-muted', note: 'เป็นป้ายกำกับ แต่ยังต้องอ่านออก จึงใช้ muted ไม่ใช่ subtle' },
      { part: 'รายการปกติ', token: '--color-text-muted', note: 'ต้องได้ 4.5:1 บนพื้นเมนู' },
      { part: 'รายการที่เปิดอยู่', token: '--color-primary-soft + --color-primary-text', note: 'มีแถบซ้ายกำกับด้วย เพราะพื้นอ่อนหายไปในธีมมืดบางชุดสี' },
      { part: 'ตัวเลขงานค้าง', token: '--color-surface-alt', note: 'ตัวเลขที่ต้องรีบใช้พื้น danger-soft แทน' },
      { part: 'รายการที่ปิดใช้งาน', token: 'opacity 0.5', note: 'ยังเห็นว่ามีเมนูนี้ เพื่อให้รู้ว่าต้องขอสิทธิ์เพิ่ม' },
    ],
    matrix: {
      states: ['default', 'hover', 'focus', 'selected', 'disabled'],
      variants: [{ label: 'รายการเมนู', cls: '' }],
      render: (cls, state) => {
        const attr = state === 'selected' ? ' aria-current="page"' : ` data-state="${state}"`;
        return `<span class="ui-sidenav" style="border:0;padding:0;background:none">`
          + `<span class="ui-sidenav__item"${attr}>รายการ<span class="ui-sidenav__count">12</span></span></span>`;
      },
    },
    audit: [
      { label: 'รายการปกติ บนพื้นเมนู', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'หัวข้อกลุ่ม บนพื้นเมนู', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'รายการที่เปิดอยู่ บนพื้นอ่อน', fg: '--pv-primary-text', bg: '--pv-primary-soft', min: 4.5 },
      { label: 'แถบซ้ายของรายการที่เปิดอยู่ บนพื้นเมนู', fg: '--pv-primary', bg: '--pv-surface', min: 3 },
      { label: 'ตัวเลขงานค้าง บนพื้นอ่อนสีอันตราย', fg: '--pv-on-danger-soft', bg: '--pv-danger-soft', min: 4.5 },
    ],
  },

  {
    slug: 'breadcrumb',
    name: 'Breadcrumb',
    group: 'nav',
    summary: 'เส้นทางบอกว่าหน้านี้อยู่ชั้นไหนของโครงสร้าง และย้อนขึ้นไปได้แค่ไหน',
    useWhen: [
      'โครงสร้างลึกตั้งแต่สามชั้นขึ้นไป และผู้ใช้เข้ามาจากลิงก์ตรงได้',
      'ผู้ใช้ต้องย้อนกลับไปชั้นบนบ่อยกว่ากลับไปหน้าแรก',
    ],
    avoidWhen: [
      'เว็บแบนราบชั้นเดียว เส้นทางจะกลายเป็นของประดับ',
      'ใช้แทนปุ่มย้อนกลับของขั้นตอนที่ทำอยู่ ซึ่งเป็นคนละความหมาย',
    ],
    anatomy: [
      { part: 'ลิงก์ระดับบน', token: '--color-text-muted', note: 'กดได้ ต้องมีขีดใต้ตอนชี้ ไม่บอกด้วยสีอย่างเดียว' },
      { part: 'ตัวคั่น', token: '--color-text-muted', note: 'ซ่อนจากโปรแกรมอ่านหน้าจอด้วย aria-hidden แต่ยังต้องเห็นด้วยตา' },
      { part: 'ระดับปัจจุบัน', token: '--color-text', note: 'ไม่ใช่ลิงก์ และมี aria-current="page"' },
    ],
    matrix: {
      states: ['default', 'hover', 'focus'],
      variants: [{ label: 'ลิงก์ระดับบน', cls: '' }],
      render: (cls, state) => `<span class="ui-crumb"><span class="ui-crumb__link" data-state="${state}">รายการ</span></span>`,
    },
    audit: [
      { label: 'ลิงก์ระดับบน บนพื้นหน้า', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ระดับปัจจุบัน บนพื้นหน้า', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ตัวคั่น บนพื้นหน้า', fg: '--pv-text-muted', bg: '--pv-surface', min: 3 },
    ],
  },

  {
    slug: 'tabs',
    fill: true,
    name: 'Tabs',
    group: 'nav',
    summary: 'สลับมุมมองของข้อมูลชุดเดียวกัน โดยไม่เปลี่ยนหน้าและไม่เสียตำแหน่งที่อ่านอยู่',
    useWhen: [
      'เนื้อหาชุดเดียวกันมีหลายมุมมอง และดูทีละมุมมองก็พอ',
      'จำนวนแท็บไม่เกินราวห้าอัน และชื่อสั้นพอไม่ต้องตัดคำ',
    ],
    avoidWhen: [
      'เนื้อหาแต่ละแท็บไม่เกี่ยวกัน ควรเป็นคนละหน้าเพื่อให้ลิงก์ตรงได้',
      'ผู้ใช้ต้องเทียบข้อมูลข้ามแท็บ เพราะจะต้องสลับกลับไปกลับมา',
    ],
    anatomy: [
      { part: 'แท็บปกติ', token: '--color-text-muted', note: 'ต้องได้ 4.5:1 บนพื้นหน้า' },
      { part: 'แท็บที่เลือก', token: '--color-primary-text', note: 'มีขีดใต้กำกับ ไม่บอกด้วยสีอย่างเดียว' },
      { part: 'ขีดใต้', token: '--color-primary', note: 'WCAG 1.4.11 บังคับ 3:1 เพราะเป็นตัวบอกสถานะ' },
      { part: 'เส้นฐาน', token: '--color-border', note: 'ทำให้แถวแท็บอ่านเป็นแถวเดียวกันแม้ชื่อยาวไม่เท่ากัน' },
      { part: 'ตัวเลขกำกับ', token: '--color-surface-alt', note: 'บอกปริมาณก่อนกด ลดการกดเข้าไปเจอหน้าว่าง' },
    ],
    matrix: {
      states: ['default', 'hover', 'focus', 'selected', 'disabled'],
      variants: [{ label: 'แท็บ', cls: '' }],
      render: (cls, state) => {
        const selected = state === 'selected' ? 'true' : 'false';
        const extra = state === 'disabled' ? ' disabled' : '';
        const attr = state === 'selected' ? '' : ` data-state="${state}"`;
        return `<span class="ui-tabs__list" style="border:0"><button type="button" class="ui-tab" role="tab" tabindex="-1" aria-selected="${selected}"${extra}${attr}>รอดำเนินการ</button></span>`;
      },
    },
    audit: [
      { label: 'แท็บปกติ บนพื้นหน้า', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'แท็บที่เลือก บนพื้นหน้า', fg: '--pv-primary-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ขีดใต้แท็บที่เลือก บนพื้นหน้า', fg: '--pv-primary', bg: '--pv-surface', min: 3 },
      { label: 'ตัวเลขกำกับ บนพื้นชั้นรอง', fg: '--pv-text-muted', bg: '--pv-surface-alt', min: 4.5 },
    ],
  },

  {
    slug: 'hero',
    fill: true,
    name: 'Hero',
    group: 'layout',
    summary: 'ส่วนหัวของหน้า บอกในสามวินาทีว่านี่คืออะไร เพื่อใคร และให้กดอะไรต่อ',
    useWhen: [
      'เป็นหน้าแรกที่คนเข้ามาโดยยังไม่รู้จักผลิตภัณฑ์',
      'มีการกระทำหลักหนึ่งอย่างที่อยากให้เกิดมากที่สุด',
    ],
    avoidWhen: [
      'เป็นหน้าที่ผู้ใช้เข้ามาทำงานซ้ำทุกวัน พื้นที่ควรเป็นของข้อมูล',
      'ยังไม่มีประโยคที่บอกคุณค่าได้จริง จะเหลือแค่ภาพใหญ่กับคำสวย',
    ],
    anatomy: [
      { part: 'ป้ายบนหัวข้อ', token: '--color-primary-soft + --color-primary-text', note: 'บอกหมวดหรือของใหม่ ไม่ควรยาวเกินหนึ่งบรรทัด' },
      { part: 'หัวข้อ', token: '--color-text', note: 'ใช้ text-wrap: balance เพื่อไม่ให้บรรทัดสุดท้ายเหลือคำเดียว' },
      { part: 'คำอธิบาย', token: '--color-text-muted', note: 'กว้างไม่เกิน 46 ตัวอักษรต่อบรรทัด' },
      { part: 'ปุ่มหลัก', token: '--color-primary + --color-on-primary', note: 'มีปุ่มหลักได้ปุ่มเดียว ที่เหลือเป็นปุ่มรอง' },
      { part: 'ข้อความยืนยัน', token: '--color-text-muted', note: 'ลดความลังเลก่อนกด เช่น ไม่ต้องผูกบัตร' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'พื้นการ์ด', cls: '' },
        { label: 'พื้นสีแบรนด์', cls: 'ui-hero--brand' },
      ],
      render: (cls) => `<div class="ui-hero ui-hero--center ${cls}" style="padding:16px">`
        + '<div class="ui-hero__text"><h4 class="ui-hero__title" style="font-size:1rem;line-height:1.4rem">ปิดงานทั้งรอบได้ในบ่ายวันเดียว</h4></div></div>',
    },
    audit: [
      { label: 'หัวข้อ บนพื้นการ์ด', fg: '--pv-text', bg: '--pv-surface', min: 3 },
      { label: 'คำอธิบาย บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ป้ายบนหัวข้อ บนพื้นอ่อน', fg: '--pv-primary-text', bg: '--pv-primary-soft', min: 4.5 },
      { label: 'ตัวอักษรบนพื้นสีแบรนด์', fg: '--pv-on-primary', bg: '--pv-primary', min: 4.5 },
    ],
  },

  {
    slug: 'section-head',
    name: 'Section header',
    group: 'layout',
    summary: 'หัวข้อของส่วนหนึ่งในหน้า พร้อมคำอธิบายและปุ่มที่ทำกับส่วนนั้นทั้งก้อน',
    useWhen: [
      'หน้าหนึ่งมีหลายส่วน และต้องบอกว่าแต่ละส่วนคืออะไร',
      'มีการกระทำที่ทำกับทั้งส่วน เช่น เพิ่มรายการหรือส่งออก',
    ],
    avoidWhen: [
      'ส่วนนั้นสั้นจนหัวข้อยาวกว่าเนื้อหา',
    ],
    anatomy: [
      { part: 'ป้ายหมวด', token: '--color-primary-text', note: 'ตัวพิมพ์เล็กเสมอในภาษาไทย ใช้ระยะห่างตัวอักษรแทนการเน้น' },
      { part: 'หัวข้อ', token: '--color-text', note: 'ระดับ h2 หรือ h3 ตามลำดับจริงในหน้า ไม่เลือกจากขนาดตัวอักษร' },
      { part: 'คำอธิบาย', token: '--color-text-muted', note: 'บอกขอบเขตข้อมูลหรือเวลาที่อัปเดตล่าสุด' },
      { part: 'เส้นคั่นล่าง', token: '--color-border', note: 'มีเฉพาะหัวข้อระดับบน หัวข้อย่อยไม่ใส่เพื่อไม่ให้เส้นซ้อนกัน' },
      { part: 'ลิงก์ดูทั้งหมด', token: '--color-primary-text', note: 'มีลูกศรกำกับทิศทาง ไม่บอกด้วยสีอย่างเดียว' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'หัวข้อหลัก', cls: '' },
        { label: 'หัวข้อย่อย', cls: 'ui-sechead--sub' },
      ],
      render: (cls) => `<div class="ui-sechead ${cls}"><div class="ui-sechead__text">`
        + '<span class="ui-sechead__title ui-sechead__title--sm">รายการรอบนี้</span>'
        + '<span class="ui-sechead__sub">248 ชิ้น</span></div></div>',
    },
    audit: [
      { label: 'หัวข้อ บนพื้นหน้า', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'คำอธิบาย บนพื้นหน้า', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ป้ายหมวด บนพื้นหน้า', fg: '--pv-primary-text', bg: '--pv-surface', min: 4.5 },
      { label: 'เส้นคั่นล่าง บนพื้นหน้า', fg: '--pv-border', bg: '--pv-surface', min: 1.2 },
    ],
  },

  {
    slug: 'card',
    fill: true,
    name: 'Content card',
    group: 'layout',
    summary: 'กล่องเนื้อหาที่อ่านจบได้ในตัวเอง ใช้เรียงเป็นตารางเพื่อให้เทียบกันได้',
    useWhen: [
      'แต่ละรายการมีทั้งหัวข้อ คำอธิบาย และการกระทำของตัวเอง',
      'ผู้ใช้กวาดตาเลือกมากกว่าอ่านเรียงทีละบรรทัด',
    ],
    avoidWhen: [
      'ข้อมูลเป็นตัวเลขที่ต้องเทียบกันตรง ๆ ใช้ตารางแม่นกว่า',
      'เนื้อหาแต่ละใบยาวไม่เท่ากันมาก จนแถวการ์ดสูงเหลื่อมกันทั้งหน้า',
    ],
    anatomy: [
      { part: 'ขอบการ์ด', token: '--color-border', note: 'ใช้ขอบแทนเงาเป็นหลัก เพราะเงาหลายใบต่อกันทำให้หน้าดูขุ่น' },
      { part: 'พื้นหัวการ์ด', token: '--color-surface-alt', note: 'ที่ของภาพจริง ถ้ายังไม่มีให้ใช้สัญลักษณ์แทน' },
      { part: 'หัวข้อ', token: '--color-text', note: 'สั้นพอจบในสองบรรทัดเมื่อการ์ดแคบสุด' },
      { part: 'คำอธิบาย', token: '--color-text-muted', note: 'ต้องได้ 4.5:1 บนพื้นการ์ด' },
      { part: 'แถบท้าย', token: '--color-surface-alt', note: 'แยกข้อมูลประกอบออกจากเนื้อหา ทำให้ปุ่มอยู่ระดับเดียวกันทุกใบ' },
      { part: 'ขอบของใบที่แนะนำ', token: '--color-primary', note: 'ต้องมีป้ายข้อความคู่ด้วย ไม่ตัดสินด้วยสีอย่างเดียว' },
    ],
    matrix: {
      states: ['default', 'hover', 'focus'],
      variants: [{ label: 'การ์ดที่กดได้', cls: 'ui-card--link' }],
      render: (cls, state) => `<span class="ui-card ${cls}" data-state="${state}" style="max-width:220px">`
        + '<span class="ui-card__body"><span class="ui-card__title">คู่มือเริ่มต้นใช้งาน</span>'
        + '<span class="ui-card__text">อ่านจบใน 5 นาที</span></span></span>',
    },
    audit: [
      { label: 'หัวข้อ บนพื้นการ์ด', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'คำอธิบาย บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ข้อมูลประกอบ บนแถบท้าย', fg: '--pv-text-muted', bg: '--pv-surface-alt', min: 4.5 },
      { label: 'ขอบการ์ด บนพื้นหน้า', fg: '--pv-border', bg: '--pv-bg', min: 1.2 },
      { label: 'ขอบของใบที่แนะนำ บนพื้นหน้า', fg: '--pv-primary', bg: '--pv-surface', min: 3 },
    ],
  },

  {
    slug: 'stat',
    name: 'Stat card',
    group: 'layout',
    summary: 'ตัวเลขตัวเดียวที่ต้องเห็นก่อนใคร พร้อมบอกว่าดีขึ้นหรือแย่ลงเทียบกับอะไร',
    useWhen: [
      'มีตัวชี้วัดไม่เกินราวสี่ตัวที่ต้องเห็นทันทีที่เปิดหน้า',
      'ตัวเลขมีค่าอ้างอิงให้เทียบ เช่น เดือนก่อนหรือเป้าหมาย',
    ],
    avoidWhen: [
      'ตัวเลขไม่มีอะไรให้เทียบ จะเหลือแค่ตัวเลขลอย ๆ ที่ตัดสินใจไม่ได้',
      'มีตัวชี้วัดเกินหกตัว ควรใช้ตารางแทนเพื่อให้เทียบข้ามแถวได้',
    ],
    anatomy: [
      { part: 'ป้ายชื่อ', token: '--color-text-muted', note: 'บอกหน่วยและขอบเขตเวลา เช่น เดือนนี้' },
      { part: 'ตัวเลข', token: '--color-text', note: 'ใช้ tabular-nums ให้หลักตรงกันเมื่อวางหลายใบ' },
      { part: 'ทิศทางที่ดีขึ้น', token: '--color-on-success-soft', note: 'มีลูกศรขึ้นกำกับ ไม่บอกด้วยสีเขียวอย่างเดียว' },
      { part: 'ทิศทางที่แย่ลง', token: '--color-on-danger-soft', note: 'ขึ้นหรือลงจะดีหรือแย่ ขึ้นกับตัวชี้วัด ต้องเขียนคำกำกับ' },
      { part: 'แถบสัดส่วน', token: '--color-primary', note: 'ให้เห็นสัดส่วนโดยไม่ต้องคิดเลขในหัว' },
      { part: 'แถบซ้ายของใบที่ต้องรีบ', token: '--color-danger', note: 'ใช้แถบแทนการเปลี่ยนพื้นทั้งใบ เพื่อให้ตัวเลขยังอ่านง่าย' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'ปกติ', cls: '' },
        { label: 'ต้องรีบดู', cls: 'ui-stat--alert' },
      ],
      render: (cls) => `<span class="ui-stat ${cls}" style="min-width:140px">`
        + '<span class="ui-stat__label">เลยกำหนด</span>'
        + '<span class="ui-stat__value">3<span class="ui-stat__unit">ชิ้น</span></span></span>',
    },
    audit: [
      { label: 'ตัวเลข บนพื้นการ์ด', fg: '--pv-text', bg: '--pv-surface', min: 3 },
      { label: 'ป้ายชื่อ บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ทิศทางที่ดีขึ้น บนพื้นการ์ด', fg: '--pv-on-success-soft', bg: '--pv-surface', min: 4.5 },
      { label: 'ทิศทางที่แย่ลง บนพื้นการ์ด', fg: '--pv-on-danger-soft', bg: '--pv-surface', min: 4.5 },
      { label: 'แถบสัดส่วน บนราง', fg: '--pv-primary', bg: '--pv-surface-alt', min: 3 },
    ],
  },

  {
    slug: 'accordion',
    fill: true,
    name: 'Accordion',
    group: 'layout',
    summary: 'หัวข้อที่กดเปิดดูรายละเอียดได้ ใช้ย่อเนื้อหายาวให้กวาดตาหาได้ก่อน',
    useWhen: [
      'ผู้ใช้ส่วนใหญ่สนใจแค่บางหัวข้อ เช่น คำถามที่พบบ่อย',
      'เนื้อหาแต่ละหัวข้ออ่านจบได้ในตัวเอง ไม่ต้องอ่านเรียงกัน',
    ],
    avoidWhen: [
      'เนื้อหาสำคัญที่ทุกคนต้องอ่าน การซ่อนไว้ทำให้คนพลาด',
      'ต้องเทียบเนื้อหาข้ามหัวข้อ เพราะจะต้องเปิดปิดสลับไปมา',
    ],
    anatomy: [
      { part: 'หัวข้อ', token: '--color-text', note: 'ใช้ summary ของ details จึงได้คีย์บอร์ดและ aria-expanded มาเอง' },
      { part: 'ลูกศร', token: '--color-text-muted', note: 'เป็นตัวบอกสถานะเปิดปิด จึงต้องผ่าน 3:1 ตาม WCAG 1.4.11' },
      { part: 'เนื้อหา', token: '--color-text-muted', note: 'ระยะห่างบรรทัด 1.6 เพราะเป็นย่อหน้าที่ต้องอ่านจริง' },
      { part: 'เส้นคั่นรายการ', token: '--color-border', note: 'ทำให้เห็นว่ามีกี่หัวข้อโดยไม่ต้องเปิดทุกอัน' },
    ],
    matrix: {
      states: ['default', 'hover', 'focus'],
      variants: [{ label: 'หัวข้อ', cls: '' }],
      render: (cls, state) => `<span class="ui-accordion" style="border:0"><span class="ui-accordion__item" style="border:0">`
        + `<span class="ui-accordion__head" data-state="${state}">ยกเลิกกลางคันได้ไหม</span></span></span>`,
    },
    audit: [
      { label: 'หัวข้อ บนพื้นหน้า', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'เนื้อหา บนพื้นหน้า', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ลูกศร บนพื้นหน้า', fg: '--pv-text-muted', bg: '--pv-surface', min: 3 },
    ],
  },

  {
    slug: 'footer',
    fill: true,
    name: 'Footer',
    group: 'layout',
    summary: 'ท้ายเว็บ รวมลิงก์ที่ไม่ได้ใช้ทุกวันแต่ต้องหาเจอ และข้อความตามกฎหมาย',
    useWhen: [
      'เว็บมีหน้ารองหลายหน้าที่ไม่ควรอยู่ในเมนูหลัก',
      'ต้องแสดงข้อความลิขสิทธิ์ นโยบาย หรือข้อมูลบริษัท',
    ],
    avoidWhen: [
      'หน้าจอทำงานที่เลื่อนไม่จบ ท้ายเว็บจะไม่มีวันถูกเห็น',
    ],
    anatomy: [
      { part: 'พื้นท้ายเว็บ', token: '--color-surface', note: 'แยกจากพื้นหน้าด้วยเส้นบน ไม่ใช้ surface-alt เพราะ text-muted บนพื้นนั้นได้แค่ 4.13:1' },
      { part: 'หัวข้อคอลัมน์', token: '--color-text', note: 'เป็นป้ายกำกับ ไม่ใช่ลิงก์ จึงไม่ควรกดได้' },
      { part: 'ลิงก์', token: '--color-text-muted', note: 'ต้องได้ 4.5:1 และมีขีดใต้ตอนชี้' },
      { part: 'บรรทัดลิขสิทธิ์', token: '--color-text-muted', note: 'ตัวเล็กลงได้ แต่ยังต้องผ่าน 4.5:1 เพราะเป็นข้อความ' },
      { part: 'แบบพื้นเข้ม', token: '--color-primary + --color-on-primary', note: 'เขียนคู่สีของตัวเองไว้ เพราะพื้นนี้เข้มเสมอไม่ว่าธีมไหน' },
    ],
    matrix: {
      states: ['default', 'hover', 'focus'],
      variants: [{ label: 'ลิงก์ท้ายเว็บ', cls: '' }],
      render: (cls, state) => `<span class="ui-footer" style="border:0;padding:0;background:none">`
        + `<span class="ui-footer__link" data-state="${state}">นโยบายความเป็นส่วนตัว</span></span>`,
    },
    audit: [
      { label: 'ลิงก์ บนพื้นท้ายเว็บ', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'หัวข้อคอลัมน์ บนพื้นท้ายเว็บ', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'บรรทัดลิขสิทธิ์ บนพื้นท้ายเว็บ', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ตัวอักษรบนพื้นเข้ม', fg: '--pv-on-primary', bg: '--pv-primary', min: 4.5 },
    ],
  },

  {
    slug: 'alert',
    name: 'Alert',
    group: 'feedback',
    summary: 'ข้อความแจ้งผลหรือเตือน ที่อยู่ในหน้าถาวรจนกว่าเรื่องนั้นจะจบ',
    useWhen: [
      'ผลของสิ่งที่ผู้ใช้เพิ่งทำ ต้องอยู่ให้อ่านทันแม้ละสายตาไปแล้ว',
      'มีเงื่อนไขค้างอยู่ที่ต้องจัดการ เช่น เอกสารส่งไม่สำเร็จ',
    ],
    avoidWhen: [
      'เป็นข้อผิดพลาดของช่องกรอกช่องเดียว ให้ใช้ข้อความใต้ช่องนั้นแทน',
      'ข้อความชั่วคราวที่หายเองได้ ใช้ toast จะไม่กินพื้นที่ถาวร',
    ],
    anatomy: [
      { part: 'พื้นกล่อง', token: '--color-*-soft', note: 'พื้นอ่อนของสี่โทน ต้องต่างจากพื้นหน้าพอให้เห็นขอบเขตกล่อง' },
      { part: 'ไอคอนโทน', token: '--color-on-*-soft', note: 'บอกความหมายด้วยรูปทรง สีเป็นตัวเสริมเท่านั้น' },
      { part: 'หัวข้อ', token: '--color-on-*-soft', note: 'ต้องได้ 4.5:1 บนพื้นอ่อนของโทนนั้น' },
      { part: 'ปุ่มในกล่อง', token: '--color-danger / --color-primary', note: 'บอกทางออก ไม่ใช่แค่บอกว่าพัง' },
      { part: 'บทบาท', token: 'role=alert / role=status', note: 'danger ใช้ alert เพราะขัดจังหวะการอ่าน ที่เหลือใช้ status' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'Info', cls: 'ui-alert--info' },
        { label: 'Success', cls: 'ui-alert--success' },
        { label: 'Warning', cls: 'ui-alert--warning' },
        { label: 'Danger', cls: 'ui-alert--danger' },
      ],
      render: (cls) => `<span class="ui-alert ${cls}" style="padding:8px 12px">`
        + '<span class="ui-alert__text"><span class="ui-alert__title">บันทึกเรียบร้อย</span></span></span>',
    },
    audit: [
      { label: 'ข้อความ Info บนพื้นอ่อน', fg: '--pv-on-info-soft', bg: '--pv-info-soft', min: 4.5 },
      { label: 'ข้อความ Success บนพื้นอ่อน', fg: '--pv-on-success-soft', bg: '--pv-success-soft', min: 4.5 },
      { label: 'ข้อความ Warning บนพื้นอ่อน', fg: '--pv-on-warning-soft', bg: '--pv-warning-soft', min: 4.5 },
      { label: 'ข้อความ Danger บนพื้นอ่อน', fg: '--pv-on-danger-soft', bg: '--pv-danger-soft', min: 4.5 },
      { label: 'พื้นอ่อน Danger บนพื้นการ์ด', fg: '--pv-danger-soft', bg: '--pv-surface', min: 1.1 },
    ],
  },

  {
    slug: 'modal',
    fill: true,
    name: 'Modal dialog',
    group: 'feedback',
    summary: 'หน้าต่างที่หยุดงานอื่นไว้ก่อน ใช้ยืนยันสิ่งที่ย้อนกลับไม่ได้',
    useWhen: [
      'การกระทำนั้นย้อนกลับไม่ได้ หรือกระทบข้อมูลหลายรายการพร้อมกัน',
      'ต้องการข้อมูลเพิ่มอีกนิดเดียวก่อนทำงานต่อ',
    ],
    avoidWhen: [
      'เนื้อหายาวจนต้องเลื่อนหลายจอ ควรเป็นหน้าเต็มแทน',
      'ใช้บอกข่าวที่ไม่ต้องตัดสินใจ การขัดจังหวะโดยไม่จำเป็นทำให้คนกดปิดทิ้งเป็นนิสัย',
    ],
    anatomy: [
      { part: 'ฉากหลัง', token: 'พื้นทึบแสงจาก --color-text', note: 'ทำให้รู้ว่าข้างหลังกดไม่ได้ ต้องกดแล้วปิดได้ด้วย' },
      { part: 'สัญลักษณ์นำ', token: '--color-danger-soft / --color-primary-soft', note: 'บอกน้ำหนักของเรื่องตั้งแต่ยังไม่อ่านข้อความ' },
      { part: 'หัวข้อ', token: '--color-text', note: 'เขียนเป็นสิ่งที่กำลังจะเกิด ไม่ใช่คำถามว่าแน่ใจไหม' },
      { part: 'เนื้อหา', token: '--color-text-muted', note: 'เลื่อนเองได้ ปุ่มท้ายกล่องจึงไม่หลุดออกนอกจอ' },
      { part: 'แถบปุ่ม', token: '--color-surface-alt', note: 'ปุ่มยืนยันอยู่ขวาสุด ปุ่มยกเลิกเป็นปุ่มรองเสมอ' },
      { part: 'โฟกัส', token: 'aria-modal + focus trap', note: 'โฟกัสต้องวนอยู่ในกล่อง และ Esc ต้องปิดได้' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'ยืนยันทั่วไป', cls: '' },
        { label: 'ยืนยันการทำลาย', cls: 'ui-modal__mark--danger' },
      ],
      render: (cls) => `<span class="ui-modal" style="max-width:210px;box-shadow:none">`
        + `<span class="ui-modal__head" style="padding:12px"><span class="ui-modal__mark ${cls}"></span>`
        + '<span class="ui-modal__heading"><span class="ui-modal__title">ยกเลิกเอกสาร</span></span></span></span>',
    },
    audit: [
      { label: 'หัวข้อ บนพื้นกล่อง', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'เนื้อหา บนพื้นกล่อง', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'สัญลักษณ์อันตราย บนพื้นอ่อน', fg: '--pv-on-danger-soft', bg: '--pv-danger-soft', min: 4.5 },
      { label: 'ปุ่มยืนยันการทำลาย', fg: '--pv-on-danger', bg: '--pv-danger', min: 4.5 },
    ],
  },
];

export const bySlug = (slug) => COMPONENTS.find((item) => item.slug === slug) ?? null;

const cache = new Map();

async function fetchText(url) {
  if (cache.has(url)) return cache.get(url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`โหลดไม่สำเร็จ: ${url} (${response.status})`);
  const text = await response.text();
  cache.set(url, text);
  return text;
}

/** ตัดบล็อกที่คั่นด้วย marker — ใช้ทั้งกับ HTML comment และ CSS comment */
function sliceBlock(source, openMarker, closeMarker) {
  const start = source.indexOf(openMarker);
  if (start === -1) return '';
  const from = start + openMarker.length;
  const end = source.indexOf(closeMarker, from);
  return source.slice(from, end === -1 ? undefined : end).trim();
}

/** ลดระดับการเยื้องของ snippet ให้เริ่มที่คอลัมน์ศูนย์ */
function dedent(text) {
  const lines = text.split('\n');
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^\s*/)[0].length);
  const min = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(min)).join('\n').trim();
}

/**
 * @card คือภาพย่อสำหรับการ์ดในแคตตาล็อกโดยเฉพาะ ไม่ใช่การย่อ @preview ทั้งชิ้น
 * เพราะการย่อของจริงลงในกล่อง 150px ทำให้ตัวอักษรทับกันจนอ่านไม่ออก
 * ถ้าไฟล์ไหนยังไม่มี @card ให้ตกลงมาใช้ @preview เหมือนเดิม
 */
export async function loadMarkup(slug) {
  const raw = await fetchText(`${MARKUP_DIR}/${slug}.html`);
  const preview = dedent(sliceBlock(raw, '<!-- @preview -->', '<!-- @end -->'));
  const card = dedent(sliceBlock(raw, '<!-- @card -->', '<!-- @end -->'));

  return {
    preview,
    card: card || preview,
    variants: dedent(sliceBlock(raw, '<!-- @variants -->', '<!-- @end -->')),
  };
}

export async function loadCatalogCss() {
  return fetchText(CATALOG_CSS);
}

/** CSS ของ component ตัวหนึ่ง = บล็อก _base (reset + token โครงสร้าง) + บล็อกของตัวมันเอง */
export async function loadComponentCss(slug) {
  const css = await loadCatalogCss();
  const base = sliceBlock(css, '/* @component _base */', '/* @end */');
  const own = sliceBlock(css, `/* @component ${slug} */`, '/* @end */');
  return { base, own };
}

/** ชื่อ token ที่ CSS ก้อนนี้อ้างจริง — ใช้ตัดสินว่าจะแนบ token ตัวไหนไปกับโค้ด */
export function collectColorTokens(cssText) {
  const found = new Set();
  const pattern = /var\(\s*(--color-[a-z0-9-]+)/gi;
  let match = pattern.exec(cssText);
  while (match !== null) {
    found.add(match[1]);
    match = pattern.exec(cssText);
  }
  return [...found].sort();
}
