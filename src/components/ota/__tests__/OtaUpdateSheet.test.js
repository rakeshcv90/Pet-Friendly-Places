import React from 'react';
import codePush from '@revopush/react-native-code-push';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { OtaUpdateSheet } from '../OtaUpdateSheet';
import { useOtaStore } from '../../../services/ota/otaStore';
import { __resetOtaForTests } from '../../../services/ota/otaService';

const originalDev = global.__DEV__;

const makeRemote = (overrides = {}) => {
  const local = { install: jest.fn().mockResolvedValue(undefined) };
  const remote = {
    label: 'v7',
    description: 'Faster home screen and a fix for saved places',
    packageSize: 3 * 1024 * 1024,
    isMandatory: false,
    appVersion: '1.0',
    failedInstall: false,
    download: jest.fn(async onProgress => {
      onProgress({ receivedBytes: 30, totalBytes: 100 });
      return local;
    }),
    ...overrides,
  };
  return { remote, local };
};

const open = (props = {}) => render(<OtaUpdateSheet visible onClose={jest.fn()} {...props} />);

describe('OtaUpdateSheet (Settings > Check for Updates)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.__DEV__ = false;
    __resetOtaForTests();
    codePush.checkForUpdate.mockResolvedValue(null);
    codePush.getConfiguration.mockResolvedValue({ appVersion: '1.0' });
    codePush.getUpdateMetadata.mockResolvedValue(null);
  });

  afterAll(() => {
    global.__DEV__ = originalDev;
  });

  it('checks as soon as it opens, showing a spinner while it does', async () => {
    let release;
    codePush.checkForUpdate.mockReturnValue(new Promise(resolve => (release = resolve)));
    const { getByTestId, getByText } = open();

    expect(codePush.checkForUpdate).toHaveBeenCalledTimes(1);
    expect(getByTestId('ota-spinner')).toBeTruthy();
    expect(getByText('Checking for updates…')).toBeTruthy();

    await act(async () => release(null));
  });

  it('says the app is up to date, with the version', async () => {
    codePush.getUpdateMetadata.mockResolvedValue({ label: 'v5' });
    const { findByText } = open();

    expect(await findByText('Your app is up to date')).toBeTruthy();
    expect(await findByText('Version 1.0 · Update v5')).toBeTruthy();
  });

  it('shows the update details when one is available', async () => {
    codePush.checkForUpdate.mockResolvedValue(makeRemote().remote);
    const { findByText, getByText, queryByText } = open();

    expect(await findByText('Update available')).toBeTruthy();
    expect(getByText('v7 · 3.0 MB')).toBeTruthy();
    expect(getByText('Faster home screen and a fix for saved places')).toBeTruthy();
    expect(queryByText('Required')).toBeNull();
  });

  it('marks a mandatory update as required and does not offer to skip it', async () => {
    codePush.checkForUpdate.mockResolvedValue(makeRemote({ isMandatory: true }).remote);
    const { findByText, getByText, queryByTestId } = open();

    expect(await findByText('Required update available')).toBeTruthy();
    expect(getByText('Required')).toBeTruthy();
    expect(queryByTestId('ota-later')).toBeNull();
  });

  it('downloads on request, then offers a restart without restarting by itself', async () => {
    const { remote, local } = makeRemote();
    codePush.checkForUpdate.mockResolvedValue(remote);
    const { findByTestId, findByText, getByTestId } = open();

    fireEvent.press(await findByTestId('ota-download'));

    // download() reports 30% and the sheet shows it
    await waitFor(() => expect(remote.download).toHaveBeenCalled());
    expect(await findByText('Update installed')).toBeTruthy();
    expect(local.install).toHaveBeenCalledWith(codePush.InstallMode.ON_NEXT_SUSPEND, 30);
    expect(
      await findByText('It applies by itself when you leave the app for a moment. Restart to use it right away.'),
    ).toBeTruthy();
    expect(codePush.restartApp).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('ota-restart'));
    expect(codePush.restartApp).toHaveBeenCalledWith(true);
  });

  it('shows the download progress bar while downloading', async () => {
    const { remote } = makeRemote();
    let finish;
    remote.download.mockImplementation(async onProgress => {
      onProgress({ receivedBytes: 40, totalBytes: 100 });
      await new Promise(resolve => (finish = resolve));
      return { install: jest.fn().mockResolvedValue(undefined) };
    });
    codePush.checkForUpdate.mockResolvedValue(remote);
    const { findByTestId, getByText, getByTestId } = open();

    fireEvent.press(await findByTestId('ota-download'));
    await waitFor(() => expect(getByText('40%')).toBeTruthy());
    expect(getByText('Downloading update…')).toBeTruthy();
    expect(getByTestId('ota-progress-fill').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '40%' })]),
    );

    await act(async () => finish());
  });

  it('lets the user postpone: Later closes the sheet', async () => {
    const onClose = jest.fn();
    codePush.checkForUpdate.mockResolvedValue(makeRemote().remote);
    const { findByTestId } = open({ onClose });

    fireEvent.press(await findByTestId('ota-download'));
    fireEvent.press(await findByTestId('ota-later'));

    expect(onClose).toHaveBeenCalled();
    expect(codePush.restartApp).not.toHaveBeenCalled();
  });

  it('explains being offline and retries the check', async () => {
    codePush.checkForUpdate.mockRejectedValueOnce(new Error('Network request failed'));
    const { findByText, getByTestId } = open();

    expect(await findByText("You're offline")).toBeTruthy();
    expect(await findByText("You're offline. Connect to the internet and try again.")).toBeTruthy();

    codePush.checkForUpdate.mockResolvedValueOnce(null);
    fireEvent.press(getByTestId('ota-retry'));
    expect(await findByText('Your app is up to date')).toBeTruthy();
  });

  it('reports a failed install and lets the user try again', async () => {
    const { remote, local } = makeRemote();
    local.install.mockRejectedValueOnce(new Error('disk full'));
    codePush.checkForUpdate.mockResolvedValue(remote);
    const { findByTestId, findByText } = open();

    fireEvent.press(await findByTestId('ota-download'));
    expect(await findByText('Something went wrong')).toBeTruthy();
    expect(await findByText(/Your app is unchanged/)).toBeTruthy();

    fireEvent.press(await findByTestId('ota-retry'));
    expect(await findByText('Update installed')).toBeTruthy();
  });

  it('explains that development builds have no updates', async () => {
    global.__DEV__ = true;
    const { findByText } = open();

    expect(await findByText('Updates unavailable')).toBeTruthy();
    expect(codePush.checkForUpdate).not.toHaveBeenCalled();
  });

  it('tells the banner to stay away while open and releases it on close', async () => {
    const { rerender } = open();
    expect(useOtaStore.getState().sheetOpen).toBe(true);

    rerender(<OtaUpdateSheet visible={false} onClose={jest.fn()} />);
    expect(useOtaStore.getState().sheetOpen).toBe(false);
  });

  it('shows an update that is already installed and waiting for a restart', async () => {
    useOtaStore.setState({ restartPending: true, status: 'installed' });
    const { findByText, getByTestId } = open();

    expect(await findByText('Update installed')).toBeTruthy();
    expect(codePush.checkForUpdate).not.toHaveBeenCalled();
    expect(getByTestId('ota-restart')).toBeTruthy();
  });
});
