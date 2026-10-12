---
name: gaia-implementation-plan
description: "GAIA app coding status (built 2026-10-08; login working 2026-10-09): what's done, what remains (PayOS), unverified Gommo facts, and the approved paid test run"
metadata:
  node_type: memory
  type: project
  originSessionId: 2e850aa2-4a80-4c8f-bb4f-927366945f4c
  modified: 2026-10-11T14:51:33.994Z
---

**Status (2026-10-08):** the user said "bắt đầu code", and the whole app is now coded in `D:\GAIA-AI\gaia-studio`.
- It covers all 7 screens from the mockup, Google login via Supabase, the per-user credit wallet, and PayOS top-up.
- typecheck, lint and build are clean.
- The SQL money functions passed 34 PGlite tests, and the pricing logic passed 14 tests.
- Architecture is documented in `gaia-studio/CLAUDE.md`. The Vietnamese setup guide for the user is `gaia-studio/SETUP.md`.

**Deviation from the earlier "keep app/api/gommo/*" scope:** the old proxy routes had no auth, so anyone could spend GAIA's Gommo credits through them. I deleted them and moved generation behind authenticated, credit-charging routes under `/api/generations/*`. I kept `lib/gommo.ts` but rewrote it.

**Setup progress (2026-10-09):**
- DONE: new Supabase project `ynifiicggklbnszvjjkb` (redirect `https://ynifiicggklbnszvjjkb.supabase.co/auth/v1/callback`), Google OAuth client, Supabase + Gommo keys in `.env`. Google login works locally; Studio shows the user's wallet at 0 credit.
- The downloaded Google `client_secret_*.json` sits in the repo root; it is gitignored (commit 4bfe388). Suggest the user delete it.
- REMAINING: PayOS account + 3 keys in `.env`; webhook needs a public domain (deploy).
- Next session: grant test credits, then the approved paid test run below.

To test before PayOS is ready, grant credits with `select gaia_grant(<user id>, 500, '…')`.

**First paid run, 2026-10-10** (user: "cứ dùng đi"): 9 samples sent straight to Gommo by a scratch script (not through the app/DB): 5 Nano Banana 2 vip 1k 16_9 (400 each) + 4 VEO 3.1 fast 720p 8s (1,200 each).
- VERIFIED: `credit`/`credit_fee` = the real charge = the `/ai/models` price row. 79ai `credits_ai` went 191,600 → 184,800 (exactly 6,800). `GAIA_SETTLE_ACTUAL_COST=1` is safe, not yet enabled.
- VERIFIED: Gommo does NOT return the translated prompt for `translate_to_en` (prompt stays Vietnamese), so `prompt_sent` stays empty.
- Balance check: POST `/api/apps/go-mmo/ai/me` → `balancesInfo.credits_ai` (free).
- Founder's GAIA wallet (dhnghia.ctu@gmail.com) got 500 test credits via `gaia_grant` on 2026-10-10 (expires 2027-01-08). The user confused this wallet with the 79ai balance; they declined showing the 79ai balance in the UI (2026-10-10), so don't re-propose it.
- Results live in `gaia-studio/public/samples/` (WebP via sharp; MP4 as-is, 3–11 MB) and `lib/suggestions.ts` `sample` fields for indices 0–6, 8, 11.

**User QA run through the app, 2026-10-11** (tracker [[gaia-qa-image-tracker]]: 28 pass, 2 fail, 4 todo):
- VERIFIED: `subjects` as `[{id_base, url}]` works (reference images are used). Video `images` (frames) are untested but use the same helper.
- VERIFIED: jobs continue after the tab closes.
- VERIFIED: an edit costs the same as a create (Nano Banana 2 vip 1k = 400).
- Upscale (`ai_templates/tools` `image_resolution`) is BROKEN on Gommo's side. It returns `Upload ảnh thất bại (HTTP 401)` even though the source URL is public (200). The first attempt was still charged 200 ("Upscale Image with AI Credit [4K]") with no output, and the second wasn't charged. Real upscale price = 200, not 300/500.
- Gommo auto-refunds failed image creations (policy violation, >1h timeout) per `users/paymentsHistory`. That endpoint (`currency_name=credits_ai`) is the free way to audit real charges.
- VERIFIED 2026-10-11: Gommo refunds failed videos in full, about 1 minute after the failure. The tags seen were `#vid_fail`, `#vid_busy` and `#vid_policy`.
  - The status string on failure is `ERROR`, not `MEDIA_GENERATION_STATUS_FAILED`. GAIA's "anything else = fail" branch handled it.
  - GAIA refunded the user in full each time.
- VERIFIED 2026-10-11: a start frame sent as `images: [{id_base, url}]` works. Gommo shows `action_type: createFromImageStart`, and frame 0 of the output matches the image.
- VERIFIED: start + end frames are accepted in the right order (`createFromImageStartAndEnd`). Both tries failed with `#vid_policy` (same real-people photo), so there is no successful output yet.
- Gommo's model flags can be wrong. `kling_video_2_5` reports `startText: true`, yet Gommo rejected text-only with "Model Kling 2.5 yêu cầu tối thiểu 1 ảnh tham chiếu". Gommo did not charge, and GAIA refunded the user.
- Video stats for 2026-10-11, 12 jobs:
  - All 6 successes took 1.6–2.7 min.
  - Policy failures took 3.7–10.5 min. Veo filters the generated OUTPUT too (Vertex "Responsible AI for Veo" page), so a block arrives only after generation.
  - Gommo doesn't pass on Google's support code.
- `#vid_policy` is NOT deterministic.
  - First attempt: a photoreal still of real actors, 9:16, sat at 0% for ~10 min, then failed with `#vid_policy`.
  - Second attempt, same prompt and image at 16:9: succeeded in 2.5 min.
  - I wrongly blamed the image, so don't tell users what caused a policy block.
- Gommo/Veo does NOT crop a start frame whose aspect differs from `ratio`. A 3:2 image in a 16:9 video came out with black pillarbox bars for all 8 seconds.
- Faces drift when a push-in camera ("máy quay tiến chậm") enlarges small source faces ~3–4×, and when heads turn to angles the source never showed (profile → frontal).
- The library card shows a generic failure message ("Bạn có thể thử lại, hoặc sửa prompt rồi tạo mới") plus a "Thử lại" button. This is correct even for `#vid_policy`, because a retry can pass.
  - I proposed hiding "Thử lại" for policy errors. The user rejected it (2026-10-11): the same image and prompt succeeded on retry.
  - Don't re-propose it. Don't show Gommo's "vi phạm chính sách, chỉnh lại prompt/ảnh" text to users either: it blames content that may be fine.

**Pricing behaviour:** the server rejects a request with 409 if the UI's `expectedCredits` differs from the server price. The user is never charged an amount that wasn't shown.

**Known UX follow-ups:**
- The mobile composer takes a lot of screen height.
- The landing hero still uses colour blocks; it needs real sample images.
- The Điều khoản and Bảo mật pages are placeholders.

Related: [[gaia-multi-user-business]], [[gaia-redesign-status]], [[verify-gommo-before-ui-claims]], [[prompt-translation-plan]].

**2026-10-12 (user approved both):**
- Kling 2.5 now requires a Start frame (`START_FRAME_REQUIRED`).
- Start/End frames are auto centre-cropped to the video ratio, with a preview popover.
- Verified with a temporary dev page (deleted afterwards): crop maths, chip, popover and the Kling hint.
- NOT yet verified: the logged-in Studio flow (real upload, re-crop on ratio change, reused frames). The user should test it.
- Not committed.
- Mockup/canvas are not updated for the new frame chip ("· đã cắt 16:9" plus the preview popover).
- No free way exists to find other models that need an image.
  - A paid text-only probe of the 20 other video models at their cheapest settings would cost up to ~80,000 Gommo credits (~80k đ), and only models that accept text get charged.
  - Not approved. Don't run it without an explicit OK.

**2026-10-12 speed work (user: "chuyển trang Compiling + Rendering rất lâu"):**
- Root cause: about 3–4 sequential Supabase round trips per page at ~250 ms each from the user's network. Also:
  - undici's 4 s keep-alive forced re-handshakes;
  - there was no loading UI;
  - a cold Gommo catalog cost ~1.6 s.
- Fixes are documented in `gaia-studio/CLAUDE.md` "Page speed".
- Measured with a temporary magic-link session for the founder's account, revoked afterwards.
- Also done (user approved):
  - Hover states for `.submit`/`.primary` and danger mini-buttons.
  - Trash overlay button on error cards.
- B01 (hover-to-play video cards) was DECLINED by the user, who feared slowness. Don't re-propose it unless asked.
- Security follow-up NOT done:
  - `npm audit` flags next 16.2.9 as critical ("Middleware/Proxy bypass … Turbopack", fixed in next@16.4.0), plus eslint-config-next/postcss/sharp issues.
  - Pages re-verify with `getUser`, so a proxy bypass alone doesn't leak data.
  - Recommend upgrading Next before deploy; ask first.
- Not committed.

**2026-10-12, committed and pushed:**
- All work from 10-11 and 10-12 is in commit 2442699 on `main`: auth-unavailable handling, frame crop, Kling Start frame required, speed fixes, hovers, error-card trash, and the Next upgrade.
- Next upgraded to 16.4.0 (with eslint-config-next 16.4.0) at the user's OK.
  - `error.tsx` uses the stable `retry` prop. `unstable_retry` was renamed in 16.3.
  - The next/postcss/sharp audit findings are fixed. 5 dev-only highs remain in the eslint-config-next chain; npm's "fix" is a downgrade to 14, so ignore it.
- Verified on a production build:
  - All pages return 200 with content.
  - `/login?next=/credit` while signed in → /credit.
  - Signed-out /credit → /login, and the API returns 401.
- Next ≥16.3 `next dev` maintains the `nextjs-agent-rules` block in AGENTS.md (`agentRules`). If AGENTS.md shows as modified after dev, commit that block.

**2026-10-12, QA round on the user's own dev server** (automated with headless Chrome plus a temporary magic-link session, revoked afterwards; Tạo never clicked):
- New Gommo limit found from the user's runs: Kling 2.5 Start+End only works in Professional mode. Gating is via `END_FRAME_MODES`.
- Kling 2.5 Start-frame video and VEO Start+End video both succeeded; frames verified, no black bars.
- Bug found and fixed: the Trash tab briefly rendered library items as trash cards (fixed with `itemsFor` / `listReq`).
- Also done: the sign-out item is red (E02).
- These changes are NOT committed yet (needs the user's OK).
- Never run `next build` while the user's `next dev` is up. Test against their dev server on :3000 instead.
- Test harness lessons:
  - Wait for React hydration (`__react*` keys) before typing.
  - Set files with `DOM.setFileInputFiles` on `.composer input[type=file]` after clicking the dashed Start/End button.
  - Wait 350 ms after a hover change, because of CSS transitions.
  - Restore any data a test touched, and verify it in the DB.
