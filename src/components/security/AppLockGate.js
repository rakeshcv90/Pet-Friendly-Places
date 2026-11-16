import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useStore } from '../../store';
import { LockScreen } from './LockScreen';
import { Loader } from '../common/Loader';
import { ModernConfirmModal } from '../../screens/Profile/components/ModernConfirmModal';
import { signOut } from '../../services/auth/signOut';
import { getItem, setItem, STORAGE_KEYS } from '../../services/storage/storage';
import { enableAppLock, isAppLockSupported } from '../../services/security/appLock';

// Locks again when the app was in the background for this long. A quick switch to another app
// and back does not ask again.
export const LOCK_AFTER_MS = 60 * 1000;

// Pause between the permissions sheet closing and the lock offer appearing
export const OFFER_DELAY_MS = 600;

// Sits above the navigation: shows the lock screen when needed, re-locks after a spell in the
// background, and once offers to turn the lock on after sign-in.
export const AppLockGate = ({ ready = true, isDarkMode = false }) => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const appLockEnabled = useStore(state => state.appLockEnabled);
  const isLocked = useStore(state => state.isLocked);
  const lockApp = useStore(state => state.lockApp);
  const unlockApp = useStore(state => state.unlockApp);
  const setAppLockEnabled = useStore(state => state.setAppLockEnabled);
  const permissionsStep = useStore(state => state.permissionsStep);
  const permissionsSheetOpen = useStore(state => state.permissionsSheetOpen);

  const [signingOut, setSigningOut] = useState(false);
  const [offerVisible, setOfferVisible] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const leftAt = useRef(null);

  // Lock again after time away. Only 'background' counts: 'inactive' also fires for the unlock
  // prompt itself.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'background') {
        leftAt.current = Date.now();
      } else if (next === 'active' && leftAt.current) {
        const away = Date.now() - leftAt.current;
        leftAt.current = null;
        if (away >= LOCK_AFTER_MS) {
          lockApp();
        }
      }
    });
    return () => subscription.remove();
  }, [lockApp]);

  // After sign-in, offer the lock once (if the phone can do it)
  useEffect(() => {
    let cancelled = false;
    let timer;
    // Only after the permissions step is over, and never while its sheet is still up
    const permissionsOver = permissionsStep === 'done' && !permissionsSheetOpen;
    if (!ready || !isAuthenticated || appLockEnabled || isLocked || !permissionsOver) {
      return undefined;
    }
    if (getItem(STORAGE_KEYS.APP_LOCK_OFFERED) === '1') {
      return undefined;
    }
    isAppLockSupported().then(supported => {
      if (supported && !cancelled) {
        // A short pause after the previous popup closes, so they never feel stacked
        timer = setTimeout(() => !cancelled && setOfferVisible(true), OFFER_DELAY_MS);
      }
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ready, isAuthenticated, appLockEnabled, isLocked, permissionsStep, permissionsSheetOpen]);

  const closeOffer = () => {
    setItem(STORAGE_KEYS.APP_LOCK_OFFERED, '1');
    setOfferVisible(false);
  };

  const turnOn = async () => {
    closeOffer();
    setEnabling(true);
    if (await enableAppLock()) {
      setAppLockEnabled(true);
    }
    setEnabling(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  };

  return (
    <>
      {isAuthenticated && appLockEnabled && isLocked ? (
        <LockScreen autoPrompt={ready} onUnlock={unlockApp} onSignOut={handleSignOut} />
      ) : null}
      <ModernConfirmModal
        visible={offerVisible}
        onClose={closeOffer}
        onConfirm={turnOn}
        title="Protect PetFriendly?"
        subtitle="Ask for your fingerprint, face or phone lock each time you open the app. You can change this any time in Settings."
        badge="APP LOCK"
        type="success"
        confirmText="Turn On"
        cancelText="Not Now"
        isDarkMode={isDarkMode}
      />
      <Loader
        visible={signingOut || enabling}
        title={signingOut ? 'Signing out…' : 'Setting up…'}
      />
    </>
  );
};
