import { useEffect } from 'react';
import { AppState } from 'react-native';
import { APP_UPDATE_CONFIG } from '../config/appUpdate';
import { useAppUpdateStore } from '../services/appUpdate/appUpdateStore';
import {
  applyCachedPolicy,
  autoCheckAppUpdate,
  checkForAppUpdate,
  completeFlexibleUpdate,
  dismissAppUpdateDialog,
  getInstalledApp,
  openAppUpdateCheck,
  openStore,
  startAppUpdate,
} from '../services/appUpdate/InAppUpdateService';

// The shared store-update state plus its actions, for the dialog, the blocking screen and Settings
export const useInAppUpdate = () => {
  const state = useAppUpdateStore();
  return {
    ...state,
    check: () => checkForAppUpdate({ source: 'manual' }),
    openCheck: openAppUpdateCheck,
    update: startAppUpdate,
    restart: completeFlexibleUpdate,
    openStore,
    later: dismissAppUpdateDialog,
  };
};

// Looks for a Google Play / App Store update at start-up and when the app returns to the
// foreground. The service throttles it, never overlaps checks, and never blocks start-up: the
// first check waits a moment after the app has started.
export const useAppUpdateAutoCheck = ({ startDelayMs = APP_UPDATE_CONFIG.START_DELAY_MS } = {}) => {
  useEffect(() => {
    // A version known to be too old is blocked from the first screen, before any network call
    applyCachedPolicy();
    const timer = setTimeout(() => autoCheckAppUpdate({ force: true }), startDelayMs);
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') {
        autoCheckAppUpdate();
      }
    });
    return () => {
      clearTimeout(timer);
      subscription?.remove?.();
    };
  }, [startDelayMs]);
};

// "v1.0 (12)": the installed native version and build, for the Settings row
export const useAppVersionLabel = () => {
  const { version, build } = getInstalledApp();
  if (!version) {
    return '';
  }
  return build ? `v${version} (${build})` : `v${version}`;
};
