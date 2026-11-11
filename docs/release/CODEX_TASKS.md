# Danavi — Codex Task Assignments

**Date:** 2026-11-11
**Codex CLI:** v0.167.0 (verified available)
**Workflow:** Claude assigns → Codex implements → Claude reviews

---

## Dispatch status (Tech Lead, 21:45)

The tasks below were regrouped into conflict-free Codex batches. **Authoritative briefs** (with exact scope, acceptance, verification):

| Batch | Brief | Covers | Mode |
|---|---|---|---|
| A | `codex/TASK-A_android_native.md` | TASK-001, 002, 003, 005 (launcher), 006 (strings.xml), 010 | Codex, auto |
| B | `codex/TASK-B_js_branding.md` | TASK-004, 006 (app.json), 007, 008, + B4 test fix | Codex, auto |
| C | Splash screen (TASK-009) | after A+B are accepted | Codex, auto |
| D | **TASK-013 RN upgrade → targetSdk/compileSdk 36, 16 KB pages, edge-to-edge** (SEC C3/H6) | separate branch, rollback = discard branch | Codex, **needs owner approval** |
| — | TASK-011 AAB | after D + MANUAL-10 | Claude verifies; signing = manual |

Added manual tasks: **MANUAL-11** generate a new upload key (old password is in git history) + enroll Play App Signing; **MANUAL-12** restrict Mapbox `pk.` token in Mapbox account.

---

## Batch 1 — Security Critical (Phase 1)

### TASK-001: Externalize Release Keystore Credentials
**Priority:** Critical
**File:** `android/app/build.gradle`
**Description:** Remove hardcoded `storePassword '<OLD_PASSWORD>'` and `keyPassword '<OLD_PASSWORD>'`. Reference credentials from `gradle.properties` variables (`MYAPP_RELEASE_STORE_PASSWORD`, etc.) which already have empty placeholders.
**Change:**
```groovy
// BEFORE
release {
    storeFile file('release.keystore')
    storePassword '<OLD_PASSWORD>'
    keyAlias 'travel-release'
    keyPassword '<OLD_PASSWORD>'
}
// AFTER
release {
    storeFile file('release.keystore')
    storePassword MYAPP_RELEASE_STORE_PASSWORD ?: ''
    keyAlias MYAPP_RELEASE_KEY_ALIAS ?: 'travel-release'
    keyPassword MYAPP_RELEASE_KEY_PASSWORD ?: ''
}
```
**Acceptance:** `grep -r '<OLD_PASSWORD>' android/` returns nothing. Build with correct env vars signs correctly.

### TASK-002: Disable Cleartext Traffic + Network Security Config
**Priority:** Critical
**Files:**
- `android/app/src/main/AndroidManifest.xml`: Set `android:usesCleartextTraffic="false"`, add `android:networkSecurityConfig="@xml/network_security_config"`
- Create `android/app/src/main/res/xml/network_security_config.xml`: Allow cleartext only for `localhost` and `10.0.2.2` (emulator).
**Acceptance:** HTTPS API calls work. HTTP blocked. Dev builds can reach localhost.

### TASK-003: Clean AndroidManifest — Remove Keys & Excess Permissions
**Priority:** High
**File:** `android/app/src/main/AndroidManifest.xml`
**Changes:**
1. Delete all commented-out `<meta-data>` blocks containing API keys
2. Remove `ACCESS_BACKGROUND_LOCATION`
3. Add `android:maxSdkVersion="32"` to `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE`
4. Remove `USE_EXACT_ALARM` (verify no alarm usage in codebase first: `grep -r 'exact_alarm\|AlarmManager\|USE_EXACT_ALARM' src/ android/`)
**Acceptance:** Manifest has no API keys (commented or not), no background location, storage permissions scoped to API 32.

### TASK-004: Strip Console Logs from Release Builds
**Priority:** High
**File:** `babel.config.js`
**Change:** Add `babel-plugin-transform-remove-console` for production:
```js
// In babel.config.js plugins array:
...(process.env.NODE_ENV === 'production' ? [['transform-remove-console', {exclude: ['error']}]] : []),
```
Also: `npm install --save-dev babel-plugin-transform-remove-console`
**Acceptance:** Release bundle contains no `console.log` calls (verify with `npx react-native bundle --dev false` + grep).

---

## Batch 2 — Branding (Phase 3)

### TASK-005: Replace Android Launcher Icons
**Priority:** High
**Source:** `C:\Users\lekha\Downloads\Danavi_Android_Icon_Kit\android\app\src\main\res\`
**Target:** `android/app/src/main/res/`
**Steps:**
1. Copy all `mipmap-*` directories from kit to project (overwrite existing)
2. Copy `drawable/ic_launcher_background.xml` from kit to project
3. Copy `mipmap-anydpi-v26/` directory (adaptive icons)
4. Copy `mipmap-anydpi-v33/` directory (themed icons)
5. Verify `AndroidManifest.xml` still references `@mipmap/ic_launcher` and `@mipmap/ic_launcher_round`
**Acceptance:** Fresh install shows Danavi Cầu Rồng icon. Adaptive icon works. Round icon works. Themed icon works on Android 13+.

### TASK-006: Rename App to "Danavi"
**Priority:** High
**Files:**
- `app.json`: Change `name` to `"Travel"` (keep — it's the internal RN name), change `displayName` to `"Danavi"`
- `android/app/src/main/res/values/strings.xml`: Change `app_name` to `"Danavi"`
**Acceptance:** App shows "Danavi" under launcher icon. Build succeeds.
**Note:** Do NOT change `applicationId`, `namespace`, or package name.

### TASK-007: Update About Screen Branding
**Priority:** High
**File:** `src/container/screens/Profile/About.tsx`
**Changes:**
1. Replace placeholder logo ("T" circle) with Danavi logo image. Copy `branding/danavi-full-logo-512.png` from kit to `src/assets/images/danavi_logo.png`. Use `<Image source={require(...)} />`.
2. Change "Travel App" → "Danavi" (line 98)
3. Change slogan to "Khám phá Đà Nẵng cùng Danavi" (line 99–101)
4. Update version to match `package.json` or read dynamically
5. Change developer name "Travel Team" → "Danavi Team" (placeholder until owner provides)
6. Change copyright "© 2024 Travel App" → "© 2026 Danavi"
7. Update description text (lines 118–124) to reference Danavi and Đà Nẵng
8. **URLs**: Change to placeholder-safe values or remove until owner provides real URLs:
   - Website: comment out or use `#` placeholder
   - Facebook/Instagram: comment out
   - Email: comment out
   - Play Store: use `com.travel` (current applicationId)
**Acceptance:** About screen shows Danavi logo, name, and updated info. No "Travel" branding visible.

### TASK-008: Update FAQ and Policy Screens
**Priority:** High
**Files:**
- `src/container/screens/Profile/FAQ.tsx`: Replace `support@travelapp.com` → placeholder or remove
- `src/container/screens/Profile/Policy.tsx`: Replace `legal@travelapp.com`, `security@travelapp.com`, "ứng dụng Travel" → "ứng dụng Danavi"
**Acceptance:** No "travelapp.com" references. Text says "Danavi" where appropriate.

### TASK-009: Implement Splash Screen
**Priority:** Medium
**Steps:**
1. Install `react-native-bootsplash`
2. Copy `branding/danavi-full-logo-512.png` as splash source
3. Generate splash assets: `npx react-native generate-bootsplash src/assets/images/danavi_logo.png --background=#FFFFFF --logo-width=200`
4. Configure Android (`MainActivity.kt` or `.java`)
5. Hide splash after app ready (`RNBootSplash.hide()` in `App.tsx`)
**Acceptance:** App shows Danavi splash on cold start. No white flash. No old icon visible.

---

## Batch 3 — Production Readiness (Phase 4)

### TASK-010: Update Version for Release
**Priority:** High
**File:** `android/app/build.gradle`
**Change:** Update `versionCode` and `versionName` to release values (e.g., `versionCode 1`, `versionName "1.0.0"` — may keep 1 for first release).
**Acceptance:** `adb shell dumpsys package com.travel | grep version` shows correct values.

### TASK-011: Generate Release AAB
**Priority:** High
**Dependency:** TASK-001 (credentials externalized)
**Command:** `cd android && ./gradlew bundleRelease`
**Acceptance:** `android/app/build/outputs/bundle/release/app-release.aab` exists and is a valid bundle.

---

## Manual Tasks (Owner Required)

| Task ID | Description | Owner Action |
|---------|-------------|--------------|
| MANUAL-01 | Provide real website, social media, and contact URLs | Owner |
| MANUAL-02 | Provide real support/legal email addresses | Owner |
| MANUAL-03 | Provide developer name for About screen | Owner |
| MANUAL-04 | Create Privacy Policy page and provide URL | Owner |
| MANUAL-05 | Write store description (short 80 char + full 4000 char) | Owner |
| MANUAL-06 | Create feature graphic (1024×500) | Owner/Designer |
| MANUAL-07 | Capture app screenshots for store listing | After build |
| MANUAL-08 | Complete Google Play content rating questionnaire | Owner in Play Console |
| MANUAL-09 | Set up Google Play developer account if not done | Owner |
| MANUAL-10 | Configure keystore password in local gradle.properties | Owner |
