---
name: ui-aligned-grids
description: "User rejects masonry/staggered layouts — galleries and card lists must be strictly aligned, equal-size cells"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 2812d442-ea84-402d-b875-1c47a6407b47
  modified: 2026-10-11T02:30:00.000Z
---

Card/media grids must be strictly aligned: equal cell size, equal caption height, labels in the same position. No masonry (CSS columns) or ragged justified rows.

**Why:** On 2026-10-07 the user flagged the library masonry as uneven ("người OCD nhìn vào sẽ khó chịu"). Fix accepted in the mockup: square frames, media "Trọn khung" (contain), 2-line clamped titles with fixed min-height. On 2026-10-11 the user removed the "Lấp đầy" (cover) toggle: cells are ALWAYS contain ("tính thẩm mỹ cao hơn"); don't re-add a cover option.

**How to apply:** For any new gallery/list UI (mockup or gaia-studio app), default to a uniform grid with fixed aspect-ratio cells; show true ratio via a label rather than via cell shape. Related: [[ui-copy-english-terms]].
