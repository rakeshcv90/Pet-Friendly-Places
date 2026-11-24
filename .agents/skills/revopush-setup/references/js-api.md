# JS API — the `codePush()` HOC and the manual `sync()` flow

Two ways to use the SDK: the **HOC** (simplest, right for most apps) or the
**imperative API** (full control over when/how updates are checked, downloaded,
and applied). Full reference: https://docs.revopush.org/sdk/api-js

## Option A — the HOC (recommended default)

Wrapping the root component with `codePush()` makes the app check for and apply
OTA updates automatically.

```javascript
import codePush from "@revopush/react-native-code-push";

function App() {
  // ...
}

export default codePush(App);
```

For Expo Router, wrap the root layout export: `export default codePush(RootLayout);`

### Wrapping the root export

Edit the file that default-exports the root component. Show the user the change
before making it, and leave the file alone if it is already wrapped (it has
`export default codePush(` or a `codePush(...)(...)` call).

1. Add `import codePush from "@revopush/react-native-code-push";` after the
   last existing import, unless that import is already there.
2. Wrap the default export, by shape:

| Existing export | Change to |
|---|---|
| `export default App;` | `export default codePush(App);` |
| `export default function App() { … }` (or `class App`) | Drop `export default` from the declaration and add `export default codePush(App);` at the end of the file |
| `export default function () { … }` (anonymous) | Give it a name first, e.g. `function RevopushRoot() { … }`, then add `export default codePush(RevopushRoot);` at the end |

Anything else — `export default React.memo(App)`, `export default App.foo`, a
re-export, or a file with no default export — don't guess: show the user the
export and agree on the edit, since a wrong change to the entry file breaks the
app.

### HOC options

Pass an options object to tune *when* updates are checked and installed:

```javascript
const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESUME,
  minimumBackgroundDuration: 60 * 10, // seconds backgrounded before applying
};

export default codePush(codePushOptions)(App);
```

| Option | Values | Default | Notes |
|---|---|---|---|
| `checkFrequency` | `ON_APP_START`, `ON_APP_RESUME`, `MANUAL` | `ON_APP_START` | When to check the server. `MANUAL` → you call `codePush.sync()` yourself. |
| `installMode` | `IMMEDIATE`, `ON_NEXT_RESTART`, `ON_NEXT_RESUME`, `ON_NEXT_SUSPEND` | `ON_NEXT_RESTART` | When a downloaded update is applied. |
| `mandatoryInstallMode` | same as `installMode` | `IMMEDIATE` | Install mode for updates marked mandatory. |
| `minimumBackgroundDuration` | seconds | `0` | With resume-based modes, how long backgrounded before applying. |
| `updateDialog` | `false` or options object | `false` | Show a built-in prompt before applying. |
| `deploymentKey` | string | from native config | Override which deployment to pull from at runtime. |
| `rollbackRetryOptions` | object | `null` | Retry behavior for updates that previously rolled back. |

### HOC progress callbacks

When you need progress UI without leaving the HOC, define these methods on the
wrapped component — the SDK calls them:

```javascript
codePushStatusDidChange(status) { /* status is a codePush.SyncStatus value */ }
codePushDownloadDidProgress({ receivedBytes, totalBytes }) { /* update a bar */ }
```

A safe production default: check on resume, apply on next resume, and only after
10 minutes backgrounded so users aren't interrupted mid-session — the options
object shown above. Pass it as `codePush(codePushOptions)(App)`; don't
default-export the options object itself.

## Option B — manual / custom update flow

Use this when the user wants their own UX: a "Check for updates" button, a custom
download progress bar, gating updates behind a prompt, etc. Set the HOC to
`checkFrequency: MANUAL` (or don't use the HOC) and drive it yourself.

### Single-call: `codePush.sync()`

`sync()` handles check + download + install in one call and is idempotent (safe
to call repeatedly):

```javascript
codePush.sync(
  { installMode: codePush.InstallMode.IMMEDIATE, updateDialog: true },
  (status) => {
    // codePush.SyncStatus.* — e.g. CHECKING_FOR_UPDATE, DOWNLOADING_PACKAGE,
    // INSTALLING_UPDATE, UP_TO_DATE, UPDATE_INSTALLED, UPDATE_IGNORED, UNKNOWN_ERROR
  },
  ({ receivedBytes, totalBytes }) => { /* download progress */ }
);
```

`SyncStatus` codes: `0 UP_TO_DATE`, `1 UPDATE_INSTALLED`, `2 UPDATE_IGNORED`,
`3 UNKNOWN_ERROR`, `4 SYNC_IN_PROGRESS`, `5 CHECKING_FOR_UPDATE`,
`6 AWAITING_USER_ACTION`, `7 DOWNLOADING_PACKAGE`, `8 INSTALLING_UPDATE`.

### Fully manual: check → download → install

For complete control, compose the lower-level methods:

```javascript
const update = await codePush.checkForUpdate();      // RemotePackage | null
if (update) {
  const local = await update.download(({ receivedBytes, totalBytes }) => {
    // render progress
  });                                                 // LocalPackage
  await local.install(codePush.InstallMode.ON_NEXT_RESTART);
  // then restart when you choose:
  codePush.restartApp();
}
```

Key methods:
- `codePush.checkForUpdate(deploymentKey?, handleBinaryVersionMismatch?)` → `RemotePackage | null`
- `RemotePackage.download(onProgress?)` → `LocalPackage`
- `LocalPackage.install(installMode, minimumBackgroundDuration?)`
- `codePush.getUpdateMetadata(updateState?)` → currently running/pending `LocalPackage`
- `codePush.restartApp(onlyIfUpdateIsPending?)`
- `codePush.notifyAppReady()` — **required** when NOT using the HOC. Call it
  after the app boots successfully to confirm the update is healthy; without it
  the next restart rolls the update back (this is the safety mechanism that
  protects users from a broken update).

> If you use the HOC, `notifyAppReady()` is called for you. If you go fully
> manual, you must call it yourself or every update will be rolled back.

## Notes

- OTA updates deliver JS/asset changes only. Native changes (new native modules,
  permission changes, SDK bumps) still require a store/native build.
- Updates are scoped to the **deployment key** baked into the build (Staging vs
  Production) unless overridden via the `deploymentKey` option — see
  `cli-and-releases.md`.
