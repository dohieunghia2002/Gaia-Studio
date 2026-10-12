---
name: gaia-github-repo
description: "GAIA app code is on GitHub at dohieunghia2002/Gaia-Studio (private, branch main); gh CLI installed and logged in"
metadata:
  node_type: memory
  type: reference
  originSessionId: 2e850aa2-4a80-4c8f-bb4f-927366945f4c
  modified: 2026-10-12T12:05:18.414Z
---

The repo is https://github.com/dohieunghia2002/Gaia-Studio. It was created on 2026-10-08.
- It is private, the default branch is `main`, and the remote is `origin`.
- The repo root is `D:\GAIA-AI\gaia-studio`. Since 2026-10-12 it also holds copies of the mockup and logo under `design/` ([[gaia-handoff-2026-10-12]]). The originals remain in `D:\GAIA-AI\mockup-gaia` and `D:\GAIA-AI\logo`.
- The user chose the name "Gaia-Studio" over "gaia-studio".

**Tools:**
- GitHub CLI 2.102.0 was installed via winget on 2026-10-08. It is logged in as `dohieunghia2002` (https, keyring).
- If `gh` is not on PATH in an old shell, call `"/c/Program Files/GitHub CLI/gh.exe"`.

**Committing:**
- The git identity is the user's global config.
- `.gitattributes` forces LF line endings.
- `.env` is gitignored. Before pushing, scan staged files against the `.env` values; this was done before the first push.
- The user tends to rename `.env.example` to `.env` (twice on 2026-10-09), which shows as a deleted tracked file. Restore it with `git checkout -- .env.example` and never commit its deletion; SETUP.md references it.
- The user asks for commits pushed straight to `main`.

Related: [[gaia-implementation-plan]].
