# Codex Brief C — Danavi splash screen + About/Profile fixes

Repo: `D:\Project\Travel\Travel_FE\Travel` (RN 0.74.2, branch `dev`, uncommitted accepted work from batches A+B is present — do not revert it). Brand kit (read-only, run nothing inside): `C:\Users\lekha\Downloads\Danavi_Android_Icon_Kit`. Do NOT commit/push. Do NOT change applicationId/namespace/`getMainComponentName`. No other agent is running.

## C1 (Medium, BRAND-04) — Splash screen
No splash exists today (cold start shows a blank window). Implement with `react-native-bootsplash` (pick the latest major compatible with RN 0.74; check its README/peer deps — and note it must keep working after a later RN ≥0.81 upgrade).
- Logo: kit `branding/danavi-bridge-transparent.png` (bridge only, no text — Android 12+ masks the splash icon to a circle, text would crop). Background `#FFFFFF`. Logo width so the whole bridge fits inside the Android 12 icon safe area (check bootsplash docs; ~150-200dp source width is typical). Use only the free generator features (no `--brand`/license options).
- Generate assets with the bootsplash CLI into android res + `src/assets/bootsplash/` (or the tool's default), wire `MainActivity.kt` (`RNBootSplash.init(this, R.style.BootTheme)` before `super.onCreate`) and `styles.xml` BootTheme per docs, set `android:theme` as docs require.
- Hide in JS when the first screen is ready: `BootSplash.hide({fade: true})` from the navigation container `onReady` (look at `src/container/AppContainer.tsx` / `App.tsx`; pick the earliest point the UI is rendered; must also hide on error paths so the app never sticks on splash).
- Add the jest mock for bootsplash so all tests still pass.
- Accept: cold start on emulator shows white + Danavi bridge, then app; no old icon, no white→blank flash; Android 12+ (API 34 emulator) uses SplashScreen API via bootsplash.

## C2 (Medium, QA-02) — About screen facts
`src/container/screens/Profile/About.tsx`: remove the hardcoded "Kích thước 45.2 MB" row (untrue/unmaintainable) and change platform support to derive from reality: Android minSdk 23 → "Android 6.0+" (put in `BRAND` as `minAndroid: '6.0'`; drop iOS mention since iOS release is out of scope). Remove the duplicated plain "Danavi" text under the logo only if the logo image already contains the word Danavi (it does: full logo) — keep tagline.
The logo sits on a light grey square that doesn't match the white card: make the image container background match the card (or transparent) so the white PNG background blends.

## C3 (Medium, UX-01) — Floating chat bubble covers Profile actions
On `ProfileScreen`, the floating AI chat bubble (draggable FAB) initially sits exactly over the "Về ứng dụng" ⓘ button (bottom-right of the list), making About unreachable without dragging the bubble. Fix minimally: e.g. give the Profile ScrollView enough bottom padding / position the bubble's default so it doesn't overlap tappable rows, or hide the bubble on Profile (the Profile list already has a "Trợ lý AI" row). Also make the whole row (label + button) tappable for About/FAQ/Policy/Settings rows if they are currently button-only — reuse the same onPress. Find the bubble component (`grep -rn FloatingChat src`).

## Verification you must run
`npx jest` (all pass, baseline 24/24), `npx tsc --noEmit` (must not exceed 54 errors), eslint on changed files, `cd android && gradlew assembleDebug`.
Write `docs/release/codex/REPORT-C.md` (files changed, per-task status, trimmed outputs, open issues).
