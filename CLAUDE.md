# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

GAIA Studio is a multi-user web app for generating AI images and videos. Users sign in with Google, buy GAIA credits through PayOS, and spend them on generations. Generation runs on the third-party **Gommo** API (`https://api.gommo.net`), reached through the founder's 79ai account, so Gommo credits are GAIA's cost and never the user's balance. Supabase stores users, the library and the credit wallet.

All UI copy and most code comments are in Vietnamese (`<html lang="vi">`). Creator terms stay in English (prompt, model, ratio, resolution, start/end frame, reference, credit); actions and statuses are Vietnamese. The UI was rebuilt on 2026-10-08 from `../mockup-gaia/GAIA-Studio-mockup.html` (the "Phòng tối"/Darkroom design). Change the mockup and the app together, and match the mockup's classes in `app/globals.css`.

Stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Supabase (`@supabase/ssr` + `supabase-js`), `qrcode`. There is **no Tailwind**: styling is plain CSS in `app/globals.css`, ported from the mockup. Fonts come from `next/font` (Be Vietnam Pro as `--font-ui`, JetBrains Mono as `--font-mono`). The `@/*` alias points to the project root. `SETUP.md` (Vietnamese) covers the Supabase, Google OAuth and PayOS setup.

## Commands

```bash
npm run dev          # http://localhost:3000
npm run build
npm run lint         # ESLint 9 + React Compiler rules; the codebase is currently clean
npm run typecheck    # tsc --noEmit
```

There is no test framework. The SQL and pricing logic were verified with throwaway scripts (PGlite plus Node type-stripping). Re-verify that way after changing `supabase/migrations/*` or `lib/catalog.ts`.

## Next 16 specifics

- `proxy.ts` replaces `middleware.ts`. The exported function is named `proxy`.
- `params`, `searchParams` and `cookies()` are Promises and must be awaited.
- `getUser()` in `lib/auth.server.ts` calls `connection()`, so auth-gated pages always render per request.

## Page speed (measured 2026-10-12)

From the dev machine in VN, every Supabase call costs about 250 ms of network round trip. The Supabase work itself is about 20 ms, and the DB is in ap-southeast-1. Gommo `/ai/models` costs about 1.6 s. Page time is therefore the number of *sequential* round trips. Keep it at one.

- **`pageSession(nextPath)`** (`lib/auth.server.ts`) replaces `requireUserPage` in pages.
  - It gives `userId` from the locally verified JWT, so data loads start at once.
  - It also returns a `verified` promise (`getUser`, still checked against Supabase). Pages must `Promise.all` it with their data before rendering.
  - Use `getProfileRow(userId)` + `toProfile(user, row)` in the same `Promise.all`.
- **One query per need:**
  - `listLibrary` embeds versions (`versions:generations!root_id(...)`).
  - `getDetail` loads root and versions with one `or(id.eq.X,root_id.eq.X)`.
  - `getCreditSummary` runs its two queries in parallel.
- **`getCatalog`** serves a stale catalog immediately and refreshes it in the background after 5 min.
- **`app/studio/loading.tsx`, `app/credit/loading.tsx`** stream a spinner at once, so a click responds in about 100 ms instead of freezing until the server finishes.
- **`instrumentation.ts`** sets an undici global dispatcher with a 30 s keep-alive. The default 4 s meant almost every navigation re-opened HTTPS connections, adding ~3 RTT (/credit: 390 ms warm vs 850 ms after a 6 s pause).
  - `undici` is pinned to a 7.x version, matching Node's bundled undici major, and listed in `serverExternalPackages`.
- Results:
  - Steady state is ~0.4 s for detail pages and ~0.45–0.8 s for Studio/Credit, down from 0.9–1.5 s.
  - The first visit to a route after a dev restart or a `.next` wipe still compiles, which takes seconds. That is dev only.

## Auth: "not signed in" vs "Supabase unreachable"

These are two different states. Never treat an unreachable Supabase as signed out. On 2026-10-11 doing that caused false "Phiên đăng nhập đã hết hạn" messages and bounced users from /credit back to /studio.

- `isAuthUnavailable()` in `lib/supabase/network.ts` classifies the error. A retryable fetch error (network, timeout, 5xx), an unknown or non-JSON response, or a 429 counts as unreachable. A 4xx such as `bad_jwt`, or a missing session, means signed out.
- `getUser()` throws `AuthUnavailableError` (`lib/auth-unavailable.ts`) when Supabase is unreachable. How each caller handles it:
  - `requireUserApi` turns it into a 503 `auth_unavailable`. The client then shows the message and does not redirect to /login.
  - Pages let it reach `app/error.tsx`, which recognises it by `digest` (Next keeps a pre-set digest even in production) and offers "Thử lại".
  - Pages end their `Promise.all([verified, ...data])` with `.catch(preferAuthError(verified))`.
    - When Supabase is unreachable the data queries usually fail before `verified`, and the page then showed the generic "Có lỗi khi tải trang".
    - `preferAuthError` awaits `verified` first, so its error (the redirect or `AuthUnavailableError`) wins.
    - Verified on 2026-10-18 by QA case H01, run on a production build with a preload that makes every fetch to the Supabase host fail.
- `proxy.ts`:
  - If `getClaims()` is unreachable, it lets the request through and sets the `x-gaia-auth-unavailable` header. Pages then fail fast instead of waiting through supabase-js's ~25s refresh retry a second time.
  - On `/login` it checks with `getUser()`, not only the JWT signature, so a session revoked server-side cannot loop /login ↔ page.
  - It honours `next`, and its redirects copy the refreshed session cookies.
- The cookie-session clients use `fetchWithTimeout` (20s). The admin/DB client deliberately has no timeout: aborting a credit RPC that already ran would leave the charge state ambiguous.
- `/auth/callback` sends `error=network` when the code exchange fails because Supabase is unreachable. The login page shows the matching message.

## Architecture

### Money flows through Postgres functions

`supabase/migrations/0001_gaia_init.sql` defines the schema:

- Tables: `profiles`, `generations`, `credit_lots`, `credit_allocations`, `credit_ledger`, `payments`.
- RLS lets users only **read** their own rows.
- Every credit mutation is a `security definer` function that only `service_role` can execute. EXECUTE is revoked from PUBLIC, anon and authenticated.

The functions:

- `gaia_create_generation`: inserts the job and spends credits in one transaction. Spending is FIFO by lot expiry and records allocations. It raises `INSUFFICIENT_CREDITS` when the balance is short.
- `gaia_refund(generation, amount|null)`: idempotent. It never refunds more than was charged. Credits return to the lots they came from; if a lot has expired, it creates a 7-day refund lot instead.
- `gaia_apply_topup(payment)`: idempotent. Lots expire after 90 days.
- `gaia_grant`: an admin helper for granting credits manually.
- `gaia_balance` and `gaia_expire_lots`: expiry is lazy, applied on read, and writes "Credit hết hạn" rows to the ledger.

Each function takes a per-user advisory lock.

Server code uses the secret-key client `supabaseAdmin()` (`lib/supabase/admin.ts`). It bypasses RLS, so **every query must filter by `user_id`**. `lib/supabase/server.ts` is the cookie-session client, used only for auth.

### Pricing

- `lib/models.server.ts` fetches `/ai/models`, curates the list, converts prices to GAIA credits and caches the result in memory for 5 minutes.
  - Curation: video models need `startText` and must not be edit, lipsync, motion, upscale or per-second models. Image models must have a ratio other than `auto`.
  - Conversion: `ceil(gommo × GAIA_COST_PER_GOMMO_CREDIT × GAIA_MARKUP ÷ 100)`.
  - Allowlist: only models in `VERIFIED_MODELS` are sold. That includes models Gommo adds later, which stay hidden until tested. Each entry also switches on only the verified extras: `refs` (Reference images), `edit` (Sửa ảnh), `start` and `end` (Start/End frame). The catalog exposes these as `maxReferences`, `edit` and `frames`.
  - Founder controls: `VERIFIED_MODELS`, `MODEL_ORDER` and `FEATURED_MODELS`. The first available model in `MODEL_ORDER` is the composer default.
- `lib/catalog.ts` is shared by client and server.
  - `priceFor` picks the most specific matching row of the model's `prices` table, or returns `null` when the model doesn't sell that combination.
  - `resolveSelection` snaps a selection to a combination that is actually sold.
- `createGenerations` re-checks the selection server-side and **rejects (409) any request whose `expectedCredits` differs from the server price**. The user is never charged an amount the UI did not show.

### Generation lifecycle

`lib/generations.server.ts` drives each job:

1. `gaia_create_generation` charges credits. The row starts as `pending`.
2. `submitToGommo` calls `/ai/generateImage` or `/ai/create-video` and stores `gommo_id`.
3. `POST /api/generations/sync`, which the client polls every 4 s while jobs are running, asks Gommo for each running job's status.
   - Success: stores the URLs.
   - Error, an unknown video status, or a timeout (image 30 min, video 4 h): sets status to error and refunds in full.
   - Status transitions use `update … where status in ('pending','processing')`, so only one request can finish a job.

Gommo's response shapes:

| | Image | Video |
|---|---|---|
| Status request body | `{ id_base }` → `imageInfo` | `{ videoId }` → `videoInfo` |
| Success | `SUCCESS` + `url` (`url_thumb` = 480px CDN thumbnail) | `MEDIA_GENERATION_STATUS_SUCCESSFUL` + `download_url` (may lag a few seconds) |
| Cost field | `imageInfo.credit` | `videoInfo.credit_fee` |
| Ratio format | whatever the model's option `type` is (`16_9` or `16:9`) | same |

**Verified 2026-10-10** (9 sample generations sent straight to Gommo, see SETUP.md):

- `credit`/`credit_fee` are the real charge and equal the `/ai/models` price row: the balance dropped by exactly the listed 6,800. `GAIA_SETTLE_ACTUAL_COST=1` is safe to enable (still off).
- Gommo does not return the translated prompt for `translate_to_en`; `videoInfo.prompt` stays the Vietnamese original, so `prompt_sent` stays empty.

**Verified 2026-10-11** (the founder's QA run through the app):

- `subjects` as `[{ id_base, url }]` works: reference images are used. Video `images` (start/end frames) go through the same `toGommoImageRefs` but are still untested.
- Jobs keep running after the tab closes.
- An edit costs the same as a create (Nano Banana 2 vip 1k = 400 Gommo credits).
- `users/paymentsHistory` (`currency_name=credits_ai`) lists every real charge and refund for free. Use it to audit costs.

**Upscale was removed on 2026-10-11.** Gommo's `ai_templates/tools` `image_resolution` returned `Upload ảnh thất bại (HTTP 401)` for public source URLs. It charged 200 credits once with no output. The founder chose to drop the feature and build one later. Old `op='upscale'` rows stay in the DB (the check constraint allows them), and the server filters them out of versions and summaries.

Images are versioned. Edits (`op='edit'`, `editImage` + `base64Image` data URL, 1–4 per request) are `generations` rows with `root_id`/`source_id`. The library lists roots only (`root_id is null`), with version count, total credits and the latest successful version as the thumbnail. A layers badge on the card marks images with more than one version.

**Trash (Thùng rác).**

- "Chuyển vào thùng rác" soft-deletes the root and its versions with one `deleted_at` stamp. The undo toast restores the rows that carry that stamp.
- The Studio tab "Thùng rác" lists deleted roots (`?trash=1`, ordered by `deleted_at`). From there an item can be restored (`POST /restore` without `deletedAt` reuses the item's own stamp) or deleted permanently (`DELETE ?scope=permanent`). "Dọn thùng rác" is `DELETE /api/generations/trash`.
- Permanent delete really deletes the rows. Versions cascade, and `credit_ledger.generation_id` is set null, so the history stays intact. Files on Gommo can't be deleted (no API).
- Items in the trash for `TRASH_DAYS` (30, `lib/trash.ts`) are purged lazily whenever the trash is listed.
- Running jobs are never hard-deleted.
- Deleting a single edit version ("Xoá phiên bản này") stays a soft delete with undo. It doesn't show in the trash and is purged after 30 days.
- Multi-select ("Chọn") works in the library and the Trash. Click the "Chọn" button, or tick a card's checkbox (shown on hover on desktop). Shift+click selects a range, and Esc exits.
  - In this mode, clicking a card toggles it instead of opening the detail page. The selection bar replaces the filter tabs.
  - Running jobs can't be selected in the library. In the Trash they can be restored but not purged.
  - All bulk actions go through `POST /api/generations/bulk { action: 'trash' | 'restore' | 'purge', ids, deletedAt? }`, with at most `MAX_BULK` (500) ids, chunked to 100 per Supabase query.
  - A bulk trash uses one stamp, so a single undo (`restore` + `deletedAt`) brings everything back.
  - Compare `deleted_at` as a time, not a string: Supabase returns `…+00:00`, while JS stamps end in `Z`.
- UI tests of this flow (headless Chrome + temporary magic-link session + `[QA]` dummy rows that are deleted afterwards) are stable only against a production build on :3100.
  - In Next 16.4 dev, a cold-compile error on `/studio` ("The server could not finish this Suspense boundary") can turn into a reload loop. Browser logs written to `.next/dev/logs` trigger recompiles, which trigger reloads, which log the error again.
  - Don't build while the user's dev server is running.
  - **Never recursively delete a `.next` folder on Windows**, including a temp worktree's: no `Remove-Item -Recurse`, `git worktree remove` or `rm -rf`. `next build` (Turbopack) creates junctions in `.next/node_modules/` (e.g. `undici-<hash>`) that point at the real packages in `serverExternalPackages`, and the delete follows them.
    - On 2026-10-18 this emptied `node_modules/undici`. `npm install` restored it.
    - Remove those junctions first with `cmd /c rmdir <junction>`.

Downloads go through `/api/generations/[id]/download`, because Gommo's CDN is cross-origin and `<a download>` can't force a download.

Prompt translation sits behind `preparePrompt()` (`lib/prompt.server.ts`). For now it sends Gommo's `translate_to_en` only for video prompts that contain Vietnamese diacritics. It is invisible to users.

### Payments (PayOS)

`lib/payos.server.ts` signs requests with HMAC-SHA256 as documented at https://payos.vn/docs/api/. `lib/payments.server.ts` handles the rest:

- `createTopup` inserts the `payments` row first, then creates the payment link, then renders the VietQR string as SVG.
- `getTopup` polls PayOS while an order is pending, so credits arrive even without a webhook. This is useful locally.
- `/api/payos/webhook` verifies the signature and applies the top-up.
- Rules (1.000đ = 10 credit, minimum 20.000đ, +5% bonus from 200k, +10% from 500k) live in `lib/topup-rules.ts`.

### UI

- Pages (server components) authenticate, load initial data and render one client component:
  - `components/studio/StudioApp.tsx`: library, composer, polling, toasts and the first-run suggestions.
  - `components/detail/ImageDetail.tsx` and `components/detail/VideoDetail.tsx`.
  - `components/credit/CreditPage.tsx`.
- `CreditProvider` shares the balance and `ToastProvider` shows toasts.
- The client calls the API through `lib/client/api.ts`, which turns `{ error, message }` responses into `ClientError` with the Vietnamese message. Upload images through `lib/client/upload.ts`; it downscales to 2048px before `/api/uploads`, which uploads to Gommo.
- Start/End frames are centre-cropped in the browser to the selected video ratio (`processFrame` in `StudioApp.tsx`). Gommo/Veo doesn't crop; it pillarboxes a mismatched frame with black bars (verified 2026-10-11).
  - Each frame `Upload` keeps its `source` (the file, or the CDN URL of a reused frame) and the `ratio` it was prepared for. When the ratio or model changes, an effect re-crops and re-uploads it.
  - A reused frame that already matches is kept, not re-uploaded. Gommo's CDN sends `Access-Control-Allow-Origin: *`, so reused frames can be fetched and cropped.
  - The frame chip shows "đã cắt 16:9", and its thumbnail opens a preview of exactly what will be sent.
- Gommo's capability flags can be wrong. `START_FRAME_REQUIRED` in `lib/models.server.ts` lists video models that need a Start frame despite `startText: true`. The composer blocks Tạo with a hint, and `cleanInputs` rejects such requests on the server.
  - No free API field reveals this. A wrong entry only shows up as an instant, uncharged Gommo rejection.
- Per-model tests on 2026-10-16 and 2026-10-18 (results in `docs/qa/`):
  - A model or extra goes into `VERIFIED_MODELS` only after a real run through GAIA's API **and a visual check of the output**. A `success` status alone is not enough.
    - Edits on Z-Image and Kling Colors 1.5/2.1 "succeeded" but drew a new picture that ignored the source.
    - Wan 3.0 Start/End frame runs "succeeded" with an unrelated scene.
    - Check frames with Chrome headless; there is no ffmpeg on this machine.
  - Models Gommo lists as ON can still reject every job: "gói dịch vụ không khả dụng", `#vid_maintenance`, `#img_bp` and similar. Leave them out of `VERIFIED_MODELS`.
  - `ALLOWED_MODES` restricts modes. `google_image_gen_banana_pro` is VIP-only. Grok's "Spicy" mode is hidden by founder decision.
  - `TESTED_RANGE` (video) sells only the modes and resolutions already generated successfully through GAIA, with durations inside the tested min–max.
    - Its `exclude` blocks combos Gommo prices but rejects, such as Kling 2.5 Relax 10s and VEO 3.1 4s.
    - It filters the option lists and the price rows, so the composer, "từ X credit" and the server's 409 check all follow it.
    - Widen a range only after a real run. Results are in `docs/qa/`.
  - `editImage` rejects a model without `edit`, and the detail page's edit model picker only lists those models.
  - Price rows whose mode/resolution/duration is not a selectable option are dropped, so "từ X credit" is the real minimum.
- Sync never fails a job on an unknown Gommo status.
  - For `FAILED`/`ERROR` it first records the message in `error_message` while the job stays running (`confirmFailure`). It fails and refunds only if the error persists for 60 s or more.
  - A Seedance job reported "Đang chuyển máy chủ xử lý..." and later succeeded, after the old code had already refunded it.
- `END_FRAME_MODES` (same file) lists models whose Start + End frame only works in some modes. `kling_video_2_5` needs `professional`; Gommo rejected relax instantly on 2026-10-12. The composer shows a hint and blocks Tạo, and `createGenerations` rejects it on the server.
- The Studio library tracks which tab `items` belong to (`itemsFor`). While a tab switch is loading it shows a spinner and drops stale responses. Before this, library items briefly rendered as Trash cards, and clicking Khôi phục on them returned 404.
- Elapsed timers and dates use the Asia/Ho_Chi_Minh time zone (`lib/format.ts`), and clocks only start after mount, to avoid hydration mismatches.
- Gommo's suggestion feeds (`midjourney/kling/sora_feed_suggested`) returned nothing on 2026-10-08, so first-run ideas are GAIA's own (`lib/suggestions.ts`).
- The landing page (`app/page.tsx`, reworked 2026-10-10 to look less templated) is product-led:
  - Its prompt box (`components/home/HomePrompt.tsx`) is a GET form to `/studio?kind=&prompt=`. The proxy carries the query through `/login?next=…` (the login page shows the carried prompt), and `/studio` pre-fills the composer and then strips the query from the URL.
  - Its "Model và giá" table lists the live catalog (available models, featured first) with each model's "from" price.
- No placeholder art anywhere (no colour blocks standing in for images). `Suggestion.sample` in `lib/suggestions.ts` is only for real GAIA outputs stored in `public/samples/`; suggestion cards and the landing "Tạo bằng GAIA" section render media only when a sample exists.
- Mono type is for numbers, params and credit only, not for labels or eyebrows. Media labels read "Ảnh · 3:4" / "Video · 16:9", not uppercase.
- Library cells always show the whole image or video ("Trọn khung"). The founder removed the "Lấp đầy" (cover) option on 2026-10-11.
- Pasting an image (Ctrl+V) into the composer's prompt box adds it: as a Reference in image mode, or as the Start and then End frame in video mode (`pasteImages` in `StudioApp`). Pasting text behaves normally.
- The credit history can be sorted Mới nhất / Cũ nhất (`/api/credits?order=asc|desc`; `before` is the id cursor in either direction).
