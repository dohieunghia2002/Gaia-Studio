# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

GAIA Studio is a multi-user web app for generating AI images and videos. Users sign in with Google, buy GAIA credits through PayOS, and spend them on generations. Generation runs on the third-party **Gommo** API (`https://api.gommo.net`), reached through the founder's 79ai account, so Gommo credits are GAIA's cost and never the user's balance. Supabase stores users, the library and the credit wallet.

All UI copy and most code comments are in Vietnamese (`<html lang="vi">`). Creator terms stay in English (prompt, model, ratio, resolution, start/end frame, reference, upscale, credit); actions and statuses are Vietnamese. The UI was rebuilt on 2026-10-08 from `../mockup-gaia/GAIA-Studio-mockup.html` (the "Phòng tối"/Darkroom design). Change the mockup and the app together, and match the mockup's classes in `app/globals.css`.

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
  - Founder controls: `HIDDEN_MODELS`, `MODEL_ORDER` and `FEATURED_MODELS`. The first available model in `MODEL_ORDER` is the composer default.
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

**Still unverified (needs a run through the app itself):**

- The element format of `images` (video start/end frames) and `subjects` (image references). The code sends `[{ id_base, url }]`. `toGommoImageRefs` in `lib/gommo.ts` is the single place to change it.
- The upscale model and its price. GAIA holds the higher estimate of 500 Gommo credits.

Images are versioned. Edits (`op='edit'`, `editImage` + `base64Image` data URL) and upscales (`op='upscale'`, `ai_templates/tools` `image_resolution`, synchronous) are `generations` rows with `root_id`/`source_id`. The library lists roots only (`root_id is null`), with version count, total credits and the latest successful version as the thumbnail.

"Xoá khỏi thư viện" is a soft delete (`deleted_at`), because Gommo has no delete API. Undo restores the rows that share the same `deleted_at` stamp.

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
- Elapsed timers and dates use the Asia/Ho_Chi_Minh time zone (`lib/format.ts`), and clocks only start after mount, to avoid hydration mismatches.
- Gommo's suggestion feeds (`midjourney/kling/sora_feed_suggested`) returned nothing on 2026-10-08, so first-run ideas are GAIA's own (`lib/suggestions.ts`).
- The landing page (`app/page.tsx`, reworked 2026-10-10 to look less templated) is product-led:
  - Its prompt box (`components/home/HomePrompt.tsx`) is a GET form to `/studio?kind=&prompt=`. The proxy carries the query through `/login?next=…` (the login page shows the carried prompt), and `/studio` pre-fills the composer and then strips the query from the URL.
  - Its "Model và giá" table lists the live catalog (available models, featured first) with each model's "from" price.
- No placeholder art anywhere (no colour blocks standing in for images). `Suggestion.sample` in `lib/suggestions.ts` is only for real GAIA outputs stored in `public/samples/`; suggestion cards and the landing "Tạo bằng GAIA" section render media only when a sample exists.
- Mono type is for numbers, params and credit only, not for labels or eyebrows. Media labels read "Ảnh · 3:4" / "Video · 16:9", not uppercase.
