import { Linking, Platform } from 'react-native';
import { getBuildNumber, getBundleId, getVersion } from 'react-native-device-info';
import { APP_UPDATE_CONFIG } from '../../config/appUpdate';
import { compareBuilds, isVersionBelow, maxVersion } from '../../utils/versionComparison';
import { getItem, setItem, STORAGE_KEYS } from '../storage/storage';
import { isOfflineError } from '../ota/otaService';
import { useOtaStore } from '../ota/otaStore';
import { APP_UPDATE_STATUS, UPDATE_KIND, useAppUpdateStore } from './appUpdateStore';

// Google Play / App Store updates for new native builds, using sp-react-native-in-app-updates:
//   Android: Google Play's in-app update API (flexible = downloads in the background, immediate =
//            full-screen). The app never installs an APK itself.
//   iOS:     Apple's public lookup tells the newest version; "Update" opens the App Store page.
// JavaScript-only fixes still go out through Revopush (services/ota). The two are independent.

// Values of the library's enums (IAUUpdateKind, IAUAvailabilityStatus, IAUInstallStatus)
const KIND_FLEXIBLE = 0;
const KIND_IMMEDIATE = 1;
const AVAILABILITY_DEVELOPER_TRIGGERED = 3;
const INSTALL = {
  INSTALLED: 4,
  FAILED: 5,
  CANCELED: 6,
  DOWNLOADING: 2,
  DOWNLOADED: 11,
};

export const APP_UPDATE_MESSAGES = {
  offline: "You're offline. Connect to the internet and try again.",
  checkFailed: "We couldn't check for updates right now. Please try again.",
  startFailed: "We couldn't start the update. Please try again.",
  notPublished: "This app isn't on the store yet, so there is nothing to compare with.",
  notFromStore: 'Updates through Google Play are only available when the app is installed from Google Play.',
  noStoreLink: "We couldn't open the store. Search for Pet Friendly Places in the store to update.",
  cancelled: 'The update was cancelled.',
};

// Development console log, so a check can be followed in Metro / the device log. Silent in release
// builds and in tests. Filter the console by "[AppUpdate]".
const log = (...args) => {
  if (__DEV__ && !process.env.JEST_WORKER_ID) {
    // eslint-disable-next-line no-console
    console.log('[AppUpdate]', ...args);
  }
};

const getSetting = () => useAppUpdateStore.getState();
const setApp = patch => useAppUpdateStore.getState().setAppUpdate(patch);

let busy = false;
let pendingCheck = null;
let client;
let listenersAdded = false;
// Store versions the optional dialog already appeared for in this session: one prompt per version
const promptedFor = new Set();

// ── The library (loaded lazily: an old build without the native part must not crash the app) ───
const getClient = () => {
  if (client !== undefined) {
    return client;
  }
  try {
    const Library = require('sp-react-native-in-app-updates');
    const InAppUpdates = Library.default ?? Library;
    client = new InAppUpdates(false);
  } catch (error) {
    client = null;
  }
  return client;
};

export const isAppUpdateSupported = () => Platform.OS === 'android' || Platform.OS === 'ios';

export const getInstalledApp = () => ({
  version: String(getVersion() ?? ''),
  build: String(getBuildNumber() ?? ''),
});

// ── Minimum supported version ("mandatory update" policy) ────────────────────────────────────────
const readPolicyNode = json => {
  const node = json?.[Platform.OS] ?? json ?? {};
  return {
    minimumVersion: node.minimumVersion ?? node.minVersion ?? '',
    latestVersion: node.latestVersion ?? '',
    message: node.message ?? '',
  };
};

const fetchWithTimeout = async (url, timeoutMs) => {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = setTimeout(() => controller?.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
      signal: controller?.signal,
    });
    if (!response.ok) {
      throw new Error(`Policy request failed with status ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

// The policy that applies now: the remote file if it can be read, otherwise the last one read
// (so a blocked version stays blocked while offline), always at least the built-in minimum.
export const loadPolicy = async () => {
  const builtIn = APP_UPDATE_CONFIG.MINIMUM_SUPPORTED_VERSION?.[Platform.OS] ?? '';
  let policy = { minimumVersion: '', latestVersion: '', message: '' };

  if (APP_UPDATE_CONFIG.REMOTE_POLICY_URL) {
    try {
      const json = await fetchWithTimeout(
        APP_UPDATE_CONFIG.REMOTE_POLICY_URL,
        APP_UPDATE_CONFIG.REMOTE_TIMEOUT_MS,
      );
      policy = readPolicyNode(json);
      setItem(STORAGE_KEYS.APP_UPDATE_POLICY, policy);
    } catch (error) {
      policy = getItem(STORAGE_KEYS.APP_UPDATE_POLICY, true) || policy;
    }
  }
  return { ...policy, minimumVersion: maxVersion(policy.minimumVersion, builtIn) || '' };
};

// Applies the last known policy straight away at start-up, before any network call, so a blocked
// version is blocked from the first screen and does not get a few seconds of use.
export const applyCachedPolicy = () => {
  const { version } = getInstalledApp();
  const builtIn = APP_UPDATE_CONFIG.MINIMUM_SUPPORTED_VERSION?.[Platform.OS] ?? '';
  const cached = APP_UPDATE_CONFIG.REMOTE_POLICY_URL
    ? getItem(STORAGE_KEYS.APP_UPDATE_POLICY, true)
    : null;
  const minimumVersion = maxVersion(cached?.minimumVersion, builtIn) || '';
  setApp({
    installedVersion: version,
    installedBuild: getInstalledApp().build,
    minimumVersion,
    mandatory: isVersionBelow(version, minimumVersion),
  });
};

// ── Store lookups ───────────────────────────────────────────────────────────────────────────
const buildNumberComparator = (store, installed) => compareBuilds(store, installed);

// Picks how to deliver an Android update from what Google Play allows for this release
export const pickAndroidUpdateKind = ({ mandatory, priority, immediateAllowed, flexibleAllowed }) => {
  const preferImmediate = mandatory || priority >= APP_UPDATE_CONFIG.ANDROID_IMMEDIATE_PRIORITY;
  if (preferImmediate && immediateAllowed) {
    return UPDATE_KIND.IMMEDIATE;
  }
  if (flexibleAllowed) {
    return UPDATE_KIND.FLEXIBLE;
  }
  if (immediateAllowed) {
    return UPDATE_KIND.IMMEDIATE;
  }
  return UPDATE_KIND.STORE;
};

const storeUrlForAndroid = () => `https://play.google.com/store/apps/details?id=${getBundleId()}`;

const lookupAndroid = async ({ policy, mandatory, installed }) => {
  const lib = getClient();
  if (!lib) {
    throw new Error('In-app updates are not available in this build.');
  }
  const result = await lib.checkNeedsUpdate({
    curVersion: installed.build,
    customVersionComparator: buildNumberComparator,
  });
  const other = result?.other ?? {};

  // An immediate update that was started earlier and not finished: Google asks apps to resume it
  if (other.updateAvailability === AVAILABILITY_DEVELOPER_TRIGGERED) {
    return { resume: true };
  }
  if (!result?.shouldUpdate) {
    return { available: false };
  }
  const kind = pickAndroidUpdateKind({
    mandatory,
    priority: other.updatePriority ?? 0,
    immediateAllowed: !!other.isImmediateUpdateAllowed,
    flexibleAllowed: !!other.isFlexibleUpdateAllowed,
  });
  return {
    available: true,
    kind,
    priority: other.updatePriority ?? 0,
    totalBytes: other.totalBytes ?? 0,
    storeVersion: policy.latestVersion || `Build ${result.storeVersion}`,
    releaseNotes: policy.message || '',
    storeUrl: storeUrlForAndroid(),
  };
};

const lookupIos = async ({ policy }) => {
  const lib = getClient();
  if (!lib) {
    throw new Error('In-app updates are not available in this build.');
  }
  const installed = getInstalledApp();
  const result = await lib.checkNeedsUpdate({
    curVersion: installed.version,
    bundleId: getBundleId(),
    country: APP_UPDATE_CONFIG.IOS_COUNTRY || undefined,
  });
  const other = result?.other ?? {};
  // Apple knows no app with this bundle id: it is not publicly available (yet)
  if (!other.version && !other.trackViewUrl && !result?.storeVersion) {
    return { notPublished: true };
  }
  if (!result?.shouldUpdate) {
    return { available: false };
  }
  const trackId = other.trackId || APP_UPDATE_CONFIG.IOS_APP_STORE_ID;
  return {
    available: true,
    kind: UPDATE_KIND.STORE,
    storeVersion: result.storeVersion || other.version || '',
    releaseNotes: other.releaseNotes || policy.message || '',
    storeUrl: other.trackViewUrl
      ? String(other.trackViewUrl).split('?')[0]
      : trackId
      ? `https://apps.apple.com/app/id${trackId}`
      : '',
  };
};

const failWith = (error, fallbackMessage) => {
  const message = String(error?.message ?? error ?? '');
  if (Platform.OS === 'android' && /(-10\b|app_not_owned|not owned)/i.test(message)) {
    setApp({
      status: APP_UPDATE_STATUS.UNAVAILABLE,
      reason: 'notFromStore',
      error: APP_UPDATE_MESSAGES.notFromStore,
    });
    return;
  }
  const offline = isOfflineError(error);
  setApp({
    status: offline ? APP_UPDATE_STATUS.OFFLINE : APP_UPDATE_STATUS.ERROR,
    error: offline ? APP_UPDATE_MESSAGES.offline : fallbackMessage,
  });
  if (__DEV__) {
    console.warn('[AppUpdate]', message);
  }
};

// ── Checking ────────────────────────────────────────────────────────────────────────────────
// Decides whether to open the dialog after a check. Optional updates are offered once per store
// version per session, and never on top of the OTA sheet.
const maybeOpenDialog = ({ source, storeVersion }) => {
  if (source === 'manual') {
    setApp({ modalVisible: true });
    return;
  }
  if (promptedFor.has(storeVersion) || useOtaStore.getState().sheetOpen) {
    return;
  }
  promptedFor.add(storeVersion);
  setApp({ modalVisible: true });
};

const runCheck = async source => {
  const installed = getInstalledApp();
  setApp({
    status: APP_UPDATE_STATUS.CHECKING,
    error: null,
    reason: null,
    cancelled: false,
    source,
    installedVersion: installed.version,
    installedBuild: installed.build,
  });

  log(`check (${source}) on ${Platform.OS}: installed ${installed.version} (build ${installed.build})`);
  const policy = await loadPolicy();
  const mandatory = isVersionBelow(installed.version, policy.minimumVersion);
  setApp({ mandatory, minimumVersion: policy.minimumVersion });
  log(
    `minimum supported version: ${policy.minimumVersion || 'none'} -> ${
      mandatory ? 'BLOCKED, update required' : 'allowed'
    }${APP_UPDATE_CONFIG.REMOTE_POLICY_URL ? '' : ' (no remote policy URL set)'}`,
  );

  try {
    const found =
      Platform.OS === 'ios'
        ? await lookupIos({ policy })
        : await lookupAndroid({ policy, mandatory, installed });
    setApp({ lastCheckedAt: Date.now() });
    log('store answer:', JSON.stringify(found));

    if (found.resume) {
      // Finish the immediate update Google Play already started
      await startAppUpdate({ resume: true });
      return;
    }
    if (found.notPublished) {
      setApp({
        status: APP_UPDATE_STATUS.UNAVAILABLE,
        reason: 'notPublished',
        error: APP_UPDATE_MESSAGES.notPublished,
        // A blocked version still gets the store button when the store id is known
        storeVersion: '',
        kind: UPDATE_KIND.STORE,
      });
      return;
    }
    if (!found.available) {
      setApp({ status: APP_UPDATE_STATUS.UP_TO_DATE, storeVersion: '', kind: null });
      return;
    }
    setApp({
      status: APP_UPDATE_STATUS.AVAILABLE,
      kind: found.kind,
      priority: found.priority ?? 0,
      totalBytes: found.totalBytes ?? 0,
      storeVersion: found.storeVersion,
      releaseNotes: found.releaseNotes,
      storeUrl: found.storeUrl,
      progress: 0,
    });
    if (!mandatory) {
      maybeOpenDialog({ source, storeVersion: found.storeVersion });
    }
  } catch (error) {
    log('check failed:', String(error?.message ?? error));
    failWith(error, APP_UPDATE_MESSAGES.checkFailed);
  }
};

// Looks for a Play Store / App Store update. One check at a time; a second call joins the first.
export const checkForAppUpdate = async ({ source = 'manual' } = {}) => {
  if (!isAppUpdateSupported()) {
    return;
  }
  if (busy) {
    return pendingCheck;
  }
  busy = true;
  pendingCheck = runCheck(source).finally(() => {
    busy = false;
    pendingCheck = null;
  });
  return pendingCheck;
};

// Start-up and return to the foreground. A blocked app, or an update in progress, is always
// rechecked; otherwise at most once per CHECK_INTERVAL_MS. Never overlaps another check, and never
// disturbs a download or a restart prompt.
export const autoCheckAppUpdate = async ({ force = false } = {}) => {
  if (!isAppUpdateSupported() || busy) {
    return;
  }
  const { status, mandatory, lastCheckedAt } = getSetting();
  if (status === APP_UPDATE_STATUS.DOWNLOADING || status === APP_UPDATE_STATUS.DOWNLOADED) {
    return;
  }
  const mustRecheck = mandatory || status === APP_UPDATE_STATUS.UPDATING;
  const recent = lastCheckedAt && Date.now() - lastCheckedAt < APP_UPDATE_CONFIG.CHECK_INTERVAL_MS;
  if (!force && !mustRecheck && recent) {
    return;
  }
  await checkForAppUpdate({ source: 'auto' });
};

// ── Starting an update ──────────────────────────────────────────────────────────────────────────
const onNativeStatus = event => {
  log('Google Play status event:', JSON.stringify(event));
  const status = Number(event?.status);
  const downloaded = Number(event?.bytesDownloaded) || 0;
  const total = Number(event?.totalBytesToDownload) || 0;
  if (status === INSTALL.DOWNLOADING) {
    setApp({
      status: APP_UPDATE_STATUS.DOWNLOADING,
      progress: total > 0 ? Math.min(1, downloaded / total) : 0,
      totalBytes: total || getSetting().totalBytes,
    });
  } else if (status === INSTALL.DOWNLOADED) {
    // Ready to install: ask for the restart, even if the dialog was hidden while it downloaded
    setApp({ status: APP_UPDATE_STATUS.DOWNLOADED, progress: 1, modalVisible: true });
  } else if (status === INSTALL.FAILED) {
    setApp({ status: APP_UPDATE_STATUS.ERROR, error: APP_UPDATE_MESSAGES.startFailed });
  } else if (status === INSTALL.CANCELED) {
    setApp({ status: APP_UPDATE_STATUS.AVAILABLE, cancelled: true, progress: 0 });
  }
};

// The result of the Google Play dialog: OK (user accepted) or cancelled (user said no / backed out)
const onNativeResult = result => {
  log(`Google Play dialog result: ${result} (6 = cancelled, 4 = accepted)`);
  if (Number(result) === INSTALL.CANCELED) {
    setApp({
      status: APP_UPDATE_STATUS.AVAILABLE,
      cancelled: true,
      progress: 0,
      error: null,
    });
  }
};

const ensureNativeListeners = () => {
  const lib = getClient();
  if (!lib || listenersAdded) {
    return;
  }
  lib.addStatusUpdateListener?.(onNativeStatus);
  lib.addIntentSelectionListener?.(onNativeResult);
  listenersAdded = true;
};

export const openStore = async () => {
  const { storeUrl } = getSetting();
  const fallbackId = APP_UPDATE_CONFIG.IOS_APP_STORE_ID;
  const candidates =
    Platform.OS === 'android'
      ? [`market://details?id=${getBundleId()}`, storeUrl || storeUrlForAndroid()]
      : [
          storeUrl,
          fallbackId ? `https://apps.apple.com/app/id${fallbackId}` : '',
        ].filter(Boolean);

  for (const url of candidates) {
    log('opening store:', url);
    try {
      await Linking.openURL(url);
      return true;
    } catch (error) {
      // try the next address
    }
  }
  setApp({ status: APP_UPDATE_STATUS.ERROR, error: APP_UPDATE_MESSAGES.noStoreLink });
  return false;
};

// "Update now". Android runs Google Play's flow in the app; iOS (and Android when Play cannot run
// one) opens the store page.
export const startAppUpdate = async ({ resume = false } = {}) => {
  const { kind } = getSetting();
  if (Platform.OS !== 'android') {
    return openStore();
  }
  if (!resume && (!kind || kind === UPDATE_KIND.STORE)) {
    return openStore();
  }
  const lib = getClient();
  if (!lib) {
    return openStore();
  }

  ensureNativeListeners();
  const immediate = resume || kind === UPDATE_KIND.IMMEDIATE;
  log(`starting ${immediate ? 'immediate' : 'flexible'} update${resume ? ' (resuming)' : ''}`);
  setApp({
    status: immediate ? APP_UPDATE_STATUS.UPDATING : APP_UPDATE_STATUS.DOWNLOADING,
    cancelled: false,
    error: null,
    progress: 0,
  });
  try {
    await lib.startUpdate({ updateType: immediate ? KIND_IMMEDIATE : KIND_FLEXIBLE });
    return true;
  } catch (error) {
    const message = String(error?.message ?? error);
    log('start failed:', message);
    // Google Play does not allow this type for the release: open the store page instead
    if (/unavailable|not allowed|type unavailable/i.test(message)) {
      setApp({ status: APP_UPDATE_STATUS.AVAILABLE, kind: UPDATE_KIND.STORE });
      return openStore();
    }
    failWith(error, APP_UPDATE_MESSAGES.startFailed);
    return false;
  }
};

// Android flexible update that finished downloading: restart to install it
export const completeFlexibleUpdate = () => {
  getClient()?.installUpdate?.();
};

// "Later" on the optional dialog
export const dismissAppUpdateDialog = () => setApp({ modalVisible: false });

// Opens the update dialog and checks (the Settings "Check for app update" row)
export const openAppUpdateCheck = () => {
  setApp({ modalVisible: true, source: 'manual' });
  return checkForAppUpdate({ source: 'manual' });
};

export const __resetAppUpdateForTests = () => {
  busy = false;
  pendingCheck = null;
  client = undefined;
  listenersAdded = false;
  promptedFor.clear();
  useAppUpdateStore.getState().resetAppUpdate();
};
