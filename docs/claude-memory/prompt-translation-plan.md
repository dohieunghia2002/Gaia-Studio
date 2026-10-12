---
name: prompt-translation-plan
description: "GAIA Studio prompt translation — use Gommo translate_to_en now (plan B), switch to own Claude translation later (plan A)"
metadata:
  node_type: memory
  type: project
  originSessionId: dcacc193-c0e4-4d8f-853f-ce9c6206279d
  modified: 2026-10-06T01:03:56.633Z
---

Decided 2026-10-06: Vietnamese video prompts are translated with Gommo's `translate_to_en=true` for now. The user is an early-stage startup and chose this to avoid extra API cost. They plan to switch to their own translation with Claude once funded.

Translation must be invisible to end users, in both plan B and plan A. Users just type Vietnamese and the system decides. The user rejected a composer hint ("Prompt tiếng Việt sẽ được dịch… · Gửi nguyên văn") as confusing. So: no hint, no opt-out, no English preview to approve.

**Why:** Gommo's translation is a black box and may be less accurate, but it is free. Own translation was estimated at about 1 cent per call on Opus 5.5 (Sonnet 5.5 / Haiku 4.5 cheaper); the user deferred that choice.

**How to apply:** When implementing the redesign, keep the B→A switch cheap:
- All translation logic goes behind one server-side function (e.g. `preparePrompt()`).
- Selected by an env var like `PROMPT_TRANSLATOR=gommo|claude`.
- Supabase stores `prompt` (original), `prompt_sent`, and `translator`.
- Only send `translate_to_en` for video when the prompt contains Vietnamese diacritics.
- On the first real job, check whether Gommo's create-video response returns the translated prompt; if so, save it to `prompt_sent`.
