---
name: gaia-logo
description: "GAIA logo chosen 2026-10-07 (amber rounded square, solid half-sun on horizon, 2 diagonal frame corners); SVG master + favicon files in logo/final/"
metadata:
  node_type: memory
  type: project
  originSessionId: 2e850aa2-4a80-4c8f-bb4f-927366945f4c
  modified: 2026-10-08T11:12:30.546Z
---

On 2026-10-07 the user picked the GPT Image option out of 3 AI drafts in `D:\GAIA-AI\logo\`. I chose it because it was the only one still legible at 16–20px. The Gemini version with sun rays turned to mush, and the 4-corner version looked faint and read like a padlock.

**Assets:** I redrew it as clean SVG in `D:\GAIA-AI\logo\final\`:
- `gaia-mark.svg`: the master, 64×64 viewBox. Colors are amber `#F0A93A` with glyph `#1A1206`.
- `favicon.ico`: 16, 32 and 48px.
- `apple-touch-icon.png`: 180px, full-bleed square because iOS applies its own mask.
- `icon-512.png`: transparent corners.

Never use the raw AI PNGs. They have a dirty halo and a non-transparent background.

**Geometry (64 grid):**
- Rounded square: rx 13.
- Two corner brackets: stroke 5, round caps and joins. Paths: `M10 23.5V10h16` and `M54 44.5V54H38`.
- Solid half-sun: `M17 34.5a15 15 0 0 1 30 0z`.
- Horizon line: rect x7.5 y36 w49 h4.

**Where it is used:** it replaced the amber-square placeholders everywhere.
- Mockup HTML: symbol `#i-gaia`, favicon as a data URI, header marks at 20/22px, and a 48px icon on the login card.
- Design canvas, 4 artboards: Main, StudioEmpty, Landing, Auth. There the rect fill is `{{accent}}`, so the accent tweak still works.

When coding the real app, use `gaia-mark.svg` (see [[rebuild-ui-from-mockup]]). Related: [[gaia-ux-conventions]], [[gaia-redesign-status]].
