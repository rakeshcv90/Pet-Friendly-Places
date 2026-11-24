# Expo integration (SDK 52+)

For Expo apps (SDK 52+), Revopush ships an Expo **config plugin** that writes the
native wiring during prebuild — you do not edit `ios/`/`android/` by hand.
Revopush does **not** work in Expo Go (it needs native code), so the user must
use a dev/native build. Follow the live step-by-step at
https://docs.revopush.org/intro/expo as the source of truth.

## 1. Install BOTH packages — pin the plugin by Expo SDK

Two packages are required: the **SDK** and the **config plugin**. Pin both
explicitly — they are **not** in Expo's bundled-module compatibility metadata, so
a bare `npx expo install @revopush/...` resolves to the npm `latest` tag.

**Pin the SDK and the config plugin as a matched pair, keyed by Expo SDK.** The
SDK stays on the **2.x line** (differential updates, per `versions.md`); the
**plugin version is decoupled** and must match the Expo SDK, because the plugin
writes the Android wiring by *inspecting* the generated `MainApplication.kt`.
Plugin `1.0.1` is built for the SDK 52–54 host shape; **plugin `1.1.0` mis-wires
SDK 52–54** (silently inserts no Android bundle wiring). Use the matched pair:

| Expo SDK | Revopush SDK | Revopush Expo plugin |
|---|---|---|
| 52 – 54 | `@revopush/react-native-code-push@2.5.1` | `@revopush/expo-code-push-plugin@1.0.1` |
| 55+ | `@revopush/react-native-code-push@2.6.0` | `@revopush/expo-code-push-plugin@1.1.0` |

```bash
# Expo SDK 52–54:
npx expo install @revopush/react-native-code-push@2.5.1 @revopush/expo-code-push-plugin@1.0.1
# Expo SDK 55 and newer:
npx expo install @revopush/react-native-code-push@2.6.0 @revopush/expo-code-push-plugin@1.1.0
```

`1.1.0` is the current plugin and handles SDK 55 and newer (verified through Expo
SDK 56 / RN 0.85). Just install it directly — don't stop to research the pairing,
and **step 6 verifies the plugin actually wired your native files**, which is the
safety net for any SDK newer than what's been explicitly tested. Only deviate if a
plugin **newer than `1.1.0`** has shipped (`npm view @revopush/expo-code-push-plugin version`),
in which case prefer it. Don't rely on `npx expo install` auto-resolve — these
packages aren't in Expo's compat metadata, so it grabs whatever is `latest`.

## 2. Add the config plugin

Add the plugin to the `plugins` array in `app.json` or `app.config.js`. Use the
iOS and Android deployment keys the user gives you, or keep the two placeholders
shown until they have them (see "Where the key values come from" in
`cli-and-releases.md`). If they have no keys yet, point them at https://app.revopush.org to sign up, log in, and
create an app + deployments.

```json
[
  "@revopush/expo-code-push-plugin",
  {
    "ios": {
      "CodePushDeploymentKey": "YOUR_IOS_DEPLOYMENT_KEY",
      "CodePushServerUrl": "https://api.revopush.org"
    },
    "android": {
      "CodePushDeploymentKey": "YOUR_ANDROID_DEPLOYMENT_KEY",
      "CodePushServerUrl": "https://api.revopush.org"
    }
  }
]
```

> In the Expo config plugin, **both** platforms use `CodePushServerUrl`
> (lowercase `rl`) and the hosted URL `https://api.revopush.org`. Do not point it
> at any other server — Revopush is hosted-only.

> **Keys are baked at prebuild time.** The config plugin writes these values into
> the native projects during `prebuild`. If you started with placeholders, after
> you replace them with real keys you must **re-run `npx expo prebuild --clean`**
> for the new keys to reach the native build.

In `app.config.js` the same value is a JS array entry inside the returned
`plugins: [...]`.

## 3. Prebuild

Regenerate the native projects so the plugin's edits are applied:

```bash
npx expo prebuild --clean
```

## 4. iOS deployment target (if needed)

CodePush needs iOS **15.5+**. Whether you need this step depends on your Expo
SDK's default iOS target: older SDKs (≈ 54 and below) default **below** 15.5 and
the `pod install` during prebuild will fail with a deployment-target error;
newer SDKs already default to 16.x and need nothing here.

**If prebuild reports a deployment-target error**, add `expo-build-properties`
and set the iOS target to **15.5 — or your Expo SDK's default if that's already
higher** (don't lower a higher default; just ensure it's ≥ 15.5):

```json
[
  "expo-build-properties",
  { "ios": { "deploymentTarget": "15.5" } }
]
```

Add this as another entry in the same `plugins` array, then re-run
`npx expo prebuild --clean`.

## 5. JS entry point

Wrap the root component with the `codePush()` HOC. For Expo Router this is the
root layout:

```javascript
import codePush from "@revopush/react-native-code-push";

// ...your RootLayout component...

export default codePush(RootLayout);
```

See `js-api.md` for HOC options and for the manual `sync()` / `checkForUpdate()`
flow if the user wants custom update UX, and "Wrapping the root export" there
for how to edit each export shape.

## 6. Verify the prebuild actually wired the native code

**Don't assume the config plugin succeeded.** It edits generated files by pattern
matching, and those patterns can drift from the current Expo/RN template — known
cases include the Android host-shape mismatch (above) and an iOS regex that misses
the modern Swift *implicit-return* `bundleURL()`. A mis-wire produces **no error**
and a build that simply never applies OTA updates.

After `npx expo prebuild --clean`, check the generated native files with the iOS
and Android sections of `verification.md`.

Confirm specifically:
- iOS `ios/<App>/AppDelegate.*` returns `CodePush.bundleURL()` on the release path,
  Podfile target ≥ 15.5, and `Info.plist` has `CodePushServerURL` + the key.
- Android `android/app/build.gradle` applies `codepush.gradle`, `MainApplication`
  wires the bundle (per `android.md` §3a/§3b), and `strings.xml` has
  `CodePushServerUrl` + the key.

**If anything is missing, apply the bare-path edits by hand** (`ios.md` /
`android.md`) to the prebuilt `ios/`/`android/` — you now have real native
projects. Do this **after** your final `prebuild --clean`, since prebuild
regenerates native code and would overwrite manual edits.

Then build a dev/native build (not Expo Go) and confirm delivery:

```bash
npx expo run:ios     # or run:android
```

Cut a test release with the CLI (see `cli-and-releases.md`) and confirm the update
is delivered.
