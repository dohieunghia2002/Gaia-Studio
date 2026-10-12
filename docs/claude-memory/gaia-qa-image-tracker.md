---
name: gaia-qa-image-tracker
description: Manual QA tracker artifacts (round 1 image, round 2 system; db-backed) — where they live, how to read the user's results
metadata:
  type: reference
---

The user asked on 2026-10-10 for a "bảng unit test" to check image generation themselves. They meant a manual test table, not automated tests.

It is published at https://claude.ai/artifact/6V1FGJZQBgn2RN9gkKzyTo. The source is `kiem-thu-tao-anh.html`, which was in the session scratchpad. The page declares the `db` capability.

**Data:**
- Collection `cases` holds 34 docs, A01–G03, in groups A (Chuẩn bị) through G (Từ trang chủ vào Studio).
- Fields: `order`, `group`, `title`, `steps[]`, `expected[]`, `credit` (GAIA credits), `priority`, `verify`, `status` (todo/pass/fail/skip), `note`, `updatedAt`.

**Reading results:**
- Use `ArtifactData` query on `cases` with `status == fail`, plus the notes.
- Case text was seeded with `set`. Later edits must use `update` pinned with `if_version`, so the user's status and notes aren't overwritten.

**Scope:**
- The 3 `verify` cases answer the open Gommo questions: C05 (Reference/`subjects` format), C07 (job continues after the tab closes) and E04 (real upscale price and whether a refund line appears).
- All cases together cost about 68 GAIA credits, out of the 500 test credits.
- The first run (2026-10-11) gave 28 pass, 2 fail (D02 cover toggle, E04 upscale) and 4 todo. The notes became the 2026-10-11 changes.
- Round 2, "Kiểm thử hệ thống GAIA" (2026-10-11): https://claude.ai/artifact/GLEQL5BL9Px7gobtFFwvng. Source `kiem-thu-he-thong.html` was in the scratchpad.
  - It has the same page code, with collection `cases` holding 46 docs: A (re-test of the 10-11 changes; formerly H, moved out of round 1), B video, C video detail, D progress/toasts, E credit and account, F landing/login/legal/404/auth-guard, G mobile via Chrome device mode.
  - About 72 GAIA credits (~5.6k 79ai). B03/B04 are `verify` cases for the video Start/End frame format.
- G01 and G02 steps were rewritten because the user found them unclear. Write steps as concrete click paths (exact URL, button label, sample text).

Related: [[gaia-implementation-plan]].

**Round 2 update (2026-10-12):**
- At that point the user's results were 21 pass, 25 todo, 0 fail.
- The page (Version 2) now renders a read-only `reply` field, plus `replyAt`, under each note as "Claude · time". To answer the user's notes, use batch `update` writes on only `reply` and `replyAt`, pinned with `if_version`.
- Edits so far:
  - Replies written on A05, A07, A10, B01, B03, B04 and B06.
  - B04 and B06 steps were rewritten: use photos without real people, and Kling needs a Start frame.
  - F07 now also checks `/login?next=/credit`.
- New group H (12/10 changes), H01–H07 (orders 47–53, 12 credits):
  - H01–H02: Wi-Fi off, which simulates Supabase being unreachable.
  - H03: Kling Start frame required.
  - H04–H07: frame crop, re-crop, the video verify (H06), reuse.
- Pending user approval (from the notes):
  - A05: `.submit` hover.
  - A10: danger button hover.
  - A07: trash action on error cards.
  - B01: hover-to-play video cards.
- 2026-10-12, later:
  - Added H08–H11 (hovers, error-card trash, navigation speed; all 0 credit).
  - Replies on A05, A07 and A10 now say "ĐÃ LÀM". The B01 reply records the user's decision not to build it.
  - Round 2 now has 57 docs.
- 2026-10-12, Version 3 of the page:
  - Tabs are now Cần làm (default; status todo) / Lỗi / Đã xong / Tất cả, stored under localStorage `gaia-qa2-filter-v2`.
  - New `by: 'claude'` field shows a "Claude đã test" chip.
  - An explicit `[hidden]{display:none}` rule was added. A local preview needs it, because the publish skeleton is what normally supplies it.
- Claude auto-tested and marked pass: B06, E08, F06, G01–G04, H02–H11. Also added H12 (Kling end-frame mode) and H13 (Trash tab stale render), both pass.
- D01 was set to skip at the user's own reasoning.
- Only H01 (Wi-Fi off) is left for the user. The page now has 59 docs.
