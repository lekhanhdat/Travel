# Codex Brief E — Play policy cleanup (run AFTER Batch D is accepted, on `release/rn-upgrade`)

Repo: `D:\Project\Travel\Travel_FE\Travel`. Do NOT commit/push/switch branch. Do NOT change applicationId/namespace.

## E1 (High, POL-H7) — Hide donation in release when payments are disabled
`FEATURE_FLAGS.ENABLE_PAYMENT` is `false` (`src/config/featureFlags.ts`) but Profile still shows the "Ủng hộ" row and routes to `Donation` (external PayOS-style link/QR). External payment for tips to the developer risks rejection under Google Play's Payments policy. Render the Ủng hộ row (and the DONATION route registration if trivially gated) only when `FEATURE_FLAGS.ENABLE_PAYMENT` is true. Keep the code (project convention: don't delete features; gate them). Update/add a test asserting the row is absent when the flag is false.

## E2 (High, POL-03) — Remove unused RECORD_AUDIO
No code records audio (`grep -rn "RECORD_AUDIO|audio: true|startRecording" src` → nothing; vision-camera used for photos only). Remove `android.permission.RECORD_AUDIO` from `android/app/src/main/AndroidManifest.xml`; after build, check the merged manifest (`android/app/build/intermediates/merged_manifests/debug/.../AndroidManifest.xml`) that no library re-adds it — if one does, add `tools:node="remove"`. Confirm vision-camera is configured without audio.

## E3 (Low, BRAND-05) — Splash status bar
During splash the status bar is grey. Make it white with dark icons in BootTheme (`android:statusBarColor`, `android:windowLightStatusBar`) consistent with edge-to-edge setup from Batch D.

## E4 (Medium, POL-04) — In-app privacy policy link
`Policy.tsx` renders text only. Add `privacyPolicyUrl: string | null` and `accountDeletionUrl: string | null` to `BRAND` (null for now, owner fills, MANUAL-04/13) and, when non-null, show "Xem chính sách đầy đủ" / "Yêu cầu xóa tài khoản" links in Policy. Hidden while null.

## Verification
`npx jest`, `npx tsc --noEmit` (no increase), eslint changed files, `gradlew assembleDebug`, check merged manifest permissions list (paste it). Write `docs/release/codex/REPORT-E.md`.

## E5 (Low, UX-02) — Chat bubble overlaps camera flash button
On the Camera tab (verified on 16 KB API 35 emulator after Batch D) the FloatingChatBubble's default position covers the flash toggle at bottom-right of the camera controls. Hide the bubble on the Camera tab (same mechanism App.tsx already uses for TAB_NAMES.PROFILE) or move its default anchor above the controls. Keep the behaviour on other tabs.

## E6 (Investigate, MAP-01) — Mapbox MarkerView JNI warning (legacy arch)
On API 36 logcat shows `ReactNativeJS: 'Mapbox [error]', 'RNMBXMarkerViewContent | MarkerView positions won't be reported to measure(): No implementation found for ... RNMBXMarkerViewContentTranslations.nativeSet'` (@rnmapbox/maps 10.3.18, newArchEnabled=false). Markers still render. Investigate whether this native method is only built with New Architecture, whether any app code relies on MarkerView measure(), and whether it causes misplaced markers/tap issues in MapScreen.tsx. Fix only if safe and small (e.g. documented config flag); otherwise document in REPORT-E with evidence. Do not change Mapbox version or architecture.

Environment: branch `release/rn-upgrade` at commit bf31b21 (Batch D accepted). Use the same sandbox Gradle flags/cache approach you used in Batch D. Never print MAPBOX_DOWNLOADS_TOKEN or other secrets.
