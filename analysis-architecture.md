# วิเคราะห์สถาปัตยกรรมโปรเจกต์ และแผนจัดโครงสร้างใหม่

> **ขอบเขต:** โครงสร้างไฟล์ · การแบ่งชั้น · การพึ่งพา · เครื่องมือ
> **เอกสารที่เกี่ยวข้อง:** [`analysis-responsive-mobile.md`](./analysis-responsive-mobile.md) · [`analysis-responsive-tablet.md`](./analysis-responsive-tablet.md)
> **สถานะโค้ดที่ตรวจ:** commit `2754978`
> **วันที่ตรวจ:** 2026-09-11

---

## 0. สถานะการแก้ไข (อัปเดต 2026-09-11)

**เฟส 0 (ลบ dead code) ทำเสร็จแล้ว** — และได้ผลมากกว่าที่ประเมินไว้

| | ประเมินไว้ | จริง |
|---|---|---|
| ไฟล์ที่ลบ | 8 | **14** |
| บรรทัดที่ลด | 2,477 | **2,845** (CSS −2,093 · JS −752) |

**สาเหตุที่มากกว่าประเมิน — orphan ลูกโซ่:** พอลบ `pages/color-theory.js`,
`pages/workshop.js`, `pages/palette-preview.js` ออก โมดูลที่มีแต่สามไฟล์นั้นเรียกใช้ก็กลายเป็น orphan ตาม
ต้องวนตรวจซ้ำจนไม่มี orphan ใหม่ (จบที่รอบ 3)

| รอบ | ไฟล์ที่ลบ |
|---|---|
| 1 | `workshop.css` · `palette-preview.css` · `pages/{workshop,palette-preview,color-theory}.js` · `modules/{inspector,palette-bar,selection-store}.js` |
| 2 | `modules/{checklist,editor-panel,scale-generator,section-tabs,sidebar-nav,workshop-shell}.js` |
| 3 | — ไม่มี orphan เหลือ ✓ |

**ขนาดโปรเจกต์หลังเก็บกวาด:** CSS 10 ไฟล์ / 10,964 บรรทัด · JS 52 ไฟล์ / 12,316 บรรทัด

> ⚠️ **ผลข้างเคียงที่ต้องรู้:** `modules/sidebar-nav.js` ถูกลบไปด้วย
> เอกสาร responsive ฉบับแรกอ้างอิงไฟล์นี้ว่าเป็นตัวอย่างของการฮาร์ดโค้ด `MOBILE_BREAKPOINT = 900`
> — ตอนนี้เหลือแต่ `modules/toc-nav.js:9` ที่ยังฮาร์ดโค้ดอยู่จริง (แก้ในเอกสารนั้นแล้ว)

**หน้า stub:** คง `workshop/` และ `palette-preview/` ไว้เป็น redirect ตามที่ตัดสินใจ
ลิงก์เก่าจึงยังใช้ได้ — ลบเฉพาะ CSS/JS ที่ไม่มีใครโหลด

| เฟส | สถานะ |
|---|---|
| 0 · ลบ dead code | ✅ **เสร็จ** |
| 1 · tooling (Vite/ESLint/Stylelint/CI) | ⬜ ยังไม่ทำ |
| 2 · ดึง token + breakpoints | ⬜ ยังไม่ทำ |
| 3–5 · แตกไฟล์ · ย้ายโครง · HTML shell | ⬜ ยังไม่ทำ |

---

## 1. บทสรุปผู้บริหาร

ColorLab **ไม่ได้มีสถาปัตยกรรมที่ผิด** — มีการแบ่งชั้น `pages` / `modules` / `utils` ที่ถูกต้องตามหลัก
มี state layer จริง (`palette-store.js` ใช้ร่วม 5 หน้า) และ `utils/` เป็น pure logic ที่แยกจาก DOM สะอาด

ปัญหาอยู่ที่ **แกนการแบ่งไฟล์ของ CSS กับ JS ไม่ตรงกัน**

```
JS  แบ่งตาม "ฟีเจอร์"  →  modules/layer-panel.js · layout-canvas.js · layout-board.js
CSS แบ่งตาม "หน้า"     →  page-specific/layout.css  (2,163 บรรทัด รวมทุกอย่าง)
```

สไตล์กับพฤติกรรมของสิ่งเดียวกันจึงอยู่คนละโลก — แก้ layer panel ต้องเปิด 2 ไฟล์ที่อยู่คนละต้นไม้
และ CSS ของทั้ง 3 โมดูลปนอยู่ในไฟล์เดียวที่ไม่มีใครกล้าแตะ

**นี่คือรากของปัญหาอื่นเกือบทั้งหมด** — ไฟล์ยักษ์ (A4), dead code ที่ไม่มีใครสังเกต (A1),
และ breakpoint ที่กระจายจนไม่สม่ำเสมอ (A8 — ดูรายละเอียดในเอกสาร responsive)

| ระดับ | จำนวน | สาระ |
|---|---|---|
| 🔴 **A1–A2** | 2 | Dead code 2,477 บรรทัด · แกนการแบ่งไฟล์ไม่ตรงกัน |
| 🟠 **A3–A5, A7–A8** | 5 | ไม่มี `@layer` · ไฟล์ยักษ์ · HTML ซ้ำ · ไม่มี test/CI · token กระจาย |
| 🟡 **A6** | 1 | ไม่มี build step |

**ประเมินแรงงานรวม ~11 วัน** แต่ **เฟส 0–2 (2.5 วัน) ให้ผลตอบแทนสูงสุด** และเป็นงานความเสี่ยงต่ำทั้งหมด

---

## 2. โครงสร้างปัจจุบัน

```
ColorLab/
├── index.html                      970 บรรทัด   Color Theory      [หน้าจริง]
├── .nojekyll · .gitignore
│
├── workspace/index.html            146          Colorground       [หน้าจริง]
├── layout/index.html               393          Layout builder    [หน้าจริง]
├── component-style/index.html      133          Component Style   [หน้าจริง]
│
├── contrast-audit/index.html        70          placeholder เปล่า  [stub]
├── token-export/index.html          70          placeholder เปล่า  [stub]
├── workshop/index.html              26          redirect →workspace [stub]
├── palette-preview/index.html       26          redirect →workspace [stub]
│
└── assets/
    ├── components/     21 × .html          คอมโพเนนต์ตัวอย่าง (โหลดด้วย fetch)
    ├── images/         icon-sprite.svg
    ├── css/            12 ไฟล์ · 13,057 บรรทัด
    └── js/             64 ไฟล์ · 13,068 บรรทัด
         ├── pages/      8 ไฟล์    entry point
         ├── modules/   44 ไฟล์    UI behavior
         └── utils/     12 ไฟล์    pure logic
```

### CSS ที่แต่ละหน้าโหลดจริง

| หน้า | CSS ที่โหลด | JS entry |
|---|---|---|
| `/` | design-system · app-shell · theory · theory-figures · color-theory | `theory.js` |
| `/workspace/` | design-system · app-shell · workspace · preview-mock | `workspace.js` |
| `/layout/` | design-system · app-shell · component-catalog · component-style · layout | `layout.js` |
| `/component-style/` | design-system · app-shell · component-catalog · component-style | `component-style.js` |
| `/contrast-audit/` · `/token-export/` | design-system · app-shell | `placeholder.js` |
| `/workshop/` · `/palette-preview/` | design-system · app-shell | — |

> หน้า Layout โหลด CSS 5 ไฟล์ และ `layout.js` มี `import` 17 บรรทัด ซึ่งแต่ละตัวยัง import ต่ออีกชั้น
> — เป็น request waterfall ที่ยาวที่สุดในโปรเจกต์

---

## 3. สิ่งที่ทำถูกแล้ว — ห้ามรื้อ

การจัดโครงสร้างใหม่ต้อง **รักษาสิ่งเหล่านี้ไว้ทั้งหมด** ไม่ใช่เริ่มจากศูนย์

| เรื่อง | หลักฐานในโค้ด | ทำไมถึงมีค่า |
|---|---|---|
| **แบ่งชั้น 3 ระดับชัดเจน** | `pages/` → `modules/` → `utils/` | เป็น layered architecture ที่ถูกต้อง · ทิศทางการพึ่งพาไม่ย้อน |
| **`utils/` เป็น pure logic** | `color-utils.js` (409) · `layout-model.js` (899) · `palette-tokens.js` (240) | ทดสอบได้ทันทีโดยไม่ต้องมี DOM — เป็นฐานของ test suite ในอนาคต |
| **มี state layer จริง** | `palette-store.js` · pattern `createPaletteStore()` ใช้ร่วม 5 หน้า | ไม่ใช่ global mutable state · เป็น factory ที่คุมขอบเขตได้ |
| **ES modules มาตรฐาน** | ทุกไฟล์ใช้ `import`/`export` ไม่มี global namespace | ย้ายเข้า bundler ได้โดยแทบไม่ต้องแก้โค้ด |
| **Module reuse สูงจริง** | `theme-toggle` 8 หน้า · `icon-sprite` 8 · `guide-modal` 4 · `orbit-dock` 4 | ไม่ใช่การแยกไฟล์ลวง ๆ — ถูกใช้ซ้ำจริง |
| **คอมเมนต์อธิบาย "ทำไม" ไม่ใช่ "อะไร"** | `layout.css:502` อธิบายว่าทำไมย่อที่ wrapper ไม่ใช่ที่ canvas | เป็นทรัพย์สินที่หายากมาก **ห้ามตัดทิ้งตอนย้ายไฟล์** |

---

## 4. ปัญหาเชิงสถาปัตยกรรม

### 🔴 A1 · Dead code 2,477 บรรทัด (16% ของ CSS)

ไฟล์ที่ **ไม่มีหน้าไหนโหลดและไม่มีไฟล์ไหน import**

| ไฟล์ | บรรทัด | สาเหตุ |
|---|---|---|
| `assets/css/page-specific/workshop.css` | 1,095 | หน้า workshop ถูกยุบเข้า workspace ตั้งแต่ v.0008 |
| `assets/css/page-specific/palette-preview.css` | 998 | หน้า palette-preview ถูกยุบเข้า workspace |
| `assets/js/pages/workshop.js` | 51 | เหมือนกัน |
| `assets/js/pages/palette-preview.js` | 34 | เหมือนกัน |
| `assets/js/pages/color-theory.js` | 29 | หน้าแรกใช้ `theory.js` แทน |
| `assets/js/modules/inspector.js` | 187 | ถูกถอดตอนเอาแผงคุณสมบัติออกจาก workspace |
| `assets/js/modules/palette-bar.js` | 49 | เหมือนกัน |
| `assets/js/modules/selection-store.js` | 34 | เหมือนกัน |
| **รวม** | **2,477** | |

**ทำไมถึงสะสมได้โดยไม่มีใครเห็น:** ไม่มี build step ที่จะเตือนว่าไฟล์ไม่ถูก import
และไม่มี lint rule ตรวจ orphan — โครงสร้างปัจจุบัน **ไม่มีกลไกใดบอกได้เลยว่าไฟล์ไหนตายแล้ว**

> `workshop.css` 1,095 บรรทัดมีคอมเมนต์อธิบายเหตุผลเชิงออกแบบไว้เยอะ
> ก่อนลบควร `git log --follow` ดูว่ามีแนวคิดอะไรที่ควรยกไปไว้ที่ `workspace.css` หรือไม่
> — แต่ตัวไฟล์เองไม่มีเหตุผลให้อยู่ต่อ เพราะ git เก็บประวัติไว้ครบแล้ว

---

### 🔴 A2 · แกนการแบ่ง CSS กับ JS ไม่ตรงกัน (รากของปัญหาอื่น)

**ตัวอย่างที่ชัดที่สุด — ฟีเจอร์ "แผงเลเยอร์" ของหน้า Layout:**

```
พฤติกรรม :  assets/js/modules/layer-panel.js          435 บรรทัด
สไตล์     :  assets/css/page-specific/layout.css       บรรทัด 254–481 (ปนกับอีก 6 ฟีเจอร์)
โมเดลข้อมูล:  assets/js/utils/layout-model.js           899 บรรทัด (ปนกับ canvas + board)
```

`layout.css` 2,163 บรรทัดมีอย่างน้อย 6 ฟีเจอร์ปนกัน (อ่านจากคอมเมนต์หัวข้อในไฟล์):

| บรรทัด | ส่วน |
|---|---|
| 26–82 | หัวแผงสองข้าง |
| 83–123 | แท็บของแผงซ้าย |
| 124–253 | คลังคอมโพเนนต์ |
| 254–481 | แผงเลเยอร์ |
| 482–~1090 | แคนวาส · กริด · หมุดยืด · เงาปลายทาง |
| 1092–1103 | media queries (ทั้งหน้ารวมกัน) |
| 1104+ | dock · HUD · flow view · quick add |

**ผลกระทบที่วัดได้:** `media query` ของทั้งหน้าถูกรวมไว้ในบล็อกเดียวที่บรรทัด 1092–1103
ซึ่งเป็นสาเหตุโดยตรงของบั๊ก T0-1 ในเอกสาร tablet — เมื่อกฎเดียวตัดสินใจหลายเรื่องพร้อมกัน
(จำนวนคอลัมน์ · ตำแหน่ง dock · การซ่อน summary) การพลาด 8px เรื่องเดียวทำให้พลาดตามกันหมด

---

### 🟠 A3 · ไม่มี `@layer` — cascade อาศัยลำดับ `<link>` ล้วน

`grep "@layer"` = **0 ทุกไฟล์**

ลำดับความสำคัญของ CSS ทั้งโปรเจกต์ขึ้นกับลำดับแท็ก `<link>` ใน HTML แต่ละหน้า
ซึ่งต้องเรียงให้ตรงกันเองใน 6 ไฟล์ — ถ้าหน้าใหม่เรียงสลับ สไตล์จะเพี้ยนแบบหาสาเหตุยาก

```css
/* เสนอ: ประกาศลำดับไว้ที่เดียว แล้วลำดับ <link> จะไม่สำคัญอีกต่อไป */
@layer reset, tokens, base, ui, feature, page, utility;
```

ผลพลอยได้: ลด specificity war — กฎใน `feature` ชนะ `ui` เสมอโดยไม่ต้องเพิ่ม selector ให้ยาวขึ้น

---

### 🟠 A4 · ไฟล์ยักษ์ 3 ตัว

| ไฟล์ | บรรทัด | รอยแตกตามธรรมชาติ |
|---|---|---|
| `assets/css/component-catalog.css` | 2,436 | **แบ่งตามคอมโพเนนต์อยู่แล้ว** — `ui-btn` (242) · `ui-badge` (363) · `ui-field` (423) · `ui-table` (530) · `ui-toolbar` (618) … ตรงกับ 21 ไฟล์ใน `assets/components/` แบบ 1:1 |
| `assets/js/pages/layout.js` | 2,428 | แบ่งตามหน้าที่ได้ชัด — tokens (68–100) · render (101–312) · parts (197–307) · board/zoom (386–443) · HUD (477–581) · flow view (582–640) · quick add (641–700+) |
| `assets/css/page-specific/layout.css` | 2,163 | ตามตาราง A2 ข้างบน |

**`component-catalog.css` เป็นเคสที่ชัดที่สุด** — มี `assets/components/button.html` อยู่แล้ว
แต่ CSS ของปุ่มอยู่ห่างออกไปอีกต้นไม้หนึ่ง ทั้งที่ทั้งคู่เปลี่ยนพร้อมกันเสมอ

---

### 🟠 A5 · HTML โครงเดียวกันถูกคัดลอก 6 รอบ

| ไฟล์ | บรรทัด | `class="topbar"` |
|---|---|---|
| `index.html` | 970 | 8 |
| `workspace/index.html` | 146 | 8 |
| `layout/index.html` | 393 | 7 |
| `component-style/index.html` | 133 | 7 |
| `contrast-audit/index.html` | 70 | 7 |
| `token-export/index.html` | 70 | 7 |

แถบบน · ลิงก์ CSS · โครง `<div class="app">` ถูกเขียนซ้ำทุกไฟล์
เพิ่มเมนู 1 อันต้องแก้ 6 ไฟล์ และถ้าลืมไฟล์ใดไฟล์หนึ่งจะไม่มีอะไรเตือน

---

### 🟠 A7 · ไม่มี test / lint / CI

ไม่มี `package.json`, `.eslintrc`, `.stylelintrc`, `.github/workflows/`

`utils/` 12 ไฟล์เป็น pure function ทั้งหมด — **พร้อมเขียน unit test ทันที**
`color-utils.js` มีฟังก์ชันคณิตศาสตร์สี (`contrastRatio`, `simulateCvd`, `rybHueToRgbHue`)
ที่ผลลัพธ์ตรวจสอบได้ด้วยค่าอ้างอิงมาตรฐาน — เป็นจุดเริ่มที่คุ้มที่สุด

---

### 🟡 A6 · ไม่มี build step

ข้อดีที่มีตอนนี้: เปิดด้วย static server ก็ทำงานเลย ไม่มีขั้นตอนคั่น
ข้อเสีย: หน้า Layout โหลด CSS 5 ไฟล์ + ES module chain ลึกหลายชั้น = waterfall
และไม่มีอะไรจับ dead code (A1) หรือบังคับกฎการพึ่งพา

**Vite ให้ทั้งสองอย่าง** — `vite dev` ยังเป็น native ES module ไม่มี bundle (เร็วกว่าเดิมด้วย)
ส่วน `vite build` ค่อย bundle สำหรับ production

---

## 5. โครงสร้างเป้าหมาย

**หลักการเดียว: สิ่งที่เปลี่ยนพร้อมกัน ต้องอยู่ด้วยกัน**

```
ColorLab/
├── src/
│   ├── shared/                       ── ไม่รู้จักฟีเจอร์ใดเลย
│   │   ├── tokens/
│   │   │   ├── breakpoints.css       ← ใหม่ · แก้ A8
│   │   │   ├── color.css · space.css · type.css · motion.css
│   │   │   └── tokens.js             ← JS อ่านค่าเดียวกับ CSS
│   │   ├── ui/                       ── ปุ่ม/ช่องกรอก/การ์ด: CSS+JS คู่กัน
│   │   │   ├── button/   button.css · button.html
│   │   │   ├── field/    field.css  · field.html
│   │   │   └── … (21 ตัว ← แตกจาก component-catalog.css)
│   │   └── lib/                      ── เดิมคือ utils/ (pure logic)
│   │       ├── color-utils.js · color-utils.test.js
│   │       └── …
│   │
│   ├── features/                     ── แต่ละโฟลเดอร์ = 1 ฟีเจอร์ครบชุด
│   │   ├── palette/
│   │   │   ├── palette.css
│   │   │   ├── store.js · editor.js · export.js · library.js · scales.js
│   │   │   └── index.js              ← public API เท่านั้นที่ออกนอกโฟลเดอร์
│   │   ├── layout-builder/
│   │   │   ├── canvas.css · layer-panel.css · library.css · dock.css
│   │   │   ├── canvas.js  · layer-panel.js  · board.js · model.js
│   │   │   └── index.js
│   │   ├── color-tools/              (wheel · scale · contrast · cvd · harmony)
│   │   └── component-catalog/
│   │
│   ├── widgets/                      ── ประกอบหลายฟีเจอร์เข้าด้วยกัน
│   │   ├── app-shell/   topbar.css · dock.css · cmdk.css · guide.css  + js
│   │   └── nav/         sidebar-nav.js · toc-nav.js · groundnav.css
│   │
│   └── pages/                        ── ผูกทุกอย่าง · ที่เดียวที่รู้จัก widgets
│       ├── theory/     index.html · theory.js · theory.css · figures.css
│       ├── workspace/ · layout/ · component-style/
│       └── _shell.html               ← โครงร่วม · แก้ A5
│
├── public/                           ── ผลลัพธ์ที่ deploy
├── tools/
│   └── responsive-audit.mjs          ← harness จากการตรวจรอบนี้ เก็บไว้รันซ้ำ
├── package.json · vite.config.js
├── .eslintrc.json · .stylelintrc.json
└── .github/workflows/ci.yml
```

### กฎการพึ่งพา

```
pages  →  widgets  →  features  →  shared
```

- ห้ามย้อนทิศ (`shared` ห้าม import `features`)
- **ห้าม feature import feature โดยตรง** — ต้องผ่าน `pages` ที่เป็นตัวประกอบ
- บังคับด้วย `eslint-plugin-import` → `import/no-restricted-paths` ใน CI

> ทิศทางนี้ **ตรงกับที่โปรเจกต์ทำอยู่แล้ว** (`pages` → `modules` → `utils`)
> การย้ายครั้งนี้จึงไม่ใช่การเปลี่ยนสถาปัตยกรรม แต่เป็นการ **จัดกลุ่มตามฟีเจอร์เพิ่มเข้าไปในแกนเดิม**

---

## 6. แผน Migration

### เฟส 0 — ลบ dead code (0.5 วัน) 🟢 เสี่ยงต่ำมาก

```bash
git rm assets/css/page-specific/workshop.css
git rm assets/css/page-specific/palette-preview.css
git rm assets/js/pages/workshop.js
git rm assets/js/pages/palette-preview.js
git rm assets/js/pages/color-theory.js
git rm assets/js/modules/inspector.js
git rm assets/js/modules/palette-bar.js
git rm assets/js/modules/selection-store.js
```

**ไม่ลบโฟลเดอร์ `workshop/` และ `palette-preview/`** — เก็บ redirect ไว้ให้ลิงก์เก่าไม่เสีย
(`workshop/index.html` มี `<meta http-equiv="refresh">` และ `<link rel="canonical">` ที่ถูกต้องอยู่แล้ว)

**ตรวจก่อนลบ:** เปิดทั้ง 4 หน้าจริง ยืนยันว่าไม่มี 404 ใน Network tab
**ผลลัพธ์:** −2,477 บรรทัด · CSS เหลือ 10,964 บรรทัด

### เฟส 1 — ตั้ง tooling (1 วัน) 🟢 เสี่ยงต่ำ

```jsonc
// package.json
{
  "type": "module",
  "scripts": {
    "dev":    "vite",
    "build":  "vite build",
    "lint":   "eslint src && stylelint 'src/**/*.css'",
    "test":   "vitest run",
    "audit:responsive": "node tools/responsive-audit.mjs"
  }
}
```

- Vite ตั้งค่า `appType: 'mpa'` — รองรับหลาย HTML entry โดยไม่ต้องเขียน router
- ESLint + `import/no-restricted-paths` บังคับกฎการพึ่งพาใน §5
- Stylelint จับ hardcoded color / breakpoint ที่ไม่ผ่าน token
- **ย้าย `tools/responsive-audit.mjs` เข้า repo** — harness ที่ใช้ตรวจรอบนี้ ควรรันซ้ำได้ใน CI

> **ยังเปิดด้วย static server ได้เหมือนเดิม** — Vite dev server ก็เสิร์ฟ native ES module
> ไม่ได้บังคับให้ต้อง build ก่อนดู

### เฟส 2 — ดึง token ออกมา (1 วัน) 🟢 เสี่ยงต่ำ · **ให้ผลตอบแทนสูงสุด**

แตก `design-system.css` (882) เป็น `shared/tokens/*.css` และเพิ่ม `breakpoints.css`

**ทำไมต้องทำก่อนงาน responsive:** งานทั้งสองเอกสาร responsive ต้องแก้ breakpoint 11 ค่าใน 12 ไฟล์
ถ้าไม่มี single source ก่อน จะต้องไล่แก้ทีละจุดและพลาดได้ง่าย (ซึ่งเป็นที่มาของบั๊ก T0-1)

พร้อมกันนี้ลบ hardcode ใน `assets/js/modules/sidebar-nav.js:5` และ `assets/js/modules/toc-nav.js:9`

### เฟส 3 — แตกไฟล์ยักษ์ (3–4 วัน) 🟠 เสี่ยงกลาง

เรียงจากง่ายไปยาก:

| ลำดับ | ไฟล์ | วิธีแตก | เวลา |
|---|---|---|---|
| 1 | `component-catalog.css` 2,436 | ตามคอมโพเนนต์ → `shared/ui/<name>/<name>.css` คู่กับ `.html` ที่มีอยู่แล้ว | 1 วัน |
| 2 | `layout.css` 2,163 | ตามตาราง A2 → `features/layout-builder/*.css` | 1 วัน |
| 3 | `layout.js` 2,428 | ตามกลุ่มหน้าที่ใน A4 | 1.5 วัน |

**วิธีตรวจว่าแตกแล้วไม่พัง:** รัน `tools/responsive-audit.mjs` ก่อนและหลัง — ตัวเลขต้องเท่าเดิมทุกช่อง
(ถ้าดีขึ้นแปลว่าเผลอแก้บั๊กไปด้วย ถ้าแย่ลงแปลว่าตกกฎ CSS ไป)

### เฟส 4 — ย้ายเข้าโครง `src/` (3 วัน) 🟠 เสี่ยงกลาง

ทำทีละฟีเจอร์ ไม่ย้ายรวดเดียว · ลำดับที่แนะนำ:
`shared/lib` → `shared/tokens` → `shared/ui` → `features/palette` → `features/color-tools` → `features/layout-builder` → `widgets` → `pages`

แต่ละก้าวต้องผ่าน `npm run lint && npm run test && npm run audit:responsive`

### เฟส 5 — HTML shell เดียว (2 วัน) 🟡

ใช้ `vite-plugin-html` หรือ partial include ดึงแถบบน/ลิงก์ CSS/โครง `app` มาไว้ที่เดียว
คาดว่า HTML รวมลดจาก 4,110 เหลือ ~2,500 บรรทัด

---

## 7. ลำดับงานที่แนะนำ เมื่อรวมกับงาน Responsive

งานสองชุดนี้ทับซ้อนกันที่ **เฟส 2 (token)** — ทำผิดลำดับจะเสียเวลาซ้ำ

```
เฟส 0  ลบ dead code            0.5 วัน   ← ทำก่อนเสมอ ลดพื้นที่ที่ต้องแก้
   ↓
เฟส 1  tooling + audit harness   1 วัน   ← ได้ตาข่ายกันพลาดก่อนเริ่มแก้จริง
   ↓
เฟส 2  token + breakpoints       1 วัน   ← ปลดล็อกงาน responsive ทั้งหมด
   ↓
   ├─→ responsive เฟส 1 (มือถือ P0)      1.5–2 วัน   ← ผู้ใช้เห็นผลทันที
   ├─→ responsive เฟส A (แท็บเล็ต T0)      1 วัน
   └─→ สถาปัตยกรรม เฟส 3–5                 8 วัน     ← ทำคู่ขนานได้
```

**ถ้าต้องเลือกทำอย่างเดียว:** เฟส 0 → 1 → 2 (**2.5 วัน**) แล้วต่อด้วย responsive เฟส 1
จะได้ทั้งโครงสร้างที่ไม่ถอยหลังและผลที่ผู้ใช้สัมผัสได้จริงบนมือถือ

---

## 8. ความเสี่ยงและการรับมือ

| ความเสี่ยง | โอกาส | การรับมือ |
|---|---|---|
| แตกไฟล์ CSS แล้วตกกฎบางข้อ | สูง | รัน `audit:responsive` เทียบก่อน-หลังทุกก้าว · แตกทีละไฟล์ต่อ commit |
| ลำดับ cascade เปลี่ยนหลังแตกไฟล์ | สูง | ทำ `@layer` (A3) **ก่อน** แตกไฟล์ — ลำดับจะไม่ขึ้นกับลำดับ import อีก |
| คอมเมนต์อธิบาย "ทำไม" หายตอนย้าย | กลาง | ย้ายด้วย `git mv` + แก้ทีหลัง ไม่ copy-paste · ให้ reviewer เช็กคอมเมนต์โดยเฉพาะ |
| GitHub Pages พังเพราะมี build step | กลาง | ตั้ง workflow ให้ build แล้ว deploy `public/` · คง `.nojekyll` ไว้ |
| ลิงก์เก่าเสียหลังจัดโครง | ต่ำ | URL ทุกหน้าเป็น folder-based อยู่แล้ว · เฟส 4 ไม่แตะ URL |
| ขอบเขตงานบานปลาย | สูง | เฟส 0–2 เป็นหน่วยที่จบในตัว หยุดตรงไหนก็ได้โดยไม่ทิ้งงานค้าง |

---

## 9. ตัวชี้วัดความสำเร็จ

| ตัวชี้วัด | ตอนนี้ | เป้า |
|---|---|---|
| Dead code | 2,477 บรรทัด | **0** |
| ไฟล์ > 800 บรรทัด | 12 ไฟล์ | **≤ 3** |
| ไฟล์ CSS ใหญ่สุด | 2,436 | **< 500** |
| breakpoint ที่ต่างกัน | 11 ค่า | **5 ค่า** |
| แหล่งนิยาม breakpoint | 12 ไฟล์ CSS + 2 ไฟล์ JS | **1 ไฟล์** |
| `@layer` | ไม่มี | **มี · ประกาศที่เดียว** |
| Unit test | 0 | **`shared/lib` ครอบคลุม ≥ 80%** |
| CI | ไม่มี | **lint + test + responsive audit ทุก PR** |
| HTML ซ้ำ (topbar) | 6 ไฟล์ | **1 ไฟล์** |

---

## 10. หมายเหตุจากผู้ตรวจ

**สิ่งที่ทำให้โปรเจกต์นี้ต่างจากโค้ดที่ "รกจริง":**

`layout.css:502` เขียนไว้ว่าทำไมต้องย่อที่ wrapper แทนที่จะย่อที่ canvas ตรง ๆ
`workspace.css:7` อธิบายว่าทำไมถึงเอาแผงคุณสมบัติขวาออก
`app-shell.css:31` อธิบายว่าทำไม topbar ต้องมี stacking context ของตัวเอง

คอมเมนต์พวกนี้คือ **สิ่งที่ refactor ทำลายได้ง่ายที่สุดและสร้างใหม่ยากที่สุด**
เพราะมันบันทึกเหตุผลที่หาไม่เจอจากตัวโค้ด

ข้อเสนอในเอกสารนี้ทั้งหมด **ไม่ใช่การบอกว่าโครงสร้างเดิมผิด** — โครงสร้างเดิมถูกต้องตามหลัก
แค่ยังแบ่งด้วยแกนเดียว (ชั้น) ทั้งที่โปรเจกต์โตจนต้องการสองแกน (ชั้น + ฟีเจอร์)

และปัญหาที่ทำให้ต้องมาเขียนเอกสารนี้ตั้งแต่แรก — dead code 2,477 บรรทัดที่สะสมโดยไม่มีใครเห็น —
ไม่ได้เกิดจากความประมาท แต่เกิดจาก **ไม่มีเครื่องมือใดในโปรเจกต์ที่มองเห็นมันได้**
ซึ่งเป็นเหตุผลที่เฟส 1 (tooling) ถูกวางไว้ก่อนงานรื้อโครงสร้างจริงทั้งหมด
