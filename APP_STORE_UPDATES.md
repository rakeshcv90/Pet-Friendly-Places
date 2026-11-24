# Google Play / App Store updates (new app versions)

When a new **native build** is published (new APK/AAB or IPA), the app tells users and takes them to the update.
JavaScript-only fixes still go out by Revopush OTA (see `OTA_UPDATES.md`). The two never share state.

Library: `sp-react-native-in-app-updates` **2.0.0** (a TurboModule, New Architecture ready) with
`react-native-device-info` **10.3.0** (the version the library pins). Not Expo. No other native code was added.

## Which one is used when

| Change | Delivered by | User sees |
|---|---|---|
| JavaScript, UI, images | Revopush OTA | small banner, **Check for OTA update** |
| Native code, libraries, permissions, version bump | Google Play / App Store | update dialog, **Check for app update** |

Both show their version separately: the native version `v1.0 (12)` (version name and build number) and the OTA release label
(`v5`). A store update changes the first; an OTA update only changes the second.

## What the app does

- **Start-up and return to the foreground:** checks the store (first check 2.5 s after start; foreground checks at most once
  per hour). Checks never overlap and never block start-up. Failures are silent.
- **Optional update:** dialog with the app icon, installed and available version, notes, **Update now** / **Later**. Shown once
  per store version per session. Never shown on top of the OTA sheet.
- **Required update:** when the installed version is below the minimum supported version, a full-screen **Update required** screen
  replaces the app (the Android back button does nothing). It has **Update now** and **Check again**, explains being offline, and
  rechecks every time the app returns to the foreground. A required update always comes before any OTA prompt: the OTA banner and
  automatic OTA check stay off while it is showing. Not every store update is required; only the minimum version blocks.
- **Settings:** Profile > **Check for app update** (store) and Profile > **Check for OTA update** (Revopush) are two separate rows.

### Android (Google Play in-app updates)

- **Flexible:** Google Play downloads in the background. The dialog shows progress and the user can keep using the app; when it is
  downloaded the dialog asks **Restart to update**.
- **Immediate:** Google's full-screen flow. Used for a required update, or a release with Play update priority 4 or 5, when Play allows it.
  If the user cancels, the app offers it again (and the required screen stays up). An immediate update Google Play already started is
  resumed automatically when the app opens.
- The type follows what Play allows for that release; if Play allows neither, **Update now** opens the Play listing.
- The app never installs an APK itself.
- Comparison uses the **build number (versionCode)**. Play only tells the app the new versionCode, so the dialog shows `Build 12`
  unless the policy file gives a `latestVersion` (below).
- Works only for an app **installed from Google Play**. A sideloaded or debug build gets "Updates through Google Play are only
  available when the app is installed from Google Play".

### iOS (App Store)

- Apple's public lookup (by the app's bundle id `com.cvinfotech.petfriendlyplaces`) gives the newest version and the App Store link.
  **Update now** opens that page. The app never downloads an IPA.
- If Apple knows no app with that bundle id (not published yet, or not in the user's country), the check says there is nothing to
  compare with and does not invent a link. `IOS_APP_STORE_ID` in `src/config/appUpdate.js` is optional and only used when the lookup
  finds nothing; leave it empty until the numeric id exists in App Store Connect.

## Minimum supported version (required updates)

`src/config/appUpdate.js`:

- `MINIMUM_SUPPORTED_VERSION` `{ android, ios }`: built-in minimum (`'0.0.0'` = nobody is blocked). Changing it needs a release.
- `REMOTE_POLICY_URL`: a public JSON file you host, so the minimum can change **without a release**:

```json
{
  "android": { "minimumVersion": "1.2.0", "latestVersion": "1.4.0", "message": "What is new in this version" },
  "ios":     { "minimumVersion": "1.2.0", "message": "What is new in this version" }
}
```

`minimumVersion` is compared with the version name (`1.2.0`). The effective minimum is the higher of the file and the built-in value.
The last file read is remembered, so a blocked version stays blocked when offline. A missing, unreadable or malformed file never
blocks anyone. Block a version only after the fixed build is live in the store.

## Manual setup still needed

1. **Publish the app** on Google Play and the App Store (in-app updates cannot work before that).
2. Set `REMOTE_POLICY_URL` (optional) and host the JSON file.
3. Android: when releasing an urgent update, set the in-app update priority (0-5) through the Google Play Developer API (the Play Console
   screen does not offer it). Priority is optional; without it every update is flexible unless the version is below the minimum.
4. Increase `versionCode` (Android) and the build/version (iOS) for every store release.
5. iOS: nothing else. The lookup needs no key; phased releases and country availability can delay what Apple reports.

## Testing

Unit tests cover the logic (`npx jest src/services/appUpdate src/components/appUpdate src/hooks/__tests__/useInAppUpdate.test.js __tests__/AppUpdates.test.js`).
**A real store update has not been tested**: that needs a published (or internal-testing) version, which does not exist yet.

**Android (Google Play):**
1. Upload build A (versionCode N) and a later build B (versionCode N+1) to an **internal testing** track (or use Google's internal app
   sharing, as in Google's "Test in-app updates" guide). Install A **from Google Play**.
2. Open the app. Within a few seconds the dialog shows Update available. Check: flexible (Update now > Play confirms > progress >
   Restart to update); cancelling in Play; killing the app mid-download; airplane mode (Check for app update says offline).
3. Immediate: release B with update priority 4-5, or raise `MINIMUM_SUPPORTED_VERSION` above A's version and use the policy file; the
   full-screen flow runs. Cancel it and the app offers it again. Force-close during it and reopen: it resumes.
4. Up to date: open B. Settings > Check for app update says "Your app is up to date".

**iOS:**
1. After the first release is live: install an older build (lower version) from TestFlight/Xcode and open it: Update available with the
   store version and notes; **Update now** opens this app's page.
2. Required: put a minimum above the installed version (policy file); the Update required screen appears; airplane mode shows the offline text.
3. Before publication: Check for app update says there is nothing to compare with.

**Revopush (unchanged):** deployment keys, the Staging/Production setup and the root `codePush()` wrapper were not touched. After this change,
still test one Staging OTA update as in `OTA_UPDATES.md`.

## Code

`src/services/appUpdate/` (logic and state), `src/hooks/useInAppUpdate.js`, `src/components/appUpdate/` (dialog and Update required screen),
`src/utils/versionComparison.js`, `src/config/appUpdate.js`, wired in `App.js` and the Profile menu. The project is JavaScript, so these
are `.js` files, not `.ts`.
