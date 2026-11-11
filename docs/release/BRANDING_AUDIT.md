# Danavi — Branding Audit

**Date:** 2026-11-11
**Branch:** `dev`

---

## Status (2026-11-11 22:35)
Implemented and verified on emulator: launcher name/icon (adaptive v26 + themed v33, bridge-only), splash (bootsplash, bridge-only on white), About/FAQ/Policy, `app.json` displayName. Store icon to upload manually: `play-store/danavi-google-play-512-full-logo.png` (512×512 PNG). Pending owner: real URLs/emails (`src/config/brand.ts`), feature graphic 1024×500, screenshots. Notification icon: app has no notifications today → not needed.

## Current State (as audited before changes)

| Item | Current Value | Target Value |
|------|---------------|--------------|
| `app.json` displayName | "Travel" | "Danavi" |
| `strings.xml` app_name | "Travel" | "Danavi" |
| About screen app name | "Travel App" | "Danavi" |
| About screen developer | "Travel Team" | (TBD by owner) |
| About screen copyright | "© 2024 Travel App" | "© 2026 Danavi" |
| About screen logo | Placeholder letter "T" | Danavi full logo |
| About screen URLs | travelapp.com, facebook.com/travelapp, etc. | Real Danavi URLs |
| FAQ support email | support@travelapp.com | (TBD by owner) |
| Policy email | legal@travelapp.com | (TBD by owner) |
| Feedback email | feedback@travelapp.com | (TBD by owner) |
| Play Store URL | com.travelapp | com.travel (actual applicationId) |
| Launcher icon | Default React Native icon (PNG only) | Danavi Cầu Rồng (adaptive + legacy) |
| Adaptive icon | Not present | Danavi kit provides v26 + v33 |
| Themed icon (Android 13+) | Not present | Danavi kit provides monochrome |
| Splash screen | Not implemented | Needs Danavi-branded splash |
| Notification icon | Not present | Needs monochrome version |

---

## Launcher Icon Replacement Plan

### Current project icons (to be replaced):
```
android/app/src/main/res/mipmap-mdpi/ic_launcher.png       (48×48)
android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
android/app/src/main/res/mipmap-hdpi/ic_launcher.png       (72×72)
android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
android/app/src/main/res/mipmap-xhdpi/ic_launcher.png      (96×96)
android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png     (144×144)
android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png    (192×192)
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
```

### New icons from kit (`C:\Users\lekha\Downloads\Danavi_Android_Icon_Kit\android\app\src\main\res\`):
- Legacy PNGs: `ic_launcher.png` + `ic_launcher_round.png` (5 densities)
- Foreground PNGs: `ic_launcher_foreground.png` (5 densities)
- Monochrome PNGs: `ic_launcher_monochrome.png` (5 densities)
- Adaptive XML: `mipmap-anydpi-v26/ic_launcher.xml`, `ic_launcher_round.xml`
- Themed XML: `mipmap-anydpi-v33/ic_launcher.xml`, `ic_launcher_round.xml`
- Background drawable: `drawable/ic_launcher_background.xml`

### Steps:
1. Back up current mipmap icons (git tracks them; rename not needed if using version control).
2. Copy all files from kit's `android/app/src/main/res/` into project's `android/app/src/main/res/`.
3. Verify `AndroidManifest.xml` references: `@mipmap/ic_launcher` and `@mipmap/ic_launcher_round` (already correct).
4. Clean build and verify on multiple launcher shapes.

---

## In-App Branding Locations

### About Screen (`src/container/screens/Profile/About.tsx`)
- **Line 94–96:** Placeholder `<View>` with letter "T" → Replace with `<Image>` using `danavi-full-logo-512.png` or `danavi-bridge-transparent.png`
- **Line 98:** "Travel App" → "Danavi"
- **Line 99:** Slogan text → Update to Danavi slogan (e.g., "Khám phá Đà Nẵng cùng Danavi")
- **Line 107:** Version "1.0.0" → Dynamic from app config or update
- **Line 108:** Release date "01/01/2024" → Update
- **Line 110:** Developer "Travel Team" → Owner-provided name
- **Line 118:** Description mentions "Travel App" → Update to Danavi
- **Line 177:** Copyright "© 2024 Travel App" → "© 2026 Danavi"
- **Lines 33–51:** All URLs (travelapp.com, facebook.com/travelapp, etc.) → Real Danavi URLs

### FAQ Screen (`src/container/screens/Profile/FAQ.tsx`)
- **Line 81:** `support@travelapp.com` → Real support email
- **Line 116:** `support@travelapp.com` → Real support email

### Policy Screen (`src/container/screens/Profile/Policy.tsx`)
- **Line 36:** `legal@travelapp.com` → Real legal email
- **Line 121:** "ứng dụng Travel" → "ứng dụng Danavi"
- **Line 198:** `security@travelapp.com` → Real security email

### Login Screen (`src/container/screens/Login/LoginScreen.tsx`)
- No branding text found — uses i18n keys. OK.

### Home Screen (`src/container/screens/Home/HomeScreen.tsx`)
- No branding text found. OK.

### Map Screen (`src/container/screens/Maps/MapScreen.tsx`)
- **Line 966:** `logoEnabled={false}` — Mapbox logo disabled. OK for now.

---

## Splash Screen

**Current state:** No splash screen implementation. No `react-native-bootsplash` or `react-native-splash-screen` dependency.

**Recommendation:**
- Install `react-native-bootsplash` (modern, supports Android 12+ SplashScreen API).
- Use `danavi-bridge-transparent.png` or `danavi-full-logo-512.png` as splash asset.
- Set background color to white (`#FFFFFF`) to match Danavi branding.
- Generate assets with `npx react-native generate-bootsplash`.

---

## Google Play Assets

### From kit:
- `play-store/danavi-google-play-512-full-logo.png` — **Recommended** for store icon
- `play-store/danavi-google-play-512-icon-only.png` — Alternative (icon only)

### Still needed (owner must provide):
- Screenshots (phone + tablet) — at least 2 per form factor
- Feature graphic (1024×500)
- App description (short + full)
- Privacy Policy URL
- Developer contact info
- Content rating questionnaire completion

---

## Assets Available for In-App Use

| File | Size | Recommended Use |
|------|------|-----------------|
| `branding/danavi-full-logo-1024.png` | 1024×1024 | About screen, large displays |
| `branding/danavi-full-logo-512.png` | 512×512 | About screen (recommended) |
| `branding/danavi-bridge-transparent.png` | Variable | Splash screen, overlays |
| `branding/danavi-icon-bridge-only-1024.png` | 1024×1024 | In-app icon reference |
| `branding/danavi-original-1254.png` | 1254×1254 | Source reference only |
