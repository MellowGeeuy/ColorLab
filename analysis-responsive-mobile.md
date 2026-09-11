# วิเคราะห์ความพร้อมด้าน Responsive — มือถือ (320–767px)

> **ขอบเขต:** จอกว้าง 320–767px (มือถือแนวตั้งและแนวนอนขนาดเล็ก)
> **คู่มือพี่น้อง:** [`analysis-responsive-tablet.md`](./analysis-responsive-tablet.md) — 768–1279px
> **สถานะโค้ดที่ตรวจ:** commit `2754978` · CSS 13,057 บรรทัด / JS 13,068 บรรทัด
> **วันที่ตรวจ:** 2026-09-11

---

## 0. สถานะการแก้ไข (อัปเดต 2026-09-11)

เฟส 1 ลงมือแก้แล้ว · ผลวัดซ้ำด้วย harness เดิม:

| ตัวชี้วัด | ก่อน | หลัง |
|---|---|---|
| `.app` ล้นแบบเข้าถึงไม่ได้ (4 หน้า × 17 ความกว้าง) | สูงสุด 119px | **0 ทุกช่อง** |
| จุดล้นซ่อนที่ 360px | 2–7 จุด/หน้า | **0 ทุกหน้า** |
| Tap target < 24px (จอ 360px, touch) | 1–2 จุด/หน้า | **0** (เหลือ 1 ในคอมโพเนนต์สาธิต) |

| ข้อ | สถานะ | หมายเหตุ |
|---|---|---|
| P0-1 เมนูถูกตัด | ✅ แก้แล้ว (รอบ 2) | **ใช้ทางที่ 2 — bottom tab bar** หลังพบว่าทางที่ 1 ยังใช้งานยาก |
| P0-2 drag-and-drop บนทัช | ✅ แก้แล้ว | ย้ายไป Pointer Events ทั้งสอง flow — ดู §4 P0-2 |
| P0-3 tap target | ✅ แก้แล้ว | ดูข้อแก้ไขใน §4 P0-3 |
| P0-4 tooltip hover-only | ✅ แก้แล้ว | rail แสดงคำกำกับถาวรบนทัช |
| P1-1 ผัง Layout | ✅ แก้แล้ว | **แต่วิธีแก้ต่างจากที่เสนอไว้เดิม — ดู §5 P1-1** |
| P1-2 `100vh` | ✅ หมดไปเอง | `palette-preview.css` ถูกลบทิ้งเป็น dead code |
| P1-3 / P1-4 scale-strip · wheel | ✅ แก้แล้ว | สเกลคง 11 ขั้นแต่เลื่อนดูได้ · วงล้อใช้ `min(280px, 100%)` |
| P2 ระบบ breakpoint | ✅ แก้แล้ว | รวม 11 ค่าเหลือ 3 + `breakpoints.css` — ดู §6 |

**จุดที่เหลือและถือว่ารับได้ (ตรวจแล้วเป็นผลบวกลวง):**

- `.auto-card__row` ล้น 3px ที่จอ 320px — เป็นการปัดเศษ sub-pixel ของ grid track ที่ถูก `overflow: hidden` ครอบไว้ ตาไม่เห็นความต่าง
- `.lay-lib__name` ล้น 5px — คือ `text-overflow: ellipsis` ทำงานตามปกติ ไม่ใช่เนื้อหาหาย

---

## 1. บทสรุปผู้บริหาร

ColorLab มีรากฐานที่ดีกว่าที่คาด — มี `viewport` meta ครบทุกหน้า, ใช้ `100dvh` ที่ app shell,
มี `touch-action: none` บน canvas ที่ต้องลากทุกตัว, และหน้า Color Theory มี mobile drawer ทำงานอยู่แล้ว

**แต่ปัญหาที่แท้จริงไม่ได้อยู่ที่ "จอล้น" แบบที่เห็นทั่วไป** — วัดแล้วพบว่า
`document.documentElement.scrollWidth` เท่ากับความกว้างจอพอดีทุกหน้า (ไม่มี horizontal scroll ระดับเอกสาร)
เพราะ `.app` ตั้ง `overflow: hidden` ไว้ (`assets/css/app-shell.css:12`)

ผลคือเนื้อหาที่ล้น **ไม่ได้ทำให้จอเลื่อนได้ แต่ถูกตัดหายไปเงียบ ๆ** — ผู้ใช้เข้าไม่ถึงตลอดกาล
นี่คือรูปแบบความเสียหายที่ตรวจจับยากที่สุด เพราะเครื่องมือ audit ทั่วไปที่ดูแค่ระดับเอกสารจะรายงานว่า "ผ่าน"

| ระดับ | จำนวนปัญหา | ผลกระทบ |
|---|---|---|
| 🔴 **P0** | 4 | ใช้งานไม่ได้จริง — เมนูหาย / ลากไม่ได้ / กดไม่โดน |
| 🟠 **P1** | 4 | ใช้งานได้แต่ทรมาน — ต้องซูม เล็งนาน อ่านยาก |
| 🟡 **P2** | 3 | หนี้เชิงระบบ — ทำให้แก้รอบหน้าแพงขึ้น |

**ประเมินแรงงาน:** P0 ทั้งหมด ≈ 1.5–2 วัน · P0+P1 ≈ 4–5 วัน · ครบทั้งหมด ≈ 7–8 วัน

---

## 2. วิธีตรวจ (ทำซ้ำได้)

ไม่ได้อ่านแค่ CSS — รันเว็บจริงใน Chrome headless แล้ววัดผ่าน Chrome DevTools Protocol

```bash
# 1) เสิร์ฟโปรเจกต์
cd ColorLab && py -m http.server 5500 --bind 127.0.0.1

# 2) เปิด Chrome headless พร้อมพอร์ต debug
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless=new --disable-gpu --remote-debugging-port=9222 \
  --user-data-dir=/tmp/cl-profile about:blank &
```

จากนั้นใช้ `Emulation.setDeviceMetricsOverride` ตั้งขนาดจอ แล้ว `Runtime.evaluate` วัดค่าในหน้า

**ตัวชี้วัดที่ใช้ — และเหตุผลที่ต้องวัดแบบนี้:**

| ตัวชี้วัด | สูตร | ทำไมถึงสำคัญ |
|---|---|---|
| ล้นระดับเอกสาร | `documentElement.scrollWidth - innerWidth` | มาตรฐานทั่วไป — **แต่โปรเจกต์นี้ได้ 0 ทุกหน้า จึงไม่พอ** |
| ล้นใน container | `el.scrollWidth - el.clientWidth` | จับการล้นที่ถูก `overflow:hidden` กลืนไว้ |
| เข้าถึงได้ไหม | `overflow-x ∈ {auto, scroll}` | แยก "เลื่อนดูได้" ออกจาก "หายถาวร" |
| Tap target | `min(rect.width, rect.height)` | เทียบ 24px (WCAG 2.2 AA) และ 44px (Apple HIG) |

---

## 3. ผลตรวจจริง

### 3.1 กวาดความกว้างทีละขั้น — หา "จุดแตก" ที่แท้จริง

ตัวเลข = พิกเซลที่ `.app` ล้นออกไปแล้ว **เข้าถึงไม่ได้** (0 = ปกติ)

| หน้า | 320 | 360 | 390 | 412 | 480 | 540 | 600 | 640 | 680 | 720 |
|---|---|---|---|---|---|---|---|---|---|---|
| **หน้าแรก** | **39** | **2** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Workspace** | **44** | **8** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Layout** | **119** | **79** | **49** | **27** | 0 | 0 | 0 | 0 | 0 | 0 |
| **Component Style** | **42** | **6** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

**อ่านตารางนี้ว่า:**

- **แถบบนแตกต่ำกว่า 390px ทุกหน้า** — ครอบคลุม Android 360px (ส่วนแบ่งตลาดสูงมาก) และ iPhone SE 375px
- **หน้า Layout แตกไปถึง 412px** — หนักสุดและกินช่วงกว้างสุด
- ช่วง 480–720px ผ่านหมด — ปัญหากระจุกตัวที่ **ปลายล่างของสเปกตรัม** ซึ่งเป็นจุดที่โปรเจกต์ไม่มี breakpoint รองรับเลย

### 3.2 จำนวนจุดล้นที่ซ่อนอยู่ (ไม่รวมที่เลื่อนดูได้)

| หน้า | 320 | 360 | 390 | 480 | 600 | 640 | 680 | 720 |
|---|---|---|---|---|---|---|---|---|
| หน้าแรก | 4 | 2 | 2 | 2 | 3 | 3 | 3 | **0** |
| Workspace | 7 | 7 | 5 | 2 | 3 | 2 | **0** | **0** |
| Layout | 6 | 6 | 5 | 2 | 3 | 3 | **0** | **0** |
| Component Style | 4 | 4 | 3 | 3 | 3 | 3 | **0** | **0** |

ทุกหน้าสะอาดที่ ≥680px — **680px คือเส้นแบ่งที่ข้อมูลบอกเอง** ไม่ใช่ตัวเลขที่เลือกมาลอย ๆ

### 3.3 Tap target (วัดที่ 360px)

| หน้า | < 24px (ตก WCAG 2.2 AA) | 24–44px (ตก Apple HIG) | ปุ่มทั้งหมด |
|---|---|---|---|
| หน้าแรก | **15** | 15 | 58 |
| Workspace | 1 | 11 | 76 |
| **Layout** | 1 | **47** | 111 |
| Component Style | 2 | **40** | 89 |
| Contrast Audit | 1 | 6 | 11 |
| Token Export | 1 | 6 | 11 |

---

## 4. ปัญหา P0 — ต้องแก้ก่อนบอกว่า "รองรับมือถือ"

### 🔴 P0-1 · เมนูหลักถูกตัดหาย เข้าไม่ถึงถาวร

**อาการ:** ที่ 360px เมนู "Layout" ถูกตัด และปุ่มควบคุมฝั่งขวาถูกเมนูทับ — ผู้ใช้ไปหน้าอื่นไม่ได้เลย

**กลไกที่วัดได้ (หน้า Workspace @360px):**

```
nav.groundnav       client 166px → content 332px   overflow-x: visible   ล้น 166px
  ↑ .topbar__side   client 190px → content 356px   overflow-x: visible
  ↑ header.topbar   client 360px → content 368px   overflow-x: visible
  ↑ div.app         client 360px → content 368px   overflow-x: HIDDEN    ← ตัดตรงนี้
  ↑ body / html     scrollWidth 360px                                    ← จอไม่เลื่อน
```

ปุ่มเมนู 3 ตัวกินพื้นที่รวม **332px** (`110.9 + 134.6 + 78 + ช่องไฟ`) แต่คอลัมน์ที่ได้รับจัดสรรมีแค่ 166px

**ต้นเหตุ:** `.groundnav` (`assets/css/app-shell.css:52`) เป็น flex ที่ `min-width: 0`
โดยลูกทุกตัว `white-space: nowrap` (`assets/css/app-shell.css:69`)
แต่ **ไม่มี `overflow-x` ให้เลื่อน** และไม่มี media query ใดยุบมันเป็นเมนูอื่นที่จอต่ำกว่า 560px
(`assets/css/app-shell.css:633` ซ่อนได้แค่ `.topbar__name` กับ label ของปุ่ม hero)

**วิธีแก้ — เลือก 1 ใน 2:**

**ทางที่ 1 (เร็ว, 30 นาที) — ให้เลื่อนดูได้** เหมาะถ้าอยากคง information scent ของเมนูไว้

```css
/* assets/css/app-shell.css — เพิ่มต่อจากบล็อก .groundnav */
@media (max-width: 680px) {
  .groundnav {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    /* หยุดที่ปุ่มพอดีทุกครั้ง ไม่ค้างครึ่งปุ่ม */
    scroll-snap-type: x proximity;
    /* กันไม่ให้เบราว์เซอร์ตีความว่าเป็นท่าทาง back/forward ของทั้งหน้า */
    overscroll-behavior-x: contain;
  }
  .groundnav::-webkit-scrollbar { display: none; }
  .groundnav__item { scroll-snap-align: start; }

  /* บอกผู้ใช้ว่ายังมีของทางขวา — ไม่งั้นจะไม่รู้ว่าเลื่อนได้ */
  .topbar__side { -webkit-mask-image: linear-gradient(90deg, #000 85%, transparent); }
}
```

**ทางที่ 2 (ที่ใช้จริง) — ยุบเป็นเมนูล่างแบบ tab bar**

> **ทำไมถึงต้องเปลี่ยนจากทางที่ 1:** ลองใช้จริงแล้วยังยาก — ที่จอ 360px เมนูได้พื้นที่ 166px
> ผู้ใช้จึงเห็น `Color Theory` เต็ม · `Component Style` ครึ่งเดียว · `Layout` ไม่เห็นเลย
> คือเห็น **1 ใน 3** และไม่มีอะไรบอกว่าปัดได้นอกจากขอบจาง ๆ
> การให้เลื่อนได้แก้เรื่อง "เข้าไม่ถึง" แต่ไม่ได้แก้เรื่อง "หาไม่เจอ"

เว็บนี้มีปลายทางนำทาง **4 จุดพอดี** (`Color Theory` · `Component Style` · `Layout` · `Colorground`)
ซึ่งเป็นจำนวนที่เหมาะกับ tab bar ที่สุด (Material แนะนำ 3–5 ช่อง) — เห็นครบพร้อมกัน แตะเดียวถึง

**สิ่งที่ทำ:**

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `assets/js/modules/mobile-tabbar.js` | **ไฟล์ใหม่** — สร้างแถบจากลิงก์ที่มีอยู่แล้วในแถบบน |
| `assets/css/app-shell.css` | `.tabbar` + ซ่อน `.groundnav`/`.topnav__item--hero`/`.dock` ที่ ≤680px |
| `assets/css/design-system.css` | โทเคน `--tabbar-h: 3.5rem` |
| `pages/{theory,workspace,layout,component-style,placeholder}.js` | เรียก `initMobileTabbar()` |

**เหตุผลที่ให้ JS สร้าง ไม่ประกาศใน HTML:** เป็นเหตุผลเดียวกับที่ `orbit-dock.js` เขียนไว้ในหัวไฟล์ —
ถ้าประกาศซ้ำใน 6 ไฟล์ HTML วันที่เพิ่มเมนูใหม่จะลืมไฟล์ใดไฟล์หนึ่งแน่นอน

**รายละเอียดที่ต้องระวัง (เจอตอนทำ):**

1. **หน้า Workspace ไม่มีปุ่ม hero** เพราะผู้ใช้ยืนอยู่ที่นั่นแล้ว — ถ้าอ่านจาก DOM ตรง ๆ
   จะได้ 3 แท็บบนหน้านั้นและ 4 แท็บบนหน้าที่เหลือ โมดูลจึงตรวจ `.topbar--ground`
   แล้วสร้างแท็บที่สี่เป็นหน้าปัจจุบันเอง
2. **ป้ายในแถบบนยาวเกินช่องแท็บ** (`Component Style` = 134px แต่ช่องกว้าง 90px)
   ใช้ตารางย่อป้ายที่จับคู่ด้วย **id ของไอคอน** ไม่ใช่ `href` เพราะ href เป็น relative path ที่ต่างกันทุกหน้า
3. **แถบต้องต่อเข้า `.app` ไม่ใช่ `body`** — `.app` เป็น grid สูงเต็มจอ แถบจึงได้แถวของตัวเอง
   ไม่ต้องใช้ `position: fixed` ที่จะไปทับเนื้อหาส่วนล่างของทุกหน้า
4. **ปิดการยุบแถบบน (`is-nav-docked`) บนมือถือ** — โดมลอยคือ "แถบบนที่ยุบแล้ว" ซึ่งซ้ำซ้อนกับแถบล่าง
   และถ้าปล่อยให้ยุบ ปุ่มธีม/คู่มือ/สารบัญ จะหายไปโดยไม่มีที่ไป

**ผลพลอยได้:** แถบบนโล่งพอจะเอา **ชื่อแบรนด์กลับมาแสดงที่ ≤560px** ได้
(เดิมซ่อนเพราะแย่งที่กับเมนู) ผู้ใช้จึงรู้ว่าอยู่หน้าไหนโดยไม่ต้องเดาจากโลโก้สี่เหลี่ยมเปล่า ๆ

**ผลวัด:** ทั้ง 4 หน้าได้ 4 แท็บ ขนาด **90×56px** ที่จอ 360px (เกินเกณฑ์ 44px)
`aria-current` ถูกต้องทุกหน้า · `.app` ล้น 0 ทุกความกว้าง 320–1280px

---

### 🔴 P0-2 · หน้า Layout ใช้ลากวางไม่ได้เลยบนทัช

**อาการ:** ฟีเจอร์หลักของหน้า Layout คือการลากคอมโพเนนต์เข้าผัง — บนมือถือทำไม่ได้ 100%

**ต้นเหตุ:** ใช้ HTML5 Drag and Drop API

| ไฟล์ | สิ่งที่ใช้ |
|---|---|
| `assets/js/modules/layer-panel.js` | `draggable` (2 จุด), `dragstart` |
| `assets/js/pages/layout.js` | `draggable`, `dragstart` |

HTML5 DnD **ไม่ยิง event บน touch screen** ทั้ง iOS Safari และ Android Chrome — ไม่ใช่บั๊กที่แก้ด้วย CSS ได้

**หลักฐานว่าทีมรู้วิธีที่ถูกอยู่แล้ว:** ในโปรเจกต์เดียวกันนี้
`assets/js/modules/layout-canvas.js:38` และ `assets/js/modules/layout-board.js`
ใช้ `pointerdown` ซึ่งทำงานได้ทั้งเมาส์/ทัช/ปากกา — แค่ยังไม่ได้ใช้กับ layer panel

**วิธีแก้:** ย้ายจาก DnD API ไป Pointer Events ให้เหมือนส่วนที่เหลือของโปรเจกต์

```js
// รูปแบบที่ layout-canvas.js ใช้อยู่แล้ว — ยกมาใช้กับ layer-panel.js
function makeDraggable(el, { onStart, onMove, onEnd }) {
  el.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    // จับ pointer ไว้กับ element นี้ — นิ้วเลื่อนออกนอกกรอบก็ยังตามต่อ
    el.setPointerCapture(ev.pointerId);
    onStart(ev);

    const move = (e) => onMove(e);
    const up = (e) => {
      el.releasePointerCapture(e.pointerId);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);  // สายไม่หลุดตอนมีสายเข้า
      onEnd(e);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });
}
```

```css
/* คู่กันเสมอ — ไม่มีบรรทัดนี้ เบราว์เซอร์จะแย่งเอาไปเป็นการ scroll หน้า */
.lay-layer__row,
.lay-lib__item { touch-action: none; }
```

> โปรเจกต์ตั้ง `touch-action: none` ถูกต้องแล้วที่ 5 จุด
> (`assets/css/page-specific/layout.css:544`, `assets/css/page-specific/workspace.css:412` และอื่น ๆ)
> เหลือแค่ขยายมาคลุมส่วนที่ยังใช้ DnD

**สิ่งที่ทำจริง — ถอด HTML5 DnD ออกทั้งหมด เหลือ Pointer Events ทางเดียว**

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `assets/js/utils/pointer-drag.js` | **ไฟล์ใหม่** — `makeDraggable()` + `createDragGhost()` |
| `assets/js/modules/layer-panel.js` | จัดลำดับเลเยอร์ · ถอด `draggable`/`dragstart`/`dragover`/`drop` |
| `assets/js/modules/layout-canvas.js` | เปลี่ยน listener `dragover`/`drop` เป็นเมธอด `dropPreview` / `dropCellAt` / `endDropPreview` |
| `assets/js/pages/layout.js` | `initLibraryDrag()` ลากของจากคลังมาวางตามตำแหน่ง |

### ปัญหาที่ยากที่สุด: "ลาก" กับ "เลื่อนดูลิสต์" เป็นท่าเดียวกันบนนิ้ว

ทั้งแผงเลเยอร์และคลังคอมโพเนนต์เป็นลิสต์ที่ต้องเลื่อนดูได้
ถ้าตั้ง `touch-action: none` ที่แถวตามสูตรมาตรฐาน **นิ้วจะเลื่อนลิสต์ไม่ได้เลย**

แยกด้วย **เจตนา** แทน:

| อุปกรณ์ | เงื่อนไขเข้าโหมดลาก |
|---|---|
| เมาส์ / ปากกา | ขยับเกิน 5px (ชี้ได้แม่นอยู่แล้ว) |
| นิ้ว | **แตะค้าง 320ms โดยไม่ขยับ** — ถ้าขยับก่อนครบเวลา ถือว่าตั้งใจ scroll |

เป็นท่าเดียวกับที่ iOS/Android ใช้จัดลำดับรายการ ผู้ใช้จึงเดาถูกโดยไม่ต้องสอน

**จุดที่ต้องระวัง:** ตั้ง `touch-action: none` ตอนแตะค้างครบแล้วไม่ทัน เพราะเบราว์เซอร์ตัดสินใจ
ไปแล้วตั้งแต่ `touchmove` แรก จึงต้องดัก `touchmove` แบบ non-passive แล้ว `preventDefault()` เอง
— ทำได้เพราะตอนแตะค้างนิ้วยังไม่ขยับ การ scroll จึงยังไม่เริ่ม

### เรื่องอื่นที่ต้องทำเองหลังเลิกใช้ DnD

- **ภาพตามนิ้ว** — DnD วาดให้เอง พอเลิกใช้ต้องวาดเอง (`.drag-ghost`)
  ต้องตั้ง `pointer-events: none` ไม่งั้น `elementFromPoint` จะเจอแต่ตัวมันเอง หาแคนวาสไม่พบ
- **หาเป้าหมายเอง** — ไม่มี `dragover` แล้ว ใช้ `document.elementFromPoint(x, y)` ยิงรังสีแทน
- **กัน click ซ้อน** — เบราว์เซอร์ยิง `click` ตามหลัง `pointerup` ต้องมี flag กันไว้
  ไม่งั้นลากเสร็จแล้วจะวางซ้ำหรือเลือกแถวซ้ำ
- **ปิด callout ของ iOS** — แตะค้างบน iOS เด้งเมนู "คัดลอก/แชร์" และ Android เริ่มไฮไลต์ข้อความ
  ปิดด้วย `-webkit-touch-callout: none` + `user-select: none` เฉพาะแถวที่ลากได้

### ผลทดสอบ (จำลองนิ้วจริงด้วย `Input.dispatchTouchEvent`)

| เคส | ผล |
|---|---|
| ลากของจากคลังมาวางบนผังด้วยนิ้ว | ✅ วางที่คอลัมน์/แถวที่ปล่อยจริง |
| ปล่อยนอกผัง | ✅ ยกเลิก ไม่วางต่อท้ายโดยไม่ตั้งใจ |
| แตะสั้น ๆ ที่ชิปในคลัง | ✅ ยังวางต่อท้ายได้เหมือนเดิม |
| จัดลำดับเลเยอร์ด้วยนิ้ว | ✅ สลับลำดับได้ |
| จัดลำดับเลเยอร์ด้วยเมาส์ | ✅ ไม่ regress |
| แตะสั้น ๆ บนแถวเลเยอร์ | ✅ เลือกแถว ไม่ใช่ลาก |
| **ปัดนิ้วบนลิสต์คลัง** | ✅ เลื่อนปกติ (scrollTop 0 → 192) ไม่เข้าโหมดลาก |

---

### 🔴 P0-3 · ปุ่มเล็กกว่ามาตรฐานทั้งระบบ

**อาการ:** ปุ่มไอคอนทุกตัวคือ **28×28px** — เล็กกว่าเกณฑ์ Apple HIG (44pt) ถึง 36%

**ต้นเหตุ:** โทเคนถูกออกแบบมาสำหรับเมาส์ล้วน (`assets/css/design-system.css:162`)

```css
--control-h-sm: 1.75rem;  /* 28px */
--control-h-md: 2rem;     /* 32px */
--control-h-lg: 2.5rem;   /* 40px */
```

ทั้งสามค่าต่ำกว่า 44px และ `.btn--sm.btn--icon` (`assets/css/design-system.css:477`)
คือ 28×28 ที่ปรากฏซ้ำทั่วทุกหน้า — `#theme-toggle`, `#guide-open`, `#palette-reset`, `#toc-toggle`

**เคสหนักสุด — ยิ่งกว่าปุ่มเล็ก:**

| จุด | ขนาดจริง @360px | ปัญหา |
|---|---|---|
| `input#hsl-hue` | **100 × 8px** | สไลเดอร์สูง 8px — นิ้วจับแทบไม่ติด |
| `input#hsl-sat`, `#hsl-light` | 100 × 16px | เหมือนกัน |
| `a.topbar__brand` | **10.9 × 32px** | โลโก้ยุบเหลือ 11px เพราะ `.topbar__name` ถูกซ่อนที่ ≤560px |

`.range` (`assets/css/design-system.css:523`) ไม่ได้กำหนดความสูงเลย จึงตกไปใช้ค่า default ของเบราว์เซอร์

**วิธีแก้ — แยกโทเคนตามชนิดอุปกรณ์ ไม่ใช่ขยายทุกอย่างจนพัง desktop:**

```css
/* assets/css/design-system.css — ต่อท้าย :root */

/* ขยายเฉพาะเครื่องที่ "นิ้วเป็นตัวชี้" — เมาส์ยังได้ UI กระชับเหมือนเดิม
   ใช้ any-pointer ไม่ใช่ pointer เพราะ iPad ที่ต่อคีย์บอร์ดรายงานตัวเองเป็น fine
   ทั้งที่ยังแตะจอได้ — ถ้ามีทางแตะได้ ให้เผื่อขนาดไว้ก่อน
   และตรงประเด็นกว่า max-width เพราะแท็บเล็ตจอใหญ่ก็ใช้นิ้ว */
@media (any-pointer: coarse) {
  :root {
    --control-h-sm: 2.25rem;  /* 36px */
    --control-h-md: 2.75rem;  /* 44px */
    --control-h-lg: 3rem;     /* 48px */
  }
}

/* สไลเดอร์ต้องกำหนดพื้นที่จับเอง — ค่า default ของเบราว์เซอร์บางตัวเหลือ 8px
   ใช้ตัวเลือกระดับ element ไม่ใช่คลาส .range เพราะมี input[type=range] อีก 4 ตัว
   (#cmp-text · #cmp-fill · #cmp-btn · #auto-light) ที่ไม่ได้ใส่คลาสไว้เลย */
.range,
input[type="range"] {
  height: var(--control-h-md);
  /* พื้นหลังใส แต่กินพื้นที่จับเต็มความสูง — รางยังบางสวยเหมือนเดิม */
  background: transparent;
}
input[type="range"]::-webkit-slider-thumb { width: 24px; height: 24px; }
input[type="range"]::-moz-range-thumb     { width: 24px; height: 24px; }
```

> **กับดักที่เจอตอนลงมือ:** `.range--hue` (`assets/css/page-specific/color-theory.css:48`)
> ตั้ง `height: 8px` ทับไว้ และอยู่ในไฟล์ที่โหลดทีหลัง จึงชนะกฎข้างบน
> แถบสีรุ้งต้องบางตามดีไซน์ — ทำให้หนา 44px คือทำลายงานออกแบบ
> ทางออกคือแยก "ความหนาของราง" ออกจาก "พื้นที่รับสัมผัส":
>
> ```css
> .range--hue {
>   box-sizing: border-box;
>   height: var(--control-h-md);                          /* กล่องรับสัมผัส 44px */
>   padding-block: calc((var(--control-h-md) - 8px) / 2); /* padding ใสขนาบบนล่าง */
>   background-clip: content-box;                         /* รุ้งวาดแค่ในกรอบ 8px */
> }
> ```

```css
/* assets/css/app-shell.css — กันโลโก้ยุบจนกดไม่โดน
   ต้นเหตุคือ min-width: 0 ที่ตัวมันเอง ปล่อยให้ยุบได้ไม่จำกัดเมื่อชื่อแบรนด์ถูกซ่อน */
.topbar__brand { flex-shrink: 0; }
```

> **ควบคู่กัน:** ปุ่มที่กำหนดความสูงด้วย `padding` ล้วนจะไม่โตตามโทเคน ต้องผูกเพิ่มเอง
> — `.lay-panel__tab` และ `.cs-palette-pill` ใส่ `min-height: var(--control-h-*)` แล้ว
> ส่วน `.lay-panel__toggle` เปลี่ยนจากค่าตายตัว `1.75rem` มาเป็น `var(--control-h-sm)`

> **หมายเหตุผลบวกลวง:** audit เจอ `input#mood-*` และ `input#ramp-*` ขนาด 1×1px
> ตรวจแล้วเป็น radio ที่ซ่อนไว้โดยตั้งใจ โดยมี `<label>` เป็นเป้ากดจริง — **ไม่ใช่ปัญหา**
> เช่นเดียวกับ `.icon-sprite > svg` ที่ audit รายงานว่าถูกตัด 300px
> ซึ่งเป็น SVG sprite ที่ตั้งใจซ่อน (`assets/css/design-system.css:304`)

---

### 🔴 P0-4 · Tooltip ผูกกับ `:hover` — บนทัชไม่มีทางเห็น

**อาการ:** tool rail ใน Workspace เป็นไอคอนล้วนไม่มีคำกำกับ ชื่อเครื่องมืออยู่ใน tooltip ที่เปิดด้วย hover เท่านั้น
บนมือถือจึงต้อง **เดาว่าไอคอนไหนคืออะไร**

**ต้นเหตุ:** ทั้งโปรเจกต์ **ไม่มี `@media (hover: hover)` หรือ `(pointer: coarse)` แม้แต่บรรทัดเดียว**

| จุด | ไฟล์ |
|---|---|
| `.orbit__item:hover .orbit__tip` | `assets/css/app-shell.css:394` |
| `.rail__item:hover .rail__tip` | `assets/css/page-specific/workspace.css:99` |

**วิธีแก้:**

```css
/* assets/css/page-specific/workspace.css */

/* เอฟเฟกต์ hover ให้เฉพาะเครื่องที่ hover ได้จริง
   — บนทัช :hover จะ "ค้าง" หลังแตะ ทำให้ tooltip ติดคาจอ */
@media (hover: hover) and (pointer: fine) {
  .rail__item:hover .rail__tip { opacity: 1; }
}

/* บนทัช: เลิกพึ่ง tooltip แล้วแสดงคำกำกับถาวรไปเลย
   rail กว้าง 4rem อยู่แล้ว ใส่ข้อความ 10px ได้พอดี */
@media (pointer: coarse) {
  .rail__tip { display: none; }
  .rail__item {
    flex-direction: column;
    gap: 2px;
    height: auto;
    padding-block: var(--space-2);
  }
  .rail__item::after {
    content: attr(aria-label);
    font-size: 0.625rem;
    line-height: 1;
    text-align: center;
  }
}
```

`:focus-visible` ที่มีอยู่แล้วยังต้องคงไว้ — ผู้ใช้คีย์บอร์ดพึ่งมัน

---

## 5. ปัญหา P1 — ใช้งานได้แต่ทรมาน

### 🟠 P1-1 · ผังหน้า Layout ยุบไม่ลงจริงที่ ≤412px

จาก §3.1 หน้า Layout ล้น **119px ที่ 320px** และยังล้น **27px ที่ 412px**

> ⚠️ **แก้ข้อวินิจฉัยเดิม** — ฉบับแรกของเอกสารนี้ระบุว่าต้นเหตุคือ canvas ที่บังคับ grid 12 คอลัมน์
> และเสนอให้ทับด้วย `.lay-canvas { --grid-cols: 4 }` ที่จอแคบ **ข้อเสนอนั้นผิดสองชั้น**
>
> 1. `--grid-cols` ถูกเขียนเป็น **inline style จาก JS** (`assets/js/modules/layout-canvas.js:58`,
>    `assets/js/modules/layout-board.js:83`) ซึ่งชนะกฎใน stylesheet เสมอ — CSS ที่เสนอไว้จะไม่ทำงานเลย
> 2. สำคัญกว่านั้น: จำนวนคอลัมน์คือ **ค่าที่ผู้ใช้ตั้งเอง** จากแผงคุณสมบัติ (ปุ่ม 4/6/8/12/16/24)
>    มันเป็นส่วนหนึ่งของผังที่ผู้ใช้กำลังออกแบบ ไม่ใช่เรื่องการแสดงผล
>    การไปทับด้วย viewport = แอบเปลี่ยนงานของผู้ใช้ ซึ่งคอมเมนต์ที่
>    `assets/css/page-specific/layout.css:504` เขียนเจตนาไว้ชัดว่า
>    "ผังกว้างเท่าที่ตั้งเสมอ ไม่หดตามพื้นที่ เพราะต้องเห็นสัดส่วนจริงของอุปกรณ์นั้น" และให้ใช้ zoom แทน

**ต้นเหตุจริง (วัดด้วย CDP ที่ 360px):**

```
div.lay-topbar    ต้องการ 439px  ได้ 360px   min-width: auto
  → ดัน .lay-main ทั้งก้อนเป็น 439px
    → .app { overflow: hidden } ตัดส่วนเกิน 79px ทิ้ง
```

`.lay-topbar` เป็น grid item ที่ `min-width: auto` จึงไม่ยอมแคบกว่า min-content ของทั้งแถว
(ตัวสลับมุมมอง + แท็บหน้า + ปุ่ม) — **ไม่เกี่ยวกับ canvas เลย**

**วิธีแก้ที่ใช้จริง:**

```css
/* assets/css/page-specific/layout.css */
.lay-topbar {
  min-width: 0;
  overflow-x: auto;              /* ส่วนเกินเลื่อนดูได้ ไม่ใช่ถูกตัดทิ้ง */
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}
.lay-topbar::-webkit-scrollbar { display: none; }

/* ป้ายสถานะยืดตามแถบข้างบน ถ้าไม่ปลดล็อกจะดันกริดกลับมาอีกทาง */
.lay-status { min-width: 0; }

@media (max-width: 680px) {
  /* dock ลอยทับ canvas อยู่ บนจอเตี้ยจึงบังพื้นที่ทำงานเกือบหมด */
  .lay-dock {
    position: sticky;
    inset-block-end: 0;
    inset-inline: 0;
    padding-block-end: max(var(--space-2), env(safe-area-inset-bottom));
  }
}
```

**ผล:** `.app` ล้น 119 → **0** ที่ 320px และ 0 ทุกความกว้างตั้งแต่ 320 ถึง 1280px

### 🟠 P1-2 · `100vh` ทำให้หน้าโดนแถบ URL กิน

`assets/css/page-specific/palette-preview.css:8` ใช้ `min-height: 100vh`
และบรรทัด 692 ใช้ `height: calc(100vh - 64px)`

บนมือถือ `100vh` = ความสูง **ตอนแถบ URL ยุบแล้ว** เนื้อหาจึงถูกแถบ URL บังตอนโหลดครั้งแรก

app-shell ใช้ `100dvh` ถูกต้องแล้ว (`assets/css/app-shell.css:9`) — แค่ทำให้สม่ำเสมอ

```css
/* ใส่ fallback ก่อนเสมอ เผื่อเบราว์เซอร์เก่าที่ยังไม่รู้จัก dvh */
.pp { min-height: 100vh; min-height: 100dvh; }
.pp__frame { height: calc(100vh - 64px); height: calc(100dvh - 64px); }
```

### 🟠 P1-3 · แถบสเกลสีบีบจนอ่านตัวเลขไม่ออก

`.scale-strip` (`assets/css/design-system.css:712`) เป็น 11 คอลัมน์
ยุบเหลือ 6 ที่ ≤900px (`assets/css/design-system.css:824`)

ที่ 360px: 6 คอลัมน์ = ช่องละ ~53px ที่ `aspect-ratio: 1 / 2.2` และตัวอักษร `0.62rem` (≈9.9px)
audit พบตัวอักษรต่ำกว่า 12px **5 จุดในหน้าแรก**

```css
@media (max-width: 680px) {
  /* 11 ขั้นครบ แต่เลื่อนดูแนวนอน — ดีกว่าบีบจนอ่านไม่ออกหรือตัดขั้นทิ้ง */
  .scale-strip {
    grid-template-columns: repeat(11, minmax(4.5rem, 1fr));
    overflow-x: auto;
    overscroll-behavior-x: contain;
  }
  .scale-strip__cell { aspect-ratio: auto; min-height: 5.5rem; font-size: var(--text-xs); }
}
```

### 🟠 P1-4 · วงล้อสีตายตัว 280px

`.wheel` (`assets/css/design-system.css:611`) กำหนด `width/height: 280px` ตายตัว

ที่ 320px จอ − padding `--space-5` สองข้าง (40px) = เหลือ 280px **พอดีเป๊ะ ไม่เหลือระยะหายใจเลย**

```css
.wheel {
  /* ยืดตามที่มี แต่ไม่โตเกินขนาดที่ออกแบบไว้ */
  width: min(280px, 100%);
  height: auto;
  aspect-ratio: 1;
}
```

---

## 6. ระบบ Breakpoint ที่เสนอ

### ปัญหาปัจจุบัน: 11 breakpoint ไม่มีระบบ

```
560 · 640 · 720 · 760 · 860 · 900 · 1080 · 1100 · 1180 · 1300 · 1500
```

กระจายอยู่ใน 12 ไฟล์ โดย **ไม่มีค่าใดต่ำกว่า 560px** ทั้งที่ข้อมูลใน §3.1 บอกว่าจุดแตกอยู่ที่ **320–412px**
และ `assets/js/modules/toc-nav.js:9` ฮาร์ดโค้ด `MOBILE_BREAKPOINT = 900` ไว้อีกชุด
— JS กับ CSS จึงไม่ตรงกัน

> เดิม `assets/js/modules/sidebar-nav.js:5` ก็ฮาร์ดโค้ดค่าเดียวกันไว้ แต่ไฟล์นั้นถูกลบทิ้งแล้ว
> ตอนเก็บกวาด dead code เพราะมีแต่หน้าที่ถูกยุบไปแล้วที่ใช้ — ดู `analysis-architecture.md` §6 เฟส 0

### ระบบใหม่: 5 ขั้น ตั้งชื่อตามหน้าที่

| ชื่อ | ช่วง | ที่มาของตัวเลข |
|---|---|---|
| `xs` | < 390px | §3.1 — ทุกหน้าล้นต่ำกว่านี้ |
| `sm` | 390–679px | มือถือปกติ |
| `md` | 680–1023px | §3.2 — ทุกหน้าสะอาดตั้งแต่ 680px |
| `lg` | 1024–1279px | แท็บเล็ตแนวนอน |
| `xl` | ≥ 1280px | เดสก์ท็อป |

```css
/* assets/css/breakpoints.css — ไฟล์ใหม่ โหลดก่อน design-system.css */
:root {
  --bp-sm:  390px;
  --bp-md:  680px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
}
```

> ⚠️ **ข้อจำกัดที่ต้องรู้:** CSS custom property **ใช้ใน `@media` ไม่ได้**
> `@media (max-width: var(--bp-md))` จะไม่ทำงาน — เป็นข้อจำกัดของสเปก ไม่ใช่บั๊กเบราว์เซอร์
> โทเคนข้างบนมีไว้ให้ **JS อ่านค่าเดียวกัน** เพื่อลบการฮาร์ดโค้ดใน `sidebar-nav.js` / `toc-nav.js`:
>
> ```js
> const bp = (name) =>
>   parseInt(getComputedStyle(document.documentElement).getPropertyValue(`--bp-${name}`), 10);
> const isMobile = window.matchMedia(`(max-width: ${bp('md') - 1}px)`);
> isMobile.addEventListener('change', handleLayoutChange);   // ตอบสนองตอนหมุนจอด้วย
> ```
>
> `matchMedia` + `change` event ดีกว่า `window.innerWidth` ที่ใช้อยู่ เพราะไม่ต้องรอ resize event
> และไม่คำนวณซ้ำโดยไม่จำเป็น

---

## 7. แผนลงมือ

### เฟส 1 — หยุดเลือด (1.5–2 วัน) 🔴

| # | งาน | ไฟล์ | เวลา |
|---|---|---|---|
| 1 | `.groundnav` เลื่อนแนวนอนได้ (P0-1 ทางที่ 1) | `app-shell.css` | 0.5 ชม. |
| 2 | โทเคน `pointer: coarse` + `.range` สูง 44px (P0-3) | `design-system.css` | 2 ชม. |
| 3 | `.topbar__brand { min-width }` (P0-3) | `app-shell.css` | 10 นาที |
| 4 | แยก hover ด้วย `(hover: hover)` + คำกำกับบนทัช (P0-4) | `app-shell.css`, `workspace.css` | 3 ชม. |
| 5 | ~~`100vh` → `100dvh` (P1-2)~~ | ~~`palette-preview.css`~~ | หมดไปเอง — ไฟล์ถูกลบเป็น dead code |
| 6 | Layout: `--grid-cols: 4` + dock ก้นจอ (P1-1) | `layout.css` | 3 ชม. |

**ผลที่ได้:** ทุกหน้าเปิดใช้ได้จริงบนมือถือ ยกเว้นการลากวางในหน้า Layout

### เฟส 2 — โครงสร้างนำทาง (2–3 วัน) 🟠

| # | งาน | เวลา |
|---|---|---|
| 7 | สร้างไฟล์ `breakpoints.css` + ลบการฮาร์ดโค้ดใน JS | 3 ชม. |
| 8 | รวม 11 breakpoint เหลือ 5 ขั้น ทีละไฟล์ | 1 วัน |
| 9 | เมนูล่างแบบ tab bar ที่ `xs`/`sm` (P0-1 ทางที่ 2) | 1 วัน |

### เฟส 3 — ทัชเต็มรูปแบบ (2 วัน) 🔴

| # | งาน | เวลา |
|---|---|---|
| 10 | `layer-panel.js`: DnD → Pointer Events (P0-2) | 1 วัน |
| 11 | `layout.js`: DnD → Pointer Events (P0-2) | 1 วัน |

### เฟส 4 — ขัดเงา (1–2 วัน) 🟡

| # | งาน |
|---|---|
| 12 | `.scale-strip` / `.wheel` ยืดหยุ่น (P1-3, P1-4) |
| 13 | `component-catalog.css` — ดู `analysis-responsive-tablet.md` §5 |
| 14 | Container query แทน media query ในแผงที่ใช้ซ้ำหลายที่ |

---

## 8. Checklist ทดสอบ

### ทำอัตโนมัติ — รันซ้ำได้ทุกครั้งก่อน commit

- [ ] ทุกหน้า × {320, 360, 390, 412, 480, 600, 680, 767}: `.app` ล้น = 0
- [ ] ไม่มี container ที่ `scrollWidth > clientWidth` โดย `overflow-x` ไม่ใช่ `auto`/`scroll`
- [ ] ปุ่มทุกตัวที่ `pointer: coarse` มีด้านสั้น ≥ 44px
- [ ] ไม่มีข้อความ `font-size < 12px` (ยกเว้นที่ยกเว้นไว้โดยตั้งใจ)

### ต้องลองด้วยมือ

- [ ] ลากคอมโพเนนต์เข้า canvas ด้วยนิ้วได้ (หลังเฟส 3)
- [ ] ปรับสไลเดอร์ HSL ด้วยนิ้วได้ ไม่ลั่นไปเลื่อนหน้าแทน
- [ ] EyeDropper ยังทำงาน (Chrome Android)
- [ ] หมุนจอ แนวตั้ง ↔ แนวนอน แล้ว layout ตามทัน
- [ ] เปิดคีย์บอร์ดเสมือนแล้วช่องกรอกไม่โดนบัง
- [ ] ทดสอบบนเครื่องจริงอย่างน้อย 1 iOS + 1 Android — headless จำลอง gesture ไม่ได้

---

## 9. อ้างอิงมาตรฐาน

| หัวข้อ | มาตรฐาน |
|---|---|
| ขนาดเป้ากดขั้นต่ำ (AA) | WCAG 2.2 SC 2.5.8 Target Size (Minimum) — 24×24 CSS px |
| ขนาดเป้ากดที่แนะนำ (AAA) | WCAG 2.2 SC 2.5.5 Target Size (Enhanced) — 44×44 CSS px |
| แนวทางของ Apple | Human Interface Guidelines — 44×44 pt |
| แนวทางของ Google | Material Design — 48×48 dp |
| หน่วยความสูง viewport | CSS Values 4 — `dvh` / `svh` / `lvh` |
| ความสามารถของอุปกรณ์ | CSS Media Queries 4 — `pointer`, `hover` |
| Pointer Events | W3C Pointer Events Level 3 |

---

## 10. หมายเหตุจากผู้ตรวจ

สิ่งที่ทำไว้ดีแล้วและ **ไม่ควรรื้อ** ตอนแก้ responsive:

- `viewport` meta ถูกต้องครบ 8 หน้า — ไม่มี `user-scalable=no` ที่จะปิดการซูม (ตก WCAG 1.4.4)
- `prefers-reduced-motion` 18 จุด — ดูแลดีกว่าเว็บส่วนใหญ่มาก
- `touch-action: none` วางถูกที่บน canvas ทั้ง 5 จุด
- `minmax(0, 1fr)` ใช้อย่างเข้าใจ — เป็นเหตุผลที่ไม่มีหน้าไหนล้นระดับเอกสาร
- `overflow-x: auto` บน `#tool-rail` ทำให้ล้น 110px กลายเป็น "เลื่อนดูได้" แทนที่จะหาย — **เป็นแบบอย่างที่ควรใช้กับ `.groundnav`**

สิ่งที่ควรระวังที่สุดตอนแก้: `.app { overflow: hidden }` (`assets/css/app-shell.css:12`)
มีเหตุผลรองรับ (กันโดม Colorground ทำให้จอเลื่อน) **อย่าลบทิ้ง** — ให้แก้ที่ต้นทางว่าทำไมเนื้อหาถึงล้นแทน
