# Codex Brief F — Repository cleanup (run AFTER Batch E is accepted, on `release/rn-upgrade`)

Repo: `D:\Project\Travel\Travel_FE\Travel`. Do NOT commit/push/switch branch. Do NOT change applicationId/namespace/package name, API endpoints, Firebase/Mapbox config, deep links. Never print secrets (`android/local.properties`, `.env`).

Goal: remove files that are provably unused, fix dead config, reduce lint noise — without changing app behaviour or UI.

## Hard rules
- **Project convention: commented-out feature code is NOT dead code.** Do not delete commented-out features/screens/blocks; leave them as is and list them in the report (file:line, what feature) so the owner can decide.
- Every deletion needs evidence: `git grep` (and for assets: `src/res/images.tsx`, `ImageSvg.tsx`, `require(`, Android resource references) showing zero references. Put the evidence table in the report.
- If unsure → keep and list as "candidate".
- Do not touch `docs/release/**` except writing your report, nor `MIGRATION_AUDIT.md` / `MIGRATION_TASKLIST.md` (owner's history).
- Keep `android/app/debug.keystore` (RN template, debug only).

## F1 — Stale bundled resources in `android/app/src/main/res/drawable-*`
Files named `node_modules_*` and `src_assets_*` (≈30) are outputs of an old manual `react-native bundle --assets-dest android/app/src/main/res`. Gradle's RN plugin regenerates these into build intermediates for release. Verify (e.g. `git log --follow` on one, and that a clean `assembleVerification` APK still contains the `node_modules_*`/`src_assets_*` drawables after deletion via `aapt2 dump resources` or unzip listing) and delete them from `src/main/res`. Add a short `.gitignore` guard if appropriate so they don't come back.

## F2 — Duplicate asset trees
Two parallel trees exist: `src/assets/svg` + `src/assets/ImageSvg.tsx` and `src/assets/assets/svg` + `src/assets/assets/ImageSvg.tsx` + `src/assets/assets/fonts`. Determine which exports are actually imported. Consolidate into ONE tree (prefer `src/assets/svg` + `src/assets/ImageSvg.tsx`, `src/assets/fonts`), update imports, keep the `genimgsvg` script working against the kept path, delete the duplicate. Fonts: `react-native.config.js` points to `./src/assets/fonts/` which does not exist — fix so `npx react-native-asset`/linking points to the real fonts; the Android copies in `android/app/src/main/assets/fonts` must remain identical and used fonts must still render (check `fontFamily` usages).

## F3 — Unused images and fonts
- `images.frame`, `images.icon_camera`, `images.search` have no usages outside `src/res/images.tsx` (Claude's grep). Confirm, remove keys + files (regenerate `src/res/images.tsx` with `npm run genimg` or edit consistently).
- `src/assets/assets/svg/Star.svg` appeared unreferenced.
- `ios/assets/fonts/NotoSansJP-*.ttf`: check `fontFamily` usage and `ios/Travel/Info.plist` UIAppFonts / project.pbxproj; remove only if unused everywhere (update pbxproj/Info.plist consistently), otherwise list as candidate.
- Find any other image/svg not referenced anywhere.

## F4 — Root stray files and dependencies
- `genimg.js`, `genimgsvg.js`: used by npm scripts → keep (fix paths if F2 changes them).
- `ReactotronConfig.js`: dev-only, imported under `__DEV__` in `index.js`; keep unless its dependency is missing. Ensure it is NOT included in production bundle (check the release bundle for "Reactotron").
- Only one lockfile should be authoritative. `package-lock.json` is used (npm ci, CI `.github/workflows/ci.yml` — check). If CI/README use npm, delete `yarn.lock` and say so; if Yarn is used anywhere, keep both and report.
- Run `npx depcheck` (or equivalent) → remove dependencies that are truly unused (verify with grep + native autolinking; never remove a native module that autolinking/Gradle uses, nor babel/jest/metro plugins referenced in config files). Re-run `npm install` to update lock file. List removed packages with evidence.

## F5 — Lint / dead code (non-behavioural)
- `npx eslint . ` : fix unused imports/variables and obvious `no-shadow` warnings in `src/` where the fix is mechanical and behaviour-neutral. Do not reformat whole files.
- Remove leftover `console.log` debug statements that print user data/tokens/responses (production already strips console via babel, but keep source clean); keep `console.error`.
- Remove TODO-less dead helpers/functions with zero references (evidence required). Do NOT touch commented-out feature blocks (see Hard rules).
- Try to reduce `tsc --noEmit` errors (currently 45) where fixes are type-only and safe; never increase.

## Verification (paste outputs)
- `npx jest --runInBand` (all pass), `npx tsc --noEmit` count (≤ 45), `npx eslint .` summary (errors 0; warnings count before/after).
- `gradlew clean assembleDebug assembleVerification` with your Batch D sandbox flags; `aapt2 dump badging` (target 36), APK size before/after.
- `react-native bundle --platform android --dev false` succeeds; grep bundle for `Reactotron` → none.
- `git status --short` and `git diff --stat` summary.
- Write `docs/release/codex/REPORT-F.md` with: deleted files + evidence, kept candidates, commented-out feature list, dependency changes, verification outputs.

## F6 — Developer-only backend test in Camera (found by Claude on release-equivalent build)
`src/container/screens/Camera/CameraScreen.tsx` shows a floating "wifi" button (≈line 470-487) and a connection test (≈line 90-130) that shows toasts "✅ Kết nối thành công / Backend API đang hoạt động bình thường" and logs `API_BASE_URL`. It appears in the release-equivalent build. Gate the button and any automatic call to the test behind `__DEV__` (do not delete — project convention). Remove the `console.log` of the API URL/response bodies. Also hard-coded Vietnamese strings there ('❌ Lỗi kết nối') → i18n keys if trivial.

## F7 — Chat bubble overlaps Map action buttons
On the Map tab after selecting a marker, the bottom action row ("Chỉ đường" / "Xem") is partly covered by the FloatingChatBubble (bottom-right). Hide the bubble on the Map tab using the same mechanism as Profile/Camera in `App.tsx` (or, if MapScreen exposes selection state easily, only while a marker is selected). Add/adjust the App test.

## F8 — Debug-only observation (document, fix only if simple)
On the API 36 emulator the **debug** build (Metro) rendered Home but JS touchables (bottom tabs, "Xem tất cả") did not respond while native TextInput did; the release-equivalent build works. Reactotron connects in debug (`index.js` `__DEV__` import). Check whether Reactotron/devtools blocks the JS responder in debug on RN 0.81 (e.g. try without Reactotron). Report findings; do not ship changes that affect release.

Base commit for F: the commit after Batch E (check `git log -1`).
