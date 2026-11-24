import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { MandatoryUpdateScreen } from '../MandatoryUpdateScreen';
import { APP_UPDATE_STATUS, UPDATE_KIND, useAppUpdateStore } from '../../../services/appUpdate/appUpdateStore';
import * as service from '../../../services/appUpdate/InAppUpdateService';

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');

jest.mock('../../../services/appUpdate/InAppUpdateService', () => ({
  ...jest.requireActual('../../../services/appUpdate/InAppUpdateService'),
  checkForAppUpdate: jest.fn().mockResolvedValue(undefined),
  startAppUpdate: jest.fn(),
}));

const setApp = patch => act(() => useAppUpdateStore.getState().setAppUpdate(patch));

const block = patch =>
  setApp({
    mandatory: true,
    minimumVersion: '1.2.0',
    installedVersion: '1.0',
    installedBuild: '1',
    storeVersion: '1.5.0',
    status: APP_UPDATE_STATUS.AVAILABLE,
    kind: UPDATE_KIND.STORE,
    ...patch,
  });

describe('MandatoryUpdateScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppUpdateStore.getState().resetAppUpdate();
  });

  it('is not there while the installed version is supported', () => {
    const { queryByTestId } = render(<MandatoryUpdateScreen />);

    expect(queryByTestId('mandatory-update-screen')).toBeNull();
  });

  it('replaces the app with an Update required screen, naming the versions', () => {
    const { getByTestId, getByText } = render(<MandatoryUpdateScreen />);

    block();

    expect(getByTestId('mandatory-update-screen')).toBeTruthy();
    expect(getByText('Update required')).toBeTruthy();
    expect(getByTestId('mandatory-update-message').props.children).toMatch(/version 1\.2\.0 or newer/);
    expect(getByTestId('app-update-installed').props.children).toBe('1.0 (1)');
    expect(getByTestId('app-update-available').props.children).toBe('1.5.0');
  });

  it('starts the update from Update now', () => {
    const { getByTestId } = render(<MandatoryUpdateScreen />);
    block();

    fireEvent.press(getByTestId('mandatory-update-now'));

    expect(service.startAppUpdate).toHaveBeenCalledTimes(1);
  });

  it('checks again on request', () => {
    const { getByTestId } = render(<MandatoryUpdateScreen />);
    block();

    fireEvent.press(getByTestId('mandatory-update-retry'));

    expect(service.checkForAppUpdate).toHaveBeenCalledWith({ source: 'manual' });
  });

  it('has no way past it: no Later or Close button', () => {
    const { queryByText } = render(<MandatoryUpdateScreen />);
    block();

    expect(queryByText('Later')).toBeNull();
    expect(queryByText('Close')).toBeNull();
    expect(queryByText('Not now')).toBeNull();
  });

  it('explains being offline and offers only Try again', () => {
    const { getByTestId, queryByTestId } = render(<MandatoryUpdateScreen />);
    block({ status: APP_UPDATE_STATUS.OFFLINE, error: "You're offline. Connect to the internet and try again." });

    expect(getByTestId('mandatory-update-message').props.children).toMatch(/offline/i);
    expect(queryByTestId('mandatory-update-now')).toBeNull();
    fireEvent.press(getByTestId('mandatory-update-retry'));
    expect(service.checkForAppUpdate).toHaveBeenCalled();
  });

  it('says so when the user cancelled the update, and offers it again', () => {
    const { getByTestId } = render(<MandatoryUpdateScreen />);
    block({ cancelled: true });

    expect(getByTestId('mandatory-update-message').props.children).toMatch(/required to continue/);
    expect(getByTestId('mandatory-update-now')).toBeTruthy();
  });

  it('shows the work while Google Play updates, with no buttons to tap', () => {
    const { getByTestId, queryByTestId } = render(<MandatoryUpdateScreen />);
    block({ status: APP_UPDATE_STATUS.UPDATING });

    expect(getByTestId('mandatory-update-spinner')).toBeTruthy();
    expect(queryByTestId('mandatory-update-now')).toBeNull();
  });

  it('says when the store update is not there yet', () => {
    const { getByTestId } = render(<MandatoryUpdateScreen />);
    block({ status: APP_UPDATE_STATUS.UNAVAILABLE, storeVersion: '' });

    expect(getByTestId('mandatory-update-message').props.children).toMatch(/not available in the store yet/);
  });

  it('goes away once the version is no longer blocked', () => {
    const { queryByTestId } = render(<MandatoryUpdateScreen />);
    block();
    expect(queryByTestId('mandatory-update-screen')).toBeTruthy();

    setApp({ mandatory: false });

    expect(queryByTestId('mandatory-update-screen')).toBeNull();
  });
});
