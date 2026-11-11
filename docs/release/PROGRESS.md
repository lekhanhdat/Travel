# Danavi — Release Progress Tracker

**Last Updated:** 2026-11-11 21:45 (Claude, Tech Lead)

## Phase Status

| Phase | Status | Notes |
|-------|--------|-------|
| 0 — Discovery & Audit | DONE | Scheduled run 20:00 + Tech Lead verification 21:30 (C3, H6, M7, M8, L4 added) |
| 1 — Security fixes | IN PROGRESS | Codex A (A1–A3), Codex B (B1) |
| 2 — Stability / tests | IN PROGRESS | Codex B4 (App.test.tsx) |
| 3 — Branding | IN PROGRESS | Codex A4/A5 (launcher, name), B2/B3 (in-app). Splash = TASK-C (after A+B) |
| 4 — Production prep | BLOCKED | C3/H6 need React Native upgrade → owner decision |
| 5 — Final QA | NOT STARTED | |

## Codex dispatch log

| Batch | Brief | Scope | Status |
|-------|-------|-------|--------|
| A | `codex/TASK-A_android_native.md` | android/** only | Running |
| B | `codex/TASK-B_js_branding.md` | src/**, babel, package.json, tests | Running |
| C | Splash screen (react-native-bootsplash) | MainActivity, styles, App.tsx | Waiting for A+B |
| D | RN upgrade → targetSdk 36 + 16 KB | whole native layer | **Approved by owner 2026-11-11** — on a separate branch, after A+B accepted |

A and B have disjoint file scopes so they run in parallel.

## Baseline (before changes)
- `npx jest`: 22/23 suites, 217 passed, 1 skipped; App.test.tsx failing (pre-existing).

## Blockers

| Blocker | Waiting On | Impact |
|---------|-----------|--------|
| RN upgrade for targetSdk 36 / 16 KB (C3, H6) | Owner approval | **Blocks any Play submission** |
| Real website/social/email | Owner | About/FAQ/Policy links hidden until provided |
| Privacy Policy URL, store texts, feature graphic, screenshots | Owner | Blocks store listing |
| New upload key + Play App Signing, local signing props | Owner | Blocks signed AAB |

## Review results

### Batch A — ACCEPTED (Claude, 22:00)
- Diff reviewed: signing reads `MYAPP_RELEASE_*` via `findProperty`, release tasks fail fast if missing; `grep <OLD_PASSWORD> android/` = 0 (excluding build/). Manifest: cleartext off + NSC; debug overlay allows only localhost/10.0.2.2/127.0.0.1; background location, exact alarm, commented keys removed; storage maxSdk 32/28. 25 kit resources copied (hash-matched per Codex), `app_name`=Danavi, versionName 1.0.0.
- Independently verified on emulator Pixel_8_API_34: fresh install → launcher shows Cầu Rồng adaptive icon + label **Danavi**; `dumpsys` versionName=1.0.0; app loads home data over HTTPS; Metro via `adb reverse` works (debug cleartext exception OK); no FATAL/CLEARTEXT errors in logcat.
- Note: debug builds over Wi-Fi to a LAN Metro IP will no longer work (cleartext limited to localhost) — use `adb reverse`.
- Note: Codex A's report updated its gradle sandbox finding: `assembleDebug` succeeded (13m37s).

### Batch B — ACCEPTED (Claude, 22:00)
- Diff reviewed (babel factory, remove-console only in production, reanimated last; brand.ts; About/FAQ/Policy; jest mocks). `yarn.lock` diff is line-ending only.
- Independently verified: `npx jest` → 24/24 suites, 219 passed, 1 skipped (baseline 22/23). About screen on device shows Danavi logo, name, tagline, version 1.0.0, new description; contact/social hidden (BRAND fields null).
- Open: 54 pre-existing TS errors; Jest open-handle warning (pre-existing); `npm audit`: 55 vulns (2 critical, 28 high) — to triage in Batch D with the RN upgrade.

### Found during review → Batch C
- About shows false hardcoded "45.2 MB" and "iOS 12.0+, Android 8.0+" (minSdk 23 = Android 6.0).
- UX-01: floating AI bubble fully covers the Profile → "Về ứng dụng" ⓘ button (About unreachable without dragging).
- Logo sits on a grey square inside a white card.

### Batch C — ACCEPTED (Claude, 22:35)
- react-native-bootsplash 6.3.12 (v7 needs RN ≥0.80 → bump in Batch D), bridge-only logo 130dp on white, hidden from `NavigationContainer.onReady` + error boundary fallback.
- Independently verified on emulator: cold start shows white splash with Cầu Rồng logo (not cropped) → home in ~9 s with Metro; Profile has no chat bubble, "Về ứng dụng" label row opens About; About shows "Android 6.0+", no size row, logo blends with card; 0 FATAL in logcat. `npx jest` 24/24 suites, 224 passed. `tsc` 53 errors (baseline 55).
- Review incident: after Codex's npm reinstall, the running Metro served a stale module map (`color-name` missing) and the app stayed on the splash. Resolved by restarting Metro with `--reset-cache`; node_modules is consistent. Dev note: when the JS bundle fails, the red box is hidden under the splash — restart Metro with `--reset-cache` after dependency changes.
- Minor (not blocking): status bar is grey during splash; consider white status bar in BootTheme.

## Next
- **Batch D (RN 0.81.6 upgrade, targetSdk 36, 16 KB)** — brief ready at `codex/TASK-D_rn_upgrade.md`. Needs a base commit of A–C on `dev` (local only, no push) to branch `release/rn-upgrade` from → **waiting for owner permission to commit locally.**
