import { create } from 'zustand';

// Where a Google Play / App Store update is right now. One shared state, so the automatic check,
// the update dialog, the blocking "Update required" screen and the Settings row always agree.
// (JavaScript OTA updates have their own state in services/ota: the two never share it.)
export const APP_UPDATE_STATUS = {
  IDLE: 'idle',
  CHECKING: 'checking',
  UP_TO_DATE: 'upToDate',
  AVAILABLE: 'available',
  // Android flexible update: Google Play is downloading it while the app stays usable
  DOWNLOADING: 'downloading',
  // Android flexible update downloaded: a restart installs it
  DOWNLOADED: 'downloaded',
  // Android immediate update: Google Play's full-screen flow is running
  UPDATING: 'updating',
  OFFLINE: 'offline',
  ERROR: 'error',
  // No store listing to compare with: not published yet, or not installed from the store
  UNAVAILABLE: 'unavailable',
};

// How the update is delivered
export const UPDATE_KIND = {
  FLEXIBLE: 'flexible',
  IMMEDIATE: 'immediate',
  // Open the store page (iOS always, Android when Play cannot run an in-app update)
  STORE: 'store',
};

const initialState = {
  status: APP_UPDATE_STATUS.IDLE,
  // Installed native app: name ("1.4.0") and build number (Android versionCode / iOS build)
  installedVersion: '',
  installedBuild: '',
  // Newest version in the store, as text to show ("1.5.0" or "Build 12")
  storeVersion: '',
  releaseNotes: '',
  // Where to open the store page
  storeUrl: '',
  kind: null,
  // Google Play update priority, 0 to 5
  priority: 0,
  totalBytes: 0,
  // Download progress, 0 to 1
  progress: 0,
  // Below the minimum supported version: the app is blocked until it is updated
  mandatory: false,
  minimumVersion: '',
  // Reason for UNAVAILABLE: 'notPublished' | 'notFromStore'
  reason: null,
  error: null,
  // The user dismissed the in-app flow (Android) so the screen can say so
  cancelled: false,
  // The update dialog is open
  modalVisible: false,
  // 'auto' (start-up / resume) or 'manual' (Settings)
  source: null,
  lastCheckedAt: null,
};

export const useAppUpdateStore = create(set => ({
  ...initialState,
  setAppUpdate: patch => set(patch),
  resetAppUpdate: () => set(initialState),
}));

// True while the app must not be used until it is updated. Used by the OTA code too, so that
// a required native update always comes first.
export const isNativeUpdateBlocking = () => useAppUpdateStore.getState().mandatory;
