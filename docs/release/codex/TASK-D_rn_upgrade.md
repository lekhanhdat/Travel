# Codex Brief D — React Native upgrade for Google Play (targetSdk 36 + 16 KB pages)

**Status: approved by owner (2026-11-11), runs on a separate branch `release/rn-upgrade`** created from `dev` after batches A–C are committed locally. Rollback = discard the branch. Do NOT push, do NOT merge.

## Why (SECURITY_AUDIT C3, H6)
- Google Play: new apps/updates must target **API 36** since 2026-08-31 (extension window closed 2026-11-01). Current: compile/target 34, RN 0.74.2, AGP from RN 0.74, Gradle 8.8, NDK 26.1.
- Apps targeting API 35+ must support **16 KB page size**; updates without it are blocked from 2027-02-01.

## Target version decision
- **React Native 0.81.x (latest patch, 0.81.6)** — last line that still supports the legacy architecture (RN 0.82+ makes the New Architecture mandatory). The app runs `newArchEnabled=false` and depends on legacy-only libs (`rn-fetch-blob`, `react-native-tts`, `react-native-sound-player`, …). 0.81 defaults to compile/target SDK 36, ships 16 KB-aligned prebuilts, NDK r27+.
- Moving to the New Architecture / RN ≥0.82 is a later, separate project.

## Scope
1. Follow React Native Upgrade Helper diff 0.74.2 → 0.81.6 for Android (and keep iOS files consistent where the template changes them, but iOS build is out of scope). Gradle wrapper, root/app `build.gradle`, `settings.gradle`, `gradle.properties`, `MainActivity.kt`/`MainApplication.kt`, babel/metro/jest presets (`@react-native/*` 0.81.x), React 19.1 + matching test renderer/types.
2. `compileSdk = 36`, `targetSdk = 36`, `buildToolsVersion` 36.x, NDK r27c or r28 as the template specifies; `minSdk` = template default (24) — record that Android 6.0 (API 23) devices are dropped and update `BRAND.minAndroid`.
3. Upgrade native libs to versions supporting RN 0.81 + 16 KB + legacy arch: `@rnmapbox/maps` (10.1.x→latest 10.x with 16 KB support), `react-native-vision-camera` (4.x latest; 5.x only if 4.x lacks 0.81 support), `react-native-reanimated` (3.19.x — v4 requires New Arch), `react-native-gesture-handler`, `react-native-screens`, `react-native-safe-area-context`, `react-native-svg`, `react-native-webview`, `@react-native-async-storage/async-storage`, `@react-native-community/geolocation`, `react-native-image-picker`, `react-native-bootsplash`, `@react-navigation/*` (stay on v6 unless forced). Replace unmaintained libs only if they fail to build (`rn-fetch-blob` → `react-native-blob-util` is the drop-in); report every replacement.
4. **Edge-to-edge:** at targetSdk 35+ Android enforces edge-to-edge and API 36 removes the opt-out. Audit every screen header/tab bar/bottom sheet/FAB for status-bar and navigation-bar overlap; use `react-native-safe-area-context` insets. Verify on emulator with gesture nav and 3-button nav.
5. Android 14/15/16 behaviour changes relevant to this app: foreground-service types (none expected), predictive back (`android:enableOnBackInvokedCallback` — leave default unless issues), photo picker for image-picker, camera/mic runtime permissions.
6. Run `npm audit` after the upgrade; fix critical/high in runtime deps where a non-breaking upgrade exists; list the rest with justification.

## Verification (must run, paste trimmed outputs into REPORT-D.md)
- `npx jest` all pass; `npx tsc --noEmit` ≤ current error count (report diff); eslint on changed files.
- `cd android && gradlew clean assembleDebug assembleRelease` (release needs signing props → if missing, run `bundleRelease` with an **unsigned** variant or report it as blocked; never write secrets).
- `aapt2 dump badging app-debug.apk | findstr targetSdkVersion` → 36.
- 16 KB: `zipalign -c -P 16 -v 4 <apk>` → "Verification successful"; list every `lib/arm64-v8a/*.so` with its LOAD alignment (`llvm-readelf -l`) → all `0x4000`.
- Smoke on emulator (API 34 + an API 36 image; 16 KB image if available): launch, home list, map renders, camera screen opens, image picker, login/logout, TTS/audio, splash, About.

## Out of scope
New Architecture, iOS build, feature changes, applicationId/package rename.
