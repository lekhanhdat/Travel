# Batch F — Repository cleanup

Date: 2026-11-12. Branch: `release/rn-upgrade`. Base HEAD: `e244d24` (`fix(release): Play policy cleanup (batch E)`). Starting working tree was clean. No commit, push, branch switch, applicationId/namespace/package-name, endpoint, Firebase/Mapbox configuration or deep-link changes. The debug keystore remains. Other release reports and both migration history files remain unchanged.

## Changes

| Item | Result |
| --- | --- |
| F1 | Removed 28 old manually bundled drawables. Kept all bootsplash resources. Ignored local Kotlin compiler-session files and added two narrowly scoped `.gitignore` patterns for `drawable-*/node_modules_*` and `drawable-*/src_assets_*`. Metro-generated release resources belong in Gradle intermediates. |
| F2 | Consolidated both actively imported SVG registries into `src/assets/ImageSvg.tsx` / `src/assets/svg`. Updated application imports and Jest mocks. Moved three GoogleSans fonts to `src/assets/fonts`, matching the existing `react-native.config.js` asset path. Android font copies are unchanged and byte-identical. |
| F3 | Removed the three unused PNG keys/files, 20 SVGs with no consumers outside their generated registries, two byte-identical duplicate SVGs, and six unregistered/unreferenced iOS NotoSansJP fonts. No iOS plist/project references needed removal. The evidence tables distinguish unused content from relocated content. |
| F4 | Kept and exercised both asset generators. Fixed their ESLint parser selection and equivalent regex escapes; removed generator-local unused bindings. Kept Reactotron's configuration and its installed dependency. Removed `yarn.lock`; npm is authoritative in CI and README. Removed only the unused direct dev dependency `@babel/preset-env` and updated `package-lock.json` through npm. |
| F5 | Removed 173 executable `console.log` statements, including API URL/body, photo path, search/query, location and navigator diagnostics. Kept `console.error` and every commented-out feature. Removed unused imports/bindings, a dead style object and a dead constant; renamed shadowing callback parameters while preserving object property keys. Narrowed/widened types to reflect existing runtime inputs, reducing TypeScript errors from 45 to 23. |
| F6 | Camera's mount-time connection test, method and wifi button are guarded by `__DEV__`. The implementation remains available in debug. Removed URL/response logging and added `ui.camera.connectionError` in both languages. Tests cover mount, direct invocation and button visibility in both dev modes. |
| F7 | Added Map to App's existing Profile/Camera bubble exclusion. The App test covers all three excluded tabs and restoring the bubble on Home. |
| F8 | Investigated on API 36 with the fresh debug APK and Metro, with Reactotron enabled and temporarily disabled. No permanent debug-tooling or release change was made. Details below. |

The existing missing-dependency hook lint errors were handled with five local, explained `eslint-disable-next-line react-hooks/exhaustive-deps` exceptions. These preserve the existing native-listener lifetimes and network/zoom refresh triggers; changing those schedules is outside this behavior-preserving cleanup. The empty traffic-logging effect was removed. CachedImage's error callback no longer depends on `uri`, which it only used for logging.

## Dependency audit

`npx.cmd --offline depcheck --json` could not run: `ENOTCACHED`, with no cached response for depcheck. Used an equivalent conservative audit instead: tracked JS/TS import/require strings, npm scripts, Babel/Jest/Metro/ESLint/TypeScript configuration, native source/config and `react-native config` autolinking metadata. All remaining application dependencies have source/config references or native autolinking evidence. `react-native-screens`, CLI packages, Babel runtime/core, Jest transforms, type packages and config-referenced plugins were retained despite simple text-grep false positives.

| Removed package | Evidence |
| --- | --- |
| Direct dev dependency `@babel/preset-env` (`^7.20.0`) | `git grep -n -I -F '@babel/preset-env' -- ':!package.json' ':!package-lock.json' ':!yarn.lock' ':!docs/release/**' ':!MIGRATION*'` returned zero matches (exit 1). Not in native autolinking. `npm explain @babel/preset-env --offline` showed only the root dev dependency. Babel uses `module:@react-native/babel-preset`; no config uses preset-env. |

```text
npm.cmd install --package-lock-only --offline --ignore-scripts --no-audit --no-fund
up to date in 4s

npm.cmd install --offline --ignore-scripts --no-audit --no-fund
added 31 packages, and removed 35 packages in 10s
exit 0
```

The installed tree also filled previously missing packages; the tracked lockfile only loses entries associated with the removed preset. No application/native dependency was removed. The generators' existing transitive `chalk` / `yargs-parser` availability remains a tooling candidate for explicitly declaring direct dev dependencies; both generators currently work.

## Kept candidates and boundaries

| Candidate / kept item | Reason |
| --- | --- |
| `src/container/screens/Login/ForgotPasswordScreen.tsx` | Deliberately disabled screen retained by project convention; its commented import and route remain. |
| `src/container/screens/Maps/MapScreen.tsx`, `FinishedLoadingFile` diagnostic | Retained the one non-user-data sound-file diagnostic because a `SoundPlayer.play()` call is an argument. Removing that call would change debug playback; production console stripping already removes it. Candidate for a separate playback behavior fix. |
| Existing color/style TypeScript errors and i18next compatibility setting | Resolving undefined color/style values or changing plural compatibility could affect UI/behavior. Not changed. Remaining count: 23. |
| GoogleSans aliases with underscores in some existing literal `fontFamily` strings | Existing discrepancy with `GoogleSans-Regular` / `GoogleSans-Medium` / `GoogleSans-Bold`; font registration and Android files are retained. No font naming/UI changes. |
| iOS GoogleSans registration | Existing plist only registers MaterialIcons/MaterialCommunityIcons. This batch removes only unused NotoSansJP files; iOS custom-font integration/rendering requires macOS validation. |
| `src/assets/bootsplash/*`, Android boot resources, iOS asset catalogs | Generated/implicit native tool inputs; retained. |
| Referenced PNGs, SVGs and density variants | Kept when referenced by live source or comments. No dynamic access to the images registry or namespace import of ImageSvg was found. |
| Reactotron / `ReactotronConfig.js` | Installed, dev-only import retained; production bundle contains no Reactotron match. |
| `android/app/debug.keystore` | Required template debug-only key; retained. |

## Debug responder investigation (F8)

Used emulator-5556 (`ro.build.version.sdk=36`, 1080×2400). Installed the freshly built debug APK with `adb install -r`; `run-as com.travel pwd` succeeded, establishing that the tested build was debuggable. Reused the existing Metro server on port 8081 (`packager-status:running`); an attempted second server correctly reported EADDRINUSE and exited.

With the original entry point, logcat recorded `Reactotron Configured`. The Profile tab opened and Home's “Xem tất cả” opened the catalog list. Initial screenshots sometimes captured the old screen before navigation settled. Temporarily changed only the entry-point dev guard to `__DEV__ && false`, force-stopped/restarted the app, and confirmed zero `Reactotron Configured` matches for the new process. “Xem tất cả” also opened the list in that run. Some initial taps were delayed in this run as well, while native compilation was active.

This did not reproduce a persistent JS responder failure or establish Reactotron as its cause. The temporary entry-point change was restored byte-for-byte (`git diff --quiet -- index.js`, exit 0). No speculative fix is shipped. Existing Reactotron setup instruments networking/storage/logs; no app responder override was found in that setup. Re-test a cold debug launch without concurrent builds if the intermittent delay recurs.

Ignored local screenshots/logs: `android/.gradle/f8-debug-on-all.png` (Profile), `f8-on-viewall.png`, `f8-off-viewall.png`, `f8-logcat-on.txt`, `f8-logcat-off.txt`. These files are not part of the change set and raw app logs are not pasted into this report.

## Verification

Windows `.cmd` equivalents were used for the requested npx commands. Initial baselines were captured before edits.

```text
npx.cmd jest --runInBand
Test Suites: 24 passed, 24 total
Tests:       1 skipped, 231 passed, 232 total
Snapshots:   0 total
Time:        66.337 s
Ran all test suites.
exit 0
```

```text
npx.cmd tsc --noEmit
Before: 45 error TS diagnostics; exit 2
After:  23 error TS diagnostics; exit 2
New diagnostics after normalizing source positions: 0
```

```text
npx.cmd eslint .
Before: 8 errors, 67 warnings
After:  0 errors, 29 warnings; exit 0
```

The remaining lint warnings are existing nested-component, loose-equality/regex and generator prototype/alias warnings plus pre-existing test warnings. No whole-file formatter was applied. Type-only changes: TextBase accepts React Native StyleProp<TextStyle>, catalog translator parameters accept the already-used plain translator function as well as TFunction, FlatList data parameters accept ArrayLike, and InputBase.setValue has a string annotation. Remaining TypeScript diagnostics are a subset of baseline.

Generator checks: `npm.cmd run genimgsvg` succeeds and produces the canonical registry. `node genimg.js src/assets/images --output android/.gradle/f-generated-images.tsx --name images` succeeds; comparing property keys with the maintained src/res/images.tsx returns `genimg registry keys identical: true keys: 11`. No removed key is regenerated.

```text
node node_modules/react-native/cli.js bundle --platform android --dev false --entry-file index.js --max-workers 2 --bundle-output android/.gradle/f-production.bundle --assets-dest android/.gradle/f-bundle-assets-final
Writing bundle output to: android/.gradle/f-production.bundle
Done writing bundle output
Copying 24 asset files
Done copying assets
Reactotron matches (case-insensitive): 0
Bundle bytes: 4612554
exit 0
```

### Native build

Reused Batch D sandbox cache/user.home, offline mode, in-process Kotlin, limited workers and HTTP timeouts. The first clean build attempt hit the existing 512 MB metaspace ceiling (`OutOfMemoryError: Metaspace`, `BUILD FAILED in 1m 28s`). Retried with a command-line-only JVM memory override; no project Gradle property was changed.

```powershell
cd android
$env:GRADLE_USER_HOME = 'D:\Project\Travel\Travel_FE\Travel\android\.gradle\d-user'
$env:GRADLE_OPTS = '-Duser.home=D:/Project/Travel/Travel_FE/Travel/android/.gradle/d-user'
.\gradlew.bat clean assembleDebug assembleVerification --offline --no-watch-fs --max-workers=4 `
  '-Pkotlin.compiler.execution.strategy=in-process' `
  '-Duser.home=D:/Project/Travel/Travel_FE/Travel/android/.gradle/d-user' `
  '-Dorg.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=1536m' `
  '-Dorg.gradle.internal.http.connectionTimeout=20000' `
  '-Dorg.gradle.internal.http.socketTimeout=20000' --console=plain
```

```text
BUILD SUCCESSFUL in 16m 53s
1222 actionable tasks: 1051 executed, 171 up-to-date
exit 0

Final source/lockfile refresh, same flags: assembleDebug assembleVerification
BUILD SUCCESSFUL in 1m 23s
1197 actionable tasks: 57 executed, 1140 up-to-date
exit 0
```

The final refresh ensures APKs contain the finished source after the last registry/log cleanup. Existing native deprecation warnings remain. Verification is the existing unsigned, release-equivalent variant; no release signing credentials were read or added.

`aapt2.exe dump badging` on each final APK:

```text
Debug:
package: name='com.travel' versionCode='1' versionName='1.0.0' platformBuildVersionName='16' platformBuildVersionCode='36' compileSdkVersion='36' compileSdkVersionCodename='16'
minSdkVersion:'24'
targetSdkVersion:'36'

Verification:
package: name='com.travel' versionCode='1' versionName='1.0.0' platformBuildVersionName='16' platformBuildVersionCode='36' compileSdkVersion='36' compileSdkVersionCodename='16'
minSdkVersion:'24'
targetSdkVersion:'36'
```

`aapt2.exe dump resources app-verification-unsigned.apk`, filtered to regenerated resource families:

```text
resource 0x7f07010b drawable/node_modules_reactnavigation_elements_src_assets_backicon
resource 0x7f07010c drawable/node_modules_reactnavigation_elements_src_assets_backiconmask
resource 0x7f07010d drawable/node_modules_rnmapbox_maps_lib_module_assets_heading
resource 0x7f070122 drawable/src_assets_images_caurong
resource 0x7f070123 drawable/src_assets_images_cauvang
resource 0x7f070124 drawable/src_assets_images_danavi_logo
resource 0x7f070125 drawable/src_assets_images_dantoc
resource 0x7f070126 drawable/src_assets_images_dienhai
resource 0x7f070127 drawable/src_assets_images_eye_close
resource 0x7f070128 drawable/src_assets_images_eye_open
resource 0x7f070129 drawable/src_assets_images_nharong
resource 0x7f07012a drawable/src_assets_images_red_marker
resource 0x7f07012b drawable/src_assets_images_tab_add_friends
resource 0x7f07012c drawable/src_assets_images_tab_add_friends_focus
```

This is 14 logical drawable resources regenerated from current JavaScript assets after removing all 28 source-bundled copies and running clean. Android resource optimization shortens ZIP filenames (for example res/aM.xml); searching APK ZIP entry names alone therefore yields zero family-name matches. AAPT resolves the original resource names and provides the required evidence. Old unused images and old module resource paths are not expected to return.

| APK | Before F (bytes) | Final (bytes) | Reduction |
| --- | ---: | ---: | ---: |
| Debug | 229,684,199 | 227,182,654 | 2,501,545 |
| Verification unsigned | 162,021,096 | 161,261,955 | 759,141 |

Sizes were read from the APKs at the beginning and end of this task; these are artifact comparisons, not a claim that every byte is attributable to asset removal.

All three source GoogleSans files, unchanged Android copies and final Verification APK font entries have identical SHA-256 values:

| Font | Source = Android = APK SHA-256 |
| --- | --- |
| GoogleSans-Bold.ttf | `12ACF77BEBAF68BA261051F5233FD3BE6AD5A1E812A693CB3DBBBAD8575698D9` |
| GoogleSans-Medium.ttf | `672E1681BFCB152DDA153E3D2567C82152C8785DE640D35E27AEE8153A58A8E5` |
| GoogleSans-Regular.ttf | `3CB37BD58EAE5541A499149AA60926EFE7542C8D13B24EBAA49269AC1C0EA8BA` |

Home and the catalog list rendered text on the API 36 debug emulator. Font binaries and font aliases in fonts.tsx/AppStyle.tsx were preserved. iOS build/render checks were not run: this is a Windows environment. Existing iOS GoogleSans registration and underscored literal aliases remain explicit candidates, rather than a new UI/font change.

```text
git diff --check
exit 0

git diff --quiet -- index.js
exit 0
```

## Deletion and relocation evidence

All searches used `git -c safe.directory=D:/Project/Travel/Travel_FE/Travel`; the per-command override avoids changing global Git configuration. Exit 1 means zero matches. Searches included commented source; generated registries were excluded only when checking whether their own entries had consumers. The pre-edit asset search is preserved locally in `android/.gradle/f-asset-evidence.json`.

| ID | Reproducible evidence / result |
| --- | --- |
| R1 | For each resource stem: `git grep -n -I -F <stem> -- src android ios index.js ':!android/local.properties'` → zero matches, exit 1. No Android XML/Java/Kotlin resource-name reference. `git log --follow` on `drawable-mdpi/src_assets_images_caurong.jpg` identifies `ee04db7` and `2a1ac0d` (old source-bundled history). Final clean-APK resources are recorded above. Only still-referenced images are expected to regenerate; obsolete banner/frame/search resources are intentionally absent. |
| R2 | For each SVG symbol: `git grep -n -I -w <symbol> -- src __tests__ ':!src/assets/ImageSvg.tsx' ':!src/assets/assets/ImageSvg.tsx' ':!*.svg'` → zero matches, exit 1. Also searched its literal filename in src/android/ios/tests excluding the two registries → zero matches. Thus no import, JSX use, direct require or commented feature depends on it. |
| R3 | For frame/icon_camera/search: `git grep -n -I -E "images[.\\[]...\|/<name>[.](png\|jpg\|jpeg)" -- src android ios ':!src/res/images.tsx' ':!*.svg' ':!*.lock' ':!android/local.properties'` → zero matches, exit 1. Checked generated images.tsx keys, both SVG registries, `require(` paths and native references. Keys and PNG files removed together. The similarly named icon_camera SVG was checked again after the PNG key was removed. |
| R4 | `git grep -n -I -E "NotoSans\|Noto Sans" -- src ios android react-native.config.js ':!android/local.properties'` → zero matches, exit 1. Info.plist UIAppFonts contains only MaterialIcons.ttf/MaterialCommunityIcons.ttf; pbxproj has no font/folder reference. No corresponding fontFamily or native registration. |
| R5 | Compared both SVG files byte-for-byte before removing the duplicate: identical. All old nested-registry imports were migrated; `git grep -n -I -F "assets/assets/ImageSvg" -- src __tests__` → zero matches. Retained canonical file and symbol remain used; this is deduplication, not an unused-feature deletion. |
| R6 | After migrating all app/test imports: `git grep -n -I -F "assets/assets/ImageSvg" -- src __tests__` → zero matches, exit 1. Canonical generator re-exports every remaining SVG. |
| R7 | CI uses setup-node cache npm and `npm ci --ignore-scripts`; README uses npm commands. `git grep -n -I -E "(^\|[[:space:]])yarn([[:space:]]\|$)" -- ':!yarn.lock' ':!package-lock.json' ':!docs/release/**' ':!MIGRATION*'` → zero matches, exit 1. Existing generic .gitignore Yarn patterns are not a Yarn workflow. |

### Deleted files (61)

| File | Evidence |
| --- | --- |
| `android/app/src/main/res/drawable-hdpi/node_modules_reactnavigation_elements_src_assets_backicon.png` | R1 |
| `android/app/src/main/res/drawable-mdpi/node_modules_reactnativepaper_lib_module_assets_backchevron.png` | R1 |
| `android/app/src/main/res/drawable-mdpi/node_modules_reactnavigation_elements_src_assets_backicon.png` | R1 |
| `android/app/src/main/res/drawable-mdpi/node_modules_reactnavigation_elements_src_assets_backiconmask.png` | R1 |
| `android/app/src/main/res/drawable-mdpi/node_modules_rnmapbox_maps_src_assets_heading.png` | R1 |
| `android/app/src/main/res/drawable-mdpi/src_assets_images_banner.jpg` | R1 |
| `android/app/src/main/res/drawable-mdpi/src_assets_images_banner2.jpeg` | R1 |
| `android/app/src/main/res/drawable-mdpi/src_assets_images_caurong.jpg` | R1 |
| `android/app/src/main/res/drawable-mdpi/src_assets_images_causonghan.jpg` | R1 |
| `android/app/src/main/res/drawable-mdpi/src_assets_images_chibi.png` | R1 |
| `android/app/src/main/res/drawable-mdpi/src_assets_images_danang.jpg` | R1 |
| `android/app/src/main/res/drawable-mdpi/src_assets_images_eye_close.png` | R1 |
| `android/app/src/main/res/drawable-mdpi/src_assets_images_eye_open.png` | R1 |
| `android/app/src/main/res/drawable-mdpi/src_assets_images_frame.png` | R1 |
| `android/app/src/main/res/drawable-mdpi/src_assets_images_icon_camera.png` | R1 |
| `android/app/src/main/res/drawable-mdpi/src_assets_images_search.png` | R1 |
| `android/app/src/main/res/drawable-mdpi/src_assets_images_tab_add_friends.png` | R1 |
| `android/app/src/main/res/drawable-mdpi/src_assets_images_tab_add_friends_focus.png` | R1 |
| `android/app/src/main/res/drawable-mdpi/src_assets_images_vooc.jpg` | R1 |
| `android/app/src/main/res/drawable-xhdpi/node_modules_reactnavigation_elements_src_assets_backicon.png` | R1 |
| `android/app/src/main/res/drawable-xhdpi/node_modules_rnmapbox_maps_src_assets_heading.png` | R1 |
| `android/app/src/main/res/drawable-xhdpi/src_assets_images_tab_add_friends.png` | R1 |
| `android/app/src/main/res/drawable-xhdpi/src_assets_images_tab_add_friends_focus.png` | R1 |
| `android/app/src/main/res/drawable-xxhdpi/node_modules_reactnavigation_elements_src_assets_backicon.png` | R1 |
| `android/app/src/main/res/drawable-xxhdpi/node_modules_rnmapbox_maps_src_assets_heading.png` | R1 |
| `android/app/src/main/res/drawable-xxhdpi/src_assets_images_tab_add_friends.png` | R1 |
| `android/app/src/main/res/drawable-xxhdpi/src_assets_images_tab_add_friends_focus.png` | R1 |
| `android/app/src/main/res/drawable-xxxhdpi/node_modules_reactnavigation_elements_src_assets_backicon.png` | R1 |
| `src/assets/images/frame.png` | R3 |
| `src/assets/images/icon_camera.png` | R3 |
| `src/assets/images/search.png` | R3 |
| `src/assets/assets/svg/BookMarkSvg.svg` | R2 |
| `src/assets/assets/svg/CirclePause.svg` | R2 |
| `src/assets/assets/svg/DeleteSvg.svg` | R2 |
| `src/assets/assets/svg/FilterSvg.svg` | R2 |
| `src/assets/assets/svg/FriendsSvg.svg` | R2 |
| `src/assets/assets/svg/HeartSvg.svg` | R2 |
| `src/assets/assets/svg/HelpSvg.svg` | R2 |
| `src/assets/assets/svg/HistorySvg.svg` | R2 |
| `src/assets/assets/svg/LoginSvg.svg` | R2 |
| `src/assets/assets/svg/LogoutSvg.svg` | R2 |
| `src/assets/assets/svg/Pause.svg` | R2 |
| `src/assets/assets/svg/RegisterSvg.svg` | R2 |
| `src/assets/assets/svg/RotateRight.svg` | R2 |
| `src/assets/assets/svg/Star.svg` | R2 |
| `src/assets/assets/svg/Volume.svg` | R2 |
| `src/assets/svg/Frame.svg` | R2 |
| `src/assets/svg/FriendsSvg.svg` | R2 |
| `src/assets/svg/SearchSvg.svg` | R2 |
| `src/assets/svg/TranslateSvg.svg` | R2 |
| `src/assets/assets/svg/HomeSvg.svg` | R5 |
| `src/assets/assets/svg/OptionsSvg.svg` | R5 |
| `src/assets/assets/ImageSvg.tsx` | R6 |
| `ios/assets/fonts/NotoSansJP-Black.ttf` | R4 |
| `ios/assets/fonts/NotoSansJP-Bold.ttf` | R4 |
| `ios/assets/fonts/NotoSansJP-Light.ttf` | R4 |
| `ios/assets/fonts/NotoSansJP-Medium.ttf` | R4 |
| `ios/assets/fonts/NotoSansJP-Regular.ttf` | R4 |
| `ios/assets/fonts/NotoSansJP-Thin.ttf` | R4 |
| `yarn.lock` | R7 |
| `src/assets/svg/icon_camera.svg` | R2 |

### Relocated content (14 files; bytes preserved)

| Previous path | Canonical path | Evidence |
| --- | --- | --- |
| `src/assets/assets/svg/BackSvg.svg` | `src/assets/svg/BackSvg.svg` | Moved without modifying bytes; active named imports now use the canonical registry. |
| `src/assets/assets/svg/CardSvg.svg` | `src/assets/svg/CardSvg.svg` | Moved without modifying bytes; active named imports now use the canonical registry. |
| `src/assets/assets/svg/CircleDot.svg` | `src/assets/svg/CircleDot.svg` | Moved without modifying bytes; active named imports now use the canonical registry. |
| `src/assets/assets/svg/CirclePlay.svg` | `src/assets/svg/CirclePlay.svg` | Moved without modifying bytes; active named imports now use the canonical registry. |
| `src/assets/assets/svg/Clock.svg` | `src/assets/svg/Clock.svg` | Moved without modifying bytes; active named imports now use the canonical registry. |
| `src/assets/assets/svg/Next.svg` | `src/assets/svg/Next.svg` | Moved without modifying bytes; active named imports now use the canonical registry. |
| `src/assets/assets/svg/Play.svg` | `src/assets/svg/Play.svg` | Moved without modifying bytes; active named imports now use the canonical registry. |
| `src/assets/assets/svg/StarActive.svg` | `src/assets/svg/StarActive.svg` | Moved without modifying bytes; active named imports now use the canonical registry. |
| `src/assets/assets/svg/StarInActive.svg` | `src/assets/svg/StarInActive.svg` | Moved without modifying bytes; active named imports now use the canonical registry. |
| `src/assets/assets/svg/ThunderSvg.svg` | `src/assets/svg/ThunderSvg.svg` | Moved without modifying bytes; active named imports now use the canonical registry. |
| `src/assets/assets/svg/UserSvg.svg` | `src/assets/svg/UserSvg.svg` | Moved without modifying bytes; active named imports now use the canonical registry. |
| `src/assets/assets/fonts/GoogleSans-Bold.ttf` | `src/assets/fonts/GoogleSans-Bold.ttf` | Source bytes matched Android assets/fonts before moving; fontFamily aliases remain in fonts.tsx/AppStyle.tsx. |
| `src/assets/assets/fonts/GoogleSans-Medium.ttf` | `src/assets/fonts/GoogleSans-Medium.ttf` | Source bytes matched Android assets/fonts before moving; fontFamily aliases remain in fonts.tsx/AppStyle.tsx. |
| `src/assets/assets/fonts/GoogleSans-Regular.ttf` | `src/assets/fonts/GoogleSans-Regular.ttf` | Source bytes matched Android assets/fonts before moving; fontFamily aliases remain in fonts.tsx/AppStyle.tsx. |

### Local dead code / import evidence

| Removed item | Evidence |
| --- | --- |
| `src/utils/apiUsageTracker.ts`: STORAGE_KEY | `git grep -n -I -w STORAGE_KEY -- src/utils/apiUsageTracker.ts` showed only the declaration (before line 40); zero references. DAILY_USAGE_KEY remains. |
| `src/container/screens/Home/LocationVideo.tsx`: styles.backgroundVideo and StyleSheet import | `git grep -n -I -w styles -- src/container/screens/Home/LocationVideo.tsx` showed only the declaration (before line 59); no style consumers. |
| SemanticSearchBar diagnostic-only locals/loops | apiResultIds/localIds had no consumer after log removal; the name/score/id loop only constructed log arguments. Scoped git grep evidence is in f-local-deletions-first.json. The matching/scoring/search paths remain. |
| Map diagnostic-only centerLat/centerLong/accuracy bindings and traffic effect | No remaining references after diagnostic removal; scoped git grep recorded before removal. Route bounds, camera updates, watches and SoundPlayer subscriptions remain. |
| ReviewItem componentDidMount override | The baseline override only logged review image metadata; after removing logs it had no work. Its exact baseline body is in f-review-lifecycle-before.txt. Rendering/report/delete/image handlers remain. |
| Unused imports, callback arguments and render destructuring | ESLint/compiler scope analysis verified no executable references. Declaration-only bindings were removed or parameters prefixed/renamed; props/state fields and feature implementations remain. f-lint-changes.json records individual source locations. |
| Generator-local chalk / moduleName / outputName bindings in genimgsvg.js | Each had only its definition (moduleName depended on outputName but was never consumed). getFileName remains used by the export loop. Both generator commands were exercised. |

No other helper/function was deleted on a speculative zero-reference assumption. Remaining application modules are imported, or deliberately retained commented features.

## Commented-out features and blocks retained

These are retained owner-decision candidates, not dead code. Original comment text was compared against the final source; all 17 detected feature-comment groups are present unchanged. The table uses final source locations. Small commented style/property alternatives are listed as well.

| File:line | Feature / block |
| --- | --- |
| `src/common/constants.tsx:3` | StaticSafeAreaInsets import |
| `src/common/constants.tsx:26` | iOS SAFE_BOTTOM calculation |
| `src/common/sizes.tsx:30` | unscaled size return |
| `src/common/sizes.tsx:40` | Android 29/30 size calculation |
| `src/common/sizes.tsx:55` | alternate _getSize calculation |
| `src/component/SimilarItemsComponent.tsx:97` | legacy avatar selection |
| `src/container/AppContainer.tsx:44` | ForgotPasswordScreen import |
| `src/container/AppContainer.tsx:354` | disabled ForgotPasswordScreen stack route |
| `src/container/screens/Camera/CameraScreen.tsx:82` | microphone permission request |
| `src/container/screens/Maps/MapScreen.tsx:357` | BackgroundGeolocation startup/watch/focus handler |
| `src/container/screens/Maps/MapScreen.tsx:374` | nearby location/voice selection |
| `src/container/screens/Maps/MapScreen.tsx:394` | warning-location state update |
| `src/container/screens/Maps/MapScreen.tsx:399` | warning sound playback |
| `src/container/screens/Maps/MapScreen.tsx:413` | BackgroundGeolocation blur cleanup |
| `src/container/screens/Maps/MapScreen.tsx:417` | navigation-provided location/route fallback |
| `src/container/screens/Maps/MapScreen.tsx:587` | second-modal opening |
| `src/container/screens/Maps/MapScreen.tsx:839` | older GPS-follow camera focus rule |
| `src/common/constants.tsx:31` | StaticSafeAreaInsets padding object |
| `src/container/screens/Camera/CameraScreen.tsx:68` | camera deactivation on blur |
| `ReactotronConfig.js:12` | Reactotron saga plugin |
| `ReactotronConfig.js:26` | Reactotron log forwarding |
| `App.tsx:72` | theme placeholder color |
| `src/common/constants.tsx:31`, `src/common/constants.tsx:32`, `src/common/constants.tsx:33`, `src/common/constants.tsx:34` | Commented style alternatives (retained). |
| `src/component/BigItemLocation.tsx:66`, `src/component/BigItemLocation.tsx:67`, `src/component/BigItemLocation.tsx:80`, `src/component/BigItemLocation.tsx:81` | Commented style alternatives (retained). |
| `src/component/CameraResultModal.tsx:37` | Commented style alternatives (retained). |
| `src/component/HeaderBase.tsx:141` | Commented style alternatives (retained). |
| `src/component/InputBase.tsx:179` | Commented style alternatives (retained). |
| `src/component/LargeItemLocation.tsx:86` | Commented style alternatives (retained). |
| `src/component/RecommendationsWidget.tsx:180` | Commented style alternatives (retained). |
| `src/container/screens/Maps/Advise.tsx:91` | Commented style alternatives (retained). |
| `src/container/screens/Maps/MapScreen.tsx:1698` | Commented style alternatives (retained). |

Commented generator diagnostics and all ordinary explanatory comments also remain, except obsolete descriptions of removed executable diagnostic-only loops. No commented-out screen, feature implementation, JSX block or feature helper was deleted.

## Working tree

No commit, push, branch switch or staging was performed. Untracked canonical fonts/SVGs and this report are included below; ordinary unstaged `git diff --stat` does not count untracked additions. Relocations are explicitly listed in the evidence section.

```text
git status --short
M .eslintrc.js
 M .gitignore
 M App.tsx
 M __tests__/App.test.tsx
 M __tests__/authFlow.test.js
 M __tests__/brand.test.js
 M __tests__/camera.test.js
 M __tests__/guestMode.test.js
 M __tests__/mapScreen.test.js
 M __tests__/newFeed.test.js
 D android/app/src/main/res/drawable-hdpi/node_modules_reactnavigation_elements_src_assets_backicon.png
 D android/app/src/main/res/drawable-mdpi/node_modules_reactnativepaper_lib_module_assets_backchevron.png
 D android/app/src/main/res/drawable-mdpi/node_modules_reactnavigation_elements_src_assets_backicon.png
 D android/app/src/main/res/drawable-mdpi/node_modules_reactnavigation_elements_src_assets_backiconmask.png
 D android/app/src/main/res/drawable-mdpi/node_modules_rnmapbox_maps_src_assets_heading.png
 D android/app/src/main/res/drawable-mdpi/src_assets_images_banner.jpg
 D android/app/src/main/res/drawable-mdpi/src_assets_images_banner2.jpeg
 D android/app/src/main/res/drawable-mdpi/src_assets_images_caurong.jpg
 D android/app/src/main/res/drawable-mdpi/src_assets_images_causonghan.jpg
 D android/app/src/main/res/drawable-mdpi/src_assets_images_chibi.png
 D android/app/src/main/res/drawable-mdpi/src_assets_images_danang.jpg
 D android/app/src/main/res/drawable-mdpi/src_assets_images_eye_close.png
 D android/app/src/main/res/drawable-mdpi/src_assets_images_eye_open.png
 D android/app/src/main/res/drawable-mdpi/src_assets_images_frame.png
 D android/app/src/main/res/drawable-mdpi/src_assets_images_icon_camera.png
 D android/app/src/main/res/drawable-mdpi/src_assets_images_search.png
 D android/app/src/main/res/drawable-mdpi/src_assets_images_tab_add_friends.png
 D android/app/src/main/res/drawable-mdpi/src_assets_images_tab_add_friends_focus.png
 D android/app/src/main/res/drawable-mdpi/src_assets_images_vooc.jpg
 D android/app/src/main/res/drawable-xhdpi/node_modules_reactnavigation_elements_src_assets_backicon.png
 D android/app/src/main/res/drawable-xhdpi/node_modules_rnmapbox_maps_src_assets_heading.png
 D android/app/src/main/res/drawable-xhdpi/src_assets_images_tab_add_friends.png
 D android/app/src/main/res/drawable-xhdpi/src_assets_images_tab_add_friends_focus.png
 D android/app/src/main/res/drawable-xxhdpi/node_modules_reactnavigation_elements_src_assets_backicon.png
 D android/app/src/main/res/drawable-xxhdpi/node_modules_rnmapbox_maps_src_assets_heading.png
 D android/app/src/main/res/drawable-xxhdpi/src_assets_images_tab_add_friends.png
 D android/app/src/main/res/drawable-xxhdpi/src_assets_images_tab_add_friends_focus.png
 D android/app/src/main/res/drawable-xxxhdpi/node_modules_reactnavigation_elements_src_assets_backicon.png
 M genimg.js
 M genimgsvg.js
 D ios/assets/fonts/NotoSansJP-Black.ttf
 D ios/assets/fonts/NotoSansJP-Bold.ttf
 D ios/assets/fonts/NotoSansJP-Light.ttf
 D ios/assets/fonts/NotoSansJP-Medium.ttf
 D ios/assets/fonts/NotoSansJP-Regular.ttf
 D ios/assets/fonts/NotoSansJP-Thin.ttf
 M package-lock.json
 M package.json
 M src/assets/ImageSvg.tsx
 D src/assets/assets/ImageSvg.tsx
 D src/assets/assets/fonts/GoogleSans-Bold.ttf
 D src/assets/assets/fonts/GoogleSans-Medium.ttf
 D src/assets/assets/fonts/GoogleSans-Regular.ttf
 D src/assets/assets/svg/BackSvg.svg
 D src/assets/assets/svg/BookMarkSvg.svg
 D src/assets/assets/svg/CardSvg.svg
 D src/assets/assets/svg/CircleDot.svg
 D src/assets/assets/svg/CirclePause.svg
 D src/assets/assets/svg/CirclePlay.svg
 D src/assets/assets/svg/Clock.svg
 D src/assets/assets/svg/DeleteSvg.svg
 D src/assets/assets/svg/FilterSvg.svg
 D src/assets/assets/svg/FriendsSvg.svg
 D src/assets/assets/svg/HeartSvg.svg
 D src/assets/assets/svg/HelpSvg.svg
 D src/assets/assets/svg/HistorySvg.svg
 D src/assets/assets/svg/HomeSvg.svg
 D src/assets/assets/svg/LoginSvg.svg
 D src/assets/assets/svg/LogoutSvg.svg
 D src/assets/assets/svg/Next.svg
 D src/assets/assets/svg/OptionsSvg.svg
 D src/assets/assets/svg/Pause.svg
 D src/assets/assets/svg/Play.svg
 D src/assets/assets/svg/RegisterSvg.svg
 D src/assets/assets/svg/RotateRight.svg
 D src/assets/assets/svg/Star.svg
 D src/assets/assets/svg/StarActive.svg
 D src/assets/assets/svg/StarInActive.svg
 D src/assets/assets/svg/ThunderSvg.svg
 D src/assets/assets/svg/UserSvg.svg
 D src/assets/assets/svg/Volume.svg
 D src/assets/images/frame.png
 D src/assets/images/icon_camera.png
 D src/assets/images/search.png
 D src/assets/svg/Frame.svg
 D src/assets/svg/FriendsSvg.svg
 D src/assets/svg/SearchSvg.svg
 D src/assets/svg/TranslateSvg.svg
 D src/assets/svg/icon_camera.svg
 M src/common/TextBase.tsx
 M src/common/sizes.tsx
 M src/component/CachedImage.tsx
 M src/component/FloatingChatBubble.tsx
 M src/component/InputBase.tsx
 M src/component/LanguageDropdown.tsx
 M src/component/RecommendationsWidget.tsx
 M src/component/ReviewItem.tsx
 M src/component/SemanticSearchBarComponent.tsx
 M src/component/SimilarItemsComponent.tsx
 M src/container/AppContainer.tsx
 M src/container/screens/Camera/CameraScreen.tsx
 M src/container/screens/Camera/PreviewImage.tsx
 M src/container/screens/Festival/DetailFestival.tsx
 M src/container/screens/Festival/FestivalsScreen.tsx
 M src/container/screens/Festival/ViewAllFestivals.tsx
 M src/container/screens/Home/DetailLocation.tsx
 M src/container/screens/Home/HomeScreen.tsx
 M src/container/screens/Home/LocationImage.tsx
 M src/container/screens/Home/LocationVideo.tsx
 M src/container/screens/Home/ViewAllLocation.tsx
 M src/container/screens/Login/ForgotPasswordScreen.tsx
 M src/container/screens/Login/LoginScreen.tsx
 M src/container/screens/Login/SignUpScreen.tsx
 M src/container/screens/Maps/Advise.tsx
 M src/container/screens/Maps/MapScreen.tsx
 M src/container/screens/NavigationService.tsx
 M src/container/screens/NewFeed/NewFeedScreen.tsx
 M src/container/screens/Profile/About.tsx
 M src/container/screens/Profile/ChatbotScreen.tsx
 M src/container/screens/Profile/Donation.tsx
 M src/container/screens/Profile/FAQ.tsx
 M src/container/screens/Profile/Personal.tsx
 M src/container/screens/Profile/Policy.tsx
 M src/container/screens/Profile/ProfileScreen.tsx
 M src/container/screens/Profile/Settings.tsx
 M src/context/TranslationContext.tsx
 M src/i18n/locales/en/common.json
 M src/i18n/locales/vi/common.json
 M src/res/images.tsx
 M src/services/mapbox.api.ts
 M src/utils/apiUsageTracker.ts
 M src/utils/translationHelpers.ts
 D yarn.lock
?? docs/release/codex/REPORT-F.md
?? src/assets/fonts/
?? src/assets/svg/BackSvg.svg
?? src/assets/svg/CardSvg.svg
?? src/assets/svg/CircleDot.svg
?? src/assets/svg/CirclePlay.svg
?? src/assets/svg/Clock.svg
?? src/assets/svg/Next.svg
?? src/assets/svg/Play.svg
?? src/assets/svg/StarActive.svg
?? src/assets/svg/StarInActive.svg
?? src/assets/svg/ThunderSvg.svg
?? src/assets/svg/UserSvg.svg
```

```text
git diff --stat
.eslintrc.js                                       |    7 +
 .gitignore                                         |    7 +
 App.tsx                                            |    4 +-
 __tests__/App.test.tsx                             |    3 +-
 __tests__/authFlow.test.js                         |    1 -
 __tests__/brand.test.js                            |    2 +-
 __tests__/camera.test.js                           |   26 +-
 __tests__/guestMode.test.js                        |    1 -
 __tests__/mapScreen.test.js                        |    1 -
 __tests__/newFeed.test.js                          |    1 -
 ...eactnavigation_elements_src_assets_backicon.png |  Bin 134 -> 0 bytes
 ...ctnativepaper_lib_module_assets_backchevron.png |  Bin 489 -> 0 bytes
 ...eactnavigation_elements_src_assets_backicon.png |  Bin 100 -> 0 bytes
 ...navigation_elements_src_assets_backiconmask.png |  Bin 913 -> 0 bytes
 ...de_modules_rnmapbox_maps_src_assets_heading.png |  Bin 258 -> 0 bytes
 .../res/drawable-mdpi/src_assets_images_banner.jpg |  Bin 133655 -> 0 bytes
 .../drawable-mdpi/src_assets_images_banner2.jpeg   |  Bin 178299 -> 0 bytes
 .../drawable-mdpi/src_assets_images_caurong.jpg    |  Bin 168425 -> 0 bytes
 .../drawable-mdpi/src_assets_images_causonghan.jpg |  Bin 110329 -> 0 bytes
 .../res/drawable-mdpi/src_assets_images_chibi.png  |  Bin 38912 -> 0 bytes
 .../res/drawable-mdpi/src_assets_images_danang.jpg |  Bin 135325 -> 0 bytes
 .../drawable-mdpi/src_assets_images_eye_close.png  |  Bin 1072 -> 0 bytes
 .../drawable-mdpi/src_assets_images_eye_open.png   |  Bin 718 -> 0 bytes
 .../res/drawable-mdpi/src_assets_images_frame.png  |  Bin 90654 -> 0 bytes
 .../src_assets_images_icon_camera.png              |  Bin 653 -> 0 bytes
 .../res/drawable-mdpi/src_assets_images_search.png |  Bin 8781 -> 0 bytes
 .../src_assets_images_tab_add_friends.png          |  Bin 3636 -> 0 bytes
 .../src_assets_images_tab_add_friends_focus.png    |  Bin 3690 -> 0 bytes
 .../res/drawable-mdpi/src_assets_images_vooc.jpg   |  Bin 90646 -> 0 bytes
 ...eactnavigation_elements_src_assets_backicon.png |  Bin 134 -> 0 bytes
 ...de_modules_rnmapbox_maps_src_assets_heading.png |  Bin 405 -> 0 bytes
 .../src_assets_images_tab_add_friends.png          |  Bin 7269 -> 0 bytes
 .../src_assets_images_tab_add_friends_focus.png    |  Bin 6798 -> 0 bytes
 ...eactnavigation_elements_src_assets_backicon.png |  Bin 167 -> 0 bytes
 ...de_modules_rnmapbox_maps_src_assets_heading.png |  Bin 687 -> 0 bytes
 .../src_assets_images_tab_add_friends.png          |  Bin 10833 -> 0 bytes
 .../src_assets_images_tab_add_friends_focus.png    |  Bin 17872 -> 0 bytes
 ...eactnavigation_elements_src_assets_backicon.png |  Bin 207 -> 0 bytes
 genimg.js                                          |   10 +-
 genimgsvg.js                                       |   14 +-
 ios/assets/fonts/NotoSansJP-Black.ttf              |  Bin 5722688 -> 0 bytes
 ios/assets/fonts/NotoSansJP-Bold.ttf               |  Bin 5727828 -> 0 bytes
 ios/assets/fonts/NotoSansJP-Light.ttf              |  Bin 5736752 -> 0 bytes
 ios/assets/fonts/NotoSansJP-Medium.ttf             |  Bin 5729332 -> 0 bytes
 ios/assets/fonts/NotoSansJP-Regular.ttf            |  Bin 5732824 -> 0 bytes
 ios/assets/fonts/NotoSansJP-Thin.ttf               |  Bin 5735884 -> 0 bytes
 package-lock.json                                  |  644 --
 package.json                                       |    1 -
 src/assets/ImageSvg.tsx                            |   34 +-
 src/assets/assets/ImageSvg.tsx                     |   61 -
 src/assets/assets/fonts/GoogleSans-Bold.ttf        |  Bin 119180 -> 0 bytes
 src/assets/assets/fonts/GoogleSans-Medium.ttf      |  Bin 121168 -> 0 bytes
 src/assets/assets/fonts/GoogleSans-Regular.ttf     |  Bin 122672 -> 0 bytes
 src/assets/assets/svg/BackSvg.svg                  |    1 -
 src/assets/assets/svg/BookMarkSvg.svg              |    1 -
 src/assets/assets/svg/CardSvg.svg                  |    1 -
 src/assets/assets/svg/CircleDot.svg                |    1 -
 src/assets/assets/svg/CirclePause.svg              |    1 -
 src/assets/assets/svg/CirclePlay.svg               |    1 -
 src/assets/assets/svg/Clock.svg                    |    1 -
 src/assets/assets/svg/DeleteSvg.svg                |    1 -
 src/assets/assets/svg/FilterSvg.svg                |    1 -
 src/assets/assets/svg/FriendsSvg.svg               |    1 -
 src/assets/assets/svg/HeartSvg.svg                 |    1 -
 src/assets/assets/svg/HelpSvg.svg                  |    1 -
 src/assets/assets/svg/HistorySvg.svg               |    1 -
 src/assets/assets/svg/HomeSvg.svg                  |    1 -
 src/assets/assets/svg/LoginSvg.svg                 |    1 -
 src/assets/assets/svg/LogoutSvg.svg                |    1 -
 src/assets/assets/svg/Next.svg                     |    1 -
 src/assets/assets/svg/OptionsSvg.svg               |    1 -
 src/assets/assets/svg/Pause.svg                    |    1 -
 src/assets/assets/svg/Play.svg                     |    1 -
 src/assets/assets/svg/RegisterSvg.svg              |    1 -
 src/assets/assets/svg/RotateRight.svg              |    1 -
 src/assets/assets/svg/Star.svg                     |    1 -
 src/assets/assets/svg/StarActive.svg               |    1 -
 src/assets/assets/svg/StarInActive.svg             |    1 -
 src/assets/assets/svg/ThunderSvg.svg               |    1 -
 src/assets/assets/svg/UserSvg.svg                  |    1 -
 src/assets/assets/svg/Volume.svg                   |    1 -
 src/assets/images/frame.png                        |  Bin 45989 -> 0 bytes
 src/assets/images/icon_camera.png                  |  Bin 412 -> 0 bytes
 src/assets/images/search.png                       |  Bin 4266 -> 0 bytes
 src/assets/svg/Frame.svg                           |    1 -
 src/assets/svg/FriendsSvg.svg                      |    1 -
 src/assets/svg/SearchSvg.svg                       |    1 -
 src/assets/svg/TranslateSvg.svg                    |    1 -
 src/assets/svg/icon_camera.svg                     |    1 -
 src/common/TextBase.tsx                            |    4 +-
 src/common/sizes.tsx                               |    2 -
 src/component/CachedImage.tsx                      |    3 +-
 src/component/FloatingChatBubble.tsx               |    2 +-
 src/component/InputBase.tsx                        |    3 +-
 src/component/LanguageDropdown.tsx                 |    2 +-
 src/component/RecommendationsWidget.tsx            |    1 +
 src/component/ReviewItem.tsx                       |   12 +-
 src/component/SemanticSearchBarComponent.tsx       |   54 -
 src/component/SimilarItemsComponent.tsx            |    1 +
 src/container/AppContainer.tsx                     |    6 +-
 src/container/screens/Camera/CameraScreen.tsx      |   30 +-
 src/container/screens/Camera/PreviewImage.tsx      |    2 +-
 src/container/screens/Festival/DetailFestival.tsx  |   13 +-
 src/container/screens/Festival/FestivalsScreen.tsx |    8 +-
 .../screens/Festival/ViewAllFestivals.tsx          |    9 +-
 src/container/screens/Home/DetailLocation.tsx      |   15 +-
 src/container/screens/Home/HomeScreen.tsx          |   22 +-
 src/container/screens/Home/LocationImage.tsx       |    6 +-
 src/container/screens/Home/LocationVideo.tsx       |   10 +-
 src/container/screens/Home/ViewAllLocation.tsx     |    9 +-
 .../screens/Login/ForgotPasswordScreen.tsx         |   10 +-
 src/container/screens/Login/LoginScreen.tsx        |    4 +-
 src/container/screens/Login/SignUpScreen.tsx       |   16 +-
 src/container/screens/Maps/Advise.tsx              |    3 +-
 src/container/screens/Maps/MapScreen.tsx           |  113 +-
 src/container/screens/NavigationService.tsx        |    3 -
 src/container/screens/NewFeed/NewFeedScreen.tsx    |   11 +-
 src/container/screens/Profile/About.tsx            |    2 +-
 src/container/screens/Profile/ChatbotScreen.tsx    |   10 +-
 src/container/screens/Profile/Donation.tsx         |    2 +-
 src/container/screens/Profile/FAQ.tsx              |    2 +-
 src/container/screens/Profile/Personal.tsx         |    6 +-
 src/container/screens/Profile/Policy.tsx           |    2 +-
 src/container/screens/Profile/ProfileScreen.tsx    |    3 +-
 src/container/screens/Profile/Settings.tsx         |    6 +-
 src/context/TranslationContext.tsx                 |    2 -
 src/i18n/locales/en/common.json                    |    1 +
 src/i18n/locales/vi/common.json                    |    1 +
 src/res/images.tsx                                 |    3 -
 src/services/mapbox.api.ts                         |   10 -
 src/utils/apiUsageTracker.ts                       |    1 -
 src/utils/translationHelpers.ts                    |    4 +-
 yarn.lock                                          | 8165 --------------------
 133 files changed, 177 insertions(+), 9267 deletions(-)
```

Protected-file check: no existing docs/release file or MIGRATION_AUDIT.md / MIGRATION_TASKLIST.md appears in the changed-file list. index.js is unchanged. Local build logs, screenshots, bundles and audit scripts are ignored under android/.gradle.
