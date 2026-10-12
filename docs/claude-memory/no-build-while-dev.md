---
name: no-build-while-dev
description: "Never run `next build` while the user's `next dev` is running in gaia-studio — it corrupts .next and every route except / returns 404"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 982c82bd-32a3-466e-aed9-313b4f87f0cd
  modified: 2026-10-11T11:13:38.378Z
---

On 2026-10-11 I ran `npm run build` to verify the code while the user's `npm run dev` was serving localhost:3000. Next 16 dev and build share `gaia-studio/.next`.

The next time the user started dev, every route except `/` returned the app's 404 page. That included `/login`, `/terms`, `/api/models` and `/studio` after login. The user asked "sao /studio 404 rồi".

**Fix that worked:**
1. Stop the dev process tree (`taskkill /T /F /PID <next dev pid>`).
2. `rm -rf .next`.
3. Run `npm run dev` again.

**Why:** the build overwrote manifests that dev relies on, and the breakage only showed up after a dev restart, which made it confusing for the user.

**How to apply:**
- Before `npm run build`, check port 3000 (`netstat -ano | grep :3000`).
- If dev is running, verify with `npm run typecheck` + `npm run lint` instead. If a build is really needed, run it with a separate dist dir, or ask first.
- When checking a page's HTML for errors, don't grep for "Không tìm thấy trang này": Next embeds the not-found component in every page's RSC payload. Check the HTTP status and a real heading instead.

Related: [[gaia-github-repo]].
