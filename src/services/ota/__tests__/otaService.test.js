import codePush from '@revopush/react-native-code-push';
import { useOtaStore, OTA_STATUS } from '../otaStore';
import {
  AUTO_CHECK_INTERVAL_MS,
  MANDATORY_BACKGROUND_SECONDS,
  OPTIONAL_BACKGROUND_SECONDS,
  OTA_MESSAGES,
  __resetOtaForTests,
  autoUpdate,
  checkForUpdates,
  downloadAndInstall,
  formatBytes,
  getVersionInfo,
  isOfflineError,
  isOtaSupported,
  restartApp,
} from '../otaService';

const originalDev = global.__DEV__;

// A RemotePackage as the SDK returns it, with a download that reports progress
const makeRemote = (overrides = {}) => {
  const local = { install: jest.fn().mockResolvedValue(undefined) };
  const remote = {
    label: 'v3',
    description: 'Fixes the home screen',
    packageSize: 2 * 1024 * 1024,
    isMandatory: false,
    appVersion: '1.0',
    failedInstall: false,
    download: jest.fn(async onProgress => {
      onProgress({ receivedBytes: 50, totalBytes: 100 });
      onProgress({ receivedBytes: 100, totalBytes: 100 });
      return local;
    }),
    ...overrides,
  };
  return { remote, local };
};

const state = () => useOtaStore.getState();

describe('otaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.__DEV__ = false; // OTA only runs in release builds
    __resetOtaForTests();
    codePush.checkForUpdate.mockResolvedValue(null);
  });

  afterAll(() => {
    global.__DEV__ = originalDev;
  });

  describe('support', () => {
    it('is off in debug builds, where Metro serves the JS', async () => {
      global.__DEV__ = true;
      expect(isOtaSupported()).toBe(false);

      await checkForUpdates();
      expect(codePush.checkForUpdate).not.toHaveBeenCalled();
      expect(state().status).toBe(OTA_STATUS.DISABLED);
      expect(state().error).toBe(OTA_MESSAGES.disabled);
    });

    it('is on in release builds', () => {
      expect(isOtaSupported()).toBe(true);
    });

    it('recognises network failures', () => {
      expect(isOfflineError(new Error('Network request failed'))).toBe(true);
      expect(isOfflineError(new Error('timeout of 15000ms exceeded'))).toBe(true);
      expect(isOfflineError(new Error('Failed to fetch'))).toBe(true);
      expect(isOfflineError(new Error('Unable to resolve host "api.revopush.org"'))).toBe(true);
      expect(isOfflineError(new Error('Invalid deployment key'))).toBe(false);
    });
  });

  describe('checkForUpdates', () => {
    it('reports an app that is up to date', async () => {
      const result = await checkForUpdates();

      expect(result).toBeNull();
      expect(state().status).toBe(OTA_STATUS.UP_TO_DATE);
      expect(state().lastCheckedAt).toEqual(expect.any(Number));
    });

    it('describes an update that is available', async () => {
      const { remote } = makeRemote({ isMandatory: true });
      codePush.checkForUpdate.mockResolvedValue(remote);

      const result = await checkForUpdates();

      expect(result).toBe(remote);
      expect(state().status).toBe(OTA_STATUS.AVAILABLE);
      expect(state().update).toEqual({
        label: 'v3',
        description: 'Fixes the home screen',
        size: 2 * 1024 * 1024,
        isMandatory: true,
        appVersion: '1.0',
      });
    });

    it('never offers a release that was installed before and rolled back', async () => {
      const { remote } = makeRemote({ failedInstall: true });
      codePush.checkForUpdate.mockResolvedValue(remote);

      expect(await checkForUpdates()).toBeNull();
      expect(state().status).toBe(OTA_STATUS.UP_TO_DATE);
      // ...so downloading it is impossible too
      expect(await downloadAndInstall()).toBe(false);
      expect(remote.download).not.toHaveBeenCalled();
    });

    it('treats a network failure as offline, not as a fault', async () => {
      codePush.checkForUpdate.mockRejectedValue(new Error('Network request failed'));

      await checkForUpdates();

      expect(state().status).toBe(OTA_STATUS.OFFLINE);
      expect(state().error).toBe(OTA_MESSAGES.offline);
    });

    it('reports any other failure with a friendly message', async () => {
      codePush.checkForUpdate.mockRejectedValue(new Error('500 Internal Server Error'));

      await checkForUpdates();

      expect(state().status).toBe(OTA_STATUS.ERROR);
      expect(state().error).toBe(OTA_MESSAGES.checkFailed);
    });

    it('runs one check at a time', async () => {
      let release;
      codePush.checkForUpdate.mockReturnValue(new Promise(resolve => (release = resolve)));

      const first = checkForUpdates();
      const second = checkForUpdates();
      release(null);
      await Promise.all([first, second]);

      expect(codePush.checkForUpdate).toHaveBeenCalledTimes(1);
    });

    it('keeps an installed update waiting for a restart as the headline', async () => {
      useOtaStore.setState({ status: OTA_STATUS.INSTALLED, restartPending: true });

      await checkForUpdates();

      expect(codePush.checkForUpdate).not.toHaveBeenCalled();
      expect(state().status).toBe(OTA_STATUS.INSTALLED);
    });
  });

  describe('downloadAndInstall', () => {
    it('installs an optional update to apply once the app has been hidden for 30 seconds', async () => {
      const { remote, local } = makeRemote();
      codePush.checkForUpdate.mockResolvedValue(remote);
      await checkForUpdates();

      const installed = await downloadAndInstall();

      expect(installed).toBe(true);
      expect(local.install).toHaveBeenCalledWith(
        codePush.InstallMode.ON_NEXT_SUSPEND,
        OPTIONAL_BACKGROUND_SECONDS,
      );
      expect(OPTIONAL_BACKGROUND_SECONDS).toBe(30);
      expect(state()).toMatchObject({
        status: OTA_STATUS.INSTALLED,
        restartPending: true,
        restartRequired: false,
        progress: 1,
      });
    });

    it('installs a mandatory update to apply sooner: after 10 seconds hidden', async () => {
      const { remote, local } = makeRemote({ isMandatory: true });
      codePush.checkForUpdate.mockResolvedValue(remote);
      await checkForUpdates();

      await downloadAndInstall();

      expect(local.install).toHaveBeenCalledWith(
        codePush.InstallMode.ON_NEXT_SUSPEND,
        MANDATORY_BACKGROUND_SECONDS,
      );
      expect(MANDATORY_BACKGROUND_SECONDS).toBe(10);
      expect(MANDATORY_BACKGROUND_SECONDS).toBeLessThan(OPTIONAL_BACKGROUND_SECONDS);
      expect(state().restartRequired).toBe(true);
    });

    it('never restarts the app by itself', async () => {
      const { remote } = makeRemote({ isMandatory: true });
      codePush.checkForUpdate.mockResolvedValue(remote);
      await checkForUpdates();
      await downloadAndInstall();

      expect(codePush.restartApp).not.toHaveBeenCalled();
    });

    it('only ever restarts while the app is hidden: never the immediate or resume modes', async () => {
      for (const isMandatory of [false, true]) {
        __resetOtaForTests();
        const { remote, local } = makeRemote({ isMandatory });
        codePush.checkForUpdate.mockResolvedValue(remote);
        await checkForUpdates();
        await downloadAndInstall();
        const mode = local.install.mock.calls[0][0];
        // IMMEDIATE restarts the app mid-task. ON_NEXT_SUSPEND restarts it only in the background.
        expect(mode).toBe(codePush.InstallMode.ON_NEXT_SUSPEND);
        expect(mode).not.toBe(codePush.InstallMode.IMMEDIATE);
        // The wait is real: restarting the instant the app is hidden would lose a brief app switch
        expect(local.install.mock.calls[0][1]).toBeGreaterThan(0);
      }
    });

    it('reports download progress', async () => {
      const { remote } = makeRemote();
      const seen = [];
      remote.download.mockImplementation(async onProgress => {
        onProgress({ receivedBytes: 25, totalBytes: 100 });
        seen.push(state().progress);
        onProgress({ receivedBytes: 75, totalBytes: 100 });
        seen.push(state().progress);
        return { install: jest.fn().mockResolvedValue(undefined) };
      });
      codePush.checkForUpdate.mockResolvedValue(remote);
      await checkForUpdates();

      await downloadAndInstall();

      expect(seen).toEqual([0.25, 0.75]);
    });

    it('leaves the app untouched and the update retryable when installing fails', async () => {
      const { remote, local } = makeRemote();
      local.install.mockRejectedValue(new Error('disk full'));
      codePush.checkForUpdate.mockResolvedValue(remote);
      await checkForUpdates();

      expect(await downloadAndInstall()).toBe(false);
      expect(state().status).toBe(OTA_STATUS.ERROR);
      expect(state().error).toBe(OTA_MESSAGES.installFailed);
      expect(state().restartPending).toBe(false);

      // Retrying works: the same update is still pending
      local.install.mockResolvedValue(undefined);
      expect(await downloadAndInstall()).toBe(true);
      expect(state().status).toBe(OTA_STATUS.INSTALLED);
    });

    it('treats a dropped connection during download as offline', async () => {
      const { remote } = makeRemote();
      remote.download.mockRejectedValue(new Error('Network request failed'));
      codePush.checkForUpdate.mockResolvedValue(remote);
      await checkForUpdates();

      await downloadAndInstall();

      expect(state().status).toBe(OTA_STATUS.OFFLINE);
    });

    it('does nothing without a pending update', async () => {
      expect(await downloadAndInstall()).toBe(false);
    });
  });

  describe('autoUpdate', () => {
    it('downloads and installs a compatible update, to apply while the app is hidden', async () => {
      const { remote, local } = makeRemote();
      codePush.checkForUpdate.mockResolvedValue(remote);

      await autoUpdate();

      expect(local.install).toHaveBeenCalledWith(
        codePush.InstallMode.ON_NEXT_SUSPEND,
        OPTIONAL_BACKGROUND_SECONDS,
      );
      expect(state()).toMatchObject({ status: OTA_STATUS.INSTALLED, source: 'auto' });
      expect(codePush.restartApp).not.toHaveBeenCalled();
    });

    it('does not check again within the check interval, unless forced', async () => {
      await autoUpdate();
      await autoUpdate();
      expect(codePush.checkForUpdate).toHaveBeenCalledTimes(1);

      useOtaStore.setState({ lastCheckedAt: Date.now() - AUTO_CHECK_INTERVAL_MS - 1 });
      await autoUpdate();
      expect(codePush.checkForUpdate).toHaveBeenCalledTimes(2);

      await autoUpdate({ force: true });
      expect(codePush.checkForUpdate).toHaveBeenCalledTimes(3);
    });

    it('does nothing in debug builds', async () => {
      global.__DEV__ = true;
      await autoUpdate();
      expect(codePush.checkForUpdate).not.toHaveBeenCalled();
    });

    it('stays quiet while an update waits for a restart', async () => {
      useOtaStore.setState({ restartPending: true });
      await autoUpdate({ force: true });
      expect(codePush.checkForUpdate).not.toHaveBeenCalled();
    });

    it('does not download when there is nothing new', async () => {
      await autoUpdate();
      expect(state().status).toBe(OTA_STATUS.UP_TO_DATE);
    });
  });

  describe('restartApp, version info and sizes', () => {
    it('restarts only when an update is pending', () => {
      restartApp();
      expect(codePush.restartApp).toHaveBeenCalledWith(true);
    });

    it('reads the native version and the running update', async () => {
      codePush.getConfiguration.mockResolvedValue({ appVersion: '1.2.0' });
      codePush.getUpdateMetadata.mockResolvedValue({ label: 'v4', description: 'Notes' });

      expect(await getVersionInfo()).toEqual({
        appVersion: '1.2.0',
        label: 'v4',
        description: 'Notes',
      });
    });

    it('returns empty version info in debug builds and when reading fails', async () => {
      global.__DEV__ = true;
      expect(await getVersionInfo()).toEqual({ appVersion: '', label: '', description: '' });

      global.__DEV__ = false;
      codePush.getConfiguration.mockRejectedValue(new Error('no native module'));
      expect(await getVersionInfo()).toEqual({ appVersion: '', label: '', description: '' });
    });

    it('formats download sizes', () => {
      expect(formatBytes(0)).toBe('');
      expect(formatBytes(500)).toBe('1 KB');
      expect(formatBytes(150 * 1024)).toBe('150 KB');
      expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });
  });
});
