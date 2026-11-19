import React from 'react';
import { AppState } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AppLockGate, LOCK_AFTER_MS } from '../AppLockGate';
import { useStore } from '../../../store';
import * as Keychain from 'react-native-keychain';

jest.mock('../../../screens/Community/NightSky', () => ({ NightSky: () => null }));
jest.mock('../../../services/auth/signOut', () => ({ signOut: jest.fn(async () => true) }));

const setStore = state => act(() => useStore.setState(state));

describe('AppLockGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setStore({ isAuthenticated: true, appLockEnabled: true, isLocked: true });
  });

  it('shows the lock screen and unlocks when the phone check passes', async () => {
    Keychain.getGenericPassword.mockResolvedValueOnce({ username: 'lock', password: '1' });
    const { getByText } = render(<AppLockGate ready />);

    expect(getByText('PetFriendly is locked')).toBeTruthy();
    await waitFor(() => expect(useStore.getState().isLocked).toBe(false));
  });

  it('stays locked and says so when the check fails', async () => {
    Keychain.getGenericPassword.mockResolvedValue(false);
    const { findByText } = render(<AppLockGate ready />);

    expect(await findByText(/could not verify/i)).toBeTruthy();
    expect(useStore.getState().isLocked).toBe(true);
  });

  it('tries again when Unlock is tapped', async () => {
    Keychain.getGenericPassword.mockResolvedValueOnce(false);
    const { findByText, getByText } = render(<AppLockGate ready />);
    await findByText(/could not verify/i);

    Keychain.getGenericPassword.mockResolvedValueOnce({ username: 'lock', password: '1' });
    fireEvent.press(getByText('Unlock'));

    await waitFor(() => expect(useStore.getState().isLocked).toBe(false));
  });

  it('shows nothing when the lock is off', () => {
    setStore({ appLockEnabled: false, isLocked: false });
    const { queryByText } = render(<AppLockGate ready />);
    expect(queryByText('PetFriendly is locked')).toBeNull();
  });

  it('waits for the splash before asking for the check', () => {
    const { getByText } = render(<AppLockGate ready={false} />);
    expect(getByText('PetFriendly is locked')).toBeTruthy();
    expect(Keychain.getGenericPassword).not.toHaveBeenCalled();
  });

  describe('coming back from the background', () => {
    let listener;
    beforeEach(() => {
      jest.spyOn(AppState, 'addEventListener').mockImplementation((type, fn) => {
        listener = fn;
        return { remove: jest.fn() };
      });
      setStore({ isLocked: false });
    });
    afterEach(() => jest.restoreAllMocks());

    it('locks after a long time away', () => {
      const now = jest.spyOn(Date, 'now');
      render(<AppLockGate ready />);

      now.mockReturnValue(1000);
      act(() => listener('background'));
      now.mockReturnValue(1000 + LOCK_AFTER_MS + 1);
      act(() => listener('active'));

      expect(useStore.getState().isLocked).toBe(true);
    });

    it('does not lock after a quick switch', () => {
      const now = jest.spyOn(Date, 'now');
      render(<AppLockGate ready />);

      now.mockReturnValue(1000);
      act(() => listener('background'));
      now.mockReturnValue(1000 + 5000);
      act(() => listener('active'));

      expect(useStore.getState().isLocked).toBe(false);
    });
  });
});

describe('AppLockGate offer order', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => jest.useRealTimers());

  const signedInNoLock = step =>
    act(() =>
      useStore.setState({
        isAuthenticated: true,
        appLockEnabled: false,
        isLocked: false,
        permissionsStep: step,
        permissionsSheetOpen: false,
      }),
    );

  const settle = async () => {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000);
    });
  };

  it('does not offer the lock while the permissions step is still going', async () => {
    signedInNoLock('open');
    const { queryByText } = render(<AppLockGate ready />);

    await settle();

    expect(queryByText('Protect PetFriendly?')).toBeNull();
  });

  it('does not offer the lock while the permissions sheet is still showing', async () => {
    signedInNoLock('done');
    act(() => useStore.setState({ permissionsSheetOpen: true }));
    const { queryByText } = render(<AppLockGate ready />);

    await settle();

    expect(queryByText('Protect PetFriendly?')).toBeNull();
  });

  it('offers the lock after the permissions step is over, with a pause first', async () => {
    signedInNoLock('pending');
    const { queryByText } = render(<AppLockGate ready />);
    await settle();
    expect(queryByText('Protect PetFriendly?')).toBeNull();

    // The permissions step finishes: the offer follows
    signedInNoLock('done');
    expect(queryByText('Protect PetFriendly?')).toBeNull();
    await settle();

    expect(queryByText('Protect PetFriendly?')).toBeTruthy();
  });
});
