// Settings for the Google Play / App Store update check (see APP_STORE_UPDATES.md).
// Nothing here is a secret: it ships inside the app.

export const APP_UPDATE_CONFIG = {
  // Where the minimum supported version is read from, so it can change without a new release.
  // A public JSON file you host (your API, S3, a static page). Empty = use only the values below.
  // Expected shape (see APP_STORE_UPDATES.md):
  //   { "android": { "minimumVersion": "1.2.0", "latestVersion": "1.4.0", "message": "..." },
  //     "ios":     { "minimumVersion": "1.2.0" } }
  REMOTE_POLICY_URL: '',

  // The lowest app version allowed to run. An installed version below this sees the blocking
  // "Update required" screen. '0.0.0' means no version is ever blocked.
  MINIMUM_SUPPORTED_VERSION: { android: '0.0.0', ios: '0.0.0' },

  // Optional. The numeric App Store id (the digits after "id" in the App Store link). Only used to
  // open the store page when Apple's lookup cannot find the app. Leave empty until the app is
  // published: never put a guessed id here.
  IOS_APP_STORE_ID: '',

  // Optional ISO country code for Apple's lookup (for example 'in'). Empty = Apple's default store.
  IOS_COUNTRY: '',

  // Foreground checks run at most this often. Start-up and the Settings button always check.
  CHECK_INTERVAL_MS: 60 * 60 * 1000,

  // Wait after start-up before the first check, so the app is not slowed down while it starts
  START_DELAY_MS: 2500,

  // Give up on the remote policy file after this long
  REMOTE_TIMEOUT_MS: 8000,

  // Google Play update priority (0-5, set when releasing in the Play Console). From this priority
  // up, the full-screen immediate update is preferred over the flexible background one.
  ANDROID_IMMEDIATE_PRIORITY: 4,
};
