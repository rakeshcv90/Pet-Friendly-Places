# Android native integration (bare React Native)

Exact Android edits for a bare React Native project. Android projects come in two
build-script flavors and two language flavors — **detect which the project uses
and apply the matching section**:

- Build script: **Groovy `android/app/build.gradle`** *or* **Kotlin DSL
  `android/app/build.gradle.kts`** (newer RN projects increasingly use `.kts`,
  and the `apply` syntax differs).
- App class: **`MainApplication.kt`** (Kotlin) *or* **`MainApplication.java`**.

`detection.md` explains how to tell which variants are present. Apply edits one
file at a time and show the user each change.

## Table of contents
- [1. build.gradle — Groovy](#1-buildgradle--groovy)
- [2. build.gradle.kts — Kotlin DSL](#2-buildgradlekts--kotlin-dsl)
- [3. MainApplication — Kotlin](#3-mainapplication--kotlin)
- [4. MainApplication — Java](#4-mainapplication--java)
- [5. strings.xml (server URL + deployment key)](#5-stringsxml-server-url--deployment-key)

## 1. build.gradle — Groovy

Apply the CodePush gradle script right after the React Native gradle plugin is
applied. In `android/app/build.gradle`:

```gradle
apply plugin: "com.facebook.react"
apply from: "../../node_modules/@revopush/react-native-code-push/android/codepush.gradle"
```

## 2. build.gradle.kts — Kotlin DSL

Kotlin DSL uses a different syntax. The React plugin is usually applied in a
`plugins { }` block (`id("com.facebook.react")`); add the CodePush script with
the `apply(from = ...)` function call (not `apply from:`). Place it after the
plugins block / React plugin application, near the top of the file:

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.facebook.react")
}

apply(from = "../../node_modules/@revopush/react-native-code-push/android/codepush.gradle")
```

> `codepush.gradle` is a Groovy script; `apply(from = "...")` applies it fine
> from a Kotlin DSL build file. The key differences from Groovy are the
> parentheses and the `=` (`apply(from = "...")` vs `apply from: "..."`).

## 3. MainApplication — Kotlin

Goal: in release builds the JS bundle path must come from CodePush. **Which
approach depends on the host shape in `MainApplication.kt` — and the deciding
factor is whether a `DefaultReactNativeHost` exists, NOT whether New Architecture
is on.** Open the file and check:

- **It has a `DefaultReactNativeHost`** (a `reactNativeHost` property, often
  `object : DefaultReactNativeHost(this) { ... }`) → **override `getJSBundleFile()`
  (3a).** This is the case for classic templates **and** for RN 0.76–0.82 New
  Architecture: those also expose `reactHost` via the **2-arg** form
  `getDefaultReactHost(applicationContext, reactNativeHost)`, which delegates to
  the `DefaultReactNativeHost` and respects the `getJSBundleFile()` override.
- **It has NO `DefaultReactNativeHost`** — the host is built purely via
  `getDefaultReactHost(context, packageList = …)` (RN 0.83+ bridgeless) → **pass
  `jsBundleFilePath` (3b).** Here there's no `getJSBundleFile()` to override.

> Don't decide from `newArchEnabled` or from "the file mentions
> `getDefaultReactHost`" — RN 0.76–0.82 New-Arch files contain **both** a
> `DefaultReactNativeHost` and a `getDefaultReactHost(...)` call, and they want 3a.
> When in doubt, the SDK's own `node_modules/@revopush/react-native-code-push/docs/setup-android.md`
> matches the installed version exactly.

In both cases add the import:

```kotlin
import com.microsoft.codepush.react.CodePush
```

### 3a. `DefaultReactNativeHost` present — override `getJSBundleFile()`

(Classic templates, and RN 0.76–0.82 New Architecture.) Inside the
`DefaultReactNativeHost` object returned by `reactNativeHost` /
`getReactNativeHost()`, add:

```kotlin
override fun getJSBundleFile(): String =
    CodePush.getJSBundleFile()
```

### 3b. No `DefaultReactNativeHost` (RN 0.83+ bridgeless) — pass `jsBundleFilePath`

(Only when the host is built purely via `getDefaultReactHost(context, packageList = …)`
and there is no `DefaultReactNativeHost`.) There's no method to override; instead
pass the CodePush bundle path into the host. Edit the `reactHost`:

```kotlin
override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
        context = applicationContext,
        packageList =
            PackageList(this).packages.apply {
                // add(MyReactNativePackage()) for any non-autolinked packages
            },
        // CodePush determines the JS bundle location on each app start.
        jsBundleFilePath = CodePush.getJSBundleFile(),
    )
}
```

> Build/pass `packageList` **before** `jsBundleFilePath` (as above —
> arguments evaluate left to right). `CodePush.getJSBundleFile()` reads the
> CodePush native singleton, which is created when the package list is
> constructed; calling it before the package list exists throws. In release it
> resolves to the OTA bundle (or `assets://index.android.bundle` when no update
> is installed); in debug, Metro/dev support is used and this path is ignored.

## 4. MainApplication — Java

Edit `android/app/src/main/java/.../MainApplication.java`:

```java
import com.microsoft.codepush.react.CodePush;
```

Inside the `ReactNativeHost` anonymous class:

```java
@Override
protected String getJSBundleFile() {
    return CodePush.getJSBundleFile();
}
```

(If a Java project is on the New Architecture and uses `getDefaultReactHost(...)`,
use the `jsBundleFilePath = CodePush.getJSBundleFile()` approach from **3b**
instead of overriding `getJSBundleFile()` — the same rule applies regardless of
language.)

> In both languages the import is `com.microsoft.codepush.react.CodePush` —
> Revopush keeps the original CodePush Java/Kotlin package name for drop-in
> compatibility. This is correct, not a copy-paste mistake.

## 5. strings.xml (server URL + deployment key)

Add the server URL and **Android** deployment key to
`android/app/src/main/res/values/strings.xml`, both marked `moduleConfig="true"`
so the native module reads them:

```xml
<resources>
    <!-- ...existing strings... -->
    <string moduleConfig="true" name="CodePushServerUrl">https://api.revopush.org</string>
    <string moduleConfig="true" name="CodePushDeploymentKey">YOUR_ANDROID_DEPLOYMENT_KEY</string>
</resources>
```

> Casing matters: Android uses `CodePushServerUrl` (lowercase `rl`), unlike the
> iOS `CodePushServerURL` (uppercase `URL`). This asymmetry is intentional —
> match each platform exactly. Use the Android key the user gives you, or
> keep the `YOUR_ANDROID_DEPLOYMENT_KEY` placeholder until they have one (see
> "Where the key values come from" in `cli-and-releases.md`).
