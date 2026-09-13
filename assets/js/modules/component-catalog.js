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

  {
    slug: 'select',
    name: 'Select',
    group: 'form',
    summary: 'ให้เลือกหนึ่งค่าจากรายการที่ระบบกำหนดไว้ ทั้งแบบ select ของเบราว์เซอร์และแบบเปิดรายการค้างไว้',
    useWhen: [
      'ตัวเลือกมีมากกว่าห้าอย่าง จนวางเป็นปุ่มตัวเลือกแล้วกินที่เกินไป',
      'แต่ละตัวเลือกต้องมีข้อมูลประกอบ เช่น ภาระงานของผู้รับผิดชอบ',
    ],
    avoidWhen: [
      'มีตัวเลือกสองถึงห้าอย่างและสั้น ใช้ปุ่มตัวเลือกให้เห็นพร้อมกันดีกว่า',
      'ผู้ใช้ต้องเทียบตัวเลือกกันก่อนตัดสินใจ รายการที่ปิดอยู่ทำให้เทียบไม่ได้',
    ],
    anatomy: [
      { part: 'ขอบช่อง', token: '--color-border-strong', note: 'WCAG 1.4.11 บังคับ 3:1 เพราะต้องเห็นว่ามีช่องให้กด' },
      { part: 'ลูกศรชี้ลง', token: '--color-text', note: 'สัญญาณรูปทรงที่บอกว่ากดแล้วมีรายการ ไม่ได้บอกด้วยสีอย่างเดียว' },
      { part: 'ตัวเลือกที่เลือกอยู่', token: '--color-primary-soft', note: 'มีเครื่องหมายถูกกำกับเสมอ เผื่อผู้ใช้ที่แยกพื้นอ่อนไม่ออก' },
      { part: 'เครื่องหมายถูก', token: '--color-primary-text', note: 'สีแบรนด์ระดับที่อ่านบนพื้นการ์ดได้ 4.5:1' },
      { part: 'ข้อมูลประกอบของตัวเลือก', token: '--color-text-muted', note: 'บนแถวที่เลือกต้องสลับเป็นสีข้อความหลัก เพราะพื้นเปลี่ยนไป' },
    ],
    matrix: {
      states: ['default', 'hover', 'focus', 'disabled'],
      variants: [{ label: 'ช่องเลือก', cls: '' }],
      render: (cls, state) => {
        const attr = state === 'disabled' ? ' disabled' : ` data-state="${state}"`;
        return `<select class="ui-select" tabindex="-1"${attr}><option>รอตรวจสอบ</option></select>`;
      },
    },
    audit: [
      { label: 'ขอบช่องเลือก บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'ค่าที่เลือก บนพื้นช่อง', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ตัวเลือกที่เลือกอยู่ บนพื้นอ่อน', fg: '--pv-text', bg: '--pv-primary-soft', min: 4.5 },
      { label: 'เครื่องหมายถูก บนพื้นอ่อน', fg: '--pv-primary-text', bg: '--pv-primary-soft', min: 3 },
      { label: 'ป้ายค่าที่เลือกหลายค่า', fg: '--pv-on-primary-soft', bg: '--pv-primary-soft', min: 4.5 },
    ],
  },

  {
    slug: 'checkbox',
    name: 'Checkbox & Radio',
    group: 'form',
    summary: 'ตัวเลือกที่เห็นทุกตัวพร้อมกัน ติ๊กได้หลายอันหรือเลือกได้อันเดียว พร้อมสถานะเลือกบางส่วน',
    useWhen: [
      'ตัวเลือกไม่เกินเจ็ดอย่าง และผู้ใช้ควรเห็นทั้งหมดก่อนตัดสินใจ',
      'ต้องเลือกได้หลายอย่างพร้อมกัน หรือมีกลุ่มลูกที่เลือกไม่ครบ',
    ],
    avoidWhen: [
      'ตัวเลือกยาวเกินสิบอย่าง รายการจะยาวจนหาไม่เจอ ใช้ Select แทน',
      'การเลือกมีผลทันทีโดยไม่ต้องกดบันทึก กรณีนั้นเป็นงานของ Switch',
    ],
    anatomy: [
      { part: 'ขอบกล่องตอนยังไม่ติ๊ก', token: '--color-border-strong', note: 'ด่านที่พลาดบ่อยที่สุด ขอบจางเกินไปจะมองไม่เห็นว่ามีช่อง' },
      { part: 'กล่องที่ติ๊กแล้ว', token: '--color-primary + --color-on-primary', note: 'เครื่องหมายถูกต้องอ่านออกบนสีแบรนด์ 4.5:1' },
      { part: 'ขีดกลางของสถานะเลือกบางส่วน', token: '--color-on-primary', note: 'รูปทรงต่างจากเครื่องหมายถูก จึงไม่ต้องพึ่งสี' },
      { part: 'คำอธิบายใต้ชื่อ', token: '--color-text-muted', note: 'ต้องได้ 4.5:1 เพราะเป็นข้อความที่ต้องอ่านจริง' },
      { part: 'ขอบการ์ดตัวเลือกที่เลือก', token: '--color-primary', note: 'ใช้ขอบหนาขึ้นคู่กับวงกลม ไม่ใช้พื้นสีอย่างเดียว' },
    ],
    matrix: {
      states: ['default', 'checked', 'focus', 'disabled'],
      variants: [
        { label: 'ติ๊กได้หลายอัน', cls: 'ui-box' },
        { label: 'เลือกได้อันเดียว', cls: 'ui-dot' },
      ],
      render: (cls, state) => {
        const tick = cls === 'ui-box' && state === 'checked'
          ? '<svg class="ui-icon" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
          : '';
        return `<span class="${cls}" data-state="${state}">${tick}</span>`;
      },
    },
    audit: [
      { label: 'ขอบกล่องตอนยังไม่ติ๊ก บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'เครื่องหมายถูก บนกล่องที่ติ๊กแล้ว', fg: '--pv-on-primary', bg: '--pv-primary', min: 4.5 },
      { label: 'กล่องที่ติ๊กแล้ว บนพื้นการ์ด', fg: '--pv-primary', bg: '--pv-surface', min: 3 },
      { label: 'คำอธิบายใต้ชื่อ บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'switch',
    name: 'Toggle switch',
    group: 'form',
    summary: 'เปิดหรือปิดสิ่งหนึ่งโดยมีผลทันทีที่กด ไม่ต้องรอกดบันทึก',
    useWhen: [
      'ผลของการกดเกิดขึ้นทันทีและย้อนกลับได้ด้วยการกดซ้ำ',
      'เป็นการตั้งค่าที่มีแค่เปิดกับปิด ไม่มีสถานะกลาง',
    ],
    avoidWhen: [
      'ค่าจะมีผลเมื่อกดบันทึกเท่านั้น กรณีนั้นต้องใช้ Checkbox',
      'การเปิดแล้วย้อนกลับไม่ได้ ควรใช้ปุ่มคู่กับกล่องยืนยันแทน',
    ],
    anatomy: [
      { part: 'รางตอนปิด', token: '--color-surface-alt + --color-border-strong', note: 'ต้องเห็นว่ามีสวิตช์อยู่แม้ยังไม่เปิด' },
      { part: 'รางตอนเปิด', token: '--color-primary', note: 'สีแบรนด์ล้วน ตำแหน่งปุ่มเลื่อนเป็นตัวยืนยันอีกชั้น' },
      { part: 'ปุ่มเลื่อน', token: '--color-surface / --color-on-primary', note: 'สลับสีตามรางเพื่อให้ขอบปุ่มไม่หายไปกับพื้น' },
      { part: 'คำอธิบายข้างสวิตช์', token: '--color-text-muted', note: 'ต้องบอกว่าเปิดแล้วเกิดอะไรขึ้น สวิตช์เปล่าไม่บอกอะไรเลย' },
    ],
    matrix: {
      states: ['default', 'checked', 'focus', 'disabled'],
      variants: [{ label: 'สวิตช์', cls: '' }],
      render: (cls, state) => {
        const checked = state === 'checked' ? 'true' : 'false';
        const attr = state === 'disabled' ? ' disabled' : ` data-state="${state}"`;
        return `<button type="button" class="ui-switch" role="switch" aria-checked="${checked}" tabindex="-1"`
          + `${attr} aria-label="ตัวอย่าง"><span class="ui-switch__knob"></span></button>`;
      },
    },
    audit: [
      { label: 'รางตอนปิด บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'ปุ่มเลื่อน บนรางตอนเปิด', fg: '--pv-on-primary', bg: '--pv-primary', min: 3 },
      { label: 'รางตอนเปิด บนพื้นการ์ด', fg: '--pv-primary', bg: '--pv-surface', min: 3 },
      { label: 'คำอธิบาย บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'combobox',
    name: 'Combobox',
    group: 'form',
    summary: 'พิมพ์เพื่อกรองรายการยาว ๆ แล้วเลือกจากผลที่ตรง พร้อมทางออกเมื่อไม่พบ',
    useWhen: [
      'ตัวเลือกมากจนเลื่อนหาไม่ไหว เช่น รายชื่อคู่ค้าหรือรหัสสินค้า',
      'ผู้ใช้รู้คำที่จะพิมพ์อยู่แล้ว การพิมพ์เร็วกว่าการไล่ดู',
    ],
    avoidWhen: [
      'ตัวเลือกน้อยและผู้ใช้ยังไม่รู้ว่ามีอะไรบ้าง ควรเปิดรายการให้เห็นเลย',
      'คำค้นสะกดได้หลายแบบจนหาไม่เจอ ควรมีตัวกรองช่วยแทนการพิมพ์อย่างเดียว',
    ],
    anatomy: [
      { part: 'ขอบช่องพิมพ์', token: '--color-border-strong', note: 'ต้องได้ 3:1 เหมือนช่องกรอกทุกตัว' },
      { part: 'วงแหวนตอนโฟกัส', token: '--color-primary-ring', note: 'ต้องเห็นแม้รายการเปิดคลุมอยู่' },
      { part: 'คำที่ตรงกับที่พิมพ์', token: '--color-warning-soft + --color-on-warning-soft', note: 'บอกว่าทำไมผลนี้ขึ้นมา เป็นพื้นอ่อนที่ยังอ่านออก 4.5:1' },
      { part: 'ตัวที่ลูกศรชี้อยู่', token: '--color-surface-alt', note: 'ต่างจากตัวที่เลือกไว้แล้ว สองสถานะนี้เกิดพร้อมกันได้' },
      { part: 'ข้อความตอนไม่พบ', token: '--color-text-muted', note: 'ต้องมีปุ่มทางออกต่อ ไม่จบแค่บอกว่าไม่พบ' },
    ],
    matrix: {
      states: ['default', 'focus'],
      variants: [{ label: 'ช่องค้นหา', cls: '' }],
      render: (cls, state) => `<span class="ui-combo__control" data-state="${state}" style="max-width:190px">`
        + '<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/>'
        + '<path d="m20 20-3.7-3.7"/></svg><span class="ui-combo__value">บริษัท ก.</span></span>',
    },
    audit: [
      { label: 'ขอบช่องพิมพ์ บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'คำที่ตรงกับที่พิมพ์ บนพื้นเน้น', fg: '--pv-on-warning-soft', bg: '--pv-warning-soft', min: 4.5 },
      { label: 'ข้อมูลประกอบของผลลัพธ์ บนแถวที่ชี้อยู่', fg: '--pv-text-muted', bg: '--pv-surface-alt', min: 4.5 },
      { label: 'เครื่องหมายถูก บนพื้นการ์ด', fg: '--pv-primary-text', bg: '--pv-surface', min: 3 },
    ],
  },

  {
    slug: 'upload',
    fill: true,
    name: 'File upload',
    group: 'form',
    summary: 'พื้นที่ลากไฟล์มาวาง คู่กับรายการไฟล์ที่บอกความคืบหน้าและเหตุผลเมื่อไฟล์ไม่ผ่าน',
    useWhen: [
      'ผู้ใช้ต้องแนบไฟล์ประกอบ และอยากเห็นทันทีว่าไฟล์ไหนขึ้นไปแล้ว',
      'มีเงื่อนไขของไฟล์ที่ต้องบอกล่วงหน้า เช่น นามสกุลหรือขนาดสูงสุด',
    ],
    avoidWhen: [
      'รับไฟล์เดียวและไม่มีเงื่อนไขอะไร ปุ่มเลือกไฟล์ธรรมดาก็พอ',
      'อยู่บนมือถือเป็นหลัก การลากวางทำไม่ได้ ต้องมีปุ่มเลือกไฟล์เสมอ',
    ],
    anatomy: [
      { part: 'ขอบประของพื้นที่รับไฟล์', token: '--color-border-strong', note: 'ต้องได้ 3:1 เพราะเป็นเส้นที่บอกขอบเขตของการกด' },
      { part: 'พื้นตอนลากไฟล์ผ่าน', token: '--color-primary-soft', note: 'เปลี่ยนทั้งพื้นและสไตล์เส้น ไม่พึ่งสีอย่างเดียว' },
      { part: 'เงื่อนไขของไฟล์', token: '--color-text-muted', note: 'ต้องอ่านออกจริง 4.5:1 เพราะเป็นข้อมูลที่ต้องรู้ก่อนเลือกไฟล์' },
      { part: 'ป้ายอัปโหลดเสร็จ', token: '--color-success-soft + --color-on-success-soft', note: 'มีทั้งไอคอนและคำว่าเสร็จ' },
      { part: 'ข้อความไฟล์ไม่ผ่าน', token: '--color-danger-text', note: 'บอกเหตุผลและวิธีแก้ ไม่จบแค่ว่าไม่ผ่าน' },
    ],
    matrix: {
      states: ['default', 'over'],
      variants: [{ label: 'พื้นที่รับไฟล์', cls: '' }],
      render: (cls, state) => `<span class="ui-drop" data-state="${state}" style="padding:12px;max-width:190px">`
        + '<span class="ui-drop__text"><b>ลากไฟล์มาวาง</b></span></span>',
    },
    audit: [
      { label: 'ขอบประ บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'เงื่อนไขของไฟล์ บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ป้ายอัปโหลดเสร็จ บนพื้นอ่อน', fg: '--pv-on-success-soft', bg: '--pv-success-soft', min: 4.5 },
      { label: 'ข้อความไฟล์ไม่ผ่าน บนพื้นการ์ด', fg: '--pv-danger-text', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'stepper',
    name: 'Number stepper',
    group: 'form',
    summary: 'ปรับจำนวนทีละหนึ่งด้วยปุ่มบวกลบ โดยยังพิมพ์ตัวเลขเองได้',
    useWhen: [
      'ค่าที่ปรับเป็นจำนวนเต็มช่วงสั้น เช่น จำนวนชิ้นหรือจำนวนคน',
      'ผู้ใช้มักปรับขึ้นลงทีละหนึ่งจากค่าที่ระบบเสนอไว้',
    ],
    avoidWhen: [
      'ช่วงค่ากว้างมากจนต้องกดหลายสิบครั้ง ใช้ช่องกรอกตัวเลขตรง ๆ',
      'ค่าที่กรอกเป็นทศนิยมหรือมีหน่วยหลายแบบ',
    ],
    anatomy: [
      { part: 'ปุ่มบวกลบ', token: '--color-border-strong + --color-text', note: 'สูง 36px ตามสเกล control ให้กดด้วยนิ้วได้' },
      { part: 'ช่องตัวเลข', token: '--color-surface + --color-text', note: 'เป็น input จริง เพราะพิมพ์เร็วกว่ากดปุ่มหลายสิบครั้ง' },
      { part: 'ปุ่มที่ถึงขีดจำกัด', token: '--color-surface-alt', note: 'ต้อง disabled จริง ไม่ใช่แค่ทำให้จาง' },
      { part: 'หน่วยกำกับ', token: '--color-text-muted', note: 'บอกว่านับเป็นอะไร ลดการกรอกผิดหน่วย' },
    ],
    matrix: {
      states: ['default', 'hover', 'disabled'],
      variants: [{ label: 'ปุ่มเพิ่ม', cls: '' }],
      render: (cls, state) => {
        const attr = state === 'disabled' ? ' disabled' : ` data-state="${state}"`;
        return `<button type="button" class="ui-stepper__btn" tabindex="-1"${attr} aria-label="เพิ่ม">`
          + '<svg class="ui-icon" viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg></button>';
      },
    },
    audit: [
      { label: 'ขอบปุ่ม บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'ตัวเลข บนพื้นช่อง', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ปุ่มที่ถึงขีดจำกัด บนพื้นอ่อน', fg: '--pv-text-muted', bg: '--pv-surface-alt', min: 4.5 },
      { label: 'หน่วยกำกับ บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'slider',
    name: 'Range slider',
    group: 'form',
    summary: 'เลือกค่าในช่วงต่อเนื่องด้วยการเลื่อน พร้อมตัวเลขกำกับค่าที่เลือกอยู่',
    useWhen: [
      'ค่าที่เลือกเป็นช่วงและความแม่นยำระดับหนึ่งก็พอ เช่น งบหรือระยะทาง',
      'ผู้ใช้ได้ประโยชน์จากการเห็นว่าค่าที่เลือกอยู่ตรงไหนของช่วงทั้งหมด',
    ],
    avoidWhen: [
      'ต้องได้ค่าที่แม่นยำ เช่น จำนวนเงินที่โอน ใช้ช่องกรอกตัวเลข',
      'ใช้บนมือถือและช่วงค่าละเอียดมาก การเลื่อนด้วยนิ้วจะพลาดง่าย',
    ],
    anatomy: [
      { part: 'รางที่ยังไม่ถูกเลือก', token: '--color-surface-alt + --color-border-strong', note: 'ต้องเห็นเต็มความยาว ไม่งั้นไม่รู้ว่าเลื่อนได้ถึงไหน' },
      { part: 'ช่วงที่เลือกแล้ว', token: '--color-primary', note: 'ต้องได้ 3:1 กับรางที่เหลือ ไม่ใช่แค่ต่างเฉดกัน' },
      { part: 'ปุ่มเลื่อน', token: '--color-surface + --color-primary', note: 'ขอบหนา 2px ทำให้ปุ่มไม่จมหายไปกับราง' },
      { part: 'ตัวเลขค่าที่เลือก', token: '--color-primary-text', note: 'ตำแหน่งปุ่มบอกได้แค่คร่าว ๆ ตัวเลขคือของจริง' },
      { part: 'ขีดบอกระดับ', token: '--color-border-strong', note: 'ใช้เมื่อค่าที่เลือกได้เป็นขั้น ไม่ต่อเนื่อง' },
    ],
    matrix: {
      states: ['default', 'focus'],
      variants: [{ label: 'แถบเลื่อน', cls: '' }],
      render: (cls, state) => `<span class="ui-slider" style="width:150px"><span class="ui-slider__track" data-state="${state}">`
        + '<span class="ui-slider__fill" style="width:45%"></span>'
        + '<span class="ui-slider__thumb" style="inset-inline-start:45%"></span></span></span>',
    },
    audit: [
      { label: 'รางที่ยังไม่ถูกเลือก บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'ช่วงที่เลือกแล้ว บนรางที่เหลือ', fg: '--pv-primary', bg: '--pv-surface-alt', min: 3 },
      { label: 'ตัวเลขค่าที่เลือก บนพื้นการ์ด', fg: '--pv-primary-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ป้ายปลายราง บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'tag-input',
    name: 'Tag input',
    group: 'form',
    summary: 'ใส่ได้หลายค่าในช่องเดียว ค่าที่ใส่แล้วกลายเป็นป้ายที่ถอดออกได้ทีละอัน',
    useWhen: [
      'ค่าที่กรอกมีได้หลายค่าและไม่รู้จำนวนล่วงหน้า เช่น ป้ายกำกับหรือผู้รับ',
      'ผู้ใช้ต้องเห็นค่าที่ใส่ไปแล้วทั้งหมดพร้อมกัน และถอดออกทีละอันได้',
    ],
    avoidWhen: [
      'ค่าที่เลือกได้ถูกกำหนดไว้แล้วและมีไม่มาก ใช้ปุ่มตัวกรองให้เห็นทุกตัวดีกว่า',
      'ลำดับของค่ามีความหมาย ป้ายที่เรียงตามการพิมพ์จะสื่อลำดับผิด',
    ],
    anatomy: [
      { part: 'ขอบกล่อง', token: '--color-border-strong', note: 'กล่องทั้งใบคือช่องกรอก จึงต้องได้ 3:1' },
      { part: 'วงแหวนตอนโฟกัส', token: '--color-primary-ring', note: 'ต้องอยู่รอบกล่องทั้งใบ ไม่ใช่รอบช่องพิมพ์ที่ซ่อนอยู่ข้างใน' },
      { part: 'ป้ายที่ใส่แล้ว', token: '--color-primary-soft + --color-on-primary-soft', note: 'พื้นอ่อนที่ยังอ่านออก 4.5:1' },
      { part: 'ป้ายที่ยังไม่มีในระบบ', token: '--color-danger-soft + ขอบประ', note: 'ต่างด้วยเส้นด้วย ไม่ใช่สีอย่างเดียว' },
      { part: 'ปุ่มถอดป้าย', token: 'currentColor', note: 'สืบสีจากป้าย จึงผ่านคอนทราสต์ไปพร้อมกันเสมอ' },
    ],
    matrix: {
      states: ['default', 'focus'],
      variants: [{ label: 'กล่องป้าย', cls: '' }],
      render: (cls, state) => `<span class="ui-tags" data-state="${state}" style="max-width:190px">`
        + '<span class="ui-tag">การเงิน</span><span class="ui-tags__ghost">เพิ่มป้าย</span></span>',
    },
    audit: [
      { label: 'ขอบกล่อง บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'ป้ายที่ใส่แล้ว บนพื้นอ่อน', fg: '--pv-on-primary-soft', bg: '--pv-primary-soft', min: 4.5 },
      { label: 'ป้ายที่ยังไม่มีในระบบ บนพื้นอ่อน', fg: '--pv-on-danger-soft', bg: '--pv-danger-soft', min: 4.5 },
      { label: 'ข้อความชี้แนะ บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'toast',
    name: 'Toast',
    group: 'feedback',
    summary: 'ข้อความสั้นที่ขึ้นมายืนยันสิ่งที่ผู้ใช้เพิ่งทำ พร้อมทางกลับอย่างปุ่มเลิกทำ',
    useWhen: [
      'ต้องยืนยันผลของการกระทำที่สำเร็จแล้วและไม่ต้องให้ผู้ใช้ทำอะไรต่อ',
      'อยากให้ทางกลับแทนการถามยืนยันก่อนทำ เช่น ลบแล้วค่อยให้กดเลิกทำ',
    ],
    avoidWhen: [
      'ข้อความสำคัญจนพลาดไม่ได้ ควรใช้ Alert ที่อยู่กับที่แทน',
      'ต้องให้ผู้ใช้ตัดสินใจก่อนไปต่อ กรณีนั้นเป็นงานของ Modal',
    ],
    anatomy: [
      { part: 'พื้นกล่อง', token: '--color-surface', note: 'ลอยเหนือเนื้อหา จึงต้องมีทั้งขอบและเงา ไม่ใช่เงาอย่างเดียว' },
      { part: 'ไอคอนสถานะ', token: '--color-primary-text / --color-danger-text', note: 'ระดับที่อ่านบนพื้นการ์ดได้ ไม่ใช่สีฐานที่จ้าเกิน' },
      { part: 'ปุ่มเลิกทำ', token: '--color-primary-text', note: 'มีขีดเส้นใต้ด้วย เพราะสีอย่างเดียวไม่พอบอกว่ากดได้' },
      { part: 'ข้อความประกอบ', token: '--color-text-muted', note: 'เช่นเวลาที่เหลือ ต้องอ่านออกจริง 4.5:1' },
      { part: 'ขอบของแบบล้มเหลว', token: '--color-danger', note: 'อันที่บอกความล้มเหลวต้องไม่หายเอง' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'ยืนยันว่าเสร็จ', cls: '' },
        { label: 'ล้มเหลว', cls: 'ui-toast--danger' },
      ],
      render: (cls) => `<span class="ui-toast ${cls}" style="padding:8px 12px;box-shadow:none;max-width:200px">`
        + '<span class="ui-toast__text">บันทึกแล้ว</span></span>',
    },
    audit: [
      { label: 'ข้อความ บนพื้นกล่อง', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ปุ่มเลิกทำ บนพื้นกล่อง', fg: '--pv-primary-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ไอคอนแบบล้มเหลว บนพื้นกล่อง', fg: '--pv-danger-text', bg: '--pv-surface', min: 3 },
      { label: 'ข้อความประกอบ บนพื้นกล่อง', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'progress',
    name: 'Progress',
    group: 'feedback',
    summary: 'บอกความคืบหน้าของงานที่ใช้เวลา ทั้งแบบรู้ปลายทาง ยังไม่รู้ปลายทาง และแบบวง',
    useWhen: [
      'งานใช้เวลาเกินสิบวินาที และประมาณความคืบหน้าได้',
      'ผู้ใช้ต้องตัดสินใจว่าจะรอต่อหรือไปทำอย่างอื่นก่อน',
    ],
    avoidWhen: [
      'งานเสร็จในไม่กี่วินาที แถบที่แวบขึ้นมาแล้วหายรบกวนมากกว่าช่วย',
      'ไม่รู้จริง ๆ ว่าเหลืออีกเท่าไร อย่าแสร้งบอกเปอร์เซ็นต์ที่ไม่มีอยู่',
    ],
    anatomy: [
      { part: 'รางที่ยังไม่เต็ม', token: '--color-surface-alt + --color-border', note: 'ต้องเห็นความยาวทั้งหมด ไม่งั้นเทียบไม่ได้ว่าไปถึงไหน' },
      { part: 'ส่วนที่คืบหน้าแล้ว', token: '--color-primary', note: 'ต้องได้ 3:1 กับรางที่เหลือ' },
      { part: 'ตัวเลขเปอร์เซ็นต์', token: '--color-primary-text', note: 'ใช้ตัวเลขความกว้างเท่ากัน ตัวเลขจะได้ไม่ขยับตอนนับ' },
      { part: 'สรุปตอนเสร็จ', token: '--color-success-text', note: 'บอกผลจริง เช่น ข้ามไปกี่รายการ ไม่ใช่แค่หลอดเต็ม' },
      { part: 'วงกลมความคืบหน้า', token: '--color-primary + --color-surface-alt', note: 'ใช้เมื่อที่แคบ ตัวเลขอยู่กลางวงเสมอ' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'รู้ปลายทาง', cls: '' },
        { label: 'ยังไม่รู้ปลายทาง', cls: 'ui-bar--indeterminate' },
      ],
      render: (cls) => `<span class="ui-bar ${cls}" style="width:150px">`
        + `<span class="ui-bar__fill" style="width:${cls ? '35' : '62'}%"></span></span>`,
    },
    audit: [
      { label: 'ส่วนที่คืบหน้าแล้ว บนรางที่เหลือ', fg: '--pv-primary', bg: '--pv-surface-alt', min: 3 },
      { label: 'ตัวเลขเปอร์เซ็นต์ บนพื้นการ์ด', fg: '--pv-primary-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ข้อความประกอบ บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'สรุปตอนเสร็จ บนพื้นการ์ด', fg: '--pv-success-text', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'spinner',
    name: 'Spinner',
    group: 'feedback',
    summary: 'บอกว่าระบบกำลังทำงานอยู่ในช่วงสั้น ๆ พร้อมข้อความว่ากำลังรออะไร',
    useWhen: [
      'งานใช้เวลาไม่เกินสิบวินาทีและประมาณความคืบหน้าไม่ได้',
      'ปุ่มที่กดไปแล้วกำลังทำงาน ต้องกันไม่ให้กดซ้ำ',
    ],
    avoidWhen: [
      'รู้โครงของหน้าที่กำลังโหลดอยู่แล้ว ใช้ Skeleton จะรู้สึกเร็วกว่า',
      'งานยาวจนผู้ใช้เริ่มสงสัยว่าค้างไหม ต้องเปลี่ยนไปบอกความคืบหน้า',
    ],
    anatomy: [
      { part: 'วงพื้นหลัง', token: '--color-border-strong', note: 'ต้องได้ 3:1 ไม่งั้นเห็นแค่ขีดเดียววิ่ง ดูเหมือนจอเสีย' },
      { part: 'ขีดที่หมุน', token: '--color-primary', note: 'ต่างจากวงพื้นหลังพอให้เห็นว่าหมุนอยู่' },
      { part: 'ข้อความกำกับ', token: '--color-text', note: 'ต้องบอกว่ากำลังรออะไร วงหมุนเปล่าไม่บอกอะไรเลย' },
      { part: 'กล่องตอนรอนานผิดปกติ', token: '--color-warning-soft + --color-on-warning-soft', note: 'พร้อมปุ่มทางออก ไม่ปล่อยให้หมุนไปเรื่อย ๆ' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'เล็ก', cls: 'ui-spinner--xs' },
        { label: 'ปกติ', cls: '' },
        { label: 'ใหญ่', cls: 'ui-spinner--lg' },
      ],
      render: (cls) => `<span class="ui-spinner ${cls}"></span>`,
    },
    audit: [
      { label: 'วงพื้นหลัง บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'ขีดที่หมุน บนพื้นการ์ด', fg: '--pv-primary', bg: '--pv-surface', min: 3 },
      { label: 'ข้อความกำกับ บนพื้นการ์ด', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ข้อความตอนรอนาน บนพื้นอ่อน', fg: '--pv-on-warning-soft', bg: '--pv-warning-soft', min: 4.5 },
    ],
  },

  {
    slug: 'tooltip',
    name: 'Tooltip',
    group: 'feedback',
    summary: 'คำอธิบายสั้นที่ขึ้นเมื่อชี้หรือโฟกัส ใช้เสริมสิ่งที่เห็นอยู่แล้ว ไม่ใช่แทนที่',
    useWhen: [
      'ปุ่มเป็นไอคอนล้วนและต้องบอกว่ามันทำอะไร',
      'ตัวเลขหรือคำศัพท์ในหน้าต้องการคำขยายสั้น ๆ',
    ],
    avoidWhen: [
      'ข้อมูลนั้นขาดไม่ได้ เพราะบนจอสัมผัสไม่มีการชี้ หลายคนจะไม่เคยเห็น',
      'เนื้อหายาวหรือมีปุ่มให้กดข้างใน กรณีนั้นต้องใช้ Popover',
    ],
    anatomy: [
      { part: 'พื้นกล่องคำอธิบาย', token: '--color-text', note: 'กลับสีกับพื้นหน้า จึงผ่านคอนทราสต์พร้อมกับคู่ text บน surface เสมอ' },
      { part: 'ตัวอักษรในกล่อง', token: '--color-surface', note: 'คู่กับพื้นด้านบน ไม่ต้องคำนวณคู่สีใหม่ทั้งสองธีม' },
      { part: 'ปุ่มเรียกคำอธิบาย', token: '--color-text-muted', note: 'ขนาดกดได้ 28px ตามสเกล control ของระบบ' },
      { part: 'ตัวครอบของปุ่มที่กดไม่ได้', token: '--color-primary-ring', note: 'ปุ่ม disabled รับโฟกัสไม่ได้ ต้องแขวนคำอธิบายไว้กับตัวครอบ' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'อยู่ด้านบน', cls: 'ui-tip--top' },
        { label: 'อยู่ด้านล่าง', cls: 'ui-tip--bottom' },
      ],
      render: (cls) => `<span class="ui-tip ${cls}">ยอดก่อนหักส่วนลด</span>`,
    },
    audit: [
      { label: 'ตัวอักษรในกล่อง บนพื้นกล่อง', fg: '--pv-surface', bg: '--pv-text', min: 4.5 },
      { label: 'ปุ่มเรียกคำอธิบาย บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ข้อความที่ถูกอธิบาย บนพื้นการ์ด', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'rating',
    name: 'Rating',
    group: 'feedback',
    summary: 'ให้และแสดงคะแนนเป็นดาว พร้อมตัวเลขกำกับและการกระจายของคะแนน',
    useWhen: [
      'ต้องสรุปความเห็นจำนวนมากให้เห็นในบรรทัดเดียว',
      'อยากเก็บความเห็นสั้น ๆ หลังผู้ใช้ทำงานเสร็จ',
    ],
    avoidWhen: [
      'ความเห็นมีน้อยจนค่าเฉลี่ยไม่มีความหมาย',
      'สิ่งที่วัดไม่ได้เป็นเส้นตรงห้าระดับ เช่น ความถูกต้องที่มีแค่ใช่กับไม่ใช่',
    ],
    anatomy: [
      { part: 'ดาวที่เลือกแล้ว', token: '--color-warning', note: 'เป็นสีเดียวในระบบที่ใช้กับดาว ไม่ใช้สีแบรนด์เพื่อไม่ให้สับสนกับปุ่ม' },
      { part: 'ดาวที่ยังไม่เลือก', token: '--color-border-strong', note: 'ต้องเห็นว่ามีอยู่ ไม่งั้นไม่รู้ว่าเต็มกี่ดาว' },
      { part: 'ตัวเลขคะแนน', token: '--color-text', note: 'ดาวอย่างเดียวอ่านค่าไม่ได้ ต้องมีตัวเลขคู่เสมอ' },
      { part: 'จำนวนรีวิว', token: '--color-text-muted', note: 'บอกน้ำหนักของคะแนน ค่าเฉลี่ยจาก 3 รีวิวไม่เท่ากับจาก 300' },
      { part: 'แถบการกระจาย', token: '--color-warning', note: 'ใช้สีเดียวกับดาวเพื่อให้อ่านเป็นเรื่องเดียวกัน' },
    ],
    matrix: {
      states: ['default', 'focus'],
      variants: [{ label: 'ปุ่มให้ดาว', cls: '' }],
      render: (cls, state) => `<button type="button" class="ui-rating-btn" tabindex="-1" data-state="${state}" aria-label="ตัวอย่าง">`
        + '<svg class="ui-icon ui-rating__star ui-rating__star--on" viewBox="0 0 24 24">'
        + '<path d="m12 3.8 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.9l5.8-.8z"/></svg></button>',
    },
    audit: [
      { label: 'ดาวที่เลือกแล้ว บนพื้นการ์ด', fg: '--pv-warning', bg: '--pv-surface', min: 3 },
      { label: 'ดาวที่ยังไม่เลือก บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'ตัวเลขคะแนน บนพื้นการ์ด', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'จำนวนรีวิว บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'avatar',
    name: 'Avatar',
    group: 'data',
    summary: 'รูปแทนตัวคน ใช้ตัวอักษรย่อเมื่อไม่มีรูป พร้อมแบบซ้อนกันเป็นทีมและป้ายสถานะ',
    useWhen: [
      'ต้องบอกว่าใครเป็นเจ้าของหรือผู้รับผิดชอบของแต่ละแถว',
      'มีคนหลายคนเกี่ยวข้องกับสิ่งเดียวกัน และอยากบอกจำนวนโดยไม่กินที่',
    ],
    avoidWhen: [
      'ชื่อคนสำคัญกว่าหน้าตา การเขียนชื่อเต็มอ่านได้เร็วกว่า',
      'ผู้ใช้ส่วนใหญ่ไม่ได้ตั้งรูป ตัวอักษรย่อซ้ำ ๆ กันจะกลายเป็นสัญญาณรบกวน',
    ],
    anatomy: [
      { part: 'พื้นวง', token: '--color-accent-N-soft', note: 'มาจากชุดสีเสริมของ palette ไม่ได้สุ่ม คนเดิมจึงได้สีเดิมทุกครั้ง' },
      { part: 'ตัวอักษรย่อ', token: '--color-text', note: 'ต้องอ่านออกบนพื้นอ่อนทุกสีเสริม 4.5:1' },
      { part: 'ขอบตอนซ้อนกัน', token: '--color-surface', note: 'ขอบสีพื้นหน้าเป็นตัวแยกว่าวงไหนจบตรงไหน' },
      { part: 'วงบอกจำนวนที่เหลือ', token: '--color-surface-alt + --color-text-muted', note: 'ต่างจากวงคนจริงชัดเจน' },
      { part: 'จุดสถานะ', token: '--color-success', note: 'ต้องมีคำกำกับ จุดสีอย่างเดียวคือการบอกด้วยสีล้วน' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'เล็ก', cls: 'ui-avatar--xs' },
        { label: 'ปกติ', cls: '' },
        { label: 'ใหญ่', cls: 'ui-avatar--lg' },
      ],
      render: (cls) => `<span class="ui-avatar ${cls}" data-tone="1">ก</span>`,
    },
    audit: [
      { label: 'ตัวอักษรย่อ บนพื้นวง', fg: '--pv-text', bg: '--pv-primary-soft', min: 4.5 },
      { label: 'วงบอกจำนวนที่เหลือ บนพื้นอ่อน', fg: '--pv-text-muted', bg: '--pv-surface-alt', min: 4.5 },
      { label: 'ชื่อคน บนพื้นการ์ด', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ข้อความสถานะ บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'kv-list',
    fill: true,
    name: 'Key-value list',
    group: 'data',
    summary: 'คู่ชื่อกับค่าในหน้ารายละเอียด ใช้เมื่อข้อมูลของสิ่งเดียวไม่ได้เทียบกันข้ามแถว',
    useWhen: [
      'แสดงรายละเอียดของสิ่งเดียว เช่น เอกสารหรือผู้ใช้หนึ่งคน',
      'ค่าแต่ละอันมีชนิดต่างกัน ทั้งข้อความ ตัวเลข และป้ายสถานะ',
    ],
    avoidWhen: [
      'ต้องเทียบหลายรายการกัน ใช้ Data table',
      'มีคู่ข้อมูลเกินสิบห้าคู่ ควรแบ่งเป็นหัวข้อย่อยก่อน',
    ],
    anatomy: [
      { part: 'ชื่อฟิลด์', token: '--color-text-muted', note: 'จางกว่าค่าเพื่อให้ตากวาดหาค่าได้เร็ว แต่ยังต้องได้ 4.5:1' },
      { part: 'ค่า', token: '--color-text', note: 'ตัวเลขใช้ความกว้างเท่ากันเพื่อให้หลักตรงกันเวลาไล่สายตา' },
      { part: 'เส้นคั่นแถว', token: '--color-border', note: 'เส้นตกแต่ง ช่วยจับคู่ชื่อกับค่าที่อยู่คนละฝั่ง' },
      { part: 'ค่าที่ยังไม่มี', token: '--color-text-muted', note: 'ต้องเขียนว่ายังไม่มี ไม่ปล่อยว่างให้เดาว่าโหลดพลาดหรือไม่มีจริง' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'ค่าอยู่ข้างชื่อ', cls: '' },
        { label: 'ค่าอยู่ใต้ชื่อ', cls: 'ui-kv--stack' },
      ],
      render: (cls) => `<span class="ui-kv ${cls}" style="max-width:210px"><span class="ui-kv__row">`
        + '<span class="ui-kv__key">เลขที่เอกสาร</span>'
        + '<span class="ui-kv__val ui-kv__val--num">DOC-2043</span></span></span>',
    },
    audit: [
      { label: 'ชื่อฟิลด์ บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ค่า บนพื้นการ์ด', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ค่าที่ยังไม่มี บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'timeline',
    fill: true,
    name: 'Timeline',
    group: 'data',
    summary: 'ลำดับสิ่งที่เกิดขึ้นกับงานหนึ่ง พร้อมเน้นขั้นที่กำลังค้างและปุ่มแก้ปัญหาในขั้นนั้น',
    useWhen: [
      'ผู้ใช้ต้องรู้ว่าเรื่องค้างอยู่ที่ขั้นไหนและใครถือเรื่องอยู่',
      'ต้องดูย้อนหลังว่าใครทำอะไรกับเอกสารนี้เมื่อไร',
    ],
    avoidWhen: [
      'ขั้นตอนเป็นเส้นตรงที่รู้ล่วงหน้าครบ ใช้ Progress steps จะอ่านง่ายกว่า',
      'มีรายการมากจนต้องเลื่อนยาว ควรสรุปแล้วให้กดดูเพิ่ม',
    ],
    anatomy: [
      { part: 'จุดของขั้นที่ทำแล้ว', token: '--color-success + --color-success-text', note: 'มีเครื่องหมายถูกข้างใน ไม่ใช่จุดสีเปล่า' },
      { part: 'จุดของขั้นที่กำลังค้าง', token: '--color-primary-soft + --color-on-primary-soft', note: 'เน้นทั้งพื้นและไอคอนนาฬิกา' },
      { part: 'เส้นเชื่อม', token: '--color-border', note: 'วาดจากจุด ไม่ใช่ขอบรายการ จึงไม่โผล่เลยจุดสุดท้าย' },
      { part: 'เวลา', token: '--color-text-muted', note: 'เวลาสัมพัทธ์ต้องมีเวลาจริงคู่เสมอ' },
      { part: 'ปุ่มในขั้นตอน', token: '--color-primary', note: 'ให้แก้ปัญหาจากตรงนั้นได้เลย ไม่ต้องไปหาที่อื่น' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'ทำแล้ว', cls: 'ui-time__item--done' },
        { label: 'กำลังค้าง', cls: 'ui-time__item--now' },
      ],
      render: (cls) => `<span class="ui-time"><span class="ui-time__item ${cls}" style="padding-bottom:0">`
        + '<span class="ui-time__dot"></span>'
        + '<span class="ui-time__text"><b>ส่งอนุมัติ</b></span></span></span>',
    },
    audit: [
      { label: 'จุดขั้นที่ทำแล้ว บนพื้นการ์ด', fg: '--pv-success', bg: '--pv-surface', min: 3 },
      { label: 'ไอคอนขั้นที่กำลังค้าง บนพื้นอ่อน', fg: '--pv-on-primary-soft', bg: '--pv-primary-soft', min: 4.5 },
      { label: 'ชื่อขั้นตอน บนพื้นการ์ด', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'เวลา บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'chart',
    fill: true,
    name: 'Chart',
    group: 'data',
    summary: 'กราฟแท่งและแถบสัดส่วนที่วาดด้วย CSS ล้วน พร้อมตัวเลขและคำอธิบายสีครบ',
    useWhen: [
      'ต้องเทียบค่าไม่กี่ค่าให้เห็นภาพรวมในครั้งเดียว',
      'ข้อมูลนิ่งแล้วและไม่ต้องโต้ตอบ เช่น สรุปในรายงาน',
    ],
    avoidWhen: [
      'ต้องอ่านค่าที่แน่นอนทุกค่า ตารางตรงกว่าและอ่านด้วยโปรแกรมอ่านจอได้',
      'ข้อมูลมีหลายสิบชุดหรือต้องซูมและกรอง ควรใช้ไลบรารีกราฟจริง',
    ],
    anatomy: [
      { part: 'แท่ง', token: '--color-accent-1', note: 'ใช้สีเสริมชุดเดียวกับที่ palette ปั้นให้ ไม่ตั้งสีใหม่เอง' },
      { part: 'ช่วงที่ยังไม่จบ', token: 'ลายทแยง + --color-primary', note: 'ต่างด้วยลาย ไม่ใช่แค่สีจางกว่า' },
      { part: 'ตัวเลขบนแท่ง', token: '--color-text', note: 'ความสูงของแท่งอ่านเป็นตัวเลขไม่ได้ ต้องเขียนกำกับ' },
      { part: 'เส้นฐาน', token: '--color-border-strong', note: 'เป็นเส้นอ้างอิงที่ต้องเห็น จึงถือเกณฑ์ 3:1' },
      { part: 'คำอธิบายสี', token: '--color-text-muted', note: 'ต้องมีเสมอ สีอย่างเดียวไม่บอกว่าคืออะไร (WCAG 1.4.1)' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'ช่วงที่จบแล้ว', cls: '' },
        { label: 'ช่วงที่ยังไม่จบ', cls: 'ui-chart__col--now' },
      ],
      render: (cls) => '<span class="ui-chart" style="width:110px"><span class="ui-chart__plot" style="height:60px">'
        + `<span class="ui-chart__col ${cls}" style="--ui-col:70%"></span></span></span>`,
    },
    audit: [
      { label: 'แท่ง บนพื้นการ์ด', fg: '--pv-accent-1', bg: '--pv-surface', min: 3 },
      { label: 'เส้นฐาน บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'ตัวเลขบนแท่ง บนพื้นการ์ด', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'คำอธิบายสี บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'tree',
    fill: true,
    name: 'Tree',
    group: 'data',
    summary: 'โครงสร้างที่ซ้อนกันเป็นชั้น เช่น โฟลเดอร์หรือหมวดหมู่ พับและกางได้',
    useWhen: [
      'ข้อมูลมีความเป็นพ่อลูกจริง และผู้ใช้ต้องรู้ว่าอะไรอยู่ใต้อะไร',
      'ต้องเลื่อนไปมาระหว่างสาขาโดยไม่เสียบริบทว่าตัวเองอยู่ตรงไหน',
    ],
    avoidWhen: [
      'โครงสร้างลึกเกินสามชั้น ผู้ใช้จะหลงและลากหาไม่เจอ',
      'ผู้ใช้รู้ชื่อสิ่งที่ต้องการอยู่แล้ว ช่องค้นหาพาไปถึงได้เร็วกว่า',
    ],
    anatomy: [
      { part: 'ลูกศรพับกาง', token: '--color-text-muted', note: 'หมุน 90 องศาเมื่อกาง เป็นสัญญาณรูปทรง ไม่ใช่สี' },
      { part: 'เส้นชั้น', token: '--color-border', note: 'บอกว่าลูกอยู่ใต้ตัวไหน ลดการนับระยะเยื้องด้วยตา' },
      { part: 'แถวที่เปิดอยู่', token: '--color-primary-soft + แถบซ้าย --color-primary', note: 'พื้นคู่กับแถบ ไม่ใช้พื้นสีอย่างเดียว' },
      { part: 'ตัวนับ', token: '--color-text-muted', note: 'บอกน้ำหนักของแต่ละสาขาก่อนกดกาง' },
    ],
    matrix: {
      states: ['default', 'hover'],
      variants: [{ label: 'แถวในโครงสร้าง', cls: '' }],
      render: (cls, state) => `<span class="ui-tree__row" data-state="${state}" style="max-width:180px">`
        + '<svg class="ui-icon ui-tree__caret" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>'
        + '<span class="ui-tree__label">เอกสารสัญญา</span><span class="ui-tree__count">42</span></span>',
    },
    audit: [
      { label: 'ชื่อรายการ บนพื้นการ์ด', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ชื่อรายการ บนแถวที่เปิดอยู่', fg: '--pv-text', bg: '--pv-primary-soft', min: 4.5 },
      { label: 'แถบซ้ายของแถวที่เปิดอยู่ บนพื้นการ์ด', fg: '--pv-primary', bg: '--pv-surface', min: 3 },
      { label: 'ตัวนับ บนพื้นการ์ด', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'calendar',
    fill: true,
    name: 'Calendar',
    group: 'data',
    summary: 'เลือกวันจากปฏิทิน แยกวันนี้ วันที่เลือก วันที่มีนัด และวันที่เลือกไม่ได้ออกจากกัน',
    useWhen: [
      'วันที่ที่เลือกสัมพันธ์กับวันอื่น เช่น ต้องเลี่ยงวันหยุดหรือดูว่ามีนัดอยู่แล้ว',
      'ต้องเลือกเป็นช่วง ไม่ใช่วันเดียว',
    ],
    avoidWhen: [
      'ผู้ใช้รู้วันที่แน่นอนอยู่แล้ว ช่องพิมพ์วันที่เร็วกว่ามาก',
      'ช่วงที่เลือกได้ห่างจากวันนี้มาก เช่น วันเกิด การกดเปลี่ยนเดือนจะยาวมาก',
    ],
    anatomy: [
      { part: 'วันนี้', token: 'ขอบ --color-primary', note: 'ใช้ขอบ เพราะวันนี้กับวันที่เลือกเกิดพร้อมกันได้' },
      { part: 'วันที่เลือก', token: '--color-primary + --color-on-primary', note: 'พื้นทึบ คู่สีนี้ต้องผ่าน 4.5:1' },
      { part: 'วันที่มีนัด', token: 'จุด --color-primary', note: 'ต้องมีคำอธิบายใต้ปฏิทินว่าจุดคืออะไร' },
      { part: 'วันที่เลือกไม่ได้', token: '--color-text-subtle + ขีดฆ่า', note: 'ปิดปุ่มจริงและบอกเหตุผลไว้ใต้ปฏิทิน' },
      { part: 'วันหยุด', token: '--color-text-muted', note: 'จางลงแต่ยังอ่านออก 4.5:1 เพราะยังเป็นข้อมูลที่ต้องอ่าน' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'วันนี้', cls: 'ui-cal__day--today' },
        { label: 'วันที่เลือก', cls: 'ui-cal__day--picked' },
        { label: 'วันหยุด', cls: 'ui-cal__day--off' },
      ],
      render: (cls) => `<span class="ui-cal__day ${cls}" style="min-width:32px">9</span>`,
    },
    audit: [
      { label: 'ตัวเลขวัน บนพื้นปฏิทิน', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ตัวเลขวันที่เลือก บนพื้นสีแบรนด์', fg: '--pv-on-primary', bg: '--pv-primary', min: 4.5 },
      { label: 'ขอบของวันนี้ บนพื้นปฏิทิน', fg: '--pv-primary', bg: '--pv-surface', min: 3 },
      { label: 'วันหยุดและหัวคอลัมน์ บนพื้นปฏิทิน', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'menu',
    name: 'Dropdown menu',
    group: 'nav',
    summary: 'เมนูการกระทำที่เปิดจากปุ่ม พร้อมปุ่มลัด เมนูย่อย และการกระทำที่ทำลายแยกไว้ล่างสุด',
    useWhen: [
      'มีการกระทำหลายอย่างกับของชิ้นเดียวจนวางเป็นปุ่มหมดไม่ไหว',
      'การกระทำรองไม่ควรแย่งความสนใจจากปุ่มหลักของหน้า',
    ],
    avoidWhen: [
      'มีการกระทำเดียวหรือสองอย่าง วางเป็นปุ่มตรง ๆ เร็วกว่าและเห็นได้ทันที',
      'ต้องการให้เลือกค่า ไม่ใช่สั่งให้ทำ กรณีนั้นเป็นงานของ Select',
    ],
    anatomy: [
      { part: 'พื้นเมนู', token: '--color-surface + เงา', note: 'ลอยเหนือเนื้อหา ต้องมีทั้งขอบและเงาเพื่อให้เห็นขอบในธีมมืด' },
      { part: 'รายการที่ชี้อยู่', token: '--color-surface-alt', note: 'ใช้สถานะเดียวกันทั้งเมาส์และลูกศรคีย์บอร์ด' },
      { part: 'ปุ่มลัด', token: '--color-text-muted', note: 'เขียนไว้ในเมนู เพราะเป็นที่เดียวที่ผู้ใช้จะได้เห็นมัน' },
      { part: 'การกระทำที่ทำลาย', token: '--color-danger-text', note: 'อยู่ล่างสุด แยกด้วยเส้น ลดการกดพลาดจากความเคยชิน' },
      { part: 'รายการที่กดไม่ได้', token: '--color-text-muted', note: 'บอกเหตุผลไว้ในรายการ ไม่ปล่อยให้เดาว่าทำไมกดไม่ได้' },
    ],
    matrix: {
      states: ['default', 'hover'],
      variants: [
        { label: 'การกระทำทั่วไป', cls: '' },
        { label: 'การกระทำที่ทำลาย', cls: 'ui-menu__item--danger' },
      ],
      // ห่อด้วย .ui-menu เสมอ เพราะรายการเมนูถูกออกแบบให้อยู่บนพื้นเมนู
      // ถ้าวางเดี่ยว ๆ บนพื้นของช่องตาราง สีของการกระทำที่ทำลายจะตกเกณฑ์ในธีมมืด
      render: (cls, state) => '<span class="ui-menu" style="min-width:130px;box-shadow:none">'
        + `<span class="ui-menu__item ${cls}" data-state="${state}">`
        + '<span class="ui-menu__text">ทำสำเนา</span></span></span>',
    },
    audit: [
      { label: 'รายการ บนพื้นเมนู', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'รายการ บนแถวที่ชี้อยู่', fg: '--pv-text', bg: '--pv-surface-alt', min: 4.5 },
      { label: 'การกระทำที่ทำลาย บนพื้นเมนู', fg: '--pv-danger-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ปุ่มลัด บนพื้นอ่อน', fg: '--pv-text-muted', bg: '--pv-surface-alt', min: 4.5 },
    ],
  },

  {
    slug: 'steps',
    name: 'Progress steps',
    group: 'nav',
    summary: 'ขั้นตอนที่รู้ปลายทางล่วงหน้า บอกว่าอยู่ขั้นไหน เหลืออีกกี่ขั้น และขั้นไหนมีปัญหา',
    useWhen: [
      'งานถูกแบ่งเป็นขั้นที่รู้จำนวนแน่นอน เช่น ฟอร์มยาวที่ตัดเป็นหน้า ๆ',
      'ผู้ใช้ต้องกลับไปแก้ขั้นก่อนหน้าได้โดยไม่เสียของที่กรอกไว้',
    ],
    avoidWhen: [
      'จำนวนขั้นเปลี่ยนไปตามคำตอบของผู้ใช้ ตัวนับที่ขยับจะทำให้สับสน',
      'มีแค่สองขั้น เขียนบอกตรง ๆ ง่ายกว่าสร้างแถบขั้นตอน',
    ],
    anatomy: [
      { part: 'ขั้นที่ทำแล้ว', token: '--color-success + --color-success-text', note: 'เครื่องหมายถูก เป็นรูปทรงที่ต่างจากตัวเลข' },
      { part: 'ขั้นปัจจุบัน', token: '--color-primary + --color-on-primary', note: 'วงทึบคู่กับ aria-current เพื่อให้โปรแกรมอ่านจอรู้ด้วย' },
      { part: 'ขั้นที่ยังไม่ถึง', token: '--color-border-strong + --color-text-muted', note: 'วงโปร่ง ต้องเห็นว่ามีอยู่ 3:1' },
      { part: 'ขั้นที่มีปัญหา', token: '--color-danger + --color-danger-text', note: 'ไอคอนเตือน ไม่ใช่แค่เปลี่ยนเป็นสีแดง' },
      { part: 'คำอธิบายใต้ชื่อขั้น', token: '--color-text-muted', note: 'บอกสิ่งที่เกิดขึ้นจริง เช่น กรอกไปแล้วกี่รายการ' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'ทำแล้ว', cls: 'ui-step--done' },
        { label: 'ขั้นปัจจุบัน', cls: 'ui-step--now' },
        { label: 'มีปัญหา', cls: 'ui-step--error' },
      ],
      render: (cls) => `<span class="ui-step ${cls}" style="min-width:0">`
        + '<span class="ui-step__mark">2</span>'
        + '<span class="ui-step__text"><b>รายการสินค้า</b></span></span>',
    },
    audit: [
      { label: 'ขั้นปัจจุบัน ตัวเลขบนวงทึบ', fg: '--pv-on-primary', bg: '--pv-primary', min: 4.5 },
      { label: 'ขั้นที่ทำแล้ว บนพื้นการ์ด', fg: '--pv-success-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ขั้นที่ยังไม่ถึง บนพื้นการ์ด', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'ขั้นที่มีปัญหา บนพื้นการ์ด', fg: '--pv-danger-text', bg: '--pv-surface', min: 4.5 },
    ],
  },

  {
    slug: 'bottom-nav',
    name: 'Bottom navigation',
    group: 'nav',
    summary: 'แถบนำทางหลักของมือถือ อยู่ล่างจอในระยะที่นิ้วโป้งถึง สูงสุดห้าช่อง',
    useWhen: [
      'แอปมีส่วนหลักสามถึงห้าส่วนที่ผู้ใช้สลับไปมาบ่อย',
      'ใช้บนมือถือเป็นหลัก การเอื้อมไปแตะขอบบนจอทำได้ยาก',
    ],
    avoidWhen: [
      'ส่วนหลักมีเกินห้าอย่าง ชื่อภาษาไทยจะถูกตัดจนอ่านไม่ออก',
      'อยู่บนเดสก์ท็อป ที่นั่นแถบบนหรือแถบข้างเหมาะกว่า',
    ],
    anatomy: [
      { part: 'ช่องที่เปิดอยู่', token: '--color-primary-text + แถบใต้ไอคอน', note: 'สองสัญญาณคู่กัน ไม่พึ่งสีอย่างเดียว' },
      { part: 'ช่องอื่น', token: '--color-text-muted', note: 'ต้องได้ 4.5:1 ไม่จางจนดูเหมือนกดไม่ได้' },
      { part: 'ตัวเลขบนไอคอน', token: '--color-danger + --color-on-danger', note: 'บอกจำนวนที่ค้าง ไม่ใช้จุดสีเปล่า' },
      { part: 'พื้นแถบ', token: '--color-surface + --color-border', note: 'ต้องแยกจากเนื้อหาที่เลื่อนอยู่ข้างหลัง' },
    ],
    matrix: {
      states: ['default'],
      variants: [
        { label: 'หน้าที่เปิดอยู่', cls: 'page' },
        { label: 'หน้าอื่น', cls: '' },
      ],
      render: (cls) => `<span class="ui-bnav" style="width:90px"><span class="ui-bnav__item"${cls ? ' aria-current="page"' : ''}>`
        + '<span class="ui-bnav__icon"><svg class="ui-icon" viewBox="0 0 24 24">'
        + '<path d="m3 11 9-7 9 7v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></span>หน้าแรก</span></span>',
    },
    audit: [
      { label: 'ช่องที่เปิดอยู่ บนพื้นแถบ', fg: '--pv-primary-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ช่องอื่น บนพื้นแถบ', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ตัวเลขบนไอคอน', fg: '--pv-on-danger', bg: '--pv-danger', min: 4.5 },
      { label: 'แถบใต้ไอคอน บนพื้นแถบ', fg: '--pv-primary', bg: '--pv-surface', min: 3 },
    ],
  },

  {
    slug: 'drawer',
    fill: true,
    name: 'Drawer',
    group: 'layout',
    summary: 'แผงที่เลื่อนออกจากขอบจอสำหรับงานข้างเคียง โดยยังเห็นหน้าหลักอยู่',
    useWhen: [
      'งานนั้นต้องอ้างอิงสิ่งที่อยู่ในหน้าเดิม เช่น ตัวกรองของตารางที่เห็นอยู่',
      'เนื้อหายาวกว่ากล่องลอยจะรับไหว แต่ยังไม่ควรพาออกไปทั้งหน้า',
    ],
    avoidWhen: [
      'ต้องให้ผู้ใช้ตัดสินใจก่อนไปต่อจริง ๆ กรณีนั้นเป็นงานของ Modal',
      'เนื้อหาเป็นงานหลักของผู้ใช้ ควรเป็นหน้าเต็มที่ลิงก์ถึงได้',
    ],
    anatomy: [
      { part: 'พื้นแผง', token: '--color-surface', note: 'ต้องมีขอบด้านใน ไม่พึ่งเงาอย่างเดียว เพราะเงาหายไปในธีมมืด' },
      { part: 'หัวแผง', token: '--color-text + --color-border', note: 'ชื่อบอกว่าแผงนี้ทำอะไร คู่กับปุ่มปิดที่มีคำอธิบาย' },
      { part: 'ตัวแผงที่เลื่อนได้', token: '--color-surface', note: 'ส่วนนี้เท่านั้นที่เลื่อน หัวกับท้ายอยู่กับที่' },
      { part: 'ท้ายแผง', token: '--color-surface + --color-border', note: 'ปุ่มยืนยันจึงไม่หนีไปอยู่ใต้พื้นที่ที่ต้องเลื่อน' },
      { part: 'ปุ่มยืนยัน', token: '--color-primary', note: 'เขียนผลที่จะเกิด เช่น ใช้ตัวกรอง (128) ไม่ใช่คำว่าตกลง' },
    ],
    matrix: {
      states: ['default'],
      variants: [{ label: 'หัวแผง', cls: '' }],
      render: () => '<span class="ui-drawer__head" style="padding:10px;min-width:170px">'
        + '<b class="ui-drawer__title">ตัวกรองรายการ</b></span>',
    },
    audit: [
      { label: 'ชื่อแผง บนพื้นแผง', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ปุ่มปิด บนพื้นแผง', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ขอบด้านในของแผง บนพื้นหน้า', fg: '--pv-border', bg: '--pv-bg', min: 1 },
      { label: 'ปุ่มยืนยัน', fg: '--pv-on-primary', bg: '--pv-primary', min: 4.5 },
    ],
  },

  {
    slug: 'popover',
    name: 'Popover',
    group: 'layout',
    summary: 'กล่องลอยที่มีเนื้อหาและปุ่มให้กด ผูกกับปุ่มที่เปิดมันด้วยลูกศรชี้',
    useWhen: [
      'มีงานสั้น ๆ ที่ทำจบได้ตรงนั้น เช่น เปลี่ยนผู้รับผิดชอบหรือตั้งค่าเร็ว',
      'เนื้อหายาวเกินคำอธิบายบรรทัดเดียว แต่สั้นเกินกว่าจะเปิดแผงใหญ่',
    ],
    avoidWhen: [
      'เนื้อหาเป็นคำอธิบายล้วนไม่มีอะไรให้กด ใช้ Tooltip เบากว่า',
      'ต้องกรอกหลายช่อง กล่องลอยที่สูงจะล้นจอบนมือถือ',
    ],
    anatomy: [
      { part: 'พื้นกล่อง', token: '--color-surface + ขอบ + เงา', note: 'ขอบทำให้กล่องไม่จมไปกับพื้นในธีมมืด' },
      { part: 'ลูกศรชี้ต้นทาง', token: '--color-surface + --color-border', note: 'วาดจากสี่เหลี่ยมหมุน 45 องศา จึงได้ขอบชุดเดียวกับกล่อง' },
      { part: 'ปุ่มปิด', token: '--color-text-muted', note: 'ต้องมีเสมอ การกดข้างนอกเป็นความรู้ที่ไม่ได้มีทุกคน' },
      { part: 'คำอธิบายผลที่ตามมา', token: '--color-text-muted', note: 'บอกก่อนกดยืนยัน ไม่ให้รู้ทีหลัง' },
    ],
    matrix: {
      states: ['default'],
      variants: [{ label: 'กล่องลอย', cls: '' }],
      render: () => '<span class="ui-pop" style="max-width:190px"><span class="ui-pop__head">'
        + '<b>เปลี่ยนผู้รับผิดชอบ</b></span>'
        + '<span class="ui-pop__body" style="padding:10px 14px">เลือกคนที่จะรับงานนี้ต่อ</span></span>',
    },
    audit: [
      { label: 'หัวข้อ บนพื้นกล่อง', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'คำอธิบายผลที่ตามมา บนพื้นกล่อง', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ปุ่มปิด บนพื้นกล่อง', fg: '--pv-text-muted', bg: '--pv-surface', min: 4.5 },
      { label: 'ปุ่มยืนยัน', fg: '--pv-on-primary', bg: '--pv-primary', min: 4.5 },
    ],
  },

  {
    slug: 'login',
    fill: true,
    name: 'Sign-in form',
    group: 'layout',
    summary: 'ฟอร์มเข้าสู่ระบบครบชุด ทั้งข้อผิดพลาด ปุ่มดูรหัสผ่าน และทางเข้าแบบอื่น',
    useWhen: [
      'ต้องให้ผู้ใช้ยืนยันตัวตนก่อนเข้าใช้งาน',
      'มีทางเข้าหลายแบบ เช่น รหัสผ่านกับบัญชีองค์กร',
    ],
    avoidWhen: [
      'เนื้อหาเปิดดูได้โดยไม่ต้องล็อกอิน อย่าบังคับให้สมัครก่อนเห็นอะไรเลย',
    ],
    anatomy: [
      { part: 'กล่องฟอร์ม', token: '--color-surface + --color-border', note: 'มุมโค้งระดับใหญ่ตามสเกลของระบบ' },
      { part: 'ข้อความผิดพลาด', token: '--color-danger-soft + --color-on-danger-soft', note: 'บอกรวม ๆ ไม่ระบุว่าผิดช่องไหน และบอกจำนวนครั้งที่เหลือ' },
      { part: 'ปุ่มดูรหัสผ่าน', token: '--color-text-muted', note: 'ลดการพิมพ์ผิดซ้ำ ๆ จนบัญชีถูกล็อก' },
      { part: 'ปุ่มหลัก', token: '--color-primary + --color-on-primary', note: 'เต็มความกว้าง นิ้วโป้งกดได้โดยไม่ต้องเล็ง' },
      { part: 'ลิงก์ลืมรหัสผ่าน', token: '--color-primary-text', note: 'อยู่คู่ช่องรหัส ไม่ซ่อนไว้ท้ายฟอร์ม' },
    ],
    matrix: {
      states: ['default', 'hover', 'focus'],
      variants: [{ label: 'ปุ่มเข้าสู่ระบบ', cls: '' }],
      render: (cls, state) => `<span class="ui-btn ui-btn--block" data-state="${state}" style="width:150px">เข้าสู่ระบบ</span>`,
    },
    audit: [
      { label: 'ป้ายชื่อช่อง บนพื้นกล่อง', fg: '--pv-text', bg: '--pv-surface', min: 4.5 },
      { label: 'ขอบช่องกรอก บนพื้นกล่อง', fg: '--pv-border-strong', bg: '--pv-surface', min: 3 },
      { label: 'ข้อความผิดพลาด บนพื้นอ่อน', fg: '--pv-on-danger-soft', bg: '--pv-danger-soft', min: 4.5 },
      { label: 'ปุ่มหลัก', fg: '--pv-on-primary', bg: '--pv-primary', min: 4.5 },
      { label: 'ลิงก์ลืมรหัสผ่าน บนพื้นกล่อง', fg: '--pv-primary-text', bg: '--pv-surface', min: 4.5 },
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
