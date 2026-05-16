# DESIGN.md - DiDuDuaDi

DiDuDuaDi la web app du lich am thuc cho khu pho am thuc Vinh Khanh. Giao dien can tao cam giac hien dai, sach, de tin cay, dong thoi van co su am ap cua mot hanh trinh an uong dia phuong. File nay la nguon tham chieu de thiet ke UI cho cac man hinh User, Owner va Admin.

---

## 1. Visual Theme & Atmosphere

### Tinh cach thuong hieu

- Gan gui, tre trung, thich hop cho khach du lich va nguoi di an quanh khu Vinh Khanh.
- Chuyen nghiep du de chu quan/admin tin tuong khi quan ly noi dung.
- Uu tien thong tin ro rang hon trang tri phuc tap.
- Cam giac tong the: "ban do am thuc thong minh", khong phai landing page quang cao.

### Khong khi giao dien

- Nen sang, sach, nhieu khoang tho.
- Dung xanh Emerald de tao cam giac dia phuong, than thien, da duyet/san sang.
- Dung Blue de the hien dieu huong, he thong, thong ke va hanh dong phu.
- Giao dien dashboard nen giau tinh cong cu: gon, scan nhanh, lap lai thao tac de dang.
- Giao dien ban do nen uu tien thao tac nhanh: tim quanh, chon POI, nghe audio, mo duong di.

---

## 2. Color Palette & Roles

### Core palette

| Token | Hex | Vai tro |
|---|---:|---|
| `--color-emerald-500` | `#10B981` | Primary action, active state, success |
| `--color-emerald-600` | `#059669` | Hover/pressed primary |
| `--color-emerald-50` | `#ECFDF5` | Active background, soft success card |
| `--color-blue-600` | `#2563EB` | Secondary action, analytics, links |
| `--color-blue-50` | `#EFF6FF` | Soft blue background |
| `--color-slate-950` | `#020617` | Main text, headings |
| `--color-slate-700` | `#334155` | Body text |
| `--color-slate-500` | `#64748B` | Muted text |
| `--color-slate-200` | `#E2E8F0` | Borders |
| `--color-slate-50` | `#F8FAFC` | Page background |
| `--color-orange-500` | `#F97316` | Food street CTA, warning accent |
| `--color-red-500` | `#EF4444` | Delete/reject/error |

### Semantic roles

- Primary buttons: Emerald background, white text.
- Secondary buttons: White background, slate text, soft blue/emerald border.
- Active navigation: Emerald 50 background, Emerald 600 text/icon.
- Warning/food route CTA: Orange 50 background, Orange 600 text/border.
- Status approved/available: Emerald pill.
- Status pending: Blue or amber pill.
- Status rejected/delete: Red.

### Backgrounds

- App background: soft slate/blue/emerald wash, never pure saturated gradient.
- Cards: white or near-white with subtle border.
- Dashboard panels: white, glassy, low contrast shadow.
- Map surface: framed but not buried under heavy decoration.

---

## 3. Typography Rules

### Font direction

- Use system sans-serif stack for performance and Vietnamese support:
  `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Avoid decorative fonts for operational UI.
- Letter spacing should be normal or slightly positive only for small uppercase labels.

### Type scale

| Use | Size | Weight |
|---|---:|---:|
| Hero title / major page title | 40-56px desktop, 28-36px mobile | 800 |
| Dashboard title | 28-36px | 800 |
| Section heading | 20-26px | 700 |
| Card title | 16-20px | 700 |
| Body | 14-16px | 400-500 |
| Caption/meta | 12-13px | 500 |
| Stat number | 36-48px | 800 |

### Text behavior

- Vietnamese labels must be clear and natural, not machine-translated.
- Avoid all-caps for long Vietnamese text.
- Use uppercase only for short eyebrow labels like `TONG QUAN`, `QR QUAN`.
- Buttons should use short, action-first labels: `Them mon`, `Sua`, `In standee`, `Sao chep link`.

---

## 4. Component Stylings

### Buttons

- Primary button:
  - Emerald background.
  - 12-16px border radius for app UI.
  - Strong but soft shadow only on important CTA.
  - Minimum touch target 44px.
- Secondary button:
  - White background.
  - 1px border `#DDE7F3`.
  - Blue or Emerald text depending context.
- Icon buttons:
  - Use Lucide React outline icons.
  - Square or circular hit area.
  - Tooltip/aria-label required for unclear icons.

### Cards

- Use rounded-2xl feeling for marketing/overview cards, but keep operational nested cards restrained.
- Cards should have:
  - White/near-white background.
  - 1px border `rgba(148, 163, 184, 0.22)`.
  - Shadow: soft, large blur, low opacity.
- Do not put cards inside cards unless it is a modal/dialog or repeated item inside a panel.

### Sidebar

- Sidebar should feel light, not bulky.
- Use thin outline icons.
- Active item:
  - light emerald background.
  - emerald icon/text.
  - subtle border.
- Collapsed/mobile sidebar must not let pills/text overflow.
- If width is too small, show icon-only item with hidden text instead of squeezed labels.

### Dashboard stat cards

- Layout:
  - Top row: icon on left, number on right.
  - Bottom: description text.
  - Optional mini sparkline/area chart at bottom.
- Pastel backgrounds by metric:
  - Views: blue.
  - Audio plays: teal/emerald.
  - QR scans: slate/blue.
  - Pending requests: amber/orange.
  - POI count: blue.
- Stat cards must align to a consistent grid.

### Forms

- Inputs:
  - 44-52px height.
  - rounded 12-16px.
  - white background.
  - clear focus ring in Blue/Emerald.
- Labels above fields.
- Use tabs for multilingual content, not a long stack of language fields.
- For GPS coordinates, prefer map picker over manual text fields.

### Dialogs

- Use dialogs for add/edit flows that interrupt the current view:
  - Add/edit menu item.
  - Confirm delete.
  - Quick details if content is dense.
- Dialog content max width should be readable, not full page unless editing complex forms.

### QR / Standee

- QR section should be two-column on desktop:
  - Left: printable standee preview.
  - Right: QR action panel with title `QR quan`, public link, copy/open/print.
- Do not show duplicate QR if standee already contains QR unless it serves a distinct action.
- Printable standee:
  - centered content.
  - large QR.
  - shop image/logo at top.
  - high contrast black text.
  - A4 friendly with no browser chrome content inside print body.

---

## 5. Layout Principles

### Overall layout

- App shell should be spacious but not wasteful.
- Page max width:
  - Admin/Owner dashboards: 1320-1480px.
  - Map page: can use wider layout because map/list split needs space.
- Use 24-32px gaps on desktop, 14-18px on mobile.
- Important content should start high enough above bottom navigation.

### User map page

- Primary screen is the map, not a hero.
- Controls should be grouped:
  - Search and radius.
  - Food street / current location.
  - narration toggles.
- Current coordinates belong in the note area under the map.
- Nearby list should scroll independently if content grows.

### Owner dashboard

- Overview:
  - shop identity area.
  - stat grid.
  - approved shop/quick status.
- Menu:
  - current menu grid.
  - add/edit in dialog.
  - cards show image, name, price, status/action; description hidden from card.
- Shop info/map:
  - form + map picker.
  - coordinates visible but secondary.
- QR:
  - standee preview + action panel.

### Admin dashboard

- Header should be thin glassmorphism.
- Sidebar fixed-width on desktop.
- Content area should have stable white panel height.
- Empty states should center icon and message vertically inside the fixed panel.
- If content is long, internal panel scrolls instead of expanding layout endlessly.

---

## 6. Depth & Elevation

### Shadows

- Use soft shadows:
  - small: `0 8px 24px rgba(15, 23, 42, 0.08)`
  - medium: `0 18px 45px rgba(15, 23, 42, 0.10)`
  - emerald glow: `0 18px 36px rgba(16, 185, 129, 0.16)`
- Avoid harsh black shadows.
- Avoid excessive glow on every card.

### Glassmorphism

- Header/panels may use:
  - translucent white.
  - backdrop blur.
  - subtle border.
- Keep text contrast high.
- Do not place glass over busy images unless a strong overlay is added.

---

## 7. Do's and Don'ts

### Do

- Use real food/shop images wherever possible.
- Keep map interactions obvious and reachable on mobile.
- Use icons for repeated navigation/actions.
- Show status pills for admin/owner workflows.
- Keep analytics numbers readable at a glance.
- Use empty states with centered icon, title and one short line.
- Use source-aware tracking labels: `map`, `qr`, `public-detail`, `demo-map`.

### Don't

- Do not create a landing page when the user needs the actual app.
- Do not duplicate QR previews in the same section.
- Do not use huge decorative hero typography inside dashboards.
- Do not let sidebar text overflow when collapsed.
- Do not show long food descriptions inside compact menu cards.
- Do not fallback non-Vietnamese audio to Vietnamese audio.
- Do not rely on manual coordinate input when map picker is available.
- Do not use one-color-only UI where every surface is green.

---

## 8. Responsive Behavior

### Breakpoints

- Desktop: `>= 1200px`
- Tablet: `768px - 1199px`
- Mobile: `< 768px`

### Mobile rules

- Bottom navigation must not cover important CTA/content.
- Cards should be narrower, with smaller type and tighter spacing.
- Sidebar collapses to icon rail or top/mobile nav.
- Menu grid becomes 1 column or compact 2 columns if space allows.
- Map/list can be separated by mobile panel tabs.
- Touch targets at least 44px.

### Tablet rules

- Dashboard stat cards can use 2 columns.
- Owner content can keep sidebar + content if width allows; otherwise sidebar collapses.
- QR section becomes stacked if two-column layout feels cramped.

---

## 9. Agent Prompt Guide

When generating or editing DiDuDuaDi UI, follow this prompt style:

> Build a clean, minimalist DiDuDuaDi interface for a food tourism app in Vinh Khanh. Use Emerald `#10B981` as the primary action color and Blue `#2563EB` for secondary system/analytics actions. Prefer white glassy cards, soft shadows, outline Lucide icons, clear Vietnamese labels, and dense but readable operational layouts. Keep dashboard screens practical, not marketing-heavy. Preserve map-first behavior for tourists, grid/dialog workflow for owner menu management, and stable fixed panels for admin review screens.

### Priority order

1. Usability and clarity.
2. Correct role-based workflow.
3. Mobile touch ergonomics.
4. Visual polish.
5. Decorative flair.

### Product-specific UI language

- User map: fast, guided, location-aware.
- Owner dashboard: calm, confident, self-service.
- Admin dashboard: precise, review-focused, efficient.
- QR/standee: printable, clear, high contrast.

---

## 10. Implementation Notes For This Repo

- Current frontend is plain CSS + React, not Tailwind.
- Use existing CSS files first:
  - `frontend/src/pages/MapPage.css`
  - `frontend/src/pages/OwnerDashboardPage.css`
  - `frontend/src/pages/AdminDashboardPage.css`
  - `frontend/src/pages/CollaborationPage.css`
- Use Lucide React icons where already installed.
- Keep existing route structure:
  - `/map`
  - `/poi/:id`
  - `/cooperate`
  - `/owner`
  - `/admin`
- Before finishing large UI edits, run:
  - `npm.cmd run build` in `frontend`.

