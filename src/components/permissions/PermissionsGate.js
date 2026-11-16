import React, { useEffect } from 'react';

import { useStore } from '../../store';
import { PermissionsSheet } from './PermissionsSheet';
import { getItem, setItem, STORAGE_KEYS } from '../../services/storage/storage';
import { getPermissionStatuses } from '../../services/permissions/permissions';

// After the splash on a signed-in start, offers the permissions screen once. It is skipped when the
// phone already allowed (or cannot do) everything. The same sheet opens from Settings any time.
export const PermissionsGate = ({ ready = true, isDarkMode = false }) => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const isLocked = useStore(state => state.isLocked);
  const open = useStore(state => state.permissionsSheetOpen);
  const setOpen = useStore(state => state.setPermissionsSheetOpen);
  const step = useStore(state => state.permissionsStep);
  const setStep = useStore(state => state.setPermissionsStep);

  useEffect(() => {
    let cancelled = false;
    let timer;
    if (!ready || !isAuthenticated || isLocked || step !== 'pending') {
      return undefined;
    }
    // Claim the first slot straight away, so nothing else can pop up while the phone is checked
    if (getItem(STORAGE_KEYS.PERMISSIONS_OFFERED) === '1') {
      setStep('done');
      return undefined;
    }
    getPermissionStatuses().then(({ location, notifications }) => {
      if (cancelled) {
        return;
      }
      const needsAsk = [location, notifications].some(value => value === 'denied');
      if (!needsAsk) {
        setItem(STORAGE_KEYS.PERMISSIONS_OFFERED, '1');
        setStep('done');
        return;
      }
      // The app-lock offer waits for this step; let the screen settle before the sheet slides up
      setStep('open');
      timer = setTimeout(() => !cancelled && setOpen(true), 700);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ready, isAuthenticated, isLocked, step, setOpen, setStep]);

  const handleClose = () => {
    setItem(STORAGE_KEYS.PERMISSIONS_OFFERED, '1');
    setOpen(false);
    setStep('done');
  };

  return <PermissionsSheet visible={open} onClose={handleClose} isDarkMode={isDarkMode} />;
};
