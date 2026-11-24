# Verifying the integration

A static completeness check: read the project's own files (skip `Pods/`,
`build/`, `node_modules/`, `DerivedData/` — they hold many same-named files) and
confirm each item. It doesn't run a build. Report every item to the user as
PASS, WARN or FAIL; fix each FAIL before moving on.

For the deployment-key items, check that the entry **exists** and whether it
still holds a placeholder. Don't repeat a real key back in chat.

## All projects

| Check | Result if not met |
|---|---|
| `@revopush/react-native-code-push` is in `package.json` | FAIL (Expo before install: WARN — install it with the pinned version from `expo.md`) |
| That version is on the 2.x line | WARN if 1.x (`versions.md`) |
| Microsoft `react-native-code-push` is gone from `package.json` | WARN — finish the migration (`migration.md`) |
| JS calls the SDK: a `codePush(...)` wrap on the root component, or `codePush.sync()` / `checkForUpdate()` | FAIL — installed but never invoked |
| No `YOUR_IOS_DEPLOYMENT_KEY` / `YOUR_ANDROID_DEPLOYMENT_KEY` placeholder left in `ios/`, `android/`, `app.json`, `app.config.*` | WARN — the user must replace it before a release can reach the build |

## Expo (config plugin)

In `app.json` / `app.config.js` / `app.config.ts`:

| Check | Result if not met |
|---|---|
| `@revopush/expo-code-push-plugin` is in `plugins` | FAIL |
| `CodePushServerUrl` is set for both platforms | FAIL |
| `CodePushDeploymentKey` entry is present for both platforms | FAIL |
| `ios/` / `android/` exist | WARN — run `npx expo prebuild --clean`, then do the iOS and Android checks below on the generated files (the plugin can mis-wire silently; see `expo.md` step 6) |

## iOS (bare, or Expo after prebuild)

| Check | Result if not met |
|---|---|
| `ios/<App>/AppDelegate.*` references `CodePush` (release bundle URL returns `CodePush.bundleURL()`) | FAIL |
| The app's `Info.plist` has `CodePushServerURL` (uppercase `URL`) | FAIL |
| The app's `Info.plist` has a `CodePushDeploymentKey` entry | FAIL |
| `Podfile` has `platform :ios` at **15.5** or higher | FAIL if lower; WARN if it's set through a variable (e.g. `min_ios_version_supported`) or missing — confirm it resolves to 15.5+, or pin it per `ios.md` |

## Android (bare, or Expo after prebuild)

| Check | Result if not met |
|---|---|
| `android/app/build.gradle(.kts)` applies `@revopush/react-native-code-push/android/codepush.gradle` | FAIL; WARN if it still applies the old `react-native-code-push/...` path (`migration.md`) |
| `MainApplication` wires the bundle: a `getJSBundleFile()` override or `jsBundleFilePath` (`android.md` §3) | FAIL |
| `strings.xml` has `CodePushServerUrl` (lowercase `Url`) | FAIL |
| `strings.xml` has a `CodePushDeploymentKey` entry | FAIL |
