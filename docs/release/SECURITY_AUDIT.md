# Danavi — Security Audit Report

**Date:** 2026-11-11
**Branch:** `dev` (commit `4156a1e`)
**Auditor:** Claude Code (Tech Lead / Security Auditor)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2     |
| High     | 5     |
| Medium   | 6     |
| Low      | 3     |

---

## Critical

### C1 — Release Keystore Password Hardcoded in Source

**File:** `android/app/build.gradle` (lines 86–90)
**Evidence:**
```groovy
release {
    storeFile file('release.keystore')
    storePassword '<OLD_PASSWORD>'
    keyAlias 'travel-release'
    keyPassword '<OLD_PASSWORD>'
}
```
**Impact:** Anyone with repo access can sign APKs as the official release. If the keystore leaks, attackers can publish malicious updates. Credential is already in git history.
**Fix:** Move signing credentials to `~/.gradle/gradle.properties` or CI secrets. Reference via `MYAPP_RELEASE_STORE_PASSWORD` (placeholders already exist in `gradle.properties`). Remove hardcoded values from `build.gradle`. Consider rotating the keystore if git history was ever shared publicly.
**Verify:** `grep -r '<OLD_PASSWORD>' android/` returns no matches. Release build still signs correctly.

### C2 — Cleartext HTTP Traffic Allowed

**File:** `android/app/src/main/AndroidManifest.xml`
**Evidence:** `android:usesCleartextTraffic="true"`
**Impact:** All HTTP traffic is allowed, enabling MITM attacks on API calls and data interception. Google Play flags this.
**Fix:** Set `android:usesCleartextTraffic="false"`. If localhost debugging is needed, add a `network_security_config.xml` that allows cleartext only for `10.0.2.2` / `localhost`. Verify all API URLs use HTTPS (current `API_BASE_URL` uses HTTPS — good).
**Verify:** Build the app, attempt HTTP request — should fail. HTTPS requests work normally.

---

## High

### H1 — 221 Console Log/Error/Warn Statements in Production

**Evidence:** `grep -c 'console\.(log|error|warn|debug)' src/` across 33 files = 221 occurrences.
**Top files:** `SemanticSearchBarComponent.tsx` (32), `CameraScreen.tsx` (17), `HomeScreen.tsx` (11).
**Impact:** Leaks internal state, API responses, user data, and error details to Android logcat. Accessible via `adb logcat` on any debuggable build.
**Fix:** Replace with a logger utility that is no-op in release builds, or use `babel-plugin-transform-remove-console` in `babel.config.js`.
**Verify:** Build release APK, check `adb logcat | grep -i 'travel\|danavi'` shows no app logs.

### H2 — Commented-Out API Keys in AndroidManifest

**File:** `android/app/src/main/AndroidManifest.xml`
**Evidence:** Google API key `<REDACTED_GOOGLE_KEY>` and multiple license keys in commented-out `<meta-data>` blocks.
**Impact:** Keys are in git history. Even commented out, they're extractable. If keys are still active, they can be abused.
**Fix:** Remove all commented-out key blocks. Revoke keys if they were ever valid. Use `local.properties` or env-based injection for any needed keys.
**Verify:** No API keys in `AndroidManifest.xml`. Keys revoked in Google Cloud Console.

### H3 — ACCESS_BACKGROUND_LOCATION Without Justification

**File:** `android/app/src/main/AndroidManifest.xml`
**Evidence:** `<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />`
**Impact:** Google Play requires a declaration form and valid use case. Apps without justification are rejected. The app appears to use foreground location only (map screen, nearby features).
**Fix:** Remove `ACCESS_BACKGROUND_LOCATION` unless a background location feature exists. If needed, prepare the Play Store declaration.
**Verify:** App functions correctly without background location. Map and nearby features work with foreground-only permission.

### H4 — Deprecated Storage Permissions

**File:** `android/app/src/main/AndroidManifest.xml`
**Evidence:**
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```
**Impact:** Ignored on Android 13+ (API 33). Google Play may flag apps requesting legacy storage permissions without `maxSdkVersion`. Should use scoped storage / `MediaStore` API.
**Fix:** Add `android:maxSdkVersion="32"` to both permissions, or remove if not needed. Verify image picker and camera features use modern storage APIs.
**Verify:** Image upload and camera work on Android 13+ emulator without these permissions.

### H5 — USE_EXACT_ALARM Without Justification

**File:** `android/app/src/main/AndroidManifest.xml`
**Evidence:** `<uses-permission android:minSdkVersion="34" android:name="android.permission.USE_EXACT_ALARM" />`
**Impact:** Google Play requires justification for exact alarm permission. No alarm feature is visible in the codebase.
**Fix:** Remove if not used. If needed for notifications, use `SCHEDULE_EXACT_ALARM` with user-facing alarm functionality.
**Verify:** Grep for alarm-related code; remove permission if no usage found.

---

## Medium

### M1 — No Network Security Config

**Impact:** Without `network_security_config.xml`, the app relies on `usesCleartextTraffic` flag globally. Best practice is to define per-domain policies.
**Fix:** Create `android/app/src/main/res/xml/network_security_config.xml` with HTTPS-only default and localhost exception for dev.

### M2 — Tokens Stored in AsyncStorage (Plaintext)

**File:** `src/services/api.client.ts`
**Evidence:** Access and refresh tokens stored via `AsyncStorage.setItem()`.
**Impact:** AsyncStorage is not encrypted on Android. Root access or backup extraction can read tokens.
**Fix:** Consider `react-native-keychain` or `react-native-encrypted-storage` for token storage. Low priority if target audience is consumer-level (non-rooted devices).

### M3 — No Certificate Pinning

**Impact:** API calls to `travel-api-u2xcse44ca-as.a.run.app` can be intercepted with a user-installed CA certificate.
**Fix:** Implement certificate pinning via `network_security_config.xml` or in Axios/OkHttp config. Low priority for initial release.

### M4 — API Retry Without Exponential Backoff

**File:** `src/services/api.client.ts` (line 167)
**Evidence:** Fixed 500ms retry delay.
**Impact:** Under load, fixed retries can overwhelm the server.
**Fix:** Implement exponential backoff with jitter.

### M5 — No Rate Limiting on Login

**File:** `src/container/screens/Login/LoginScreen.tsx`
**Impact:** No client-side throttle on login attempts. Server-side rate limiting status unknown.
**Fix:** Add client-side debounce/cooldown after failed attempts. Verify server-side rate limiting.

### M6 — Hardcoded Fallback API URLs

**Files:** `src/types/env.mock.ts`, `src/utils/env.ts`, `src/services/catalog.client.ts`
**Evidence:** `https://travel-api-u2xcse44ca-as.a.run.app` hardcoded as fallback.
**Impact:** If `.env` is missing, the app silently uses the hardcoded URL. Acceptable for now but should be documented.

---

## Low

### L1 — Debug Keystore in Repository

**File:** `android/app/debug.keystore`
**Impact:** Default debug keystore committed. Low risk since it's the standard Android debug key.

### L2 — Reactotron Config in Production Code

**File:** `ReactotronConfig.js`
**Impact:** Reactotron is a dev tool. Ensure it's not imported in release builds.

### L3 — `devDisabledInDev` and `bundleInDebug` Flags

**File:** `android/app/build.gradle` (bottom)
**Evidence:** `devDisabledInDev: true, bundleInDebug: true`
**Impact:** These affect dev builds only. Unusual configuration that may confuse developers.

---

## Addendum — Tech Lead verification (2026-11-11, 21:40)

Phase 0 findings C1, C2, H2–H5 re-verified against source. Additional findings:

### C3 — targetSdk 34 is below the Google Play requirement (RELEASE BLOCKER)
**Evidence:** `android/build.gradle`: `compileSdkVersion = 34`, `targetSdkVersion = 34`, RN 0.74.2, Gradle 8.8, NDK 26.1, build-tools 34 only.
**Policy (official, developer.android.com/google/play/requirements/target-sdk):** from 2026-08-31, new apps and updates must target **API 36**; extension window ended 2026-11-01. A new submission at API 34 is rejected.
**Fix:** Upgrade React Native (≥0.81 recommended, which supports compileSdk/targetSdk 36, AGP ≥8.9, NDK r27+/r28), plus native libs (@rnmapbox/maps, vision-camera, reanimated, screens, gesture-handler…). Handle Android 15/16 edge-to-edge (no opt-out at API 36) in UI. Separate phase, needs owner approval (see IMPLEMENTATION_PLAN Phase 4A).
**Verify:** `aapt dump badging app-release.apk | grep targetSdkVersion` → 36; Play Console pre-launch report clean.

### H6 — 16 KB memory page size not supported
**Evidence:** NDK 26.1 + RN 0.74 prebuilt `.so` (Hermes, reanimated, mapbox, vision-camera) are 4 KB aligned.
**Policy (official, developer.android.com/guide/practices/page-sizes):** apps targeting API 35+ must support 16 KB pages; from **2027-02-01** updates without support cannot be released.
**Fix:** Same RN upgrade as C3 (RN ≥0.77 ships 16 KB-aligned libs; AGP ≥8.5.1, NDK r28).
**Verify:** `zipalign -c -P 16 -v 4 app-release.apk` → "Verification successful"; run on 16 KB emulator image (`adb shell getconf PAGE_SIZE` = 16384).

### M7 — Signing key in git history
Password from C1 is in git history and `release.keystore` exists locally. App is not yet published, so **best fix is to generate a new upload key** and enroll Play App Signing (MANUAL-10/11), not reuse the exposed one.

### M8 — Mapbox token inlined in bundle
`MAPBOX_ACCESS_TOKEN` is a public `pk.` token (correct type) but is extractable from the APK. **Fix (manual):** restrict token scopes and add URL/app restrictions in Mapbox account; never put an `sk.` token in `.env`.

### L4 — Pre-existing failing test
`__tests__/App.test.tsx` fails (missing native mocks: RNGestureHandlerModule, RNCSafeAreaContext, SoundManager). 22/23 suites pass. Assigned to Codex B4.

### Positive checks
`.env`, `*.keystore` (except debug) are gitignored and untracked; `allowBackup="false"`; Reactotron only imported under `__DEV__`; only public env keys are inlined via babel allowlist.

---

## Recommendations Priority

1. **Immediately:** Fix C1 (keystore password), C2 (cleartext traffic).
2. **Before release:** Fix H1–H5 (logs, manifest keys, permissions).
3. **Release hardening:** Address M1–M6.
4. **Post-release:** Consider L1–L3.
