---
name: gaia-multi-user-business
description: "GAIA is a multi-user startup — users sign up, buy GAIA credits, and spend them; Gommo is the backend cost"
metadata:
  node_type: memory
  type: project
  originSessionId: dcacc193-c0e4-4d8f-853f-ce9c6206279d
  modified: 2026-10-06T12:26:23.723Z
---

GAIA is the user's startup (confirmed 2026-10-06). It is aimed at many end users who register, buy credits and use them. All generation runs on one Gommo account/token owned by the user, so Gommo credits are GAIA's cost, not the end user's balance.

**Why:** It changes what the UI may claim. Balance, credit history, "không đủ credit" and refunds must come from GAIA's own per-user wallet, which does not exist yet. Gommo has no per-end-user wallet.

**How to apply:** The system still needs these, likely as later phases after the UI rebuild:
- Supabase Auth (login/register).
- A per-user credit ledger: deduct on submit, refund policy on failure.
- A GAIA pricing table that may mark up Gommo prices.
- Credit top-up / payment.

Tie every stored generation to a `user_id` from the start.

Decided 2026-10-06:
- GAIA automatically refunds the user's credits when a job fails, even if Gommo doesn't refund GAIA.
- Design all screens (auth, top-up, history) on the canvas before writing any code. The user explicitly said not to code yet.

Decided 2026-10-06 (later the same day):
- **Pricing:** GAIA uses its own credit unit, 1.000đ = 10 credit (1 credit = 100đ). Markup is 50% on cost. GAIA credits = ceil(Gommo credits × cost per Gommo credit (≈1đ via 79ai) × 1.5 ÷ 100). Examples: VEO 3.1 from 800 → 12 credit; Nano Banana 2 from 400 → 6. See [[gommo-cost-basis-79ai]].
- **GAIA credit expiry:** 90 days from the top-up date, decided 2026-10-06 to mirror 79ai. Consume credits FIFO by lot. The credit page shows how much expires and when. GAIA's ledger is independent of 79ai's, but GAIA should buy 79ai credits just-in-time to avoid its own stock expiring.
- **Top-up:** minimum 20.000đ. Quick picks are 50k / 100k / 200k (+5% bonus) / 500k (+10% bonus), plus a custom amount field.
- **Payment:** PayOS. Per payos.vn it has been free since 23/01/2026, individuals can register with a CCCD, it supports VietQR, and it sends a webhook when payment is received.
- **Auth:** Google sign-in only, via Supabase OAuth. No email/password, email verification or reset flow. Name, email and avatar come from Google.

Related: [[verify-gommo-before-ui-claims]], [[prompt-translation-plan]].
