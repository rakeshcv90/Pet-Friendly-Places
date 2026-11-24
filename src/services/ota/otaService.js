import codePush from '@revopush/react-native-code-push';
import { useOtaStore, OTA_STATUS } from './otaStore';

// Over-the-air updates through Revopush. They replace the app's JavaScript and bundled assets only:
// anything native (new libraries, permissions, SDK upgrades) still ships as a new store build.
//
// Safety, in short:
// - Compatibility: every check sends the installed native version, and the server only answers
//   with updates released for that exact native version (`-t` when releasing). A build from the
//   store can therefore never receive a bundle made for a different native build.
// - Faulty updates: an installed update must call notifyAppReady (the root codePush() wrapper does
//   it once the app has rendered). If the app crashes first, the SDK rolls back to the previous
//   bundle on the next start and marks the release as failed, and a release marked failed is
//   never offered again.
// - Nothing restarts the app while the user is using it. An installed update restarts the app
//   by itself only after the app has been hidden for a while (30 seconds, 10 for a mandatory
//   update), so users come back to the new version without seeing a restart. Coming back sooner
//   cancels that restart; the update then applies the next time the app is hidden or restarted.
//   If the system closes the app first, the update is already saved and applies on the next start.

// How often the automatic check may run
export const AUTO_CHECK_INTERVAL_MS = 30 * 60 * 1000;
// Seconds the app must stay hidden before an installed update restarts it. A mandatory update
// waits less, because it should reach users sooner.
export const OPTIONAL_BACKGROUND_SECONDS = 30;
export const MANDATORY_BACKGROUND_SECONDS = 10;

export const OTA_MESSAGES = {
  offline: "You're offline. Connect to the internet and try again.",
  checkFailed: "We couldn't check for updates. Please try again in a moment.",
  installFailed: "We couldn't install the update. Your app is unchanged. Please try again later.",
  disabled: 'Updates are only available in the installed app, not in development builds.',
};

const setOta = patch => useOtaStore.setState(patch);
const getOta = () => useOtaStore.getState();

// The update found by the last check, kept so it can be downloaded afterwards
let pendingRemote = null;
// One check or download at a time
let busy = false;

// OTA works in release builds that carry the native module. In debug, Metro serves the JS.
export const isOtaSupported = () =>
  !__DEV__ && !!codePush && typeof codePush.checkForUpdate === 'function';

export const isOfflineError = error =>
  /network request failed|failed to fetch|network error|timed? ?out|offline|internet|unable to resolve host|no address associated|connection (was )?(lost|refused|reset)/i.test(
    String(error?.message ?? error ?? ''),
  );

const describeUpdate = remote => ({
  label: remote.label ?? '',
  description: remote.description ?? '',
  size: Number(remote.packageSize) || 0,
  isMandatory: !!remote.isMandatory,
  appVersion: remote.appVersion ?? '',
});

const failWith = (error, fallbackMessage) => {
  const offline = isOfflineError(error);
  setOta({
    status: offline ? OTA_STATUS.OFFLINE : OTA_STATUS.ERROR,
    error: offline ? OTA_MESSAGES.offline : fallbackMessage,
  });
  if (__DEV__) {
    console.warn('[OTA]', error?.message ?? error);
  }
};

// Asks the server whether an update exists for this native build and deployment.
// Resolves to the update (also kept for downloadAndInstall) or null.
export const checkForUpdates = async ({ source = 'manual' } = {}) => {
  if (!isOtaSupported()) {
    setOta({ status: OTA_STATUS.DISABLED, error: OTA_MESSAGES.disabled, source });
    return null;
  }
  // An update already installed and waiting for a restart stays the headline
  if (getOta().restartPending) {
    return null;
  }
  if (busy) {
    return pendingRemote;
  }

  busy = true;
  setOta({ status: OTA_STATUS.CHECKING, error: null, source, bannerDismissed: false });
  try {
    const remote = await codePush.checkForUpdate();
    setOta({ lastCheckedAt: Date.now() });
    // `failedInstall`: this release was installed before and rolled back. Do not offer it again.
    if (!remote || remote.failedInstall) {
      pendingRemote = null;
      setOta({ status: OTA_STATUS.UP_TO_DATE, update: null });
      return null;
    }
    pendingRemote = remote;
    setOta({ status: OTA_STATUS.AVAILABLE, update: describeUpdate(remote) });
    return remote;
  } catch (error) {
    pendingRemote = null;
    failWith(error, OTA_MESSAGES.checkFailed);
    return null;
  } finally {
    busy = false;
  }
};

// Downloads the update found by checkForUpdates and installs it. The app restarts itself to apply
// it once it has been hidden for a while (see the notes at the top).
// Resolves to true when it is installed.
export const downloadAndInstall = async () => {
  const remote = pendingRemote;
  if (!remote || busy) {
    return false;
  }

  busy = true;
  const mandatory = !!remote.isMandatory;
  setOta({ status: OTA_STATUS.DOWNLOADING, progress: 0, error: null });
  try {
    let lastPercent = -1;
    const local = await remote.download(({ receivedBytes, totalBytes }) => {
      const progress = totalBytes > 0 ? Math.min(1, receivedBytes / totalBytes) : 0;
      const percent = Math.round(progress * 100);
      // One update per percent is plenty for a progress bar
      if (percent !== lastPercent) {
        lastPercent = percent;
        setOta({ progress });
      }
    });
    // ON_NEXT_SUSPEND: restart while the app is hidden, never while it is open (not IMMEDIATE)
    await local.install(
      codePush.InstallMode.ON_NEXT_SUSPEND,
      mandatory ? MANDATORY_BACKGROUND_SECONDS : OPTIONAL_BACKGROUND_SECONDS,
    );
    pendingRemote = null;
    setOta({
      status: OTA_STATUS.INSTALLED,
      progress: 1,
      restartPending: true,
      restartRequired: mandatory,
      bannerDismissed: false,
    });
    return true;
  } catch (error) {
    // The downloaded files were not installed, so the running app is untouched. The update stays
    // pending so it can be tried again.
    failWith(error, OTA_MESSAGES.installFailed);
    return false;
  } finally {
    busy = false;
  }
};

// The check that runs by itself when the app starts and when it comes back to the foreground.
// Quiet unless there is something to report: it downloads compatible updates and installs them.
// The restart that applies them happens only while the app is hidden.
export const autoUpdate = async ({ force = false } = {}) => {
  if (!isOtaSupported()) {
    return;
  }
  const { restartPending, lastCheckedAt } = getOta();
  if (restartPending || busy) {
    return;
  }
  if (!force && lastCheckedAt && Date.now() - lastCheckedAt < AUTO_CHECK_INTERVAL_MS) {
    return;
  }
  const remote = await checkForUpdates({ source: 'auto' });
  if (remote) {
    await downloadAndInstall();
  }
};

// Restarts the app so an installed update applies. Only ever called by the user's own tap.
export const restartApp = () => {
  try {
    codePush.restartApp(true);
  } catch (error) {
    failWith(error, OTA_MESSAGES.installFailed);
  }
};

export const dismissBanner = () => setOta({ bannerDismissed: true });

// Native version and the update currently running, for display in the Profile menu
export const getVersionInfo = async () => {
  if (!isOtaSupported() || typeof codePush.getConfiguration !== 'function') {
    return { appVersion: '', label: '', description: '' };
  }
  try {
    const [config, metadata] = await Promise.all([
      codePush.getConfiguration(),
      codePush.getUpdateMetadata(),
    ]);
    return {
      appVersion: config?.appVersion ?? '',
      label: metadata?.label ?? '',
      description: metadata?.description ?? '',
    };
  } catch (error) {
    return { appVersion: '', label: '', description: '' };
  }
};

export const formatBytes = bytes => {
  if (!bytes || bytes < 0) {
    return '';
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Test helper: forget everything between runs
export const __resetOtaForTests = () => {
  pendingRemote = null;
  busy = false;
  useOtaStore.getState().resetOta();
};
