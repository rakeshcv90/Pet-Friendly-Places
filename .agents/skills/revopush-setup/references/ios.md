# iOS native integration (bare React Native)

Exact iOS edits for a bare React Native project. Pick the AppDelegate section
matching the file that exists in the project: **`AppDelegate.swift`** (current RN
template) or **`AppDelegate.mm`** (older Objective-C template). Apply edits one
file at a time and show the user each change.

## Table of contents
- [1. AppDelegate — Swift](#1-appdelegate--swift)
- [2. AppDelegate — Objective-C](#2-appdelegate--objective-c)
- [3. Podfile](#3-podfile)
- [4. Info.plist (server URL + deployment key)](#4-infoplist-server-url--deployment-key)
- [5. Reinstall pods](#5-reinstall-pods)

The goal in every case: in **release** builds the JS bundle URL must come from
`CodePush` so OTA updates are picked up; in **debug** builds it must stay on the
Metro dev server so local development is unaffected.

## 1. AppDelegate — Swift

Edit `ios/<YourApp>/AppDelegate.swift`.

```swift
import CodePush
```

In the function that returns the bundle URL, return `CodePush.bundleURL()` on the
release path:

```swift
override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    CodePush.bundleURL()
#endif
}
```

The method that returns the production bundle URL is the one to edit — its `#else`
branch should return `CodePush.bundleURL()`. **Where it lives varies by template:**
on some it's `bundleURL()` directly on `AppDelegate` (e.g. `class AppDelegate:
RCTAppDelegate`); on the newer `RCTReactNativeFactory` templates it's `bundleURL()`
on a nested `class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate`, with
`sourceURL(for:)` just calling `self.bundleURL()`. Edit whichever one returns the
release bundle URL — don't add a second `bundleURL()` on the wrong class.

## 2. AppDelegate — Objective-C

Edit `ios/<YourApp>/AppDelegate.mm` (or `.m`).

```objc
#import <CodePush/CodePush.h>
```

```objc
- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [CodePush bundleURL];
#endif
}
```

On older templates the release URL is returned from `sourceURLForBridge:` or
`getBundleURL`; put `[CodePush bundleURL]` on that release path.

## 3. Podfile

Revopush requires a minimum iOS deployment target of **15.5**. In `ios/Podfile`:

```ruby
platform :ios, '15.5'
```

If the project already targets a higher version, leave it. Do not lower it. This
step is easy to forget and a too-low target makes the iOS release build fail —
always confirm the line is at least 15.5.

## 4. Info.plist (server URL + deployment key)

Add the server URL and the **iOS** deployment key to `ios/<YourApp>/Info.plist`:

```xml
<key>CodePushServerURL</key>
<string>https://api.revopush.org</string>
<key>CodePushDeploymentKey</key>
<string>YOUR_IOS_DEPLOYMENT_KEY</string>
```

> Casing matters: iOS uses `CodePushServerURL` (uppercase `URL`). Android uses
> `CodePushServerUrl` (lowercase `rl`) — see `android.md`. Match each exactly.
> Use the iOS key the user gives you, or keep the `YOUR_IOS_DEPLOYMENT_KEY`
> placeholder until they have one (see "Where the key values come from" in
> `cli-and-releases.md`). Never invent one or read one off the machine.

## 5. Reinstall pods

After the edits:

```bash
cd ios && pod install && cd ..
```

Then verify with a release build:

```bash
npx react-native run-ios --mode Release --no-packager
```
