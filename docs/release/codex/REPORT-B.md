# Brief B — release logging, Danavi branding, Jest

Date: 2026-11-11. Repository: `D:\Project\Travel\Travel_FE\Travel`.
No commit or push performed. Android/iOS, `index.js`, and `App.tsx` were not edited by this task. Concurrent Android changes were left alone. The brand kit was read/copied only; nothing was executed inside it.

## Task status

| Task | Status | Result |
| --- | --- | --- |
| B1 / SEC-H1 | Complete | Installed `babel-plugin-transform-remove-console@^6.9.4` as a devDependency. Enabled only in `env.production`, excluding only `error`. Preserved dotenv and Paper plugins; Reanimated is last among configured plugins in both development and production. Removed the two Mapbox response logs. Release bundle contains **0** literal `console.log(` calls. |
| B2 / BRAND-02 | Complete | `displayName` is `Danavi`; registered component `name` remains `Travel`. |
| B3 / BRAND-03 | Complete; owner configuration pending | Added typed `BRAND` configuration, Danavi name/tagline/developer/copyright, version `1.0.0`, nullable release date and contact fields. Updated About/FAQ/Policy; contact sections and email prose are conditional. Play Store uses `com.travel`. About uses the full Danavi logo at 120 × 120 dp with `contain`. Removed old brand/domain references and the unsupported national-leadership description. |
| B4 / QA-01 | Complete | App render test passes unchanged. Added native/UI/SVG mocks and preserved real navigation exports alongside the existing hook mocks. Added a Danavi render/contact visibility/Play Store regression test. Adapted the existing environment allowlist test to the Babel config factory without changing its assertion. |

The requested sensitive-log grep was reviewed, including case-insensitive matches. Remaining matches containing the word `user` are fixed messages such as image-picker cancellation or refreshing data; they do not print user objects, passwords, or tokens. No additional sensitive payload logs were found by that review.

## Changed files

- `babel.config.js`: production-only console transform and environment-aware Reanimated ordering.
- `package.json`, `package-lock.json`: console-removal devDependency.
- `app.json`: display name only.
- `src/config/brand.ts`: centralized typed brand/contact/release metadata and MANUAL-01/02 owner comment.
- `src/container/screens/Profile/About.tsx`: branding, description, real logo, version, conditional release date/contact/social actions, Play Store ID, copyright.
- `src/container/screens/Profile/FAQ.tsx`: conditional support email sentence and contact section.
- `src/container/screens/Profile/Policy.tsx`: Danavi terms and conditional legal/security contact content.
- `src/assets/images/danavi_logo.png`: exact copy of `branding/danavi-full-logo-512.png` from the kit.
- `src/res/images.tsx`: one additive `danavi_logo` entry.
- `src/i18n/index.ts`: header comment branding only. These profile screens use direct copy, not locale keys, so locale files did not need changes.
- `src/services/mapbox.api.ts`: removed two response-data log calls.
- `jest.setup.js`: Gesture Handler setup, safe-area contexts/hooks, Animated helper, SoundPlayer, native device integrations, UI libraries and SVG asset mocks needed to load/render the app in Jest.
- `__tests__/brand.test.js`: new rendered branding and hidden-contact regression check.
- `__tests__/env.test.js`: instantiate the Babel configuration factory before inspecting the public dotenv allowlist.
- `docs/release/codex/REPORT-B.md`: this report.

## Validation and trimmed outputs

PowerShell execution policy blocks `npm.ps1`/`npx.ps1`, so commands used the equivalent `.cmd` launchers. Installation was **not blocked by the sandbox**.

### Dependency installation

```text
npm.cmd install --save-dev babel-plugin-transform-remove-console
added 2 packages, and audited 1326 packages in 11s
55 vulnerabilities (12 low, 13 moderate, 28 high, 2 critical)
```

No audit fixes or unrelated dependency upgrades were applied. npm also added the dependency to `yarn.lock`; that incidental addition was removed to preserve the requested file scope, leaving no final yarn lock diff.

### Android release bundle

```text
npx.cmd react-native bundle --platform android --dev false --entry-file index.js --bundle-output "$env:TEMP\danavi-check.bundle"
info Writing bundle output to: C:\Users\lekha\AppData\Local\Temp\danavi-check.bundle
info Done writing bundle output
warn Assets destination folder is not set, skipping...
bundle console.log( count: 0
```

Metro also reported the existing `rn-fetch-blob` configuration warning and Node color-environment warnings. A direct Babel transform probe retained only `console.error("x");` in production and retained log/debug/info/warn/error in development. Configured production plugin order: dotenv → Paper → remove-console → Reanimated; development: dotenv → Reanimated.

### Images and old-brand scan

```text
npm.cmd run genimg
git diff -- src/res/images.tsx
+    danavi_logo: require('../assets/images/danavi_logo.png'),
```

The generator reordered existing entries; those unrelated reorder/whitespace changes were removed. The final diff is additive only. Source and copied PNG SHA-256 hashes match: `E3E7C0B0E5CE0D09065A079927CAE00E50B8DC16FA37247680FB7039AAC53FB1`.

```text
rg -n 'Travel App|travelapp|com\.travelapp|ứng dụng Travel' src
(no matches)
```

Generic English travel terminology and internal names were preserved.

### Jest

```text
Before: npx.cmd jest --runInBand
Test Suites: 1 failed, 22 passed, 23 total
Tests:       1 skipped, 217 passed, 218 total
Failure: RNGestureHandlerModule could not be found

After: npx.cmd jest
exit=0
Test Suites: 24 passed, 24 total
Tests:       1 skipped, 219 passed, 220 total
Snapshots:   0 total
Time:        16.771 s
```

The final full-suite command used no `--forceExit`. Jest emitted a worker teardown/open-handle warning and automatically force-exited a worker. The baseline also reported that Jest did not exit after completion; this remains a follow-up, despite all assertions passing. The original App test was neither deleted nor weakened.

### TypeScript

```text
npx.cmd tsc --noEmit
Before: exit 2, 55 error TS diagnostics
After:  exit 2, 54 error TS diagnostics
```

No new diagnostic messages after normalizing shifted source line numbers. The removed placeholder logo style referenced nonexistent `AppStyle.txt_32_bold`, accounting for the reduction. Existing errors elsewhere remain; TypeScript is not clean.

### ESLint and whitespace

```text
npx.cmd eslint babel.config.js jest.setup.js src/config/brand.ts src/container/screens/Profile/About.tsx src/container/screens/Profile/FAQ.tsx src/container/screens/Profile/Policy.tsx src/i18n/index.ts src/res/images.tsx src/services/mapbox.api.ts __tests__/brand.test.js __tests__/env.test.js
exit=0
9 problems (0 errors, 9 warnings)
```

All nine warnings are existing trailing spaces in `src/i18n/index.ts`, whose only change is the requested header comment. `git diff --check` on task files passes.

## Remaining work

- **MANUAL-01/02:** Owner must supply real website/social URLs and support/legal/security/feedback emails before release. All are currently `null` and their UI is hidden. Release date is also `null` and hidden.
- Resolve the 54 pre-existing TypeScript errors separately.
- Investigate the existing Jest teardown/open-handle warning separately.
- No emulator/device visual or native runtime checks were performed; validation here covers JS bundling, rendered Jest tests, TypeScript comparison, and scoped ESLint.
