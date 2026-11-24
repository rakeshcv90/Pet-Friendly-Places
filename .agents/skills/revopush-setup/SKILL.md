---
name: revopush-setup
description: Integrate the Revopush over-the-air (OTA) update SDK
  (@revopush/react-native-code-push, the maintained successor to Microsoft
  CodePush) into a React Native or Expo app. Use whenever the user wants to add
  OTA / hot / live JS-bundle updates to a React Native or Expo project, or
  mentions Revopush, CodePush, code-push, react-native-code-push, over-the-air
  updates, hot updates, differential/diff updates, or deployment keys — even if
  they don't name Revopush explicitly, and even phrased as "set up", "integrate",
  "configure", or "add" updates. Handles iOS (AppDelegate in Swift or
  Objective-C, Podfile, Info.plist), Android (build.gradle Groovy or Kotlin DSL,
  MainApplication in Kotlin or Java, strings.xml), the JS codePush() wrapper and
  the advanced manual sync() API, old and New Architecture, and the Expo
  config-plugin / prebuild workflow. Not for publishing a release of an
  already-integrated app (that is the Revopush CLI alone) or for native apps
  without React Native.
license: MIT
metadata:
  version: "1.6.0"
  author: revopush
  last-updated: "2026-11-21"
---

# Revopush OTA Setup

Integrate Revopush OTA updates into a React Native or Expo app. Revopush is a
hosted (SaaS) drop-in successor to Microsoft CodePush; the JS API and most native
wiring are identical, only the package name and server URL differ. The current
SDK line (2.5.x/2.6.x) also ships **automatic differential ("diff") updates** —
the server sends only the changed bytes, no configuration required.

**`docs.revopush.org` is the source of truth, and Revopush is hosted-only.**
Always target the hosted servers `https://api.revopush.org` (API) and
`https://app.revopush.org` (dashboard). Revopush does not currently offer a
self-hosted option — never tell the user to point the SDK or CLI at their own
server. When a version or step looks stale, check the live docs.

> **Tip:** once the SDK is installed, it bundles its own authoritative setup docs
> at `node_modules/@revopush/react-native-code-push/docs/` (`setup-android.md`,
> `setup-ios.md`, `api-js.md`, …). For any edge case not covered here — e.g. an
> unusual template — read those; they match the installed version exactly.

## When to use

Use when a developer wants to **add or configure** Revopush/CodePush OTA updates
in a React Native or Expo project. Do **not** use when they only want to *publish
a release* of an already-integrated app — that's the `revopush` CLI by itself
(see `references/cli-and-releases.md`).

## Safety rules

These edits touch real native project files. Work transparently:

1. **Confirm the project root** — a `package.json` containing `react-native`
   must exist. If not, stop and ask where the app lives.
2. **Detect before editing.** Inspect the project per
   `references/detection.md` and **show the
   user** the detected React Native version, Expo-vs-bare result, the native file
   variants (Swift vs Objective-C, Kotlin DSL vs Groovy, Kotlin vs Java), and the
   **Android host pattern** (which decides the MainApplication wiring) before
   changing anything. The workflow branches on this.
3. **Edit deliberately.** Before each native file change, tell the user which
   file and what you're adding, and edit one file at a time so changes are easy
   to review and revert.
4. **Deployment keys come from the user, never from their machine.** Keys are
   created in the dashboard at https://app.revopush.org (the user signs up and
   logs in there). Never invent one, and don't go looking for one yourself: no
   `revopush deployment ls -k`, no reading CLI config/session files, the
   keychain, environment variables, or other projects. Those belong to the
   user, and a key found that way may be for the wrong app or deployment.
   The same goes for the user's Revopush login: apart from installing the CLI
   and `revopush -v`, `revopush` commands run on the session stored on the
   user's machine, so hand them to the user to run instead of running them.
   Ask the user for their iOS and Android keys. If they don't have them at
   hand, write the placeholders `YOUR_IOS_DEPLOYMENT_KEY` and
   `YOUR_ANDROID_DEPLOYMENT_KEY` and tell them which files to fill in — see
   "Where the key values come from" in `references/cli-and-releases.md`.

## Workflow

### 1. Detect

Follow `references/detection.md` from the project root and show the user the
summary: the RN version, Expo-vs-bare, and which iOS/Android source variants are
present. Branch on it:

| Detected | Do this |
|---|---|
| **Microsoft `react-native-code-push` present** | This is a **migration**. Read `references/migration.md` and follow it (then apply the version/native steps it points to). |
| **React Native < 0.76** | Revopush requires RN 0.76+. Tell the user to upgrade React Native, or use Microsoft CodePush (https://github.com/microsoft/react-native-code-push) for older versions. **Stop here.** |
| **Expo SDK < 52** | Revopush needs Expo SDK 52+. Tell the user to upgrade Expo, or stop. |
| **Expo SDK 52+** | Read `references/expo.md` and follow it. |
| **Bare React Native 0.76+** | Read `references/versions.md` to pick the SDK version, then `references/ios.md` and `references/android.md` for the native edits matching the variants detected. |
| **Not a React Native project / unknown** | Stop and ask the user where the React Native app is. |

If an app depends on `expo` **and** has `ios/`/`android/` folders, disambiguate
by whether those folders are **gitignored**:
- **Gitignored** → they're generated: **managed Expo (CNG)**. Use the Expo path;
  `prebuild --clean` is safe. Proceed without asking.
- **Tracked (committed)** → ambiguous. Ask the user: a **managed** app uses the
  Expo path (`prebuild --clean` regenerates native code); a **bare** app that just
  uses expo modules and hand-maintains `ios/`/`android/` uses the bare path, and
  you must **not** run `prebuild --clean` (it would overwrite their native code).

### 2. Choose the SDK version and install

Read `references/versions.md` to choose the right `@revopush/react-native-code-push`
version. **Always use the 2.x line** (2.5.x/2.6.x) for differential updates — never
the 1.x line for new setups. The current mapping: RN **0.76–0.82 → `@2.5.1`**, RN
**0.83+ → `@2.6.x`**, RN **< 0.76 → not supported** (use Microsoft CodePush). Then
install:

- **Bare RN:** `npm install --save @revopush/react-native-code-push@2.5.1`
  (0.76–0.82) or `@2.6.0`/latest 2.6.x (0.83+) — see versions.md.
- **Expo:** install the SDK **and** the config plugin, pinned as a matched pair by
  Expo SDK (SDK 52–54 → `@revopush/react-native-code-push@2.5.1` +
  `@revopush/expo-code-push-plugin@1.0.1`; SDK 55+ → `@2.6.0` + `@1.1.0`). Don't rely
  on `expo install` auto-resolve — see the table in `references/expo.md`.

Also suggest the user install or update the Revopush CLI to the latest version
(`npm install -g @revopush/code-push-cli` / `npm update -g @revopush/code-push-cli`)
— see `references/cli-and-releases.md`.

### 3. Apply the native integration

- **Bare RN:** follow `references/ios.md` and `references/android.md`. Pick the
  sections matching the detected variants — Swift vs Objective-C for iOS; Groovy
  `build.gradle` vs Kotlin DSL `build.gradle.kts` and Kotlin vs Java
  `MainApplication` for Android. For the MainApplication bundle wiring, use the
  **Android host pattern** from detection to choose between the `getJSBundleFile()`
  override (§3a) and the bridgeless `jsBundleFilePath` (§3b) — the decider is
  whether a `DefaultReactNativeHost` exists, not whether New Architecture is on.
  Apply edits with your own Read/Edit tools, one file at a time, per the safety
  rules.
- **Expo:** edit the config plugin per `references/expo.md`, then run
  `npx expo prebuild --clean`.

### 4. Wire up the JS layer

Wrap the root component with the `codePush()` higher-order component — the
simplest correct default.

**Find the right file first.** Wrap the file that has `export default <RootComponent>`,
not `index.js`. For bare RN that's usually `App.tsx`/`App.js` (the bare
`index.js` is `AppRegistry.registerComponent(name, () => App)` and has no default
export, so there is nothing to wrap there). For Expo Router it's the root
`app/_layout.tsx`. If unsure, check `package.json`'s `"main"` and trace the
component it registers.

Then make the edit yourself, following "Wrapping the root export" in
`references/js-api.md` (it covers each export shape and when not to touch the
file). If the export is already wrapped, change nothing.

For HOC options, **and** for advanced cases where the user wants to control the
update flow themselves (manual `codePush.sync()`, `checkForUpdate()`, custom
download/install UI, progress callbacks), read `references/js-api.md`.

### 5. Deployment keys & releasing

Wire in the iOS and Android deployment-key entries (the keys the user gave you,
or placeholders for them to fill in), and give the user the commands
to cut a release themselves, following `references/cli-and-releases.md`.

### 6. Verify

First, go through the static completeness checklist in
`references/verification.md` and resolve anything it flags. It covers the SDK
dep, native wiring, server URL + keys, Podfile 15.5, and the JS wrap. Fix any
FAIL before continuing; WARN (e.g. placeholder keys) is a reminder.

Then confirm end-to-end with a real release — this is where OTA "looks broken"
but isn't:
- Build a **release** build (OTA never applies in debug/dev): bare RN
  `npx react-native run-ios --mode Release --no-packager` (or the Android release
  variant); Expo a dev/native build (Revopush does **not** work in Expo Go).
- Make a trivial visible JS change, then have the **user** cut a release to the
  deployment whose key is in the build, from their own terminal:
  `revopush release-react <app> <ios|android> -d Staging`
  (see `references/cli-and-releases.md` — the CLI uses the user's own login, so
  it is theirs to run).
- **Relaunch the app twice.** With the default `installMode: ON_NEXT_RESTART`, an
  update downloads on one launch and only *applies* on the next — a single
  relaunch shows nothing and looks like a failure. Tell the user this explicitly.

Read each reference only when its branch applies, to keep this workflow lean.
