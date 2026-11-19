// Each call loads the store fresh, as on a new app start
const startApp = ({ lock, token }) => {
  jest.resetModules();
  const storage = require('../../../services/storage/storage');
  if (lock !== undefined) {
    storage.setItem(storage.STORAGE_KEYS.APP_LOCK_ENABLED, lock ? '1' : '0');
  }
  if (token) {
    storage.setItem(storage.STORAGE_KEYS.ACCESS_TOKEN, token);
  }
  return { storage, useStore: require('../../index').useStore };
};

describe('app lock state', () => {
  it('starts unlocked when the user never turned the lock on', () => {
    const { useStore } = startApp({ token: 't' });

    expect(useStore.getState().appLockEnabled).toBe(false);
    expect(useStore.getState().isLocked).toBe(false);
  });

  it('turning it on later in Settings keeps it off the screen now, and locks the next start', () => {
    const { useStore } = startApp({ token: 't' });

    // The user skipped the offer after sign-in, then switches App Lock on in Settings
    useStore.getState().setAppLockEnabled(true);
    expect(useStore.getState().isLocked).toBe(false);

    // The choice is saved on the phone...
    const storage = require('../../../services/storage/storage');
    expect(storage.getItem(storage.STORAGE_KEYS.APP_LOCK_ENABLED)).toBe('1');

    // ...so the next time the app is opened it starts locked
    const next = startApp({ lock: true, token: 't' });
    expect(next.useStore.getState().appLockEnabled).toBe(true);
    expect(next.useStore.getState().isLocked).toBe(true);
  });

  it('locks when the app comes back after a while, once the lock is on', () => {
    const { useStore } = startApp({ token: 't' });
    useStore.setState({ isAuthenticated: true });
    useStore.getState().setAppLockEnabled(true);

    useStore.getState().lockApp();

    expect(useStore.getState().isLocked).toBe(true);
  });

  it('does not lock when the lock is off', () => {
    const { useStore } = startApp({ token: 't' });
    useStore.setState({ isAuthenticated: true });

    useStore.getState().lockApp();

    expect(useStore.getState().isLocked).toBe(false);
  });

  it('turns the lock off and forgets the sequence of prompts on sign-out', () => {
    const { useStore } = startApp({ lock: true, token: 't' });
    useStore.setState({ permissionsStep: 'done' });

    useStore.getState().logout();

    expect(useStore.getState().appLockEnabled).toBe(false);
    expect(useStore.getState().permissionsStep).toBe('pending');
  });
});
