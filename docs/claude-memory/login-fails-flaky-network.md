---
name: login-fails-flaky-network
description: "2026-10-11 'phiên hết hạn' + login error=1: user's flaky IPv4 route to Cloudflare AND Supabase project Unhealthy (Nano); getUser() swallows network/DB errors as 401"
metadata:
  node_type: memory
  type: project
  originSessionId: f9a66ffe-5f14-4d0c-8eb5-88c591a3221e
  modified: 2026-10-11T11:59:25.304Z
---

**What happened (2026-10-11):**
- During QA the app said "Phiên đăng nhập đã hết hạn".
- After the user signed out, Google login kept landing on `/login?error=1` ("Đăng nhập chưa thành công").

**Diagnosis:**
- From the user's PC, about half of the requests to `ynifiicggklbnszvjjkb.supabase.co` timed out at TCP connect (curl exit 28). The rest took 2–7s.
- `www.cloudflare.com` over IPv6 was fast and stable. Over IPv4 (`curl -4`) it was flaky in the same way.
- status.supabase.com said "All Systems Operational".
- The Supabase host has IPv4 records only, so there is no IPv6 fallback.
- CORRECTION: the user then showed the project dashboard, which said Status **Unhealthy** (Nano compute, free tier). So both were at fault at once, and my first claim ("not Supabase") was wrong.
  - The global status page is not enough. Ask for the project's own status, and hover it to see per-service health.
  - DB queries via PostgREST took 12–14s at first and ~0.7s a few minutes later. The tables are tiny (1 profile, 14 generations), so GAIA's own load is not the cause.
  - The usual remedy for a stuck Nano instance is Settings → General → Restart project.

**Why the app misreports it:**
- `lib/auth.server.ts` `getUser()` ignores `error`, so a network failure looks like "not signed in".
- The API then returns 401. `lib/client/api.ts` turns that into a redirect to `/login` plus the message "Phiên đăng nhập đã hết hạn".
- `app/auth/callback/route.ts` treats a failed `exchangeCodeForSession` (also a network failure) as a generic `error=1`. The real message only shows in the dev terminal as `[auth] đổi code lỗi …`.

**How to apply:** when login or session symptoms come back, first test connectivity with a curl loop to the Supabase host (with `-m 10`, comparing `-4` against cloudflare.com), before touching the auth code.
- In production, the server → Supabase hop runs from the host, not the user's ISP. Only the browser hop is exposed to this kind of network problem.

Related: [[gaia-implementation-plan]], [[no-build-while-dev]].

**Fix shipped 2026-10-11 (user picked "A"; not committed yet):**
- Unreachable Supabase is now a separate state from "signed out": 503 from the API, `app/error.tsx` with "Thử lại" on pages, `error=network` on login.
- The proxy honours `next`, so /credit no longer bounces to /studio.
- Design notes live in `gaia-studio/CLAUDE.md` under "Auth: not signed in vs Supabase unreachable".
- Verified by simulating an outage with a dev server pointed at `http://127.0.0.1:9` plus a fake expired `sb-127-auth-token` cookie, and a headless-Chrome screenshot of the error page.
- NOT verified: the signed-in redirect from /login to `next`, which needs a real session. The user should check it in the browser.
