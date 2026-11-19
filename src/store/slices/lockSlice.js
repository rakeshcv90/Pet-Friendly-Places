import { getItem, setItem, STORAGE_KEYS } from '../../services/storage/storage';
import { disableAppLock } from '../../services/security/appLock';

const enabledAtStart = getItem(STORAGE_KEYS.APP_LOCK_ENABLED) === '1';

// App lock state. `appLockEnabled` is the user's setting; `isLocked` is whether the lock screen is
// up right now. The app starts locked when the lock is on and a session is saved.
export const createLockSlice = (set, get) => ({
  appLockEnabled: enabledAtStart,
  isLocked: enabledAtStart && !!getItem(STORAGE_KEYS.ACCESS_TOKEN),

  setAppLockEnabled: enabled => {
    setItem(STORAGE_KEYS.APP_LOCK_ENABLED, enabled ? '1' : '0');
    set({ appLockEnabled: enabled, isLocked: false });
  },

  // Called when the app comes back after a while away
  lockApp: () => {
    const state = get();
    if (state.appLockEnabled && state.isAuthenticated) {
      set({ isLocked: true });
    }
  },

  unlockApp: () => set({ isLocked: false }),

  // Sign-in prompts are shown one at a time, in order: permissions first, then the app-lock offer.
  // 'pending' = not decided yet, 'open' = the permissions sheet is up or about to be, 'done' = the
  // permissions step is over (answered, skipped, or not needed), so the lock offer may go.
  permissionsStep: 'pending',
  permissionsSheetOpen: false,
  setPermissionsStep: step => set({ permissionsStep: step }),
  setPermissionsSheetOpen: open => set({ permissionsSheetOpen: open }),
  // A new sign-in starts the sequence again
  resetPrompts: () => set({ permissionsStep: 'pending', permissionsSheetOpen: false }),

  // Turns the lock off completely (setting and the Keychain marker); used on sign-out
  clearAppLock: () => {
    setItem(STORAGE_KEYS.APP_LOCK_ENABLED, '0');
    disableAppLock();
    set({ appLockEnabled: false, isLocked: false });
  },
});
