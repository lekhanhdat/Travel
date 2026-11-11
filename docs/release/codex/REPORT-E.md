# Batch E — Play policy cleanup

Date: 2026-11-12. Branch: `release/rn-upgrade`. Actual starting HEAD: `c59f16c` (`docs(release): record batch D verification, extend batch E brief`), later than the brief's `bf31b21`. Starting working tree was clean. No commit, push, branch switch, applicationId/namespace, Mapbox version or architecture changes.

## Changes

| Item | Result |
| --- | --- |
| E1 / POL-H7 | `ProfileScreen.tsx` gates the donation row and its navigation handler with `ENABLE_PAYMENT`; `AppContainer.tsx` gates the Donation route. Feature implementation is retained. Tests cover the hidden row, blocked handler, absent route and the enabled handler's existing login behavior. |
| E2 / POL-03 | Removed the app's `RECORD_AUDIO` permission from `AndroidManifest.xml`. CameraScreen enables `photo={true}`, never enables audio/video and requests only CAMERA. VisionCamera 4.7.3's own manifest is empty; its native CameraView defaults `audio` and `video` to false. Merged-manifest results below. |
| E3 / BRAND-05 | BootTheme in `styles.xml` now sets `android:statusBarColor` to the existing white `bootsplash_background` and `android:windowLightStatusBar` to true. Batch D edge-to-edge configuration remains. |
| E4 / POL-04 | `brand.ts` adds typed nullable `privacyPolicyUrl` / `accountDeletionUrl`, both null pending MANUAL-04/13. `Policy.tsx` renders the requested Vietnamese links with link accessibility roles when configured. Tests cover null defaults and opening each configured URL. |
| E5 / UX-02 | `App.tsx` hides the bubble on Camera through the existing Profile mechanism. Test covers Camera/Profile hidden and Home restored. |
| E6 / MAP-01 | Investigation only; no safe documented configuration fix found within the allowed version/architecture scope. Evidence and remaining tap risk below. |

Changed tests: `__tests__/authFlow.test.js`, `guestNavigation.test.js`, `brand.test.js`, `App.test.tsx`. Other changed files are named in the table and this report.

## JavaScript verification

Windows `.cmd` equivalents used:

```text
npx.cmd jest --runInBand
Test Suites: 24 passed, 24 total
Tests: 1 skipped, 229 passed, 230 total
Time: 38.85 s
exit 0

npx.cmd tsc --noEmit
Before: 45 error TS diagnostics, exit 2
After:  45 error TS diagnostics, exit 2
Compare-Object after normalizing line/column numbers: no differences

npx.cmd eslint App.tsx src/config/brand.ts src/container/AppContainer.tsx src/container/screens/Profile/ProfileScreen.tsx src/container/screens/Profile/Policy.tsx __tests__/authFlow.test.js __tests__/brand.test.js __tests__/guestNavigation.test.js __tests__/App.test.tsx
0 errors, 9 warnings; exit 0
```

The two existing Policy diagnostics moved down by 15 lines with the inserted links; diagnostic content is unchanged. Lint warnings are existing AppContainer unused-import, shadowing and nested-component warnings. The skipped test remains pre-existing. `git diff --check` passes.

## Native build and permissions

Reused Batch D's ignored `android/.gradle/d-user` Gradle cache, explicit Java user.home, in-process Kotlin and limited workers. No secrets were printed or copied into tracked files.

```powershell
cd android
$env:GRADLE_USER_HOME = 'D:\Project\Travel\Travel_FE\Travel\android\.gradle\d-user'
$env:GRADLE_OPTS = '-Duser.home=D:/Project/Travel/Travel_FE/Travel/android/.gradle/d-user'
.\gradlew.bat assembleDebug --offline --no-watch-fs --max-workers=4 '-Pkotlin.compiler.execution.strategy=in-process' '-Duser.home=D:/Project/Travel/Travel_FE/Travel/android/.gradle/d-user' '-Dorg.gradle.internal.http.connectionTimeout=20000' '-Dorg.gradle.internal.http.socketTimeout=20000' --console=plain
```

```text
BUILD SUCCESSFUL in 2m 17s
569 actionable tasks: 36 executed, 533 up-to-date
exit 0
```

Fresh artifact: `android/app/build/outputs/apk/debug/app-debug.apk`, 229,684,199 bytes, modified 2026-11-12 00:50:49 local time. Gradle retains existing deprecation warnings.

Fresh merged manifest: `android/app/build/intermediates/merged_manifests/debug/processDebugManifest/AndroidManifest.xml`. Complete uses-permission list:

```text
android.permission.INTERNET
android.permission.CAMERA
android.permission.ACCESS_FINE_LOCATION
android.permission.ACCESS_COARSE_LOCATION
android.permission.ACCESS_NETWORK_STATE
android.permission.READ_EXTERNAL_STORAGE (maxSdkVersion=32)
android.permission.WRITE_EXTERNAL_STORAGE (maxSdkVersion=28)
com.android.vending.CHECK_LICENSE
android.permission.WAKE_LOCK
android.permission.ACCESS_WIFI_STATE
android.permission.SYSTEM_ALERT_WINDOW
com.travel.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION
```

`RECORD_AUDIO` is absent. No library re-added it, so no `tools:node="remove"` declaration is needed.

An initial attempt failed before app tasks because PowerShell split the unquoted dotted Kotlin property into a task name (`.compiler.execution.strategy=in-process`). The command above quotes all dotted options and is the corrected run.

## Mapbox JNI investigation

Evidence inspected in the installed `@rnmapbox/maps` **10.3.18** sources:

- `react-native.config.js` points Android C++ autolinking to `android/src/main/jni/CMakeLists.txt`. That CMake file includes the custom shadow-node sources and `RNMBXMarkerViewContentTranslationsJni.cpp`, which defines `nativeSet` / `nativeRemove`.
- React Native 0.81.6's Gradle plugin (`ReactPlugin.kt`, `configureAutolinking`) generates C++ autolinking only when New Architecture is enabled. `NdkConfiguratorUtils.kt:configureReactNativeNdk` returns early for Old Architecture. This app retains `newArchEnabled=false`; the JNI bridge is consequently not linked by this build path.
- `RNMBXMarkerViewContent.kt:setTranslationY` first calls the normal Android superclass, then attempts to publish the translation for the C++ shadow node. `RNMBXMarkerViewContentTranslations.kt` catches `UnsatisfiedLinkError`, logs the reported message once, sets `available=false`, and skips subsequent JNI calls. The warning is handled; it does not itself abort rendering.
- `RNMBXMarkerView.kt` positions markers using Mapbox's native ViewAnnotation manager, geographic coordinates, view sizes and anchor offsets. Publishing the translation supplies measurement metadata; it is separate from the actual native placement.
- `RNMBXMarkerViewContentShadowNode.cpp:getTransform` consumes that translation table to correct Fabric measurement. This custom C++ shadow node is not the legacy renderer's shadow node.

`rg` found no explicit `measure(`, `measureInWindow` or `measureLayout` call in `src`. MapScreen's location and festival markers use `TouchableOpacity`; the current-location marker uses a plain View. **There is an indirect measurement dependency:** RN's TouchableOpacity uses Pressability, whose `_measureResponderRegion` calls UIManager.measure / responder.measure. Therefore no explicit app call does not establish that taps are unaffected.

The upstream [change introducing this translation table, PR #4359](https://github.com/rnmapbox/maps/pull/4359), describes the shadow-node correction and tests taps with finger movement. This corroborates the purpose of the code; it does not establish legacy-architecture tap reliability for this app.

Conclusion from source: the missing bridge explains the legacy warning, and the failed publication should not move the native marker itself. This is a source-based inference, **not a new emulator observation**. Markers rendering is reported in the supplied brief. No fresh device test of marker placement or taps was performed in Batch E. Existing mocked map tests pass but cannot test JNI, geographic pixel placement, or physical gesture cancellation. Moving-finger taps, taps after pan/zoom, and taps during camera animation remain a runtime acceptance item on API 36 (location and festival markers). No documented flag was found to enable this Fabric measurement bridge on legacy architecture. Avoided speculative native patches, warning suppression, package changes and architecture changes.

## Remaining owner/runtime actions

- MANUAL-04/13: owner must publish and fill both BRAND URLs before release; links intentionally remain hidden while null.
- Verify white splash/dark status icons and Camera flash access on device. Jest checks navigation visibility, not platform pixels.
- Complete the Mapbox gesture acceptance noted above before treating MAP-01 as harmless.

Untracked `docs/release/OWNER_TODO.md` and `docs/release/codex/TASK-F_cleanup.md` appeared during this session; they were left untouched.
