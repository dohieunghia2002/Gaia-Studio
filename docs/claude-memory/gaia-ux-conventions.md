---
name: gaia-ux-conventions
description: "Agreed GAIA Studio design system and UX rules (Darkroom look, action semantics, credit display, honest copy) — apply when building or changing any GAIA UI"
metadata:
  node_type: memory
  type: project
  originSessionId: dcacc193-c0e4-4d8f-853f-ce9c6206279d
  modified: 2026-10-12T00:15:49.522Z
---

These were agreed with the user through 2026-10-06/07 reviews. The user rates UX very highly and reviews details closely.

**Look ("Phòng tối" / Darkroom):**
- Colors:
  - Backgrounds: page #0F0F0E, media stage #0B0B0A.
  - Surfaces: #181816 (cards/panels), #1C1C19 (popovers), #1F1F1C (controls).
  - Borders: #262622, #2E2E29, #3A3A34.
  - Text: #EDEBE6, muted #A8A399, faint #8C877D.
  - Single amber accent #F0A93A, with dark text on it #1A1206 and an amber-tint background #2A2112.
  - Error #EE7A63. Avatar #2D3142.
- Fonts: Be Vietnam Pro for UI, JetBrains Mono for numbers, params and credit. No Geist or Inter.
- Anti-"AI look" rules (user asked 2026-10-10 to remove what looked AI-made; applied without a design review):
  - No placeholder art: never colour blocks standing in for images. Show real GAIA outputs (`Suggestion.sample`) or text only.
  - Mono only for numbers/params/credit, never for labels or uppercase eyebrows. Media labels read "Ảnh · 3:4", not "ẢNH".
  - No template landing (eyebrow + slogan + 2 CTAs + feature cards + 01/02/03 + CTA band). Landing = headline, a working prompt box that carries the prompt through login into Studio, "Thử một ý tưởng" list, a live "Model và giá" table, honest credit facts.
  - Plain, specific headlines, not balanced slogans with a period.
  - Use the official Google "G" on the sign-in button, not a letter in a circle.
- Lucide-style stroke icons. A "coins" icon marks credit everywhere.
- Touch targets 44px. Radii: chips 10, buttons and cards 12, panels and composer 18.

**Action semantics** (each has its own icon, consistent on every screen):
- "Dùng lại prompt" (pencil) puts the prompt and params into the composer.
- "Tạo lại" (refresh) regenerates with the same params and costs credit.
- "Sao chép prompt" (copy) copies the text only.

**Credit shown honestly:**
- Every credit-spending button shows its cost: "Tạo lại · 12 credit", "Thử lại · 50", and the edit total ("Tạo 2 bản sửa", cost = unit × quantity).
- Every library item shows the credit used (coin + number). Multi-version items show the total. Pending items show nothing. Failed items show "Đã hoàn X credit" instead.
- The Tạo button is disabled until there is text. It has a "Không đủ credit" state with a "Nạp credit" link.

**Copy and claims:**
- Never mention Gommo or 79ai in the UI.
- No time estimates.
- The processing card says "Bạn có thể rời trang. Kết quả sẽ hiện trong thư viện khi xong."
- The "đã xong" toast only appears while GAIA is open.
- Prompt translation is invisible.
- Delete moves the item to the Trash (decided 2026-10-11):
  - The action reads "Chuyển vào thùng rác" and is followed by an undo toast that adds "Tự xoá vĩnh viễn sau 30 ngày".
  - The Trash is a library tab ("Thùng rác" plus a count). Its cards show "Tự xoá vĩnh viễn sau N ngày" with Khôi phục and Xoá vĩnh viễn; Xoá vĩnh viễn uses an inline confirm.
  - The toolbar has "Dọn thùng rác" with an inline confirm.
  - Gommo files can't be deleted, so a hard delete only removes GAIA's rows.
- Upscale was REMOVED on 2026-10-11 (Gommo's tool was broken). The founder will build an in-house upscale later, so don't re-add the Gommo one.
- A pasted image (Ctrl+V in the prompt box) becomes a Reference in image mode, or the Start/End frame in video mode.
- Edits offer a quantity of 1–4. Images with more than one version show a layers badge with the count at the card's top-left.
- The credit history has a Mới nhất / Cũ nhất sort toggle.
- See [[verify-gommo-before-ui-claims]] and [[ui-copy-english-terms]].

**Layout rules:**
- The library filter is underline text tabs. The composer's Ảnh/Video switch is a segmented control. The two must look different.
- The library uses an aligned uniform grid ([[ui-aligned-grids]]).
- Card actions are Tải về, Dùng lại prompt and a "⋯" menu.
- Start frame and End frame are inline dashed buttons. End frame is locked until a Start frame exists.
  - Since 2026-10-12, frames are auto centre-cropped to the video ratio. The chip's thumbnail takes the ratio's shape, and the label adds "· đã cắt 16:9" when a crop happened.
  - Clicking the thumbnail opens a popover with the exact image to be sent, plus one line of honest copy.
  - Models in `START_FRAME_REQUIRED` show a muted hint and keep Tạo disabled until a Start frame is added.
- The model picker shows a ✓ on the selected model, capability tags, "từ X" pricing, "N/M lượt hôm nay", and disabled "Hết lượt hôm nay" rows.
- On the image detail screen, the ⋯ menu splits into "Xoá phiên bản này" and "Xoá cả ảnh khỏi thư viện (N phiên bản)". Tải về downloads the version being viewed.
- Landing-page model cards show only capability tags and "từ X credit", both from the live model list. No hardcoded model prose.
