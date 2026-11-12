# Danavi — Google Play Release Checklist

**Date:** 2026-11-11

---

## Pre-Release Technical

- [x] Release keystore credentials externalized (not in source)  _(verified 2026-11-11, Batch A/B/C)_
- [x] Cleartext traffic disabled (`usesCleartextTraffic=false`)  _(verified 2026-11-11, Batch A/B/C)_
- [x] Network security config in place  _(verified 2026-11-11, Batch A/B/C)_
- [x] No API keys in AndroidManifest (commented or not)  _(verified 2026-11-11, Batch A/B/C)_
- [x] No hardcoded secrets in source (source + diff scans clean; old secrets remain in git history → OWNER_TODO B6)
- [x] `.env` not tracked in git (verified: OK)
- [x] Console logs stripped from release build  _(verified 2026-11-11, Batch A/B/C)_
- [x] ProGuard/R8 enabled for release (verified: OK — `enableProguardInReleaseBuilds = true`)
- [x] Hermes enabled (verified: OK)
- [ ] Correct `applicationId`: `com.travel`
- [x] `versionCode` and `versionName` set appropriately (versionCode 1, versionName 1.0.0)
- [x] `targetSdkVersion` = 36 — Batch D, verified with aapt2 (bf31b21)
- [x] 16 KB page size — zipalign -P 16 OK, all arm64 .so align 0x4000, runs on 16 KB emulator (bf31b21); re-check map on real device
- [x] No unnecessary permissions in manifest (E: RECORD_AUDIO removed; F: verified list in DATA_SAFETY)
- [x] App size within acceptable range (AAB ~77 MB; universal APK 161 MB)

## Branding

- [x] App name "Danavi" in launcher  _(verified 2026-11-11, Batch A/B/C)_
- [x] Launcher icon: Danavi Cầu Rồng (legacy + adaptive + themed)  _(verified 2026-11-11, Batch A/B/C)_
- [x] Splash screen with Danavi branding  _(verified 2026-11-11, Batch A/B/C)_
- [x] About screen updated (logo, name, copyright) — URLs/emails hidden until owner provides (MANUAL-01/02)
- [x] FAQ screen updated (branding; email hidden until MANUAL-02)
- [x] Policy screen updated (branding; emails hidden until MANUAL-02)
- [x] No "Travel" or "Travel App" text visible to users (launcher/splash/About/Profile verified on emulator)
- [x] Copyright year current (2026)  _(verified 2026-11-11, Batch A/B/C)_

## Google Play Store Listing

- [x] App name: "Danavi"
- [ ] Store icon: 512×512 PNG (from `play-store/danavi-google-play-512-full-logo.png`)
- [ ] Short description (≤80 chars)
- [ ] Full description (≤4000 chars)
- [ ] Feature graphic (1024×500)
- [ ] Screenshots: at least 2 phone screenshots
- [ ] Screenshots: tablet screenshots (recommended)
- [ ] Category selected (Travel & Local)
- [ ] Content rating completed
- [ ] Privacy Policy URL provided and accessible
- [ ] Data Safety section completed
- [ ] Contact information (email, website)
- [ ] Target audience declared

## Google Play Policy Compliance

- [x] Account deletion available (verified: `authApi.deleteAccount` exists — OK)
- [ ] Privacy policy accessible from within app
- [x] No background location without Play Store declaration  _(verified 2026-11-11, Batch A/B/C)_
- [x] Permissions justified in manifest
- [ ] No use of restricted APIs without approval
- [x] Ads declaration (if applicable) (no ads SDK)
- [x] Families policy (if targeting children — likely N/A) (N/A — 18+ proposed)

## Build & Signing

- [ ] Release AAB generated successfully
- [ ] AAB signed with a NEW upload key (old password leaked in git history — MANUAL-11)
- [ ] Google Play App Signing enrolled (recommended)
- [ ] APK tested on physical device
- [ ] Fresh install works (no leftover data from dev builds)

## Testing

- [ ] Login/Signup flow works
- [x] Home screen loads locations  _(verified 2026-11-11, Batch A/B/C)_
- [x] Map features work (GPS, markers, navigation) (emulator API 36: map, marker tap, directions)
- [ ] Camera/AI detection works
- [ ] Festival screens load
- [x] Profile/Settings screens work (emulator)
- [ ] Language switching works (vi/en)
- [ ] Search works
- [ ] Offline behavior graceful (error messages, not crashes)
- [ ] Deep links work (if applicable)
- [ ] Back navigation correct throughout
- [x] No crashes on startup  _(verified 2026-11-11, Batch A/B/C)_
- [ ] No ANR (Application Not Responding) issues
- [ ] Memory usage reasonable
- [ ] Battery usage reasonable

## Post-Release

- [ ] Crash reporting set up (Firebase Crashlytics recommended)
- [ ] Analytics set up (if desired)
- [ ] Monitoring dashboard accessible
- [x] Rollback plan documented — code: each batch is a separate local commit on `release/rn-upgrade` (revert per commit; `dev` untouched). Play: use staged rollout (e.g. 10–20%), halt rollout in Play Console if crash/ANR rises, fix forward with higher versionCode (Play cannot roll back to an older versionCode).
- [ ] Support channel ready for user feedback
