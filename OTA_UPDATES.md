# Over-the-air (OTA) updates with Revopush

The app can receive JavaScript and image/asset fixes without a new Play Store or App Store release.
SDK: `@revopush/react-native-code-push` 2.6.3 (hosted service, https://app.revopush.org).

## What OTA can and cannot change

| Goes out by OTA | Needs a new store build (APK / AAB / IPA) |
|---|---|
| JavaScript, UI and logic fixes in `src/`, `App.js` | New or upgraded native libraries (anything in `package.json` with native code) |
| Bundled images and other assets | Permissions, `AndroidManifest.xml`, `Info.plist`, Gradle/Pods changes |
| | React Native upgrades, app icon, splash, version number |

An update is released for **one native version** (`-t`). A phone only receives updates made for the
native version it has installed, so an update can never reach a build it was not made for.

## How the app uses it

- **Automatic:** a few seconds after start, and each time the app returns to the foreground (at most
  every 30 minutes), the app checks its deployment. A compatible update is downloaded and installed
  quietly. A small banner shows the progress.
  - **Restart in the background:** once an update is installed, the app restarts itself **while it is
    hidden**, so users return to the new version without seeing a restart. It waits until the app has
    been hidden for **30 seconds** (**10 seconds** for a mandatory update, `-m`).
  - The app is **never** restarted while it is open. Coming back before the wait is over cancels that
    restart; the update then applies the next time the app is hidden or started. If the system closes
    the app first, the update is already saved and applies on the next start.
  - A banner offers **Restart** for anyone who wants the update right away. It is the user's own tap.
- **Manual:** Profile > **Check for OTA update** (in the Account section of the Profile menu; **Check for app update** next to it is for Google Play / App Store, see `APP_STORE_UPDATES.md`) shows "Your app is up to
  date", or the update details, a download button with progress, and "Restart now" / "Later".
- **Offline:** checks fail quietly; the Check for OTA update sheet says "You're offline".
- **Debug builds:** OTA is off (Metro serves the JavaScript). Check for OTA update says "Updates unavailable".
- **Faulty update:** the root `codePush()` wrapper confirms the app started. If a new bundle crashes
  before that, the SDK rolls back to the previous bundle on the next start and marks the release as
  failed. A release marked failed is never offered again.

Code: `src/services/ota/` (logic and shared state), `src/hooks/useOtaUpdate.js`,
`src/components/ota/` (banner and the Check for OTA update sheet), `App.js` (wrapper and automatic check).

## Two environments

| | Staging | Production |
|---|---|---|
| For | internal testing | Play Store / App Store builds |
| Android build | `./gradlew assembleReleaseStaging` | `./gradlew assembleRelease` / `bundleRelease` |
| iOS build | scheme **PetFriendly Staging** (configuration `Staging`) | scheme **PetFriendly** (configuration `Release`) |
| Pulls updates from | the Staging deployment only | the Production deployment only |

Debug builds use no key and never update.

## Deployment keys

Create the apps at https://app.revopush.org (one for Android, one for iOS). Each gets a Staging and a
Production deployment with its own key.

**Android.** Keys are read from Gradle properties or environment variables, so they need not be
committed. Put them in `~/.gradle/gradle.properties` (your machine) and in your CI environment:

```
REVOPUSH_ANDROID_STAGING_KEY=<android staging key>
REVOPUSH_ANDROID_PRODUCTION_KEY=<android production key>
```

Without them the build contains `YOUR_ANDROID_STAGING_DEPLOYMENT_KEY` /
`YOUR_ANDROID_PRODUCTION_DEPLOYMENT_KEY` and receives no updates. (`android/app/build.gradle`)

**iOS.** `Info.plist` uses `$(CODEPUSH_KEY)`. Set the value per configuration in Xcode: target
PetFriendly > Build Settings > User-Defined > `CODEPUSH_KEY` (Release = Production key, Staging =
Staging key, Debug stays empty). The placeholders `YOUR_IOS_PRODUCTION_DEPLOYMENT_KEY` and
`YOUR_IOS_STAGING_DEPLOYMENT_KEY` are in the project until you replace them.
If `Info.plist` holds a literal key instead of `$(CODEPUSH_KEY)`, every iOS configuration uses that one key.

The server URL is `https://api.revopush.org` (`strings.xml` on Android, `Info.plist` on iOS).

## Publishing updates

These commands use your Revopush login, so run them yourself in your terminal. Install and log in once:

```
npm install -g @revopush/code-push-cli
revopush login
```

Replace the app names with the ones from the dashboard (examples below). The native version defaults
to the one in the project (`1.0` today); pass `-t` to be explicit.

```
# Android, to Staging
revopush release-react PetFriendly-Android android -d Staging -t 1.0 --description "What changed"

# iOS, to Staging
revopush release-react PetFriendly-iOS ios -d Staging -t 1.0 --description "What changed"
```

Useful flags: `-m` mandatory, `-r 25` staged rollout to 25%, `-t "~1.0.0"` a range of native versions.

## Staging to Production

1. Release to **Staging**.
2. Install a **staging build** (`assembleReleaseStaging`, or the PetFriendly Staging scheme) and test.
3. Promote the same, already tested bundle to Production, no rebuild:

```
revopush promote PetFriendly-Android Staging Production
revopush promote PetFriendly-iOS Staging Production
# gradual: revopush promote PetFriendly-Android Staging Production -r 25 --des "gradual rollout"
```

Nothing in this repository publishes to Production.

## Rollback

```
revopush rollback PetFriendly-Android Production            # to the previous release
revopush rollback PetFriendly-Android Production -r v4      # to a specific release
revopush deployment history PetFriendly-Android Production  # see the releases
```

Phones that already installed the bad update move to the previous one the next time they check.

## Testing an update on an installed release build

1. Install a **release or staging build** (not debug) with the right key.
2. Make a visible JavaScript change (a text on a screen).
3. Release it to **Staging** with the command above.
4. Open the installed staging build. Either wait a few seconds, or open Profile > Check for OTA update
   and tap "Download update".
5. **Leave the app for about 30 seconds** (10 for a mandatory update), then come back: it has restarted
   itself and shows the change. Or tap **Restart** in the banner or the update sheet to see it at once.
   (If you cancel the wait by coming back too early, close and reopen the app instead.)
6. Open Profile > Check for OTA update: it should show "Your app is up to date" with the update label (for example "Update v1").

If nothing happens: check the build is not debug, the key is not a placeholder, the update targets this
build's native version (`-t`), and the phone is online.
