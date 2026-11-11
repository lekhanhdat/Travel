# Brief C — Danavi splash and Profile/About

Date: 2026-11-11. Existing A+B edits retained. No commit or push. The brand kit was read only; no commands were run inside it. applicationId, namespace, and getMainComponentName remain unchanged.

## Task status

- **C1 / BRAND-04: implemented; API 34 runtime smoke passed, seamless packaged cold-start verification pending.** Pinned react-native-bootsplash 6.3.12 (latest v6 from npm). v7 requires RN 0.80+, so it cannot be used on RN 0.74.2. v6 declares wildcard React/RN peers; the Android build and installed runtime verify this app's current compatibility. MainActivity initializes BootTheme before super.onCreate(null), following the react-native-screens instructions. The generated activity theme uses a white background and the transparent bridge-only source. JS fades the splash from NavigationContainer.onReady, without waiting for remote data. A rendering error boundary also dismisses it and displays a Vietnamese fallback. Jest covers both readiness and a throwing first screen.
- **C2 / QA-02: complete.** Removed the size row and duplicate text below the full logo; retained tagline. BRAND.minAndroid is '6.0', matching minSdk 23, and About renders Android 6.0+ without an iOS claim. The logo container is explicitly white; emulator inspection confirms it blends into the card. Added an accessible logo label and adjusted the branding test.
- **C3 / UX-01: complete.** The floating bubble is hidden when the active leaf route is TabProfile, including initial navigation readiness; the AI row remains. Other screens retain the bubble. Profile content now scrolls with bottom padding for smaller displays. Settings, FAQ, Policy and About each have one full-width touch target, with the former button retained as a visual View inside the row. Four rendered tests press the row labels and verify their destinations. Emulator inspection confirmed no bubble on Profile and successful About navigation by tapping its label.

## Files changed for C

- App.tsx: readiness/error dismissal, fallback UI, active-route bubble visibility, white root background.
- android/app/src/main/java/com/travel/MainActivity.kt: native initialization.
- android/app/src/main/AndroidManifest.xml: generated MainActivity BootTheme (generator also reformats XML; A's security attributes retained).
- android/app/src/main/res/values/styles.xml and colors.xml: generated BootTheme and white splash color.
- android/app/src/main/res/drawable-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/bootsplash_logo.png: generated native assets.
- src/assets/bootsplash/: generated manifest and five logo densities.
- src/config/brand.ts; src/container/screens/Profile/About.tsx; src/container/screens/Profile/ProfileScreen.tsx.
- package.json, package-lock.json, yarn.lock: pinned dependency and resolved generator/runtime dependencies. Both lockfiles updated; existing A+B dependency changes retained.
- jest.setup.js; __tests__/App.test.tsx; __tests__/brand.test.js; __tests__/authFlow.test.js.
- This report. Other dirty files belong to the pre-existing work.

## Generator and sizing

Executed from the repository root, using only free flags:

```text
npx.cmd react-native-bootsplash generate C:/Users/lekha/Downloads/Danavi_Android_Icon_Kit/branding/danavi-bridge-transparent.png --platforms=android --background=FFFFFF --logo-width=130 --assets-output=src/assets/bootsplash
Android: five square drawable densities (288px through 1152px)
JS logo: 130x73dp, plus 1.5x/2x/3x/4x
```

An initial 160dp run emitted the generator's warning that logos above 134x134dp may crop. Regenerated at 130dp with no crop warning; this is deliberately smaller than the brief's approximate range. No brand/license/dark flags used. Sharp's missing native binary was repaired with npm rebuild sharp before generation.

Upstream references inspected: [v6 README](https://github.com/zoontek/react-native-bootsplash/blob/6.3.12/README.md), [v6 package peers](https://github.com/zoontek/react-native-bootsplash/blob/6.3.12/package.json), and [v7 migration requirements](https://github.com/zoontek/react-native-bootsplash/blob/master/MIGRATION.md). The installed library's values-v31 theme sets windowSplashScreenBackground/windowSplashScreenAnimatedIcon, and its Android implementation uses Activity.splashScreen on API 31+.

## Required verification

Windows .cmd/.bat equivalents were used because PowerShell blocks npm.ps1/npx.ps1. npm cache was redirected to a writable temporary directory. Git reads used a command-scoped safe.directory override, without changing global Git configuration.

```text
npx.cmd jest
Test Suites: 24 passed, 24 total
Tests:       1 skipped, 224 passed, 225 total
Snapshots:   0 total
Time:        16.164 s
exit 0
```

The existing Jest worker/open-handle warning remains. Early implementation/test failures were corrected before the final full run.

```text
npx.cmd tsc --noEmit
exit 2
53 error TS diagnostics (required maximum: 54)
No diagnostics in C's changed TS/TSX files.
```

Existing TypeScript errors remain elsewhere; this is not a clean typecheck. Removing the duplicate About name also removes its unused style, which referenced the nonexistent AppStyle.txt_24_bold.

```text
npx.cmd eslint App.tsx src/container/screens/Profile/About.tsx src/container/screens/Profile/ProfileScreen.tsx src/config/brand.ts jest.setup.js __tests__/brand.test.js __tests__/authFlow.test.js __tests__/App.test.tsx
exit 0; no output (0 errors, 0 warnings)

cd android
.\gradlew.bat assembleDebug --console=plain
BUILD SUCCESSFUL in 2m 22s
561 actionable tasks: 85 executed, 476 up-to-date
exit 0
```

APK: android/app/build/outputs/apk/debug/app-debug.apk. Existing compileSdk/AGP compatibility and Gradle deprecation warnings remain. Scoped git diff --check passed.

## Emulator evidence and limitations

- Installed the debug APK successfully on emulator-5554; ro.build.version.sdk = 34.
- Observed the full blue bridge, without text or cropping, centered on white; subsequently observed Home with its content and floating bubble. Profile had no floating bubble, and tapping the About label opened the corrected About card.
- Inspection captures are in the OS temp directory: danavi-c-current.png (bridge), danavi-c-home.png, danavi-c-profile.png, and danavi-c-about.png, plus cold-start sampling frames.
- The existing host Metro endpoint was unresponsive. Used an isolated Metro on port 8083, bypassing only its update-check cache write in a temporary launcher because the sandbox cannot write the user's CLI cache. Temporarily pointed the emulator at it for runtime checks. Original emulator developer preferences and port forwarding restored afterward; no project Metro configuration changed.
- Debug cold-start sampling, including a launcher-icon launch, showed React Native's 'Downloading...' developer overlay. This prevents certifying the requested absence of a blank frame through the entire packaged launch. The bridge-to-app behavior was observed, but a bundled/release launch without that development overlay remains a release acceptance check. No release build/signing attempted.

## Upgrade follow-up

When upgrading RN to 0.81 or later, upgrade bootsplash to the compatible supported v7 release in the same batch and regenerate with that CLI. The current integration deliberately uses the stable hide({fade:true}), init-before-super, and basic Theme.BootSplash interfaces; it does not use the themes removed in v7 or the changed isVisible API. Recheck the installed react-native-screens onCreate guidance, Android edge-to-edge/insets, and minimum SDK (update BRAND.minAndroid if it changes). Future RN 0.81+ compatibility was not claimed or tested on today's RN 0.74 binary.
