# Report A — Android native hardening and Danavi branding

Date: 2026-11-11. Scope: authorized Android native files and this report only. No commits, pushes, branch changes, app identifier changes, or JS/TS edits were performed. Concurrent changes outside this scope were left untouched. The brand kit was read and copied only; nothing was executed inside it.

## Task status

| Task | Implementation and evidence |
| --- | --- |
| A1 / SEC-C1 | Release signing reads the four MYAPP_RELEASE_* properties through project.findProperty. Empty/missing values leave release signing unconfigured; a task-graph guard throws a GradleException naming missing property names when an app release task is scheduled. Debug signing remains independent. Repository signing properties are documentation comments only. CI should use ORG_GRADLE_PROJECT_MYAPP_RELEASE_* environment variables; local developers should use ~/.gradle/gradle.properties. Runtime verification is recorded below. |
| A2 / SEC-C2/M1 | Main manifest disables cleartext and references @xml/network_security_config. Main and debug base configurations deny cleartext and trust system CAs only. Debug resource overlay allows cleartext only for localhost, 10.0.2.2, and 127.0.0.1, without subdomains. Debug manifest overrides usesCleartextTraffic with tools:replace. XML parsing and configuration assertions pass; build/merge verification is recorded below. |
| A3 / SEC-H2..H5 | Removed commented key/license metadata, background-location permission, exact-alarm permission, and all duplicate debug permissions. READ_EXTERNAL_STORAGE is capped at API 32, WRITE_EXTERNAL_STORAGE at API 28. Required INTERNET, CAMERA, RECORD_AUDIO, FINE/COARSE location and NETWORK_STATE remain. No READ_MEDIA permissions were added. |
| A4 / BRAND-01 | Copied all 25 bridge-only launcher resources from the kit's android/app/src/main/res: 20 PNGs, four adaptive XMLs, and one drawable XML. No alternatives were used. Preflight listed existing resources: only 10 legacy launcher PNGs collided; all were already tracked in git, which is their backup. No ic_launcher_background name existed in values or elsewhere. All 25 copied files match source hashes; adaptive references resolve. |
| A5 / BRAND-02 | app_name is Danavi. Manifest labels still reference @string/app_name. |
| A6 / REL-01 | versionCode remains 1; versionName is now 1.0.0. applicationId and namespace remain com.travel. |

## Changed files

- android/app/build.gradle
- android/gradle.properties
- android/app/src/main/AndroidManifest.xml
- android/app/src/debug/AndroidManifest.xml
- android/app/src/main/res/values/strings.xml
- android/app/src/main/res/xml/network_security_config.xml (new)
- android/app/src/debug/res/xml/network_security_config.xml (new)
- android/app/src/main/res/drawable/ic_launcher_background.xml (new)
- android/app/src/main/res/mipmap-anydpi-v26/{ic_launcher,ic_launcher_round}.xml (new)
- android/app/src/main/res/mipmap-anydpi-v33/{ic_launcher,ic_launcher_round}.xml (new)
- android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/{ic_launcher,ic_launcher_round}.png (replaced)
- android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/{ic_launcher_foreground,ic_launcher_monochrome}.png (new)
- docs/release/codex/REPORT-A.md

## Validation evidence (trimmed)

PowerShell/rg equivalents were used for grep checks. Secret values and removed key metadata are intentionally omitted from this report.

- Old signing-password literal: recursive `rg -l --hidden --no-ignore` check across android returned **0 matching files**.
- `rg -n -i 'ACCESS_BACKGROUND_LOCATION|requestBackground|background.?location|USE_EXACT_ALARM|SCHEDULE_EXACT_ALARM|AlarmManager|setExact' src`: no matches.
- Expanded `backgroundgeolocation` search found only commented-out BackgroundGeolocation code in src/container/screens/Maps/MapScreen.tsx:376-432. Active location permission request at line 196 is ACCESS_FINE_LOCATION. src/utils/preciseLocation.ts uses watchPosition and clears the watch.
- Searched all 11 installed node_modules/react-native-*/android/src/main/AndroidManifest.xml files for USE_EXACT_ALARM and SCHEDULE_EXACT_ALARM: **no matches**. Dependencies checked: gesture-handler, image-picker, reanimated, safe-area-context, screens, sound-player, svg, tts, vector-icons, vision-camera, webview.
- Audio-recording search in src found only CameraScreen.tsx:82-83 comments stating photos-only behavior and a commented requestMicrophonePermission. No active audio recording usage was found. RECORD_AUDIO is retained as instructed.
- Main/debug manifest search for removed permissions and metadata: **no matches**.
- Actual Gradle debug manifest merging and resource processing completed successfully. Merged debug cleartext=true and NSC=@xml/network_security_config; merged background-location/exact-alarm permissions absent; merged READ_EXTERNAL_STORAGE maxSdkVersion=32 and WRITE_EXTERNAL_STORAGE maxSdkVersion=28. Packaged debug NSC retains the denied base and exactly the three allowed hosts.
- XML parsing: both manifests, both network configurations, strings, background drawable, and four adaptive icons **PASS**.
- Assertions for main cleartext=false, NSC reference, zero debug permission declarations, both base cleartext=false, system-only trust, and the exact three debug hosts: **PASS**.
- Source/destination hashes: all **25 copied resources PASS**. Four adaptive XML resource reference checks **PASS**.

PNG header dimensions (all 20 PNGs passed):

| Density | Legacy / round | Foreground / monochrome |
| --- | --- | --- |
| mdpi | 48 x 48 | 108 x 108 |
| hdpi | 72 x 72 | 162 x 162 |
| xhdpi | 96 x 96 | 216 x 216 |
| xxhdpi | 144 x 144 | 324 x 324 |
| xxxhdpi | 192 x 192 | 432 x 432 |

Scoped `git diff --check`: exit 0, no whitespace errors; only working-copy LF/CRLF normalization warnings. Git read-only checks used per-command safe.directory because the sandbox user differs from the repository owner; global Git configuration was not changed.

## Gradle verification

1. Required debug build: `cd android; .\gradlew assembleDebug` (Windows wrapper equivalent of `./gradlew assembleDebug`). **PASS**:

```text
> Task :app:processDebugMainManifest
> Task :app:processDebugManifest
> Task :app:processDebugResources
> Task :app:validateSigningDebug UP-TO-DATE
> Task :app:packageDebug
> Task :app:assembleDebug
BUILD SUCCESSFUL in 13m 37s
530 actionable tasks: 146 executed, 384 up-to-date
```

APK: android/app/build/outputs/apk/debug/app-debug.apk. Gradle ran successfully in the sandbox. Non-blocking output included SDK XML / compileSdk tooling compatibility warnings, Gradle deprecations, a Kotlin daemon fallback, and a D8 warning from play-services-location. No unrelated build configuration was changed.
2. Missing-credential release check: `.\gradlew assembleRelease --offline --console=plain -PMYAPP_RELEASE_STORE_FILE= -PMYAPP_RELEASE_STORE_PASSWORD= -PMYAPP_RELEASE_KEY_ALIAS= -PMYAPP_RELEASE_KEY_PASSWORD=`. Empty command-line properties deliberately override any local signing configuration without reading or printing credentials. **BUILD FAILED in 1m 9s** before task-graph readiness because existing react-native-tts buildscript dependencies are absent from the offline cache:

```text
A problem occurred configuring project ':react-native-tts'.
Could not resolve all dependencies for configuration ':react-native-tts:classpath'.
No cached version of com.google.guava:guava:17.0 available for offline mode.
No cached version of net.sf.kxml:kxml2:2.3.0 available for offline mode.
[additional uncached legacy dependencies omitted]
```

3. Retried the same missing-credential release command after the online debug build populated dependency caches. **PASS: expected failure from the signing guard** (`BUILD FAILED in 1m 19s`):

```text
Build file 'android/app/build.gradle' line: 98
Missing release signing properties: MYAPP_RELEASE_STORE_FILE,
MYAPP_RELEASE_STORE_PASSWORD, MYAPP_RELEASE_KEY_ALIAS,
MYAPP_RELEASE_KEY_PASSWORD. Set them in ~/.gradle/gradle.properties
or CI ORG_GRADLE_PROJECT_<property> environment variables.
```

No release packaging was executed. bundleRelease uses the same release-task graph guard and was not separately run. A build with real release credentials was not attempted.

## Remaining operational checks

Install the resulting build on a device/emulator to confirm Metro connectivity and launcher appearance. Release signing requires developer/CI credentials outside the repository. Production cleartext endpoints will be blocked as requested. Previously tracked signing credentials and removed API/license keys should be rotated by their owners; this change does not rewrite Git history.