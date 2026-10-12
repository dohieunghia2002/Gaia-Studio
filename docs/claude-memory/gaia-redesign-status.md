---
name: gaia-redesign-status
description: "Where GAIA Studio stands — design done 2026-10-07, app coded 2026-10-08 (waiting on user Supabase/Google/PayOS setup), mockup/canvas locations"
metadata:
  node_type: memory
  type: project
  originSessionId: dcacc193-c0e4-4d8f-853f-ce9c6206279d
  modified: 2026-10-11T02:30:00.000Z
---

**Phase:**
- The design phase finished on 2026-10-07.
- The app was coded on 2026-10-08 in `D:\GAIA-AI\gaia-studio`. Status, blockers and the paid test run are in [[gaia-implementation-plan]].
- 2026-10-09: Supabase + Google login set up and working locally; PayOS still pending.
- 2026-10-10: reworked Trang chủ, Studio lần đầu and Đăng nhập to look less AI-made (rules in [[gaia-ux-conventions]]); app, mockup, PNGs, zip and canvas (Version 22) all synced. Not committed yet unless a later note says so.
- 2026-10-10: 9 real samples generated (6,800 Gommo credits) and wired into the landing ("Tạo bằng GAIA", idea thumbnails) and first-run cards; mockup (samples/ folder, PNGs, zip) and canvas (Version 23, images uploaded as assets) synced. Suggestions 7, 9, 10, 12–17 still have no sample, so first-run pages 2–3 stay text-only by design.

**Seven screens:**
- Studio
- Studio lần đầu (first-run, with prompt ideas)
- Chi tiết & chỉnh sửa ảnh
- Chi tiết video
- Trang chủ (landing)
- Đăng nhập (Google only)
- Credit & giao dịch (top-up via PayOS QR, balance with 90-day expiry, ledger)

**Where things live:**
- **Canonical mockup:** `D:\GAIA-AI\mockup-gaia\GAIA-Studio-mockup.html`. It is a standalone HTML file with 7 screens, switched by `#studio`, `#empty`, `#edit`, `#video`, `#home`, `#auth`, `#credit`. `#trash` opens Studio on the Thùng rác tab. It has a viewer bar and a "Giả lập: không đủ credit" toggle. The library is an aligned grid that is always contain (the Lấp đầy toggle was removed 2026-10-11). `samples/` holds the real sample stills it uses.
- **Design canvas:** https://claude.ai/artifact/EfF6h7iJ78JWFomq9kgZ2m (Design type). Its files are `project/*.dc.html`; read them with the Artifact read action.
  - On 2026-10-07 it was synced to the HTML file's aligned grid. The gallery uses helmet classes `.lib-grid`, `.lib-card`, `.lib-frame` and `.lib-media`.
  - Version 24 (2026-10-11) added the artboard `Trash.dc.html` at x 4560, y 1900. Sample images are uploaded as assets (`/_blob/…`).
  - The Main board is 1780 tall, and row 2 sits at y=1900.
  - Keep the canvas and the HTML file in sync whenever either changes.
- **PNGs and zip** (`mockup-gaia/png/1..7-*.png`, `GAIA-Studio-mockup.zip`) were regenerated 2026-10-07 and are current.
  - To regenerate PNGs, screenshot `file:///D:/GAIA-AI/mockup-gaia/GAIA-Studio-mockup.html?png#<screen>` at width 1440. Heights used 2026-10-10: studio 1758, empty 900, edit 960, video 960, home 1710, auth 820, credit 992 (studio/empty/home/credit = full page height).
  - Headless Chrome (`--headless=new`) will not make a window narrower than ~500px, so `--window-size=390,…` silently renders at 504px and looks broken. For phone widths, drive Chrome over CDP (`--remote-debugging-port`, then `Emulation.setDeviceMetricsOverride` + `Page.captureScreenshot`); Node 24 has a global WebSocket, so a ~50-line script works with no installs.
  - Zip with PowerShell `Compress-Archive`.
- **Logo:** chosen and redrawn as SVG on 2026-10-07. The files are in `D:\GAIA-AI\logo\final\`, already in the mockup and canvas. See [[gaia-logo]].
- **App UI:** the old UI was deleted on 2026-10-08 and rebuilt from the mockup ([[rebuild-ui-from-mockup]]).
  - `app/globals.css` ports the mockup CSS class-for-class.
  - When the design changes, update the mockup, the canvas and `gaia-studio` together.

Related: [[gaia-ux-conventions]], [[gaia-implementation-plan]], [[gaia-multi-user-business]].
