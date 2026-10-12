---
name: gommo-cost-basis-79ai
description: "GAIA's Gommo access and credit cost come from the 79ai platform (https://79ai.net/prices); key prices and policies"
metadata:
  node_type: memory
  type: reference
  originSessionId: dcacc193-c0e4-4d8f-853f-ce9c6206279d
  modified: 2026-10-11T02:30:00.000Z
---

The user found Gommo through the docs of 79ai (https://79ai.net), a platform they use. 79ai is GAIA's cost basis for Gommo credits. Its pricing page is https://79ai.net/prices. The page is a client-rendered SPA, so read it with headless Chrome `--dump-dom`, not WebFetch.

Snapshot read on 2026-10-06:

**Credit packs:**
- 50.000đ → 50.000 credit (1đ/credit)
- 200k → 210k credit (+5%, 0.95đ)
- 1tr → 1.1tr credit (+10%, 0.91đ)
- 5tr → 5.6tr credit (+12%)
- 10tr → 11.5tr credit (+15%)
- 50tr → 60tr credit (+20%, 0.83đ)

**Policies:** 79ai credits expire after 90 days and are non-refundable.

**"From" prices in credits:**
- VEO 3.1: 800
- Nano Banana 2: 400
- Nano Banana Pro: 300
- "Nâng cấp ảnh AI" (image upscale): 300
- Topaz Image Upscale: 500
- The real upscale charge seen 2026-10-11 was 200 ("Upscale Image with AI Credit [4K]"), charged even though the call failed. GAIA removed upscale.
- WAN 3.0: 3.300
- Kling 2.5: 800
- Kling 3.0 Omni: 2.875
- Seedance 2.0: 3.276
- Grok Video Heavy: 1.440

The live model list differs from Gommo's docs. Wan 2.5 and X-Imagine are no longer listed.

**Supply chain, verified 2026-10-06:** GAIA → the user's 79ai account → Gommo platform → model providers. Evidence:
- `GOMMO_DOMAIN` in gaia-studio/.env is 79ai, and API tokens are issued at 79ai.net/pages/account/apikeys.
- 79ai's own site preconnects to api.gommo.net and sets `window.__GOMMO_DESKTOP_V2__`.
- Gommo requires a `domain` param and returns `domain_id`, i.e. Gommo is a multi-site (white-label) platform and 79ai is one tenant.

It is unknown whether 79ai buys from Gommo or is the same company. 79ai's /api/docs requires login.

**Decision (2026-10-06):** the user will NOT contact 79ai for partner pricing. They accept GAIA remaining a retail customer of 79ai and subject to its policies (price, 90-day expiry, no refund). Don't re-pitch negotiating with 79ai.

79ai offers better pricing or white-label deployments on request ("Cần mức giá tốt hơn? Hoặc triển khai website riêng, vui lòng liên hệ"). The user declined to pursue this (see the decision above), so GAIA resells above 79ai's retail by design.

Related: [[gaia-multi-user-business]].
