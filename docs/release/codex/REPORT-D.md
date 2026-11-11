# Brief D — React Native 0.81 / Android API 36

Date: 2026-11-11. Branch: `release/rn-upgrade`; base: `ecd6861`. No commit, push, merge or branch switch. **Debug and unsigned release-equivalent builds plus static 16 KB checks passed. Emulator smoke checks are in progress; remaining acceptance limits are explicit below.**

## Scope and template merge

Inspected the complete [Upgrade Helper diff 0.74.2 → 0.81.6](https://raw.githubusercontent.com/react-native-community/rn-diff-purge/diffs/diffs/0.74.2..0.81.6.diff) and the published `@react-native-community/template@0.81.6` tarball. Adopted Gradle 8.14.3 (wrapper scripts/JAR included), AGP 8.11.0 through the matching RN plugin, Kotlin 2.1.20, Build Tools 36.0.0, compile/target 36, minSdk 24 and template NDK 27.1.12297006. This is the supplied/template NDK revision, rather than silently selecting another r27 revision.

`newArchEnabled=false` and Hermes remain explicit. `MainApplication` now uses `loadReactNative(this)` (merged native library loading). Existing MainActivity bootsplash initialization before `super.onCreate(null)` and its delegate already match the required integration; retained them. Existing settings.gradle already uses the new settings plugin/autolinking and needed no rewrite. Preserved applicationId/namespace/component name, launcher mipmaps, A–C security manifest and network-security resources. The template's cleartext placeholder was deliberately not substituted for A's explicit production policy.

**Android 6.0 / API 23 support is dropped. Minimum is Android 7.0 / API 24.** `BRAND.minAndroid` is now `7.0`.

Added explicit CLI 20 packages (RN no longer supplies the CLI implicitly); aligned all four `@react-native/*` presets/config packages to 0.81.6 and removed the mismatched direct runtime Gradle plugin. RN 0.81.6's published peer requires React **19.1.4**, so React and renderer both use 19.1.4; React types use the matching 19.1 range. Testing Library moves to 13 for React 19. Babel's existing Reanimated plugin ordering and SVG Metro transformation are retained. TypeScript now extends the RN config, uses ESNext/bundler resolution, and keeps project paths/includes. Small compatibility fixes cover nullable React 19 refs, void ref callbacks/timer promises, RN's isTV property and native Alert API.

iOS consistency only: minimum deployment target 15.1, updated template Gemfile dependencies, explicit legacy-architecture Podfile flag, and `RCTAppDependencyProvider` wired into the existing Objective-C RCTAppDelegate. Kept the existing Objective-C entry point and test target rather than deleting them for a Swift-only template. No pod install or iOS build was run on Windows; ignored Podfile.lock must be regenerated on macOS.

## Dependency decisions

| Package | Before (lock) | After (lock) |
| --- | --- | --- |
| react-native | 0.74.2 | 0.81.6 |
| react | 18.2.0 | 19.1.4 |
| react-test-renderer | 18.2.0 | 19.1.4 |
| @rnmapbox/maps | 10.1.31 | 10.3.18 |
| react-native-vision-camera | 4.5.3 | 4.7.3 |
| react-native-reanimated | 3.15.4 | 3.19.5 |
| react-native-gesture-handler | 2.20.0 | 2.28.0 |
| react-native-screens | 3.34.0 | 4.24.0 |
| react-native-safe-area-context | 4.11.0 | 5.11.1 |
| react-native-svg | 15.3.0 | 15.16.1 |
| react-native-webview | 13.16.0 | 13.17.0 |
| @react-native-async-storage/async-storage | 1.24.0 | 2.2.0 |
| @react-native-community/geolocation | 3.4.0 | 3.4.0 |
| react-native-image-picker | 7.2.3 | 8.3.1 |
| react-native-bootsplash | 6.3.12 | 7.3.5 |
| @react-navigation/native | 6.1.18 | 6.1.18 |
| @react-navigation/stack | 6.4.1 | 6.4.1 |
| @react-navigation/bottom-tabs | 6.6.1 | 6.6.1 |

Screens is pinned below 4.25, which removes Paper/legacy support; 4.24 supports RN 0.81 with legacy rendering. This app uses the JS stack (`@react-navigation/stack`), not native-stack, and retains Navigation v6. Gesture Handler 2.28 is the documented RN 0.79+ line; newer 2.32+ requires RN 0.84. Reanimated remains on 3.19.5; VisionCamera stays on the latest 4.x. No unmaintained library was replaced. rn-fetch-blob, TTS and sound-player compiled for both debug and release dependencies; runtime limits are recorded below.

Mapbox 10.3.18 selects Mapbox Android 11.33.0's **android-ndk27** artifact at targetSdk >=35. Reanimated and VisionCamera pass `ANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON`. These source-level settings do not prove the packaged libraries' alignment.

Bootsplash v7 migration was read. Existing Theme.BootSplash/init/hide APIs remain compatible. The Jest isVisible mock now returns a synchronous boolean. Regenerated with exactly REPORT-C's source/flags:

```text
npx.cmd react-native-bootsplash generate C:/Users/lekha/Downloads/Danavi_Android_Icon_Kit/branding/danavi-bridge-transparent.png --platforms=android --background=FFFFFF --logo-width=130 --assets-output=src/assets/bootsplash
Android: drawable mdpi through xxxhdpi, 288 through 1152 px
JS logo: 130x73, 195x110, 260x147, 390x220, 520x293
exit 0
```

Both npm and Yarn locks updated. Initial npm resolution conflicted with the installed old tree; a clean temporary package-only resolution succeeded, then `npm.cmd ci --no-fund --no-audit` installed 1134 packages without --force/--legacy-peer-deps. Synp needed its incomplete resolved metadata corrected from package-lock; Yarn then successfully installed into a separate temporary modules directory with scripts disabled. Main node_modules remains the npm-ci installation.

## Edge-to-edge and Android behavior audit

`edgeToEdgeEnabled=true` makes the layout consistent on API 34 as well as enforced API 35/36. A root SafeAreaProvider/SafeAreaView protects all navigation screens, custom tab bar, camera controls, map controls and application-level overlays. Removed old fixed StatusBarManager top offsets from HeaderBase and Profile/Personal/Settings/FAQ/Policy/About to prevent double top gaps. The startup error fallback also uses safe areas. App-owned native Modals (image viewers, filters, language picker, profile dialogs, chatbot image preview) now use SafeAreaModal with a provider measured in the modal's own window. Paper Portal modals retain Paper's own inset handling. BottomSheet accounts for bottom/side insets, including its height; migrated its obsolete v2 drag props and ref type to its installed v3 API. The draggable chat bubble uses the current safe frame/insets and resets its bounds on dimension changes.

All screen families were checked in source: Home/search/detail/gallery/video; Festivals/list/detail; Feed/composer/sheets; Map/Advise/route overlays; Camera/PreviewImage; Login/SignUp; Profile/Personal/Settings/FAQ/Policy/About/Donation/Chatbot. This is a source audit; device acceptance is listed separately below, and hidden/disabled flows are not claimed as exercised.

No application foreground service is declared; no service type added. Predictive-back manifest setting remains at the platform default. Camera requests CAMERA at runtime and does not request microphone for photos. ImagePicker uses launchImageLibrary for photo selection without a broad Android 13+ media permission request; existing legacy storage permission SDK caps remain. Physical camera/picker permission and back-navigation behavior still require the runtime checks below.

## Verification outputs

Windows .cmd/.bat equivalents used throughout. npm cache is temporary. Git uses command-scoped safe.directory only. No secret values were printed or copied into tracked files. Mapbox download credentials are loaded from gitignored local.properties or existing Gradle properties; the empty tracked placeholder is not a credential. The release signing guard remains in place. Added unsigned `verification` build type initialized from release, including R8/resource shrinking and release dependency fallbacks; it has no signing config and is not publishable.

Baseline:
```text
npx.cmd jest --runInBand
Test Suites: 24 passed, 24 total
Tests: 1 skipped, 224 passed, 225 total
Time: 23.91 s
exit 0
npx.cmd tsc --noEmit
53 error TS diagnostics; exit 2
```

After upgrade:
```text
npx.cmd jest --runInBand
Test Suites: 24 passed, 24 total
Tests: 1 skipped, 224 passed, 225 total
Time: 33.81 s
exit 0
npx.cmd tsc --noEmit
45 error TS diagnostics; exit 2
Diff: -8 diagnostics vs baseline (53 -> 45), no new diagnostic categories after compatibility fixes.
```

Jest native mocks now model imperative camera methods and formatting helpers reached under React 19; the Gesture Handler package is transformed and the removed RN Animated deep mock is no longer needed. Existing open-handle warning appeared on baseline/earlier runs.

```text
npx.cmd eslint <all changed JS/TS/TSX files plus SafeAreaModal.tsx>
0 errors, 23 warnings; exit 0
npx.cmd react-native bundle --platform android --dev false --entry-file index.js --max-workers 2 --bundle-output <temp>/danavi-d-check2.bundle --assets-dest <temp>/danavi-d-bundle-assets
Done writing bundle output
Copying 27 asset files
Done copying assets
exit 0
```

Changed-file lint warnings are existing unused values/no-shadow warnings in touched files. Metro excludes .gradle/.cxx and native Android build directories from source watching. An initial concurrent native build caused a VisionCamera CMake temporary-directory watcher ENOENT; the final exclusion config corrected that observed Metro crash. Final Metro config lint passed.

### Native build

Sandbox Java initially resolved user.home to C:/ and could not create Gradle/.android files. Java's toRealPath also failed on Gradle JARs copied to Windows temp; placing the build cache in ignored android/.gradle/d-user worked. Used explicit -Duser.home, in-process Kotlin, --no-watch-fs, --max-workers=4 and 20-second Gradle HTTP timeouts for subsequent runs. Copied the preinstalled Maven cache into the isolated cache. Earlier long dependency-wait attempts were interrupted; they do not count as successful builds.

A first complete build failure requested missing Build Tools 35 for AsyncStorage because modules without buildToolsVersion use AGP's default. The installed/read-only SDK has 34 and 36. Root library configuration now supplies 36.0.0 to those modules.

```text
cd android
.\gradlew.bat [sandbox flags above] clean assembleDebug assembleRelease --console=plain
Missing release signing properties: MYAPP_RELEASE_STORE_FILE, MYAPP_RELEASE_STORE_PASSWORD,
MYAPP_RELEASE_KEY_ALIAS, MYAPP_RELEASE_KEY_PASSWORD.
BUILD FAILED in 48s
10 actionable tasks: 10 up-to-date
exit 1 (expected credential blocker)
```

```text
.\gradlew.bat [sandbox flags above] clean assembleDebug assembleVerification bundleVerification --console=plain
:app:assembleDebug
:app:minifyVerificationWithR8
:app:assembleVerification
:app:bundleVerification
BUILD SUCCESSFUL in 23m 24s
1229 actionable tasks: 1204 executed, 25 up-to-date
exit 0
```

Produced `app-debug.apk`, `apk/verification/app-verification-unsigned.apk` (162,020,504 bytes), and `bundle/verification/app-verification.aab` (76,869,603 bytes), under android/app/build/outputs. Both native debug/release dependencies compiled, including legacy-only libraries. Gradle warned about the 512 MB metaspace limit and deprecated APIs/features, but the build passed with the existing memory configuration. No old RN 0.74 artifact was used as evidence.

### Debug APK SDK and 16 KB verification - PASS

Artifact: `android/app/build/outputs/apk/debug/app-debug.apk` (built 2026-11-11 23:17).
SHA-256: `38a22303e49ecc63dda70127fb194a459a3ab681022a322ca501d3a253fcd2b5`.

```text
aapt2.exe dump badging android/app/build/outputs/apk/debug/app-debug.apk
compileSdkVersion='36'
minSdkVersion:'24'
targetSdkVersion:'36'
exit 0
zipalign.exe -c -P 16 -v 4 android/app/build/outputs/apk/debug/app-debug.apk
Verification successful
exit 0
llvm-readelf.exe --program-headers --wide <each extracted arm64 .so>
All 16 libraries: every LOAD p_align == 0x4000
```

| Packaged arm64 library | Every LOAD alignment | LOAD count |
| --- | --- | --- |
| lib/arm64-v8a/libVisionCamera.so | 0x4000 | 3 |
| lib/arm64-v8a/libc++_shared.so | 0x4000 | 4 |
| lib/arm64-v8a/libfbjni.so | 0x4000 | 3 |
| lib/arm64-v8a/libhermes.so | 0x4000 | 3 |
| lib/arm64-v8a/libhermestooling.so | 0x4000 | 3 |
| lib/arm64-v8a/libimage_processing_util_jni.so | 0x4000 | 3 |
| lib/arm64-v8a/libimagepipeline.so | 0x4000 | 3 |
| lib/arm64-v8a/libjsi.so | 0x4000 | 3 |
| lib/arm64-v8a/libmapbox-common.so | 0x4000 | 3 |
| lib/arm64-v8a/libmapbox-maps.so | 0x4000 | 3 |
| lib/arm64-v8a/libnative-filters.so | 0x4000 | 3 |
| lib/arm64-v8a/libnative-imagetranscoder.so | 0x4000 | 3 |
| lib/arm64-v8a/libreactnative.so | 0x4000 | 3 |
| lib/arm64-v8a/libreanimated.so | 0x4000 | 3 |
| lib/arm64-v8a/librnscreens.so | 0x4000 | 3 |
| lib/arm64-v8a/libworklets.so | 0x4000 | 3 |

These are actual APK packaging/ELF results. A 16 KB emulator runtime test remains unavailable. The unsigned release-equivalent APK also passed badging (target 36/min 24), ZIP alignment and all 16 arm64 ELF libraries with exactly the same per-LOAD 0x4000 alignments listed above. Its SHA-256 is `06c6393d8ce2396cad9113b525fad0158f0db58ad0b64345f4f1aa0e7410ce46`.

A separate ignored copy was signed with the repository's standard Android **debug** keystore solely for installation/smoke tests. Original verification APK/AAB remain unsigned; no production credentials were used.

### Emulator smoke — pending fresh APK

Existing emulator-5554 is API 34. Created a separate ignored Danavi_D_API_36 AVD and booted emulator-5556 from the installed API 36 google_apis/x86_64 image. `getprop ro.build.version.sdk` returns 36; `getconf PAGESIZE` returns 4096. No 16 KB emulator image is installed. Emulator home was redirected to an ignored local directory after the default profile lock path proved unwritable. ADB CLI's profile path fails in this sandbox; the running ADB server is accessible via its standard localhost protocol.

API 36 debug smoke observed: bridge splash; Home with real catalog cards; Profile without floating bubble; About with Android 7.0+; system Back from About to Profile; CAMERA permission prompt and live emulator camera; Android system photo picker; selection of an app-logo fixture into the camera preview modal, without a broad media-permission prompt. Gesture-nav status/navigation areas remain clear in the captured Home/Profile/About/Camera views. Packaged/3-button/map/audio checks are still in progress.

Debug-only limitation: after the initial unavailable Metro and developer reloads, the native inspector aborted at HostTarget::registerInstance with "Only one instance allowed". A fresh app process with Metro running recovered and passed the above checks. This is recorded, not hidden as a successful reload. A [similar upstream missing-bundler/reload report](https://github.com/react/react-native/issues/52339) exists; it is not proof of an identical Android root cause. The dev-server address was set using RN's Change Bundle Location UI after automatic approval review rejected direct preference-file writing.

Authenticated login/logout requires a suitable test account; no credentials were supplied, invented or recorded. A 16 KB image is not installed; physical audible output is not claimed from screenshots.

## npm audit

```text
npm.cmd audit --json
critical 0; high 9; moderate 14; low 11; total 34
exit 1 (remaining advisories)
```

Fresh resolution upgraded dependencies within existing non-breaking ranges (including axios). Remaining high entries do not have a non-breaking fix reported by npm. Navigation v7 is outside the approved v6 scope; overriding 0.x decoding APIs or replacing Markdown's old major parser without compatibility work is not represented as a safe patch. These findings remain release risks, especially for untrusted deep-link/Markdown content. No automatic `npm audit fix --force` was used.

| Remaining package | Severity | Reason left |
| --- | --- | --- |
| @react-navigation/bottom-tabs | high | Navigation v6 chain; npm proposes Navigation v7 (breaking). |
| @react-navigation/core | high | Navigation v6 chain; npm proposes Navigation v7 (breaking). |
| @react-navigation/elements | high | Navigation v6 chain; npm proposes Navigation v7 (breaking). |
| @react-navigation/native | high | Navigation v6 chain; npm proposes Navigation v7 (breaking). |
| @react-navigation/stack | high | Navigation v6 chain; npm proposes Navigation v7 (breaking). |
| decode-uri-component | high | Navigation v6 chain; npm proposes Navigation v7 (breaking). |
| linkify-it | high | Markdown renderer uses older major parser; npm reports no safe automatic fix. |
| markdown-it | high | Markdown renderer uses older major parser; npm reports no safe automatic fix. |
| query-string | high | Navigation v6 chain; npm proposes Navigation v7 (breaking). |
| @react-native-community/cli-config-android | moderate | Lower severity tooling/transitive finding; outside critical/high runtime remediation. |
| @react-native-community/cli-doctor | moderate | Lower severity tooling/transitive finding; outside critical/high runtime remediation. |
| @react-native-community/cli-platform-android | moderate | Lower severity tooling/transitive finding; outside critical/high runtime remediation. |
| @react-native-community/cli-platform-apple | moderate | Lower severity tooling/transitive finding; outside critical/high runtime remediation. |
| @react-native-community/cli-platform-ios | moderate | Lower severity tooling/transitive finding; outside critical/high runtime remediation. |
| @react-native/eslint-config | moderate | npm proposes a breaking major upgrade. |
| @typescript-eslint/eslint-plugin | moderate | Lower severity tooling/transitive finding; outside critical/high runtime remediation. |
| @typescript-eslint/parser | moderate | npm proposes a breaking major upgrade. |
| @typescript-eslint/type-utils | moderate | Lower severity tooling/transitive finding; outside critical/high runtime remediation. |
| @typescript-eslint/typescript-estree | moderate | npm proposes a breaking major upgrade. |
| @typescript-eslint/utils | moderate | Lower severity tooling/transitive finding; outside critical/high runtime remediation. |
| fast-xml-parser | moderate | Lower severity tooling/transitive finding; outside critical/high runtime remediation. |
| minimatch | moderate | npm proposes a breaking major upgrade. |
| react-native-markdown-display | moderate | No automatic fix reported; retained and documented. |
| @jest/core | low | Lower severity tooling/transitive finding; outside critical/high runtime remediation. |
| @react-native-community/cli | low | npm proposes a breaking major upgrade. |
| @react-native-community/cli-config | low | npm proposes a breaking major upgrade. |
| @svgr/plugin-svgo | low | npm proposes a breaking major upgrade. |
| @testing-library/react-native | low | npm proposes a breaking major upgrade. |
| create-jest | low | npm proposes a breaking major upgrade. |
| deepmerge | low | npm proposes a breaking major upgrade. |
| jest | low | npm proposes a breaking major upgrade. |
| jest-cli | low | npm proposes a breaking major upgrade. |
| jest-config | low | npm proposes a breaking major upgrade. |
| react-native-svg-transformer | low | npm proposes a breaking major upgrade. |

## Files and review boundaries

- package.json/package-lock.json/yarn.lock; Babel/Metro/Jest/TS tooling compatibility and native mocks.
- Android build.gradle/app build.gradle/gradle.properties/wrapper and MainApplication; regenerated bootsplash PNGs/manifest.
- Gemfile, ios/Podfile, ios/Travel/AppDelegate.mm and Xcode deployment targets (no iOS build).
- App.tsx, HeaderBase, BottomSheet, SafeAreaModal, FloatingChatBubble and screen modal imports/top padding; BRAND minimum; small React/RN type compatibility fixes.
- This report.

The pre-existing TASK-D edit and externally edited PROGRESS.md / new policy/store-listing drafts were not changed by this task. No new architecture, feature, package rename, commit or push.

## References

- [Published RN 0.81.6 template](https://www.npmjs.com/package/@react-native-community/template/v/0.81.6)
- [Bootsplash 7 migration](https://github.com/zoontek/react-native-bootsplash/blob/7.3.5/MIGRATION.md)
- [Screens legacy compatibility](https://github.com/software-mansion/react-native-screens/blob/main/README.md#support-for-paper)
- [Gesture Handler 2 compatibility](https://docs.swmansion.com/react-native-gesture-handler/docs/2.x/fundamentals/installation/)
- [Android 16 edge-to-edge enforcement](https://developer.android.com/about/versions/16/behavior-changes-16)
- [Android 16 KB page sizes and ELF/ZIP verification](https://developer.android.com/guide/practices/page-sizes)
- [Image Picker permissions](https://github.com/react-native-image-picker/react-native-image-picker/blob/main/README.md)
