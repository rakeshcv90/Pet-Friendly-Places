import React from 'react';
import codePush from '@revopush/react-native-code-push';
import { render, fireEvent, act } from '@testing-library/react-native';
import { OtaUpdateBanner } from '../OtaUpdateBanner';
import { useOtaStore, OTA_STATUS } from '../../../services/ota/otaStore';
import { useAppUpdateStore } from '../../../services/appUpdate/appUpdateStore';

const setOta = patch => act(() => useOtaStore.setState(patch));

describe('OtaUpdateBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOtaStore.getState().resetOta();
    useAppUpdateStore.getState().resetAppUpdate();
  });

  it('shows nothing when there is nothing to report', () => {
    const { queryByTestId } = render(<OtaUpdateBanner />);
    expect(queryByTestId('ota-banner')).toBeNull();

    setOta({ status: OTA_STATUS.UP_TO_DATE });
    expect(queryByTestId('ota-banner')).toBeNull();
    setOta({ status: OTA_STATUS.CHECKING, source: 'auto' });
    expect(queryByTestId('ota-banner')).toBeNull();
  });

  it('shows the progress of an automatic download', () => {
    const { getByText } = render(<OtaUpdateBanner />);
    setOta({ status: OTA_STATUS.DOWNLOADING, source: 'auto', progress: 0.42 });

    expect(getByText('Downloading update… 42%')).toBeTruthy();
  });

  it('leaves a download started from Settings to the sheet', () => {
    const { queryByTestId } = render(<OtaUpdateBanner />);
    setOta({ status: OTA_STATUS.DOWNLOADING, source: 'manual', progress: 0.5 });

    expect(queryByTestId('ota-banner')).toBeNull();
  });

  it('says an optional update is ready, and restarts early only on a tap', () => {
    const { getByText, getByTestId } = render(<OtaUpdateBanner />);
    setOta({ status: OTA_STATUS.INSTALLED, restartPending: true, restartRequired: false });

    expect(getByText('Update ready. The app updates itself when you leave it for a moment, or restart now.')).toBeTruthy();
    expect(codePush.restartApp).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('ota-banner-restart'));
    expect(codePush.restartApp).toHaveBeenCalledWith(true);
  });

  it('lets an optional update be dismissed', () => {
    const { getByTestId, queryByTestId } = render(<OtaUpdateBanner />);
    setOta({ status: OTA_STATUS.INSTALLED, restartPending: true });

    fireEvent.press(getByTestId('ota-banner-dismiss'));
    expect(queryByTestId('ota-banner')).toBeNull();
  });

  it('keeps a required update in view, without a dismiss button', () => {
    const { getByText, queryByTestId, getByTestId } = render(<OtaUpdateBanner />);
    setOta({ status: OTA_STATUS.INSTALLED, restartPending: true, restartRequired: true });

    expect(getByText(/A required update is ready/)).toBeTruthy();
    expect(queryByTestId('ota-banner-dismiss')).toBeNull();
    expect(getByTestId('ota-banner-restart')).toBeTruthy();
  });

  it('reports a failed automatic update once, and stays quiet when merely offline', () => {
    const { getByText, queryByTestId, getByTestId } = render(<OtaUpdateBanner />);

    setOta({ status: OTA_STATUS.OFFLINE, source: 'auto', error: "You're offline." });
    expect(queryByTestId('ota-banner')).toBeNull();

    setOta({ status: OTA_STATUS.ERROR, source: 'auto', error: 'We could not install the update.' });
    expect(getByText('We could not install the update.')).toBeTruthy();

    fireEvent.press(getByTestId('ota-banner-dismiss'));
    expect(queryByTestId('ota-banner')).toBeNull();
  });

  it('stays out of the way while the Check for Updates sheet is open', () => {
    const { queryByTestId } = render(<OtaUpdateBanner />);
    setOta({ status: OTA_STATUS.INSTALLED, restartPending: true, sheetOpen: true });

    expect(queryByTestId('ota-banner')).toBeNull();
  });

  describe('with a Google Play / App Store update', () => {
    it('stays quiet while the store update dialog is open: one update message at a time', () => {
      const { queryByTestId } = render(<OtaUpdateBanner />);
      setOta({ restartPending: true, source: 'auto' });
      expect(queryByTestId('ota-banner')).toBeTruthy();

      act(() => useAppUpdateStore.getState().setAppUpdate({ modalVisible: true }));
      expect(queryByTestId('ota-banner')).toBeNull();

      act(() => useAppUpdateStore.getState().setAppUpdate({ modalVisible: false }));
      expect(queryByTestId('ota-banner')).toBeTruthy();
    });

    it('stays quiet while a required store update blocks the app', () => {
      const { queryByTestId } = render(<OtaUpdateBanner />);
      setOta({ restartPending: true, source: 'auto' });

      act(() => useAppUpdateStore.getState().setAppUpdate({ mandatory: true }));

      expect(queryByTestId('ota-banner')).toBeNull();
    });
  });
});
