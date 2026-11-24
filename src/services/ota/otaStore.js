import { create } from 'zustand';

// Where an over-the-air (OTA) update is right now. One shared state, so the automatic check that
// runs on start-up, the banner and the Check for updates sheet in the Profile menu always agree.
export const OTA_STATUS = {
  IDLE: 'idle',
  CHECKING: 'checking',
  UP_TO_DATE: 'upToDate',
  AVAILABLE: 'available',
  DOWNLOADING: 'downloading',
  INSTALLED: 'installed',
  OFFLINE: 'offline',
  ERROR: 'error',
  // Debug builds load their JS from Metro, so there is nothing to update
  DISABLED: 'disabled',
};

const initialState = {
  status: OTA_STATUS.IDLE,
  // { label, description, size, isMandatory, appVersion } of the update that was found
  update: null,
  // Download progress, 0 to 1
  progress: 0,
  error: null,
  // An update is installed and will apply the next time the app restarts
  restartPending: false,
  // ...and it is a mandatory one
  restartRequired: false,
  // 'auto' (start-up / resume) or 'manual' (Profile menu): the banner only reports automatic ones
  source: null,
  bannerDismissed: false,
  // The Check for Updates sheet is open: it shows the progress itself, so the banner stays away
  sheetOpen: false,
  lastCheckedAt: null,
};

export const useOtaStore = create(set => ({
  ...initialState,
  setOta: patch => set(patch),
  resetOta: () => set(initialState),
}));
