import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useOtaStore } from '../services/ota/otaStore';
import { isNativeUpdateBlocking } from '../services/appUpdate/appUpdateStore';
import {
  autoUpdate,
  checkForUpdates,
  downloadAndInstall,
  dismissBanner,
  getVersionInfo,
  restartApp,
} from '../services/ota/otaService';

// The shared OTA state plus its actions, for the Check for Updates sheet and the banner
export const useOtaUpdate = () => {
  const state = useOtaStore();
  return {
    status: state.status,
    update: state.update,
    progress: state.progress,
    error: state.error,
    restartPending: state.restartPending,
    restartRequired: state.restartRequired,
    source: state.source,
    bannerDismissed: state.bannerDismissed,
    sheetOpen: state.sheetOpen,
    check: () => checkForUpdates({ source: 'manual' }),
    download: downloadAndInstall,
    restart: restartApp,
    dismissBanner,
  };
};

// Looks for an update when the app starts and each time it returns to the foreground. The service
// skips the check when one ran recently, when an update is waiting for a restart, and in debug.
export const useOtaAutoUpdate = ({ startDelayMs = 4000 } = {}) => {
  useEffect(() => {
    // Let the app finish starting before using the network and the disk for an update
    // A required Google Play / App Store update always comes first: no OTA download meanwhile
    const run = () => {
      if (!isNativeUpdateBlocking()) {
        autoUpdate();
      }
    };
    const timer = setTimeout(run, startDelayMs);
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') {
        run();
      }
    });
    return () => {
      clearTimeout(timer);
      subscription?.remove?.();
    };
  }, [startDelayMs]);
};

// Native app version and the OTA release running now, for the Profile menu row
export const useOtaVersionInfo = () => {
  const [info, setInfo] = useState({ appVersion: '', label: '', description: '' });
  useEffect(() => {
    let active = true;
    getVersionInfo().then(next => {
      if (active) {
        setInfo(next);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  return info;
};
