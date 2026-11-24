# Migrating from Microsoft / AppCenter CodePush to Revopush

Use this when the project already has Microsoft's `react-native-code-push` (often
from App Center, which Microsoft has retired). Detection (`detection.md`) flags
this case: `react-native-code-push` is in `package.json`. The good news: the JS API
and native hooks are the same, so migration is mostly **renaming the package and
repointing the server** — your `codePush()` usage and options don't change.

## What changes vs. what stays

| Stays the same | Changes |
|---|---|
| `codePush()` HOC + all options | npm package: `react-native-code-push` → `@revopush/react-native-code-push` |
| The native module package name `com.microsoft.codepush.react` (imports unchanged) | Server URL → `https://api.revopush.org` (must be set explicitly) |
| `getJSBundleFile()` / `bundleURL()` hooks, `strings.xml`/`Info.plist` key names | Gradle apply path → `@revopush/react-native-code-push/android/codepush.gradle` |
| The JS import *symbol* (`import codePush from ...`) | Deployment keys → brand-new (App Center keys do not carry over) |

> **Do not rename `com.microsoft.codepush.react`.** Revopush keeps the original
> native package for drop-in compatibility — a migrating agent often "tidies"
> this to `com.revopush...` and breaks the build. Leave Kotlin/Java imports as-is.

## Steps

### 1. Swap the npm package

```bash
npm uninstall react-native-code-push
# install the 2.x Revopush SDK per versions.md (2.5.1 for RN 0.76–0.82, 2.6.x for 0.83+)
npm install --save @revopush/react-native-code-push@2.5.1
cd ios && pod install && cd ..   # bare RN
```

### 2. Update the JS import path (only the path, not the usage)

Every file that imports CodePush changes the **module string** only:

```diff
- import codePush from "react-native-code-push";
+ import codePush from "@revopush/react-native-code-push";
```

The `codePush(App)` wrap, options, and any manual `sync()`/`checkForUpdate()`
code are unchanged. (In a migration the wrap usually already exists — just fix
the import path.)

### 3. Repoint the server URL (the #1 thing migrators miss)

App Center builds usually had **no** server URL (they defaulted to Microsoft's
servers, now shut down). Add the Revopush server URL alongside the existing
deployment-key entry:

- iOS `Info.plist`: add `CodePushServerURL` = `https://api.revopush.org` (see `ios.md`).
- Android `strings.xml`: add `CodePushServerUrl` = `https://api.revopush.org` (see `android.md`).
- Expo: set `CodePushServerUrl` in the config-plugin entry (see `expo.md`).

Mind the casing asymmetry (`...URL` on iOS, `...Url` on Android/Expo).

### 4. Update the Android gradle apply path

In `build.gradle` / `build.gradle.kts`, the `apply ... codepush.gradle` line must
point at the new package path:

```diff
- apply from: "../../node_modules/react-native-code-push/android/codepush.gradle"
+ apply from: "../../node_modules/@revopush/react-native-code-push/android/codepush.gradle"
```
(Kotlin DSL: `apply(from = ".../@revopush/react-native-code-push/android/codepush.gradle")`.)

### 5. Get fresh deployment keys and replace them

App Center keys do **not** work against Revopush. Create a new app and
deployments at https://app.revopush.org (or via the CLI — see
`cli-and-releases.md`), then replace the old `CodePushDeploymentKey` values in
`Info.plist` / `strings.xml` / the Expo plugin with the user's new per-platform
keys, or with the `YOUR_IOS_DEPLOYMENT_KEY` / `YOUR_ANDROID_DEPLOYMENT_KEY`
placeholders until they have them (see "Where the key values come from" in
`cli-and-releases.md`).

### 6. Confirm the rest of the wiring

Go through `verification.md` to check nothing was missed (server URL, keys,
Podfile 15.5, gradle apply, bundle hooks, the wrap). Then verify with a release
build per the main workflow's Verify step.

> After migration you're on the 2.x line, so you also get **differential updates**
> automatically (smaller downloads) — no extra work. See `versions.md`.
