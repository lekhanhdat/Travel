# Codex Brief A — Android native: security hardening + launcher icon + app name

Repo: `D:\Project\Travel\Travel_FE\Travel` (React Native 0.74.2, branch `dev`). Brand kit (read-only source, do NOT run anything inside it): `C:\Users\lekha\Downloads\Danavi_Android_Icon_Kit`.

**File scope — touch ONLY these** (another agent is editing JS/TS files in parallel):
`android/app/build.gradle`, `android/gradle.properties`, `android/app/src/main/AndroidManifest.xml`, `android/app/src/debug/AndroidManifest.xml`, `android/app/src/main/res/**`, `android/app/src/debug/res/**`, `docs/release/codex/REPORT-A.md` (your report).
Do NOT touch: `package.json`, `src/**`, `App.tsx`, `index.js`, `babel.config.js`, `app.json`, `MainActivity.kt`, `MainApplication.kt`. Do NOT change `applicationId`, `namespace`, package name, `getMainComponentName`. Do NOT commit, push, or create git branches. Never write any password/secret into a tracked file, your report, or console output.

## A1 (Critical, SEC-C1) — Externalize release signing credentials
`android/app/build.gradle` `signingConfigs.release` has a hardcoded store/key password. Replace with values read from Gradle properties `MYAPP_RELEASE_STORE_FILE`, `MYAPP_RELEASE_STORE_PASSWORD`, `MYAPP_RELEASE_KEY_ALIAS`, `MYAPP_RELEASE_KEY_PASSWORD` (use `project.findProperty(...)`; these are supplied by the developer's `~/.gradle/gradle.properties` or CI env, never the repo). `android/gradle.properties` must contain at most commented placeholder documentation, no values. If the properties are missing, debug builds must still work and `assembleRelease`/`bundleRelease` must fail with a clear message (e.g. throw GradleException inside a `gradle.taskGraph.whenReady` check or only apply release signing when props exist and fail on release tasks).
Accept: `grep -rn "<OLD_PASSWORD>" android/` → no matches. `gradlew assembleDebug` OK.

## A2 (Critical, SEC-C2/M1) — Cleartext traffic
Main manifest: `android:usesCleartextTraffic="false"` and `android:networkSecurityConfig="@xml/network_security_config"`; create `res/xml/network_security_config.xml` with `cleartextTrafficPermitted="false"` base config (system CAs only, no user CAs).
Debug source set: keep Metro working — create `android/app/src/debug/res/xml/network_security_config.xml` allowing cleartext only for `localhost`, `10.0.2.2`, `127.0.0.1` (and keep `usesCleartextTraffic="true"` only in the debug manifest, or rely on the debug NSC; make sure manifest merge is valid, use `tools:replace` if needed).

## A3 (High, SEC-H2..H5) — Manifest cleanup (main AND debug manifests)
1. Delete all commented-out `<meta-data>` blocks containing API/license keys.
2. Remove `ACCESS_BACKGROUND_LOCATION` (only foreground location in `src/utils/preciseLocation.ts`, `MapScreen.tsx` — verify with grep that nothing requests background location).
3. `READ_EXTERNAL_STORAGE`/`WRITE_EXTERNAL_STORAGE`: add `android:maxSdkVersion="32"` (WRITE: `maxSdkVersion="28"` is standard; READ 32). Do not add READ_MEDIA_* unless code needs them (image picker uses Photo Picker on 13+).
4. Remove `USE_EXACT_ALARM` after grepping `src/` and `node_modules/react-native-*/android/src/main/AndroidManifest.xml` to confirm no direct need; record the evidence.
5. The debug manifest duplicates every permission of the main one — remove the duplicates there (main manifest already merges into debug).
Do not remove INTERNET, CAMERA, RECORD_AUDIO (vision-camera/TTS/voice may use it — check `src` for audio recording; if no usage, KEEP it but note in report), FINE/COARSE location, NETWORK_STATE.

## A4 (High, BRAND-01) — Launcher icons from kit
Copy from kit `android/app/src/main/res/` into project `android/app/src/main/res/`: all 5 `mipmap-<density>/` (ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png, ic_launcher_monochrome.png), `mipmap-anydpi-v26/*.xml`, `mipmap-anydpi-v33/*.xml`, `drawable/ic_launcher_background.xml`. Before overwriting, list existing files and check for name conflicts (e.g. an existing `ic_launcher_background` in `values/`). Use the bridge-only (no-text) set; do NOT use `alternatives/`. Old icons are tracked in git → git is the backup; mention in report. Verify the XMLs reference resources that exist. Check PNG sizes match README (legacy 48/72/96/144/192; foreground/monochrome 108/162/216/324/432).

## A5 (High, BRAND-02) — App name
`res/values/strings.xml`: `app_name` → `Danavi`. Manifest already uses `@string/app_name`.

## A6 (High, REL-01) — Version
`versionCode 1`, `versionName "1.0.0"`.

## Verification you must run
- `cd android && ./gradlew assembleDebug` (if sandbox blocks Gradle, say so explicitly — do not claim success).
- grep checks above.
Write `docs/release/codex/REPORT-A.md`: files changed, per-task status, command outputs (trimmed), anything not done and why.
