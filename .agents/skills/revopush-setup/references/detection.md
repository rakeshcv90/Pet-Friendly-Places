# Detecting the project

Read-only inspection that decides which integration path applies. Do it with
your own file-reading and search tools, change nothing, and show the user the
summary at the end before editing anything.

## 1. Read `package.json`

Look in `dependencies` and `devDependencies` for:

| Dependency | Meaning |
|---|---|
| `react-native` | Its version (ignore `^`/`~`, compare MAJOR.MINOR) decides support: **0.76+** required. |
| `expo` | Its version is the Expo SDK: **52+** required. Present → Expo path candidate. |
| `@revopush/react-native-code-push` | Already present → integration may be partly done; check what's missing with `verification.md`. |
| `react-native-code-push` | Microsoft's package → this is a **migration** (`migration.md`). |

No `package.json`, or neither `react-native` nor `expo` in it → not a React
Native project; stop and ask the user where the app lives.

## 2. Look at the native folders

- Do `ios/` and `android/` exist?
- **Expo only — are they gitignored?** Check `.gitignore` for `ios`/`android`
  entries (or `git check-ignore ios android`). Ignored → generated, i.e. managed
  Expo (CNG). Tracked → ambiguous; ask the user (see the workflow in `SKILL.md`).

## 3. Identify the native variants

These pick the section of `ios.md` / `android.md` to apply:

| What | Where to look | Variants |
|---|---|---|
| iOS AppDelegate | `ios/<App>/AppDelegate.*` | `AppDelegate.swift` → Swift; `AppDelegate.mm` / `.m` → Objective-C |
| Android build file | `android/app/` | `build.gradle.kts` → Kotlin DSL; `build.gradle` → Groovy |
| Android app class | `android/app/src/main/java/**/MainApplication.*` (skip `build/`) | `.kt` → Kotlin; `.java` → Java |
| New Architecture (informational) | `android/gradle.properties`, `app.json` | `newArchEnabled=true` / `"newArchEnabled": true` |

## 4. Android host pattern

Open `MainApplication` and check, in this order:

1. **Mentions `DefaultReactNativeHost`** → override `getJSBundleFile()`
   (`android.md` §3a). This is correct even on New Architecture when the
   `reactHost` getter is the 2-arg `getDefaultReactHost(context, reactNativeHost)`
   that delegates to it (RN 0.76–0.82 templates).
2. **Otherwise mentions `getDefaultReactHost`** (bridgeless
   `getDefaultReactHost(packageList = …)`, RN 0.83+) → pass `jsBundleFilePath`
   (`android.md` §3b).

The decider is whether a `DefaultReactNativeHost` exists, **not** whether New
Architecture is on.

## 5. Decide and report

| Finding | Path |
|---|---|
| `expo` present, SDK 52+ | Expo config-plugin path (`expo.md`) |
| `expo` present, SDK below 52 | Unsupported — upgrade Expo |
| No `expo`, React Native 0.76+ | Bare path (`versions.md`, `ios.md`, `android.md`) |
| No `expo`, React Native below 0.76 | Unsupported — upgrade RN or use Microsoft CodePush |

Show the user: the React Native and Expo versions, Expo-vs-bare, which native
folders exist, the iOS and Android variants, the Android host pattern, and the
path you will take.
