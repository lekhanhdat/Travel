# Danavi — Release Progress Tracker

**Last updated:** 2026-11-12 (Claude, Tech Lead). Branch `release/rn-upgrade` (local, not pushed).
Detailed per-batch review logs (A–F) and the Codex briefs/reports live in git history (commit `9c4afa9` and earlier).

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| 0 — Discovery & audit | DONE | security + branding audits (in git history) |
| 1 — Security fixes | DONE | Batches A, B |
| 2 — Stability / tests | DONE | jest 26/26 suites (254 tests); tsc 10 pre-existing errors |
| 3 — Branding | DONE | store graphics pending owner |
| 4 — Production prep | DONE (code) | RN 0.81.6, targetSdk 36, 16 KB pages; owner tasks → `OWNER_TODO.md` |
| 4b — Redesign + refactor (2026-11-12) | DONE (code) | see below; plans in `D:\Project\Travel\REDESIGN_PLAN.md` / `REFACTOR_PLAN.md` |
| 5 — Final QA | NOT STARTED | real-device pass (camera capture, map, image picker), then `RELEASE_CHECKLIST.md` |

## Redesign + refactor (owner decisions D-1…D-11, 2026-11-12)
- Design system "Danavi Coast": `src/theme/tokens.ts`, `src/ui/*`; Google Sans (OFL) only; MaterialCommunityIcons only
  (32 SVGs + svg-transformer removed); blue brand + orange accent.
- 5 tabs (Home · Feeds · Map · Camera · Profile); festivals merged into Home (mixed sections + kind chips), one
  "View all"; new location/festival Detail; Login/SignUp/Forgot redesigned on `features/auth/AuthLayout`.
- P0 fixes: per-account chat, camera lifecycle, honest Settings, reviews states, search race, no video autoplay,
  map watch/directions, SOS → 113 with confirmation.
- Data/perf: persistent catalog (stale-while-revalidate), lazy screens (`getComponent`), map clustering.
- Chat history restored from Neon after re-login (BE `GET /api/v1/memory/conversations/latest` — **needs a BE deploy**;
  until then the app falls back to the session id kept at logout).
- Image picker fallback (`android/.../picker/ContentPickerModule.kt`) when the system photo picker is missing.

## Blockers (owner)

| Blocker | Impact |
|---------|--------|
| Deploy Travel_BE (new chat-history route) | Chat history after re-login on other devices |
| Package name `com.travel` (permanent after first upload) | Decide before first upload |
| Hosted privacy policy URL + web account-deletion URL | Required by Play |
| Upload key + Play App Signing | Blocks signed AAB |
| Store texts, feature graphic, screenshots | Blocks store listing |
| Crash reporting (Firebase project) | Recommended before launch |

## Known environment notes
- Map draws only water/land (no roads, labels, markers, GPS dot) on emulators using the software GPU
  (`GL_MAX_VERTEX_UNIFORM_VECTORS (256)` in logcat). Start the AVD with `-gpu host` (or AVD setting
  Graphics = Hardware). Verified full rendering with clusters + GPS on `Danavi_API36 -gpu host`.
- After dependency changes restart Metro with `--reset-cache`.

Future work: `docs/ROADMAP.md`.
