# Danavi — Production Ready Specification

**Date:** 2026-11-11

---

## Definition of "Production Ready"

The app is considered production-ready when ALL of the following are true:

1. **No Critical or High security issues remain** (per `SECURITY_AUDIT.md`)
2. **Branding is 100% Danavi** — no old "Travel" branding visible to users
3. **Release build compiles and runs** without crashes on target Android versions
4. **Google Play requirements met** — all mandatory listing fields filled, policies complied with
5. **Core user flows tested** on release build (login, browse, map, camera, search)
6. **Owner sign-off** on branding, content, and release readiness

---

## Current Status: NOT READY

### Blocking Issues

| Category | Blockers |
|----------|----------|
| Security | Keystore password in source, cleartext traffic enabled, excess permissions |
| Branding | App named "Travel", placeholder logo, old branding in About/FAQ/Policy |
| Splash | Not implemented |
| Store | No store listing metadata prepared |
| Testing | Release build not generated or tested |

### Ready Areas

| Category | Status |
|----------|--------|
| Authentication | Functional (login, signup, token refresh, account deletion) |
| API integration | Working (HTTPS, proper error handling, retry logic) |
| Internationalization | Working (vi/en with i18next) |
| Core features | Working (catalog, map, camera, festivals, search, chatbot) |
| Feature flags | In place for controlled rollout |
| Hermes | Enabled |
| ProGuard | Enabled for release |
| `.env` security | Not tracked in git |

---

## Target Android Versions

| Spec | Value |
|------|-------|
| minSdkVersion | Project-level (check `build.gradle`, likely 23/24) |
| targetSdkVersion | Project-level (must be ≥34 for new Google Play submissions in 2026) |
| compileSdkVersion | Project-level |
| React Native | 0.74.2 |
| Hermes | Enabled |

---

## Application Identity

| Field | Current | Target |
|-------|---------|--------|
| applicationId | `com.travel` | `com.travel` (do NOT change without owner approval) |
| namespace | `com.travel` | `com.travel` |
| displayName | "Travel" | "Danavi" |
| versionCode | 1 | 1 (first release) |
| versionName | "1.0" | "1.0.0" |
