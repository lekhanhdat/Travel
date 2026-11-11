# Danavi — Implementation Plan

**Date:** 2026-11-11
**Branch:** `dev` → PRs to `main`

---

## Phase 0 — Discovery & Full Audit (COMPLETE)

- [x] Repository structure analysis
- [x] Security audit (`SECURITY_AUDIT.md`)
- [x] Branding audit (`BRANDING_AUDIT.md`)
- [x] Logo kit inspection
- [x] Release readiness assessment
- [x] Codex CLI availability check (v0.167.0 — available)

---

## Phase 1 — Security & Critical Fixes

**Goal:** Eliminate all Critical and High severity issues.

| Task ID | Priority | Description | Dependency |
|---------|----------|-------------|------------|
| P1-01 | Critical | Move release keystore password to gradle.properties / CI secrets | None |
| P1-02 | Critical | Set `usesCleartextTraffic=false`, add `network_security_config.xml` | None |
| P1-03 | High | Remove commented-out API keys from AndroidManifest.xml | None |
| P1-04 | High | Remove `ACCESS_BACKGROUND_LOCATION` permission | None |
| P1-05 | High | Add `maxSdkVersion=32` to storage permissions or remove | None |
| P1-06 | High | Remove `USE_EXACT_ALARM` permission if unused | None |
| P1-07 | High | Strip console.log/error/warn from release builds (babel plugin) | None |

**Acceptance Criteria:**
- `grep -r '<OLD_PASSWORD>' android/` returns nothing
- Cleartext traffic blocked (HTTPS only)
- No API keys in manifest
- No unnecessary permissions
- Release build produces no console output

---

## Phase 2 — Stability & Code Quality

**Goal:** Fix functional issues, clean up technical debt.

| Task ID | Priority | Description | Dependency |
|---------|----------|-------------|------------|
| P2-01 | Medium | Implement proper logger utility (dev vs release) | P1-07 |
| P2-02 | Medium | Review and update ProGuard rules for release | None |
| P2-03 | Medium | Remove unused `PASSWORD` key from localStorage constants | None |
| P2-04 | Medium | Fix About screen hardcoded version/date (use dynamic values) | None |
| P2-05 | Low | Remove Reactotron from production bundle | None |
| P2-06 | Low | Audit unused dependencies | None |

**Acceptance Criteria:**
- Logger has dev/release modes
- ProGuard doesn't break app functionality
- No dead code related to deprecated features

---

## Phase 3 — Danavi Branding Integration

**Goal:** Replace all old branding with Danavi identity.

| Task ID | Priority | Description | Dependency |
|---------|----------|-------------|------------|
| P3-01 | High | Replace launcher icons (legacy + adaptive + themed) | None |
| P3-02 | High | Rename app to "Danavi" (app.json, strings.xml) | None |
| P3-03 | High | Update About screen (logo, name, URLs, copyright) | P3-02 |
| P3-04 | High | Update FAQ screen (support email, branding text) | P3-02 |
| P3-05 | High | Update Policy screen (legal email, branding text) | P3-02 |
| P3-06 | Medium | Implement splash screen with Danavi branding | P3-01 |
| P3-07 | Medium | Copy branding assets to `src/assets/images/` for in-app use | None |
| P3-08 | Low | Create notification small icon (monochrome) | P3-01 |

**Acceptance Criteria:**
- App displays "Danavi" on Android launcher
- Adaptive icon works on Android 8+ (v26)
- Themed icon works on Android 13+ (v33)
- No old "Travel" branding visible in any user-facing screen
- Splash screen shows Danavi logo without flicker
- Clean build + fresh install shows correct icons

**MANUAL:** Tasks P3-03 through P3-05 require owner-provided URLs and contact info:
- Website URL
- Facebook page URL
- Instagram URL
- Support email
- Legal email
- Developer name
- Google Play store listing URL

---

## Phase 4 — Production & Google Play Preparation

**Goal:** Configure for production release.

| Task ID | Priority | Description | Dependency |
|---------|----------|-------------|------------|
| P4-01 | High | Update versionCode/versionName for release | None |
| P4-02 | High | Generate release AAB (Android App Bundle) | P1-01, P3-01 |
| P4-03 | High | Verify release signing works with externalized credentials | P1-01 |
| P4-04 | Medium | Prepare Privacy Policy URL | MANUAL |
| P4-05 | Medium | Prepare store listing text (short + full description) | MANUAL |
| P4-06 | Medium | Capture screenshots for store listing | P3-06 |
| P4-07 | Medium | Create feature graphic (1024×500) | MANUAL |
| P4-08 | Medium | Complete content rating questionnaire | MANUAL |
| P4-09 | Low | Set up crash reporting (Firebase Crashlytics or similar) | None |
| P4-10 | Low | Review targetSdkVersion meets Google Play requirements | None |

**Acceptance Criteria:**
- `./gradlew bundleRelease` produces a valid AAB
- AAB is signed with the release keystore
- All required Play Store metadata is prepared

---

## Phase 5 — Final QA & Release Approval

**Goal:** Validate everything works end-to-end.

| Task ID | Priority | Description | Dependency |
|---------|----------|-------------|------------|
| P5-01 | Critical | Full regression test on release build | All phases |
| P5-02 | Critical | Security re-audit on release build | P1 complete |
| P5-03 | High | Branding verification (all screens) | P3 complete |
| P5-04 | High | Google Play asset validation | P4 complete |
| P5-05 | High | Test on multiple Android versions (8, 10, 12, 13, 14) | P5-01 |
| P5-06 | Medium | Performance testing (startup time, memory) | P5-01 |
| P5-07 | Medium | Final checklist sign-off | All |

**Release decision:** Only after P5-07 sign-off and owner approval.

---

## Timeline Estimate

| Phase | Estimated Effort | Parallelizable |
|-------|-----------------|----------------|
| Phase 1 | 2–4 hours | Yes (tasks independent) |
| Phase 2 | 2–3 hours | Partially |
| Phase 3 | 4–6 hours | Partially (P3-01, P3-02 first) |
| Phase 4 | 3–5 hours | Some MANUAL tasks need owner input |
| Phase 5 | 4–6 hours | Sequential |
| **Total** | **15–24 hours** | |
