import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { AppUpdateModal } from '../AppUpdateModal';
import { APP_UPDATE_STATUS, UPDATE_KIND, useAppUpdateStore } from '../../../services/appUpdate/appUpdateStore';
import * as service from '../../../services/appUpdate/InAppUpdateService';

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');

jest.mock('../../../services/appUpdate/InAppUpdateService', () => ({
  ...jest.requireActual('../../../services/appUpdate/InAppUpdateService'),
  checkForAppUpdate: jest.fn().mockResolvedValue(undefined),
  startAppUpdate: jest.fn(),
  completeFlexibleUpdate: jest.fn(),
  openAppUpdateCheck: jest.fn(),
  openStore: jest.fn(),
}));

const setApp = patch => act(() => useAppUpdateStore.getState().setAppUpdate(patch));

const open = patch =>
  setApp({
    modalVisible: true,
    installedVersion: '1.0',
    installedBuild: '1',
    ...patch,
  });

describe('AppUpdateModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppUpdateStore.getState().resetAppUpdate();
  });

  it('is hidden until something opens it', () => {
    const { queryByTestId } = render(<AppUpdateModal />);

    expect(queryByTestId('app-update-modal')).toBeNull();
  });

  it('shows a spinner while it checks', () => {
    const { getByTestId, getByText } = render(<AppUpdateModal />);

    open({ status: APP_UPDATE_STATUS.CHECKING });

    expect(getByTestId('app-update-spinner')).toBeTruthy();
    expect(getByText('Checking for updates…')).toBeTruthy();
  });

  it('says the app is up to date, with the installed version', () => {
    const { getByText } = render(<AppUpdateModal />);

    open({ status: APP_UPDATE_STATUS.UP_TO_DATE });

    expect(getByText('Your app is up to date')).toBeTruthy();
    expect(getByText('Version 1.0 (1)')).toBeTruthy();
  });

  describe('an optional update', () => {
    beforeEach(() => {
      open({
        status: APP_UPDATE_STATUS.AVAILABLE,
        kind: UPDATE_KIND.FLEXIBLE,
        storeVersion: '1.5.0',
        releaseNotes: 'Faster maps and a new trips page',
        totalBytes: 5 * 1024 * 1024,
      });
    });

    it('shows the installed and the available version and the notes', () => {
      const { getByTestId, getByText } = render(<AppUpdateModal />);

      expect(getByText('Update available')).toBeTruthy();
      expect(getByTestId('app-update-installed').props.children).toBe('1.0 (1)');
      expect(getByTestId('app-update-available').props.children).toBe('1.5.0');
      expect(getByText('Faster maps and a new trips page')).toBeTruthy();
    });

    it('starts the update from Update now', () => {
      const { getByTestId } = render(<AppUpdateModal />);

      fireEvent.press(getByTestId('app-update-now'));

      expect(service.startAppUpdate).toHaveBeenCalledTimes(1);
    });

    it('closes on Later and lets the user carry on', () => {
      const { getByTestId, queryByTestId } = render(<AppUpdateModal />);

      fireEvent.press(getByTestId('app-update-later'));

      expect(useAppUpdateStore.getState().modalVisible).toBe(false);
      expect(queryByTestId('app-update-modal')).toBeNull();
    });

    it('mentions a cancelled update', () => {
      const { getByText } = render(<AppUpdateModal />);

      setApp({ cancelled: true });

      expect(getByText('The update was cancelled.')).toBeTruthy();
    });
  });

  it('shows the progress of a flexible download, and lets the user keep using the app', () => {
    const { getByTestId, getByText } = render(<AppUpdateModal />);

    open({ status: APP_UPDATE_STATUS.DOWNLOADING, progress: 0.4 });

    expect(getByText('Downloading update…')).toBeTruthy();
    expect(getByTestId('app-update-percent').props.children).toEqual([40, '%']);
    expect(StyleSheet.flatten(getByTestId('app-update-progress-fill').props.style).width).toBe('40%');

    fireEvent.press(getByTestId('app-update-hide'));
    expect(useAppUpdateStore.getState().modalVisible).toBe(false);
  });

  it('offers Restart to update once the download is done', () => {
    const { getByTestId, getByText } = render(<AppUpdateModal />);

    open({ status: APP_UPDATE_STATUS.DOWNLOADED, progress: 1 });

    expect(getByText('Update ready')).toBeTruthy();
    fireEvent.press(getByTestId('app-update-restart'));
    expect(service.completeFlexibleUpdate).toHaveBeenCalledTimes(1);
  });

  it('shows Google Play working during an immediate update, with no buttons to leave', () => {
    const { getByText, queryByTestId } = render(<AppUpdateModal />);

    open({ status: APP_UPDATE_STATUS.UPDATING });

    expect(getByText('Updating…')).toBeTruthy();
    expect(queryByTestId('app-update-close')).toBeNull();
  });

  it('explains when there is no store listing to check', () => {
    const { getByText } = render(<AppUpdateModal />);

    open({
      status: APP_UPDATE_STATUS.UNAVAILABLE,
      error: "This app isn't on the store yet, so there is nothing to compare with.",
    });

    expect(getByText(/isn't on the store yet/)).toBeTruthy();
  });

  it.each([
    [APP_UPDATE_STATUS.OFFLINE, "You're offline", "You're offline. Connect to the internet and try again."],
    [APP_UPDATE_STATUS.ERROR, 'Something went wrong', "We couldn't check for updates right now. Please try again."],
  ])('handles %s with a retry', (status, title, message) => {
    const { getByText, getByTestId } = render(<AppUpdateModal />);

    open({ status, error: message });

    expect(getByText(title)).toBeTruthy();
    expect(getByText(message)).toBeTruthy();
    fireEvent.press(getByTestId('app-update-retry'));
    expect(service.checkForAppUpdate).toHaveBeenCalledWith({ source: 'manual' });
  });

  it('gives way to the required-update screen', () => {
    const { queryByTestId } = render(<AppUpdateModal />);

    open({ status: APP_UPDATE_STATUS.AVAILABLE, mandatory: true });

    expect(queryByTestId('app-update-modal')).toBeNull();
  });
});
