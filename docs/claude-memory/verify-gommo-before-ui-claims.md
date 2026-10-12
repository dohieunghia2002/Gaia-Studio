---
name: verify-gommo-before-ui-claims
description: "Never put a feature or promise in GAIA's UI unless Gommo (or our own stack) verifiably supports it"
metadata:
  node_type: memory
  type: feedback
  originSessionId: dcacc193-c0e4-4d8f-853f-ce9c6206279d
  modified: 2026-10-06T01:47:21.174Z
---

Every capability, estimate or promise shown in GAIA Studio's UI must be backed by something Gommo's API actually provides, or by something our own stack implements. The user caught a card claiming "Relax: dự kiến 30–120 phút" and "GAIA sẽ báo khi xong" (on 2026-10-06). The estimate was only free text in one model's mode description, and closed-tab notifications don't exist without a server worker.

**Why:** GAIA depends on a third party (Gommo). The user said: "Phải chắc chắn là Gommo có hỗ trợ thì chúng ta mới nói được."

**How to apply:**
- Before adding a UI claim, check it against `gaia-studio/docs/gommo-api.md` or a live read-only call.
- Say when something is inferred rather than tested. Example: jobs continue server-side after the tab closes; this is inferred from the async create→poll design and has not been tested yet.
- Use bracketed placeholders (e.g. `[credit]`) instead of inventing numbers Gommo hasn't given us.

Verified data fields so far:
- `imageInfo.credit` and `videoInfo.credit_fee` exist, so showing cost per item is real.
- `videoTotalToday` / `videoMaxToday` exist on some models.

Related: [[prompt-translation-plan]].
