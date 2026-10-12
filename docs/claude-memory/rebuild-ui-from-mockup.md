---
name: rebuild-ui-from-mockup
description: "Current gaia-studio UI is throwaway — user wants it torn down and rebuilt from the mockup; don't patch old UI components"
metadata:
  node_type: memory
  type: project
  originSessionId: 2812d442-ea84-402d-b875-1c47a6407b47
  modified: 2026-10-07T12:17:45.884Z
---

The user wants the entire current UI of gaia-studio (components/studio/*, app/page.tsx, app/studio/*, login, guide) torn down and rebuilt from scratch following mockup-gaia/GAIA-Studio-mockup.html. They say they stated this "từ đầu" (in an earlier session); reaffirmed 2026-10-07 after I patched the old Gallery.tsx.

**Why:** the old UI (Geist font, blue-purple "G" logo, justified-row gallery, hover-overlay cards) does not match the new design direction in the mockup.

**Done 2026-10-08:** the old UI, hooks, store and unauthenticated `/api/gommo/*` proxies were deleted. The new UI lives in `components/` and `app/`, built from the mockup.

**How to apply:** put design changes into the mockup and/or the new UI, never into old UI components.

Scope was already confirmed on 2026-10-06 ("Chỉ giao diện"):
- Keep app/api/gommo, lib/gommo.ts and types.
- Rewrite pages, components and hooks.

Details are in [[gaia-implementation-plan]]. Related: [[ui-aligned-grids]], [[gaia-multi-user-business]], [[verify-gommo-before-ui-claims]].
