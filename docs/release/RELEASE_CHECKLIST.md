# Danavi — Google Play Release Checklist

**Date:** 2026-11-11

---

## Pre-Release Technical

- [x] Release keystore credentials externalized (not in source)  _(verified 2026-11-11, Batch A/B/C)_
- [x] Cleartext traffic disabled (`usesCleartextTraffic=false`)  _(verified 2026-11-11, Batch A/B/C)_
- [x] Network security config in place  _(verified 2026-11-11, Batch A/B/C)_
- [x] No API keys in AndroidManifest (commented or not)  _(verified 2026-11-11, Batch A/B/C)_
- [ ] No hardcoded secrets in source
- [ ] `.env` not tracked in git (verified: OK)
- [x] Console logs stripped from release build  _(verified 2026-11-11, Batch A/B/C)_
- [ ] ProGuard/R8 enabled for release (verified: OK — `enableProguardInReleaseBuilds = true`)
- [ ] Hermes enabled (verified: OK)
- [ ] Correct `applicationId`: `com.travel`
- [ ] `versionCode` and `versionName` set appropriately
- [x] `targetSdkVersion` = 36 — Batch D, verified with aapt2 (bf31b21)
- [x] 16 KB page size — zipalign -P 16 OK, all arm64 .so align 0x4000, runs on 16 KB emulator (bf31b21); re-check map on real device
- [ ] No unnecessary permissions in manifest
- [ ] App size within acceptable range

## Branding

- [x] App name "Danavi" in launcher  _(verified 2026-11-11, Batch A/B/C)_
- [x] Launcher icon: Danavi Cầu Rồng (legacy + adaptive + themed)  _(verified 2026-11-11, Batch A/B/C)_
- [x] Splash screen with Danavi branding  _(verified 2026-11-11, Batch A/B/C)_
- [x] About screen updated (logo, name, copyright) — URLs/emails hidden until owner provides (MANUAL-01/02)
- [x] FAQ screen updated (branding; email hidden until MANUAL-02)
- [x] Policy screen updated (branding; emails hidden until MANUAL-02)
- [ ] No "Travel" or "Travel App" text visible to users
- [x] Copyright year current (2026)  _(verified 2026-11-11, Batch A/B/C)_

## Google Play Store Listing

- [ ] App name: "Danavi"
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

- [ ] Account deletion available (verified: `authApi.deleteAccount` exists — OK)
- [ ] Privacy policy accessible from within app
- [x] No background location without Play Store declaration  _(verified 2026-11-11, Batch A/B/C)_
- [ ] Permissions justified in manifest
- [ ] No use of restricted APIs without approval
- [ ] Ads declaration (if applicable)
- [ ] Families policy (if targeting children — likely N/A)

## Build & Signing

- [ ] Release AAB generated successfully
- [ ] AAB signed with a NEW upload key (old password leaked in git history — MANUAL-11)
- [ ] Google Play App Signing enrolled (recommended)
- [ ] APK tested on physical device
- [ ] Fresh install works (no leftover data from dev builds)

## Testing

- [ ] Login/Signup flow works
- [x] Home screen loads locations  _(verified 2026-11-11, Batch A/B/C)_
- [ ] Map features work (GPS, markers, navigation)
- [ ] Camera/AI detection works
- [ ] Festival screens load
- [ ] Profile/Settings screens work
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
- [ ] Rollback plan documented
- [ ] Support channel ready for user feedback
